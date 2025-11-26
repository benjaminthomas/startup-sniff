import { RedditApiClient, FetchOptions, Logger } from './api-client'
import type { RedditPostInsert } from '@/types/supabase'
import type { Redis } from 'ioredis'

export interface SubredditConfig {
  name: string
  enabled: boolean
  priority: 'high' | 'medium' | 'low'
  fetchOptions: FetchOptions
  customValidation?: Record<string, unknown>
}

export interface FetcherConfig {
  subreddits: SubredditConfig[]
  batchSize: number
  maxConcurrency: number
  retryAttempts: number
  backoffMultiplier: number
  healthCheckInterval: number
  cacheResults: boolean
  cacheTTL: number
}

export interface FetchResult {
  success: boolean
  posts: RedditPostInsert[]
  subreddit: string
  fetchedAt: Date
  errors?: string[]
  metrics: {
    totalRequests: number
    successfulRequests: number
    failedRequests: number
    totalPosts: number
    validPosts: number
    duplicatesFiltered: number
    avgResponseTime: number
  }
}

export interface BatchFetchResult {
  success: boolean
  results: FetchResult[]
  totalPosts: number
  totalErrors: number
  duration: number
  summary: {
    subredditsProcessed: number
    subredditsFailed: number
    postsCollected: number
    duplicatesRemoved: number
  }
}

/**
 * High-level service for fetching posts from multiple subreddits
 */
export class SubredditFetcher {
  private apiClient: RedditApiClient
  private config: FetcherConfig
  private logger: Logger
  private redis: Redis
  private healthStatus: Map<string, boolean> = new Map()
  private lastHealthCheck: Date = new Date()

  constructor(
    apiClient: RedditApiClient,
    config: FetcherConfig,
    logger: Logger,
    redis: Redis
  ) {
    this.apiClient = apiClient
    this.config = config
    this.logger = logger
    this.redis = redis
  }

  /**
   * Fetch posts from all configured subreddits
   */
  async fetchAll(): Promise<BatchFetchResult> {
    const startTime = Date.now()
    this.logger.info('Starting batch fetch from all subreddits')

    const results: FetchResult[] = []
    const enabledSubreddits = this.config.subreddits.filter(s => s.enabled)

    this.logger.info(`Processing ${enabledSubreddits.length} enabled subreddits`)

    // Process subreddits based on priority and concurrency limits
    const priorityGroups = this.groupByPriority(enabledSubreddits)

    // Process high priority first, then medium, then low
    for (const priority of ['high', 'medium', 'low'] as const) {
      const group = priorityGroups[priority]
      if (group.length === 0) continue

      this.logger.info(`Processing ${group.length} ${priority} priority subreddits`)

      const batchResults = await this.processBatch(group)
      results.push(...batchResults)

      // Add delay between priority groups to be respectful to Reddit API
      if (priority !== 'low') {
        await this.sleep(2000)
      }
    }

    // Deduplicate across all results
    const allPosts = results.flatMap(r => r.posts)
    const uniquePosts = this.deduplicatePosts(allPosts)
    const duplicatesRemoved = allPosts.length - uniquePosts.length

    const duration = Date.now() - startTime
    const totalErrors = results.reduce((sum, r) => sum + (r.errors?.length || 0), 0)

    const summary = {
      subredditsProcessed: results.filter(r => r.success).length,
      subredditsFailed: results.filter(r => !r.success).length,
      postsCollected: uniquePosts.length,
      duplicatesRemoved
    }

    this.logger.info('Batch fetch completed:', summary)

    return {
      success: summary.subredditsFailed === 0,
      results,
      totalPosts: uniquePosts.length,
      totalErrors,
      duration,
      summary
    }
  }

  /**
   * Fetch posts from specific subreddits
   */
  async fetchSubreddits(subredditNames: string[], options?: FetchOptions): Promise<BatchFetchResult> {
    const startTime = Date.now()

    // Find configurations for requested subreddits
    const configs = subredditNames.map(name => {
      const existing = this.config.subreddits.find(s =>
        s.name.toLowerCase() === name.toLowerCase()
      )

      if (existing) {
        return existing
      }

      // Create default config for unlisted subreddits
      return {
        name,
        enabled: true,
        priority: 'medium' as const,
        fetchOptions: options || { limit: 25, sortBy: 'hot' as const }
      }
    })

    const results = await this.processBatch(configs)

    // Deduplicate results
    const allPosts = results.flatMap(r => r.posts)
    const uniquePosts = this.deduplicatePosts(allPosts)
    const duplicatesRemoved = allPosts.length - uniquePosts.length

    const duration = Date.now() - startTime
    const totalErrors = results.reduce((sum, r) => sum + (r.errors?.length || 0), 0)

    return {
      success: results.every(r => r.success),
      results,
      totalPosts: uniquePosts.length,
      totalErrors,
      duration,
      summary: {
        subredditsProcessed: results.filter(r => r.success).length,
        subredditsFailed: results.filter(r => !r.success).length,
        postsCollected: uniquePosts.length,
        duplicatesRemoved
      }
    }
  }

  /**
   * Fetch posts from a single subreddit with retry logic
   */
  async fetchSingle(subredditName: string, options?: FetchOptions): Promise<FetchResult> {
    const startTime = Date.now()

    // Find or create config
    const config = this.config.subreddits.find(s =>
      s.name.toLowerCase() === subredditName.toLowerCase()
    ) || {
      name: subredditName,
      enabled: true,
      priority: 'medium' as const,
      fetchOptions: options || { limit: 25, sortBy: 'hot' as const }
    }

    return this.fetchWithRetry(config, startTime)
  }

  /**
   * Group subreddits by priority
   */
  private groupByPriority(subreddits: SubredditConfig[]): Record<'high' | 'medium' | 'low', SubredditConfig[]> {
    return {
      high: subreddits.filter(s => s.priority === 'high'),
      medium: subreddits.filter(s => s.priority === 'medium'),
      low: subreddits.filter(s => s.priority === 'low')
    }
  }

  /**
   * Process a batch of subreddits with concurrency control
   */
  private async processBatch(configs: SubredditConfig[]): Promise<FetchResult[]> {
    const results: FetchResult[] = []
    const batches = this.chunkArray(configs, this.config.maxConcurrency)

    for (const batch of batches) {
      const batchPromises = batch.map(config =>
        this.fetchWithRetry(config, Date.now())
      )

      const batchResults = await Promise.allSettled(batchPromises)

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          this.logger.error('Batch processing error:', result.reason)
          results.push({
            success: false,
            posts: [],
            subreddit: 'unknown',
            fetchedAt: new Date(),
            errors: [result.reason?.message || 'Unknown error'],
            metrics: this.createEmptyMetrics()
          })
        }
      }

      // Add delay between batches to respect rate limits
      if (batches.indexOf(batch) < batches.length - 1) {
        await this.sleep(1000)
      }
    }

    return results
  }

  /**
   * Fetch from subreddit with retry logic
   */
  private async fetchWithRetry(
    config: SubredditConfig,
    startTime: number,
    attempt: number = 1
  ): Promise<FetchResult> {
    const metrics = this.createEmptyMetrics()

    try {
      // Check cache first if enabled
      if (this.config.cacheResults) {
        const cached = await this.getCachedResult(config.name)
        if (cached) {
          this.logger.debug(`Using cached result for r/${config.name}`)
          return cached
        }
      }

      // Check health status
      if (!this.isHealthy(config.name)) {
        this.logger.warn(`Skipping unhealthy subreddit: ${config.name}`)
        return {
          success: false,
          posts: [],
          subreddit: config.name,
          fetchedAt: new Date(),
          errors: ['Subreddit marked as unhealthy'],
          metrics
        }
      }

      const requestStart = Date.now()
      metrics.totalRequests++

      // Make the API request
      const response = await this.apiClient.fetchSubredditPosts(
        config.name,
        config.fetchOptions
      )

      const responseTime = Date.now() - requestStart
      metrics.avgResponseTime = responseTime

      if (!response.success || !response.data) {
        metrics.failedRequests++

        // Retry logic
        if (attempt <= this.config.retryAttempts) {
          const delay = this.calculateBackoffDelay(attempt)
          this.logger.warn(
            `Fetch failed for r/${config.name}, retrying in ${delay}ms (attempt ${attempt}/${this.config.retryAttempts})`
          )

          await this.sleep(delay)
          return this.fetchWithRetry(config, startTime, attempt + 1)
        }

        // Mark as unhealthy after max retries
        this.markUnhealthy(config.name)

        return {
          success: false,
          posts: [],
          subreddit: config.name,
          fetchedAt: new Date(),
          errors: [response.error || 'No data returned'],
          metrics
        }
      }

      metrics.successfulRequests++
      metrics.totalPosts = response.data.length
      metrics.validPosts = response.data.length // Already validated by API client

      const result: FetchResult = {
        success: true,
        posts: response.data,
        subreddit: config.name,
        fetchedAt: new Date(),
        metrics
      }

      // Cache successful results
      if (this.config.cacheResults) {
        await this.cacheResult(config.name, result)
      }

      // Mark as healthy
      this.markHealthy(config.name)

      this.logger.info(`Successfully fetched ${response.data.length} posts from r/${config.name}`)
      return result

    } catch (error) {
      metrics.failedRequests++

      this.logger.error(`Error fetching from r/${config.name}:`, error)

      // Retry logic for unexpected errors
      if (attempt <= this.config.retryAttempts) {
        const delay = this.calculateBackoffDelay(attempt)
        await this.sleep(delay)
        return this.fetchWithRetry(config, startTime, attempt + 1)
      }

      this.markUnhealthy(config.name)

      return {
        success: false,
        posts: [],
        subreddit: config.name,
        fetchedAt: new Date(),
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        metrics
      }
    }
  }

  /**
   * Check if subreddit is healthy
   */
  private isHealthy(subreddit: string): boolean {
    // If we haven't done a health check recently, assume healthy
    if (Date.now() - this.lastHealthCheck.getTime() > this.config.healthCheckInterval) {
      return true
    }

    return this.healthStatus.get(subreddit) !== false
  }

  /**
   * Mark subreddit as healthy
   */
  private markHealthy(subreddit: string): void {
    this.healthStatus.set(subreddit, true)
  }

  /**
   * Mark subreddit as unhealthy
   */
  private markUnhealthy(subreddit: string): void {
    this.healthStatus.set(subreddit, false)
    this.logger.warn(`Marked r/${subreddit} as unhealthy`)
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoffDelay(attempt: number): number {
    const baseDelay = 1000
    const maxDelay = 30000
    const jitter = Math.random() * 1000

    const delay = Math.min(
      baseDelay * Math.pow(this.config.backoffMultiplier, attempt - 1) + jitter,
      maxDelay
    )

    return Math.floor(delay)
  }

  /**
   * Get cached fetch result
   */
  private async getCachedResult(subreddit: string): Promise<FetchResult | null> {
    try {
      const cacheKey = `reddit:fetch:${subreddit}`
      const cached = await this.redis.get(cacheKey)

      if (cached) {
        return JSON.parse(cached)
      }
    } catch (error) {
      this.logger.debug('Cache read error:', error)
    }

    return null
  }

  /**
   * Cache fetch result
   */
  private async cacheResult(subreddit: string, result: FetchResult): Promise<void> {
    try {
      const cacheKey = `reddit:fetch:${subreddit}`
      await this.redis.setex(
        cacheKey,
        this.config.cacheTTL,
        JSON.stringify(result)
      )
    } catch (error) {
      this.logger.debug('Cache write error:', error)
    }
  }

  /**
   * Remove duplicates from posts array
   */
  private deduplicatePosts(posts: RedditPostInsert[]): RedditPostInsert[] {
    const seen = new Set<string>()
    return posts.filter(post => {
      if (seen.has(post.hash)) {
        return false
      }
      seen.add(post.hash)
      return true
    })
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  /**
   * Create empty metrics object
   */
  private createEmptyMetrics() {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalPosts: 0,
      validPosts: 0,
      duplicatesFiltered: 0,
      avgResponseTime: 0
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get fetcher health status
   */
  async getHealthStatus(): Promise<{
    healthy: boolean
    subredditStatus: Record<string, boolean>
    lastHealthCheck: Date
    apiClientHealth: unknown
  }> {
    const apiHealth = await this.apiClient.getHealthStatus()

    return {
      healthy: Object.values(this.healthStatus).every(status => status !== false),
      subredditStatus: Object.fromEntries(this.healthStatus),
      lastHealthCheck: this.lastHealthCheck,
      apiClientHealth: apiHealth
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<FetcherConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.logger.info('Fetcher configuration updated')
  }

  /**
   * Add or update subreddit configuration
   */
  updateSubredditConfig(subredditConfig: SubredditConfig): void {
    const index = this.config.subreddits.findIndex(s =>
      s.name.toLowerCase() === subredditConfig.name.toLowerCase()
    )

    if (index >= 0) {
      this.config.subreddits[index] = subredditConfig
    } else {
      this.config.subreddits.push(subredditConfig)
    }

    this.logger.info(`Updated configuration for r/${subredditConfig.name}`)
  }

  /**
   * Remove subreddit from configuration
   */
  removeSubreddit(subredditName: string): void {
    this.config.subreddits = this.config.subreddits.filter(s =>
      s.name.toLowerCase() !== subredditName.toLowerCase()
    )

    this.healthStatus.delete(subredditName)
    this.logger.info(`Removed r/${subredditName} from configuration`)
  }
}