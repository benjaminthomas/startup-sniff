import { CronJob } from 'cron'
import { SubredditFetcher } from './subreddit-fetcher'
import { RedditPostProcessor } from './post-processor'
import { RedditDatabaseInserter } from './database-inserter'
import type { Logger } from './api-client'
import type { Redis } from 'ioredis'

export interface ScheduleConfig {
  enabled: boolean
  cronPattern: string
  timezone: string
  maxRunDuration: number
  skipIfRunning: boolean
  retryOnFailure: boolean
  maxRetries: number
  healthCheckInterval: number
}

export interface JobConfig {
  name: string
  schedule: ScheduleConfig
  subreddits: string[]
  processingEnabled: boolean
  priority: 'high' | 'medium' | 'low'
}

export interface JobRun {
  jobName: string
  startTime: Date
  endTime?: Date
  status: 'running' | 'completed' | 'failed' | 'timeout'
  results?: {
    fetched: number
    processed: number
    inserted: number
    errors: number
  }
  error?: string
  duration?: number
}

export interface SchedulerMetrics {
  totalJobs: number
  activeJobs: number
  completedRuns: number
  failedRuns: number
  avgRunDuration: number
  lastRunTime: Date | null
  nextRunTime: Date | null
  uptime: number
  errorRate: number
}

/**
 * Scheduled job system for automated Reddit data collection
 */
export class RedditScheduler {
  private fetcher: SubredditFetcher
  private processor: RedditPostProcessor
  private inserter: RedditDatabaseInserter
  private redis: Redis
  private logger: Logger

  private jobs: Map<string, { config: JobConfig; cronJob: CronJob; running: boolean }> = new Map()
  private runHistory: JobRun[] = []
  private startTime: Date = new Date()
  private healthCheckJob?: CronJob

  constructor(
    fetcher: SubredditFetcher,
    processor: RedditPostProcessor,
    inserter: RedditDatabaseInserter,
    redis: Redis,
    logger: Logger
  ) {
    this.fetcher = fetcher
    this.processor = processor
    this.inserter = inserter
    this.redis = redis
    this.logger = logger

    // Start health check job
    this.startHealthCheck()
  }

  /**
   * Add a scheduled job
   */
  addJob(jobConfig: JobConfig): void {
    if (this.jobs.has(jobConfig.name)) {
      throw new Error(`Job '${jobConfig.name}' already exists`)
    }

    if (!jobConfig.schedule.enabled) {
      this.logger.info(`Job '${jobConfig.name}' added but disabled`)
      return
    }

    try {
      const cronJob = new CronJob(
        jobConfig.schedule.cronPattern,
        () => {
          this.runJob(jobConfig.name).catch(error => {
            this.logger.error(`Job execution failed: ${error}`)
          })
        },
        null,
        true,
        jobConfig.schedule.timezone || 'UTC'
      )

      this.jobs.set(jobConfig.name, {
        config: jobConfig,
        cronJob,
        running: false
      })

      cronJob.start()
      this.logger.info(`Scheduled job '${jobConfig.name}' started with pattern: ${jobConfig.schedule.cronPattern}`)
    } catch (error) {
      this.logger.error(`Failed to create job '${jobConfig.name}':`, error)
      throw error
    }
  }

  /**
   * Remove a scheduled job
   */
  removeJob(jobName: string): boolean {
    const job = this.jobs.get(jobName)
    if (!job) {
      return false
    }

    job.cronJob.stop()
    this.jobs.delete(jobName)

    this.logger.info(`Job '${jobName}' removed`)
    return true
  }

  /**
   * Run a job manually
   */
  async runJobManually(jobName: string): Promise<JobRun> {
    const job = this.jobs.get(jobName)
    if (!job) {
      throw new Error(`Job '${jobName}' not found`)
    }

    return this.runJob(jobName, true)
  }

  /**
   * Execute a job
   */
  private async runJob(jobName: string, manual = false): Promise<JobRun> {
    const job = this.jobs.get(jobName)
    if (!job) {
      throw new Error(`Job '${jobName}' not found`)
    }

    // Check if already running
    if (job.running && job.config.schedule.skipIfRunning) {
      this.logger.warn(`Job '${jobName}' is already running, skipping`)
      throw new Error(`Job '${jobName}' is already running`)
    }

    const jobRun: JobRun = {
      jobName,
      startTime: new Date(),
      status: 'running'
    }

    // Add to history
    this.runHistory.push(jobRun)

    // Keep only last 100 runs
    if (this.runHistory.length > 100) {
      this.runHistory.shift()
    }

    job.running = true

    try {
      // Set timeout if configured
      let timeoutId: NodeJS.Timeout | undefined
      if (job.config.schedule.maxRunDuration > 0) {
        timeoutId = setTimeout(() => {
          this.logger.error(`Job '${jobName}' timed out after ${job.config.schedule.maxRunDuration}ms`)
          jobRun.status = 'timeout'
          jobRun.endTime = new Date()
          job.running = false
        }, job.config.schedule.maxRunDuration)
      }

      this.logger.info(`Starting ${manual ? 'manual' : 'scheduled'} run of job '${jobName}'`)

      // Store job start in Redis for monitoring
      await this.redis.set(
        `reddit:scheduler:job:${jobName}:status`,
        JSON.stringify({
          status: 'running',
          startTime: jobRun.startTime.toISOString(),
          manual
        }),
        'EX',
        3600 // 1 hour expiry
      )

      const results = await this.executeJob(job.config)

      // Clear timeout
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      jobRun.status = 'completed'
      jobRun.endTime = new Date()
      jobRun.duration = jobRun.endTime.getTime() - jobRun.startTime.getTime()
      jobRun.results = results

      this.logger.info(`Job '${jobName}' completed successfully:`, results)

      // Store completion status
      await this.redis.set(
        `reddit:scheduler:job:${jobName}:status`,
        JSON.stringify({
          status: 'completed',
          startTime: jobRun.startTime.toISOString(),
          endTime: jobRun.endTime.toISOString(),
          duration: jobRun.duration,
          results,
          manual
        }),
        'EX',
        86400 // 24 hour expiry
      )

    } catch (error) {
      jobRun.status = 'failed'
      jobRun.endTime = new Date()
      jobRun.duration = jobRun.endTime.getTime() - jobRun.startTime.getTime()
      jobRun.error = error instanceof Error ? error.message : 'Unknown error'

      this.logger.error(`Job '${jobName}' failed:`, error)

      // Store failure status
      await this.redis.set(
        `reddit:scheduler:job:${jobName}:status`,
        JSON.stringify({
          status: 'failed',
          startTime: jobRun.startTime.toISOString(),
          endTime: jobRun.endTime.toISOString(),
          duration: jobRun.duration,
          error: jobRun.error,
          manual
        }),
        'EX',
        86400 // 24 hour expiry
      )

      // Retry logic
      if (job.config.schedule.retryOnFailure && !manual) {
        this.scheduleRetry(jobName, 1)
      }
    } finally {
      job.running = false
    }

    return jobRun
  }

  /**
   * Execute the actual job logic
   */
  private async executeJob(config: JobConfig): Promise<{
    fetched: number
    processed: number
    inserted: number
    errors: number
  }> {
    let totalFetched = 0
    let totalProcessed = 0
    let totalInserted = 0
    let totalErrors = 0

    // Fetch posts from configured subreddits
    this.logger.debug(`Fetching posts from subreddits: ${config.subreddits.join(', ')}`)

    const fetchResult = await this.fetcher.fetchSubreddits(config.subreddits)
    totalFetched = fetchResult.totalPosts
    totalErrors += fetchResult.totalErrors

    if (fetchResult.totalPosts === 0) {
      this.logger.warn('No posts fetched, ending job')
      return { fetched: 0, processed: 0, inserted: 0, errors: totalErrors }
    }

    // Collect all posts from fetch results
    const allPosts = fetchResult.results.flatMap(r => r.posts)

    // Process posts if enabled
    if (config.processingEnabled && allPosts.length > 0) {
      this.logger.debug(`Processing ${allPosts.length} posts`)

      const processResult = await this.processor.processBatch(allPosts)
      totalProcessed = processResult.processed.length
      totalErrors += processResult.failed.length

      // Insert processed posts
      if (processResult.processed.length > 0) {
        this.logger.debug(`Inserting ${processResult.processed.length} processed posts`)

        const insertResult = await this.inserter.insertBatch(processResult.processed)
        totalInserted = insertResult.inserted + insertResult.updated
        totalErrors += insertResult.failed
      }
    } else {
      // Insert without processing
      this.logger.debug(`Inserting ${allPosts.length} posts without processing`)

      // Convert raw posts to ProcessedPost format
      const processedPosts = allPosts.map(post => ({
        ...post,
        processedAt: new Date().toISOString()
      }))

      const insertResult = await this.inserter.insertBatch(processedPosts)
      totalInserted = insertResult.inserted + insertResult.updated
      totalErrors += insertResult.failed
    }

    return {
      fetched: totalFetched,
      processed: totalProcessed,
      inserted: totalInserted,
      errors: totalErrors
    }
  }

  /**
   * Schedule a retry for a failed job
   */
  private scheduleRetry(jobName: string, attempt: number): void {
    const job = this.jobs.get(jobName)
    if (!job || attempt > job.config.schedule.maxRetries) {
      return
    }

    const delay = Math.min(1000 * Math.pow(2, attempt), 300000) // Max 5 minutes

    this.logger.info(`Scheduling retry ${attempt} for job '${jobName}' in ${delay}ms`)

    setTimeout(async () => {
      try {
        await this.runJob(jobName)
      } catch {
        this.scheduleRetry(jobName, attempt + 1)
      }
    }, delay)
  }

  /**
   * Start health check monitoring
   */
  private startHealthCheck(): void {
    this.healthCheckJob = new CronJob(
      '*/5 * * * *', // Every 5 minutes
      () => this.performHealthCheck(),
      null,
      false,
      'UTC'
    )

    this.healthCheckJob.start()
    this.logger.info('Health check monitoring started')
  }

  /**
   * Perform health check on all components
   */
  private async performHealthCheck(): Promise<void> {
    try {
      // Check fetcher health
      const fetcherHealth = await this.fetcher.getHealthStatus()

      // Check database inserter stats
      const inserterStats = await this.inserter.getStats()

      // Store health data in Redis
      await this.redis.set(
        'reddit:scheduler:health',
        JSON.stringify({
          timestamp: new Date().toISOString(),
          fetcher: fetcherHealth,
          inserter: inserterStats,
          scheduler: this.getMetrics()
        }),
        'EX',
        600 // 10 minutes
      )

      this.logger.debug('Health check completed')
    } catch (error) {
      this.logger.error('Health check failed:', error)
    }
  }

  /**
   * Get scheduler metrics
   */
  getMetrics(): SchedulerMetrics {
    const now = Date.now()
    const uptime = now - this.startTime.getTime()

    const recentRuns = this.runHistory.filter(run =>
      now - run.startTime.getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
    )

    const completedRuns = recentRuns.filter(run => run.status === 'completed').length
    const failedRuns = recentRuns.filter(run => run.status === 'failed').length

    const avgRunDuration = recentRuns.length > 0
      ? recentRuns.reduce((sum, run) => sum + (run.duration || 0), 0) / recentRuns.length
      : 0

    const errorRate = recentRuns.length > 0 ? (failedRuns / recentRuns.length) * 100 : 0

    // Find next run time
    let nextRunTime: Date | null = null
    for (const [, jobData] of this.jobs) {
      const nextTick = jobData.cronJob.nextDate()
      if (nextTick && (!nextRunTime || nextTick.toJSDate() < nextRunTime)) {
        nextRunTime = nextTick.toJSDate()
      }
    }

    return {
      totalJobs: this.jobs.size,
      activeJobs: Array.from(this.jobs.values()).filter(j => j.running).length,
      completedRuns,
      failedRuns,
      avgRunDuration,
      lastRunTime: this.runHistory.length > 0 ? this.runHistory[this.runHistory.length - 1].startTime : null,
      nextRunTime,
      uptime,
      errorRate
    }
  }

  /**
   * Get job status
   */
  getJobStatus(jobName: string): {
    exists: boolean
    enabled: boolean
    running: boolean
    nextRun: Date | null
    lastRun: JobRun | null
  } {
    const job = this.jobs.get(jobName)

    if (!job) {
      return {
        exists: false,
        enabled: false,
        running: false,
        nextRun: null,
        lastRun: null
      }
    }

    const lastRun = this.runHistory
      .filter(run => run.jobName === jobName)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())[0] || null

    return {
      exists: true,
      enabled: job.config.schedule.enabled,
      running: job.running,
      nextRun: job.cronJob.nextDate()?.toJSDate() || null,
      lastRun
    }
  }

  /**
   * Update job configuration
   */
  updateJobConfig(jobName: string, newConfig: Partial<JobConfig>): void {
    const job = this.jobs.get(jobName)
    if (!job) {
      throw new Error(`Job '${jobName}' not found`)
    }

    // Update the configuration
    job.config = { ...job.config, ...newConfig }

    // If schedule changed, recreate the cron job
    if (newConfig.schedule) {
      job.cronJob.stop()

      const cronJob = new CronJob(
        job.config.schedule.cronPattern,
        () => {
          this.runJob(jobName).catch(error => {
            this.logger.error(`Job execution failed: ${error}`)
          })
        },
        null,
        false,
        job.config.schedule.timezone || 'UTC'
      )

      job.cronJob = cronJob

      if (job.config.schedule.enabled) {
        cronJob.start()
      }
    }

    this.logger.info(`Job '${jobName}' configuration updated`)
  }

  /**
   * Get run history
   */
  getRunHistory(jobName?: string, limit = 50): JobRun[] {
    let history = this.runHistory

    if (jobName) {
      history = history.filter(run => run.jobName === jobName)
    }

    return history
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit)
  }

  /**
   * Stop all jobs and cleanup
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Reddit scheduler...')

    // Stop health check
    if (this.healthCheckJob) {
      this.healthCheckJob.stop()
    }

    // Stop all jobs
    for (const [jobName, job] of this.jobs) {
      job.cronJob.stop()
      this.logger.info(`Stopped job: ${jobName}`)
    }

    this.jobs.clear()
    this.logger.info('Reddit scheduler shut down complete')
  }
}