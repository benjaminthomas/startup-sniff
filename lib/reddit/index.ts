/**
 * Reddit Trend Engine - Complete Integration
 *
 * This module orchestrates all Reddit data collection components:
 * - OAuth2 authenticated API client
 * - Rate limiting and validation
 * - Subreddit data fetching with configurable options
 * - Post processing with AI analysis and sanitization
 * - Batch database insertion with deduplication
 * - Scheduled job system for automated collection
 * - Comprehensive logging and monitoring
 * - Graceful fallbacks for API limits
 */

export { RedditApiClient, type RedditApiConfig, type FetchOptions } from './api-client'
export { RedditRateLimiter, type RateLimitResult, type RateLimitConfig } from './rate-limiter'
export {
  RedditPostValidator,
  validateRedditPost,
  sanitizeContent,
  generatePostHash,
  type ValidationResult,
  type ValidationConfig
} from './data-validator'
export {
  SubredditFetcher,
  type SubredditConfig,
  type FetcherConfig,
  type FetchResult,
  type BatchFetchResult
} from './subreddit-fetcher'
export {
  RedditPostProcessor,
  type ProcessingConfig,
  type AnalysisResult,
  type ProcessedPost,
  type ProcessingResult
} from './post-processor'
export {
  RedditDatabaseInserter,
  type InsertionConfig,
  type InsertionResult,
  type BatchResult
} from './database-inserter'
export {
  RedditScheduler,
  type ScheduleConfig,
  type JobConfig,
  type JobRun,
  type SchedulerMetrics
} from './scheduler'
export {
  RedditMonitor,
  type MonitoringConfig,
  type LogEntry,
  type MetricValue,
  type Alert
} from './monitoring'
export {
  RedditFallbackManager,
  type FallbackConfig,
  type FallbackState,
  type CircuitBreakerState
} from './fallback-manager'

import { RedditApiClient, type RedditApiConfig } from './api-client'
import { RedditRateLimiter, type RateLimitConfig } from './rate-limiter'
import { RedditPostValidator, type ValidationConfig } from './data-validator'
import { SubredditFetcher, type FetcherConfig } from './subreddit-fetcher'
import { RedditPostProcessor, type ProcessingConfig } from './post-processor'
import { RedditDatabaseInserter, type InsertionConfig } from './database-inserter'
import { RedditScheduler, type JobConfig } from './scheduler'
import { RedditMonitor, type MonitoringConfig } from './monitoring'
import { RedditFallbackManager, type FallbackConfig } from './fallback-manager'
import type { Redis } from 'ioredis'

export interface RedditEngineConfig {
  reddit: RedditApiConfig
  rateLimiting: RateLimitConfig
  validation: ValidationConfig
  fetcher: FetcherConfig
  processing: ProcessingConfig
  insertion: InsertionConfig
  monitoring: MonitoringConfig
  fallback: FallbackConfig
  supabase: {
    url: string
    key: string
  }
  openai?: {
    apiKey: string
  }
}

export interface RedditEngineOptions {
  redis: Redis
  enableScheduling?: boolean
  enableMonitoring?: boolean
  enableFallbacks?: boolean
}

/**
 * Main orchestrator for the Reddit Trend Engine
 */
export class RedditTrendEngine {
  private apiClient: RedditApiClient
  private rateLimiter: RedditRateLimiter
  private validator: RedditPostValidator
  private fetcher: SubredditFetcher
  private processor: RedditPostProcessor
  private inserter: RedditDatabaseInserter
  private monitor?: RedditMonitor
  private scheduler?: RedditScheduler
  private fallbackManager?: RedditFallbackManager

  private logger: any
  private redis: Redis

  constructor(config: RedditEngineConfig, options: RedditEngineOptions) {
    this.redis = options.redis

    // Initialize monitoring first to get logger
    if (options.enableMonitoring !== false) {
      this.monitor = new RedditMonitor(this.redis, config.monitoring)
      this.logger = this.monitor.createLogger('reddit-engine')
    } else {
      // Fallback console logger
      this.logger = {
        debug: console.debug,
        info: console.info,
        warn: console.warn,
        error: console.error,
        fatal: console.error
      }
    }

    // Initialize core components
    this.rateLimiter = new RedditRateLimiter(this.redis, config.rateLimiting)
    this.validator = new RedditPostValidator(config.validation)

    this.apiClient = new RedditApiClient(
      config.reddit,
      this.rateLimiter,
      this.logger,
      this.validator
    )

    this.fetcher = new SubredditFetcher(
      this.apiClient,
      config.fetcher,
      this.logger,
      this.redis
    )

    this.processor = new RedditPostProcessor(
      config.processing,
      this.logger,
      config.openai?.apiKey
    )

    this.inserter = new RedditDatabaseInserter(
      config.supabase.url,
      config.supabase.key,
      config.insertion,
      this.logger
    )

    // Initialize optional components
    if (options.enableFallbacks !== false) {
      this.fallbackManager = new RedditFallbackManager(
        config.fallback,
        this.redis,
        this.logger
      )
    }

    if (options.enableScheduling !== false) {
      this.scheduler = new RedditScheduler(
        this.fetcher,
        this.processor,
        this.inserter,
        this.redis,
        this.logger
      )
    }

    this.logger.info('Reddit Trend Engine initialized successfully')
  }

  /**
   * Collect posts from specified subreddits
   */
  async collectPosts(
    subreddits: string[],
    options?: {
      limit?: number
      processWithAI?: boolean
      priority?: 'high' | 'medium' | 'low'
    }
  ) {
    const timer = this.monitor?.startTimer('reddit.collect_posts', {
      subreddits: subreddits.join(','),
      count: subreddits.length.toString()
    })

    try {
      this.logger.info(`Starting post collection from ${subreddits.length} subreddits`)

      // Check fallback status if enabled
      if (this.fallbackManager) {
        for (const subreddit of subreddits) {
          const fallbackCheck = await this.fallbackManager.shouldUseFallback(subreddit)
          if (fallbackCheck.useFallback) {
            this.logger.warn(`Using fallback for r/${subreddit}: ${fallbackCheck.reason}`)

            if (fallbackCheck.method === 'cache') {
              const cached = await this.fallbackManager.getCachedData(subreddit)
              if (cached) {
                await this.inserter.insertBatch(cached as any)
                continue
              }
            }
          }
        }
      }

      // Fetch posts
      const fetchResult = await this.fetcher.fetchSubreddits(subreddits, {
        limit: options?.limit || 25
      })

      if (!fetchResult.success) {
        throw new Error(`Fetch failed: ${fetchResult.totalErrors} errors`)
      }

      const allPosts = fetchResult.results.flatMap(r => r.posts)
      this.logger.info(`Fetched ${allPosts.length} posts`)

      if (allPosts.length === 0) {
        return {
          success: true,
          fetched: 0,
          processed: 0,
          inserted: 0,
          message: 'No posts to process'
        }
      }

      // Cache data for fallback use
      if (this.fallbackManager) {
        for (const result of fetchResult.results) {
          if (result.success && result.posts.length > 0) {
            await this.fallbackManager.cacheData(result.subreddit, result.posts)
          }
        }
      }

      // Process posts (AI analysis, sanitization, etc.)
      const processResult = await this.processor.processBatch(allPosts)
      this.logger.info(`Processed ${processResult.processed.length} posts`)

      // Insert to database
      const insertResult = await this.inserter.insertBatch(processResult.processed)
      this.logger.info(`Inserted ${insertResult.inserted} posts, updated ${insertResult.updated}`)

      // Record success for fallback manager
      if (this.fallbackManager) {
        this.fallbackManager.recordSuccess()
      }

      // Record metrics
      if (this.monitor) {
        this.monitor.incrementCounter('reddit.posts.fetched', allPosts.length)
        this.monitor.incrementCounter('reddit.posts.processed', processResult.processed.length)
        this.monitor.incrementCounter('reddit.posts.inserted', insertResult.inserted)
        this.monitor.incrementCounter('reddit.posts.updated', insertResult.updated)
        this.monitor.recordGauge('reddit.collection.success_rate',
          insertResult.success ? 100 : 0)
      }

      return {
        success: true,
        fetched: allPosts.length,
        processed: processResult.processed.length,
        inserted: insertResult.inserted + insertResult.updated,
        errors: processResult.failed.length + insertResult.failed,
        details: {
          fetchResult,
          processResult,
          insertResult
        }
      }

    } catch (error) {
      this.logger.error('Post collection failed:', error)

      // Handle fallback
      if (this.fallbackManager) {
        await this.fallbackManager.handleApiFailure(
          error as Error,
          subreddits.join(','),
          options
        )
      }

      // Record error metrics
      if (this.monitor) {
        this.monitor.incrementCounter('reddit.collection.errors')
      }

      throw error
    } finally {
      timer?.()
    }
  }

  /**
   * Schedule automated collection jobs
   */
  scheduleJob(jobConfig: JobConfig): void {
    if (!this.scheduler) {
      throw new Error('Scheduler not enabled')
    }

    this.scheduler.addJob(jobConfig)
    this.logger.info(`Scheduled job: ${jobConfig.name}`)
  }

  /**
   * Get system health status
   */
  async getHealthStatus() {
    const health: any = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      components: {}
    }

    try {
      // API client health
      health.components.apiClient = await this.apiClient.getHealthStatus()

      // Fetcher health
      health.components.fetcher = await this.fetcher.getHealthStatus()

      // Database inserter stats
      health.components.inserter = await this.inserter.getStats()

      // Scheduler metrics (if enabled)
      if (this.scheduler) {
        health.components.scheduler = this.scheduler.getMetrics()
      }

      // Monitoring health (if enabled)
      if (this.monitor) {
        health.components.monitor = await this.monitor.getHealthStatus()
      }

      // Fallback status (if enabled)
      if (this.fallbackManager) {
        health.components.fallback = this.fallbackManager.getStatus()
      }

      // Determine overall status
      const hasUnhealthyComponents = Object.values(health.components).some(
        (component: any) => component.status === 'unhealthy' || component.authenticated === false
      )

      if (hasUnhealthyComponents) {
        health.status = 'unhealthy'
      } else {
        const hasDegradedComponents = Object.values(health.components).some(
          (component: any) => component.status === 'degraded'
        )
        if (hasDegradedComponents) {
          health.status = 'degraded'
        }
      }

    } catch (error) {
      this.logger.error('Health check failed:', error)
      health.status = 'unhealthy'
      health.error = error instanceof Error ? error.message : 'Unknown error'
    }

    return health
  }

  /**
   * Get system metrics
   */
  async getMetrics(since?: Date) {
    if (!this.monitor) {
      return { error: 'Monitoring not enabled' }
    }

    const metrics = {
      posts: {
        fetched: await this.monitor.getMetrics('reddit.posts.fetched.count', since),
        processed: await this.monitor.getMetrics('reddit.posts.processed.count', since),
        inserted: await this.monitor.getMetrics('reddit.posts.inserted.count', since),
      },
      performance: {
        collectionTime: await this.monitor.getMetrics('reddit.collect_posts.duration', since),
        successRate: await this.monitor.getMetrics('reddit.collection.success_rate.gauge', since),
      },
      errors: {
        total: await this.monitor.getMetrics('reddit.collection.errors.count', since),
      }
    }

    return metrics
  }

  /**
   * Get recent logs
   */
  async getLogs(component?: string, level?: 'debug' | 'info' | 'warn' | 'error' | 'fatal', limit = 100) {
    if (!this.monitor) {
      return { error: 'Monitoring not enabled' }
    }

    return this.monitor.getLogs(component, level, limit)
  }

  /**
   * Manual cleanup of old data
   */
  async cleanup(daysToKeep = 90) {
    this.logger.info(`Starting cleanup of data older than ${daysToKeep} days`)

    const deletedPosts = await this.inserter.cleanup(daysToKeep)

    if (this.monitor) {
      this.monitor.incrementCounter('reddit.cleanup.posts_deleted', deletedPosts)
    }

    this.logger.info(`Cleanup completed: ${deletedPosts} posts deleted`)
    return { deletedPosts }
  }

  /**
   * Update configuration
   */
  updateConfig(component: string, config: any): void {
    switch (component) {
      case 'fetcher':
        this.fetcher.updateConfig(config)
        break
      case 'processor':
        this.processor.updateConfig(config)
        break
      case 'inserter':
        this.inserter.updateConfig(config)
        break
      case 'monitor':
        this.monitor?.updateConfig(config)
        break
      case 'fallback':
        this.fallbackManager?.updateConfig(config)
        break
      default:
        throw new Error(`Unknown component: ${component}`)
    }

    this.logger.info(`Updated configuration for ${component}`)
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Reddit Trend Engine...')

    // Stop scheduler
    if (this.scheduler) {
      await this.scheduler.shutdown()
    }

    // Shutdown monitoring
    if (this.monitor) {
      await this.monitor.shutdown()
    }

    this.logger.info('Reddit Trend Engine shutdown complete')
  }
}

/**
 * Factory function to create a Reddit Trend Engine with default configuration
 */
export function createRedditEngine(
  config: Partial<RedditEngineConfig>,
  options: RedditEngineOptions
): RedditTrendEngine {
  const defaultConfig: RedditEngineConfig = {
    reddit: {
      userAgent: 'StartupSniff/1.0',
      clientId: config.reddit?.clientId || '',
      clientSecret: config.reddit?.clientSecret || '',
      refreshToken: config.reddit?.refreshToken || ''
    },
    rateLimiting: {
      maxRequests: 60,
      windowMs: 60000,
      keyPrefix: 'reddit'
    },
    validation: {
      maxTitleLength: 300,
      maxContentLength: 40000,
      allowedSubreddits: [
        'startups', 'entrepreneur', 'SaaS', 'digitalnomad',
        'sidehustle', 'freelance', 'webdev', 'marketing', 'indiehackers'
      ],
      requireMinScore: false
    },
    fetcher: {
      subreddits: [],
      batchSize: 10,
      maxConcurrency: 3,
      retryAttempts: 3,
      backoffMultiplier: 2,
      healthCheckInterval: 300000,
      cacheResults: true,
      cacheTTL: 3600
    },
    processing: {
      enableAiAnalysis: false,
      aiModel: 'gpt-3.5-turbo',
      maxConcurrentAnalysis: 5,
      analysisTimeout: 30000,
      contentFiltering: {
        removePersonalInfo: true,
        removeUrls: false,
        removeMarkdown: true,
        maxContentLength: 40000
      },
      sentiment: {
        enabled: true,
        confidenceThreshold: 0.5
      },
      intentDetection: {
        enabled: true,
        categories: ['business', 'help_seeking', 'showcase', 'discussion']
      },
      qualityScoring: {
        enabled: true,
        minQualityScore: 20
      }
    },
    insertion: {
      batchSize: 100,
      maxRetries: 3,
      retryDelay: 1000,
      enableDeduplication: true,
      conflictResolution: 'update',
      performanceMonitoring: true
    },
    monitoring: {
      logLevel: 'info',
      enableMetrics: true,
      enableAlerts: true,
      retentionDays: 30,
      alertThresholds: {
        errorRate: 10,
        responseTime: 5000,
        apiLimitUsage: 80
      },
      batchSize: 100,
      flushInterval: 10000
    },
    fallback: {
      enabled: true,
      maxRetries: 3,
      backoffMultiplier: 2,
      maxBackoffDelay: 30000,
      gracePeriod: 300000,
      fallbackMethods: ['cache', 'queue', 'degrade'],
      circuitBreaker: {
        enabled: true,
        failureThreshold: 5,
        timeout: 60000,
        monitoringPeriod: 300000
      },
      degradedMode: {
        enabled: true,
        reducedFetchSize: 10,
        extendedInterval: 3600000,
        prioritizeSubreddits: ['startups', 'entrepreneur']
      }
    },
    supabase: {
      url: config.supabase?.url || '',
      key: config.supabase?.key || ''
    },
    openai: config.openai
  }

  const mergedConfig = { ...defaultConfig, ...config } as RedditEngineConfig

  return new RedditTrendEngine(mergedConfig, options)
}