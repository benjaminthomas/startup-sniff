import type { Redis } from 'ioredis'
import type { Logger } from './api-client'
import type { RedditPostInsert } from '@/types/supabase'

export interface FallbackConfig {
  enabled: boolean
  maxRetries: number
  backoffMultiplier: number
  maxBackoffDelay: number
  gracePeriod: number // milliseconds before entering fallback mode
  fallbackMethods: FallbackMethod[]
  circuitBreaker: {
    enabled: boolean
    failureThreshold: number
    timeout: number
    monitoringPeriod: number
  }
  degradedMode: {
    enabled: boolean
    reducedFetchSize: number
    extendedInterval: number
    prioritizeSubreddits: string[]
  }
}

export type FallbackMethod = 'queue' | 'cache' | 'degrade' | 'circuit_breaker' | 'alternative_source'

export interface FallbackState {
  active: boolean
  method: FallbackMethod | null
  reason: string
  startTime: Date
  estimatedRecoveryTime: Date | null
  retryCount: number
  lastAttempt: Date | null
}

export interface CircuitBreakerState {
  status: 'closed' | 'open' | 'half-open'
  failureCount: number
  lastFailureTime: Date | null
  nextRetryTime: Date | null
  successCount: number
}

export interface QueuedRequest {
  id: string
  subreddit: string
  priority: 'high' | 'medium' | 'low'
  timestamp: Date
  retryCount: number
  options: any
}

/**
 * Manages graceful fallbacks for Reddit API limitations
 */
export class RedditFallbackManager {
  private config: FallbackConfig
  private redis: Redis
  private logger: Logger

  private fallbackState: FallbackState = {
    active: false,
    method: null,
    reason: '',
    startTime: new Date(),
    estimatedRecoveryTime: null,
    retryCount: 0,
    lastAttempt: null
  }

  private circuitBreaker: CircuitBreakerState = {
    status: 'closed',
    failureCount: 0,
    lastFailureTime: null,
    nextRetryTime: null,
    successCount: 0
  }

  private queuedRequests: Map<string, QueuedRequest> = new Map()
  private lastSuccessfulRequest: Date = new Date()

  constructor(config: FallbackConfig, redis: Redis, logger: Logger) {
    this.config = config
    this.redis = redis
    this.logger = logger

    // Start monitoring
    this.startMonitoring()
  }

  /**
   * Check if API request should proceed or use fallback
   */
  async shouldUseFallback(subreddit: string): Promise<{
    useFallback: boolean
    method?: FallbackMethod
    reason?: string
    delay?: number
  }> {
    // Check if fallbacks are disabled
    if (!this.config.enabled) {
      return { useFallback: false }
    }

    // Check circuit breaker status
    const circuitState = await this.checkCircuitBreaker()
    if (circuitState.useFallback) {
      return circuitState
    }

    // Check rate limiting status
    const rateLimitState = await this.checkRateLimits(subreddit)
    if (rateLimitState.useFallback) {
      return rateLimitState
    }

    // Check API health
    const healthState = await this.checkApiHealth()
    if (healthState.useFallback) {
      return healthState
    }

    return { useFallback: false }
  }

  /**
   * Handle API failure and determine fallback strategy
   */
  async handleApiFailure(
    error: Error,
    subreddit: string,
    options: any
  ): Promise<{
    shouldRetry: boolean
    fallbackMethod?: FallbackMethod
    delay?: number
    fallbackData?: any
  }> {
    this.logger.warn(`API failure for r/${subreddit}:`, error.message)

    // Update circuit breaker
    this.recordFailure()

    // Determine error type and appropriate fallback
    if (this.isRateLimitError(error)) {
      return this.handleRateLimitFailure(subreddit, options)
    }

    if (this.isAuthenticationError(error)) {
      return this.handleAuthFailure(subreddit, options)
    }

    if (this.isServerError(error)) {
      return this.handleServerError(subreddit, options)
    }

    if (this.isNetworkError(error)) {
      return this.handleNetworkError(subreddit, options)
    }

    // Generic failure handling
    return this.handleGenericFailure(error, subreddit, options)
  }

  /**
   * Handle successful API response
   */
  recordSuccess(): void {
    this.lastSuccessfulRequest = new Date()
    this.circuitBreaker.successCount++
    this.circuitBreaker.failureCount = 0

    // Close circuit breaker if it was open
    if (this.circuitBreaker.status !== 'closed') {
      this.logger.info('Circuit breaker closed - API recovered')
      this.circuitBreaker.status = 'closed'
      this.circuitBreaker.nextRetryTime = null
    }

    // Exit fallback mode if active
    if (this.fallbackState.active) {
      this.exitFallbackMode()
    }
  }

  /**
   * Queue request for later processing
   */
  async queueRequest(
    subreddit: string,
    options: any,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<string> {
    const request: QueuedRequest = {
      id: `${subreddit}_${Date.now()}_${Math.random()}`,
      subreddit,
      priority,
      timestamp: new Date(),
      retryCount: 0,
      options
    }

    this.queuedRequests.set(request.id, request)

    // Store in Redis for persistence
    await this.redis.zadd(
      `reddit:fallback:queue:${priority}`,
      Date.now(),
      JSON.stringify(request)
    )

    this.logger.info(`Queued request for r/${subreddit} with priority ${priority}`)
    return request.id
  }

  /**
   * Process queued requests
   */
  async processQueue(
    maxItems = 10
  ): Promise<Array<{ success: boolean; request: QueuedRequest; error?: string }>> {
    const results: Array<{ success: boolean; request: QueuedRequest; error?: string }> = []

    // Process high priority first, then medium, then low
    for (const priority of ['high', 'medium', 'low'] as const) {
      const queueKey = `reddit:fallback:queue:${priority}`

      // Get items from Redis queue
      const items = await this.redis.zpopmin(queueKey, Math.min(maxItems - results.length, 5))

      for (let i = 0; i < items.length; i += 2) {
        try {
          const request = JSON.parse(items[i + 1]) as QueuedRequest

          // Check if we can process this request now
          const fallbackCheck = await this.shouldUseFallback(request.subreddit)

          if (!fallbackCheck.useFallback) {
            // Process the request (would call the actual API here)
            this.logger.info(`Processing queued request for r/${request.subreddit}`)
            results.push({ success: true, request })
            this.queuedRequests.delete(request.id)
          } else {
            // Put back in queue with updated retry count
            request.retryCount++
            if (request.retryCount < this.config.maxRetries) {
              await this.redis.zadd(queueKey, Date.now() + 60000, JSON.stringify(request)) // Retry in 1 minute
              results.push({ success: false, request, error: 'Still in fallback mode' })
            } else {
              results.push({ success: false, request, error: 'Max retries exceeded' })
              this.queuedRequests.delete(request.id)
            }
          }
        } catch (error) {
          this.logger.error('Error processing queued request:', error)
        }

        if (results.length >= maxItems) break
      }

      if (results.length >= maxItems) break
    }

    return results
  }

  /**
   * Get cached data as fallback
   */
  async getCachedData(subreddit: string): Promise<RedditPostInsert[] | null> {
    try {
      const cacheKey = `reddit:fallback:cache:${subreddit}`
      const cached = await this.redis.get(cacheKey)

      if (cached) {
        const data = JSON.parse(cached)
        this.logger.info(`Using cached data for r/${subreddit} (${data.length} posts)`)
        return data
      }
    } catch (error) {
      this.logger.error('Error getting cached data:', error)
    }

    return null
  }

  /**
   * Cache data for fallback use
   */
  async cacheData(subreddit: string, data: RedditPostInsert[], ttl = 3600): Promise<void> {
    try {
      const cacheKey = `reddit:fallback:cache:${subreddit}`
      await this.redis.setex(cacheKey, ttl, JSON.stringify(data))
      this.logger.debug(`Cached ${data.length} posts for r/${subreddit}`)
    } catch (error) {
      this.logger.error('Error caching data:', error)
    }
  }

  /**
   * Enter degraded mode with reduced functionality
   */
  async enterDegradedMode(reason: string): Promise<void> {
    if (!this.config.degradedMode.enabled) return

    this.fallbackState = {
      active: true,
      method: 'degrade',
      reason,
      startTime: new Date(),
      estimatedRecoveryTime: new Date(Date.now() + this.config.gracePeriod),
      retryCount: 0,
      lastAttempt: null
    }

    this.logger.warn(`Entering degraded mode: ${reason}`)

    // Store state in Redis
    await this.redis.set(
      'reddit:fallback:state',
      JSON.stringify(this.fallbackState),
      'EX',
      3600
    )
  }

  /**
   * Exit fallback mode
   */
  private async exitFallbackMode(): Promise<void> {
    if (!this.fallbackState.active) return

    const duration = Date.now() - this.fallbackState.startTime.getTime()
    this.logger.info(`Exiting fallback mode after ${duration}ms`)

    this.fallbackState = {
      active: false,
      method: null,
      reason: '',
      startTime: new Date(),
      estimatedRecoveryTime: null,
      retryCount: 0,
      lastAttempt: null
    }

    await this.redis.del('reddit:fallback:state')
  }

  /**
   * Check circuit breaker status
   */
  private async checkCircuitBreaker(): Promise<{
    useFallback: boolean
    method?: FallbackMethod
    reason?: string
    delay?: number
  }> {
    if (!this.config.circuitBreaker.enabled) {
      return { useFallback: false }
    }

    const now = Date.now()

    // Check if circuit is open
    if (this.circuitBreaker.status === 'open') {
      if (this.circuitBreaker.nextRetryTime && now >= this.circuitBreaker.nextRetryTime.getTime()) {
        // Try half-open
        this.circuitBreaker.status = 'half-open'
        this.logger.info('Circuit breaker entering half-open state')
        return { useFallback: false }
      }

      return {
        useFallback: true,
        method: 'circuit_breaker',
        reason: 'Circuit breaker is open',
        delay: this.circuitBreaker.nextRetryTime?.getTime() || now
      }
    }

    return { useFallback: false }
  }

  /**
   * Check rate limiting status
   */
  private async checkRateLimits(subreddit: string): Promise<{
    useFallback: boolean
    method?: FallbackMethod
    reason?: string
    delay?: number
  }> {
    try {
      // Check global rate limit
      const globalLimit = await this.redis.get('reddit:ratelimit:global')
      if (globalLimit) {
        const data = JSON.parse(globalLimit)
        if (data.remaining <= 0) {
          return {
            useFallback: true,
            method: 'queue',
            reason: 'Global rate limit exceeded',
            delay: data.resetTime
          }
        }
      }

      // Check subreddit-specific rate limit
      const subredditLimit = await this.redis.get(`reddit:ratelimit:${subreddit}`)
      if (subredditLimit) {
        const data = JSON.parse(subredditLimit)
        if (data.remaining <= 1) { // Use fallback when very close to limit
          return {
            useFallback: true,
            method: 'cache',
            reason: `Rate limit low for r/${subreddit}`,
            delay: data.resetTime
          }
        }
      }
    } catch (error) {
      this.logger.error('Error checking rate limits:', error)
    }

    return { useFallback: false }
  }

  /**
   * Check API health
   */
  private async checkApiHealth(): Promise<{
    useFallback: boolean
    method?: FallbackMethod
    reason?: string
  }> {
    const timeSinceLastSuccess = Date.now() - this.lastSuccessfulRequest.getTime()

    if (timeSinceLastSuccess > this.config.gracePeriod) {
      return {
        useFallback: true,
        method: 'cache',
        reason: 'API appears unhealthy'
      }
    }

    return { useFallback: false }
  }

  /**
   * Record API failure
   */
  private recordFailure(): void {
    this.circuitBreaker.failureCount++
    this.circuitBreaker.lastFailureTime = new Date()

    // Open circuit breaker if threshold exceeded
    if (
      this.config.circuitBreaker.enabled &&
      this.circuitBreaker.failureCount >= this.config.circuitBreaker.failureThreshold
    ) {
      this.circuitBreaker.status = 'open'
      this.circuitBreaker.nextRetryTime = new Date(
        Date.now() + this.config.circuitBreaker.timeout
      )

      this.logger.warn('Circuit breaker opened due to failures')
    }
  }

  /**
   * Handle rate limit failures
   */
  private async handleRateLimitFailure(
    subreddit: string,
    options: any
  ): Promise<{
    shouldRetry: boolean
    fallbackMethod?: FallbackMethod
    delay?: number
    fallbackData?: any
  }> {
    // Try cache first
    const cached = await this.getCachedData(subreddit)
    if (cached && cached.length > 0) {
      return {
        shouldRetry: false,
        fallbackMethod: 'cache',
        fallbackData: cached
      }
    }

    // Queue for later
    await this.queueRequest(subreddit, options, 'medium')

    return {
      shouldRetry: false,
      fallbackMethod: 'queue',
      delay: 3600000 // 1 hour
    }
  }

  /**
   * Handle authentication failures
   */
  private async handleAuthFailure(
    subreddit: string,
    options: any
  ): Promise<{
    shouldRetry: boolean
    fallbackMethod?: FallbackMethod
    delay?: number
    fallbackData?: any
  }> {
    // Authentication issues need immediate attention
    this.logger.error('Authentication failure - manual intervention required')

    // Use cached data if available
    const cached = await this.getCachedData(subreddit)
    if (cached) {
      return {
        shouldRetry: false,
        fallbackMethod: 'cache',
        fallbackData: cached
      }
    }

    return {
      shouldRetry: false,
      fallbackMethod: 'circuit_breaker'
    }
  }

  /**
   * Handle server errors
   */
  private async handleServerError(
    subreddit: string,
    options: any
  ): Promise<{
    shouldRetry: boolean
    fallbackMethod?: FallbackMethod
    delay?: number
    fallbackData?: any
  }> {
    // Server errors might be temporary - queue for retry
    await this.queueRequest(subreddit, options, 'low')

    // Use cached data if available
    const cached = await this.getCachedData(subreddit)
    if (cached) {
      return {
        shouldRetry: false,
        fallbackMethod: 'cache',
        fallbackData: cached
      }
    }

    return {
      shouldRetry: true,
      delay: this.calculateBackoffDelay(this.fallbackState.retryCount)
    }
  }

  /**
   * Handle network errors
   */
  private async handleNetworkError(
    subreddit: string,
    options: any
  ): Promise<{
    shouldRetry: boolean
    fallbackMethod?: FallbackMethod
    delay?: number
    fallbackData?: any
  }> {
    // Network issues - queue and use cache
    await this.queueRequest(subreddit, options, 'high')

    const cached = await this.getCachedData(subreddit)
    if (cached) {
      return {
        shouldRetry: false,
        fallbackMethod: 'cache',
        fallbackData: cached
      }
    }

    return {
      shouldRetry: true,
      delay: this.calculateBackoffDelay(this.fallbackState.retryCount)
    }
  }

  /**
   * Handle generic failures
   */
  private async handleGenericFailure(
    error: Error,
    subreddit: string,
    options: any
  ): Promise<{
    shouldRetry: boolean
    fallbackMethod?: FallbackMethod
    delay?: number
    fallbackData?: any
  }> {
    this.logger.error(`Generic failure for r/${subreddit}:`, error)

    // Try degraded mode
    if (this.config.degradedMode.enabled) {
      await this.enterDegradedMode(error.message)
      return {
        shouldRetry: false,
        fallbackMethod: 'degrade'
      }
    }

    return {
      shouldRetry: this.fallbackState.retryCount < this.config.maxRetries,
      delay: this.calculateBackoffDelay(this.fallbackState.retryCount)
    }
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoffDelay(retryCount: number): number {
    const baseDelay = 1000 // 1 second
    const delay = Math.min(
      baseDelay * Math.pow(this.config.backoffMultiplier, retryCount),
      this.config.maxBackoffDelay
    )

    // Add jitter
    return delay + Math.random() * 1000
  }

  /**
   * Determine error types
   */
  private isRateLimitError(error: Error): boolean {
    return error.message.includes('429') || error.message.includes('rate limit')
  }

  private isAuthenticationError(error: Error): boolean {
    return error.message.includes('401') || error.message.includes('403') || error.message.includes('authentication')
  }

  private isServerError(error: Error): boolean {
    return error.message.includes('500') || error.message.includes('502') || error.message.includes('503')
  }

  private isNetworkError(error: Error): boolean {
    return error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT') || error.message.includes('network')
  }

  /**
   * Start monitoring for recovery
   */
  private startMonitoring(): void {
    setInterval(async () => {
      // Process queue periodically
      if (this.queuedRequests.size > 0) {
        await this.processQueue(5)
      }

      // Check for recovery
      if (this.fallbackState.active && this.fallbackState.estimatedRecoveryTime) {
        if (Date.now() >= this.fallbackState.estimatedRecoveryTime.getTime()) {
          this.logger.info('Attempting recovery from fallback mode')
          // Would trigger a health check here
        }
      }
    }, 60000) // Every minute
  }

  /**
   * Get fallback status
   */
  getStatus(): {
    fallback: FallbackState
    circuitBreaker: CircuitBreakerState
    queueSize: number
    lastSuccessfulRequest: Date
  } {
    return {
      fallback: this.fallbackState,
      circuitBreaker: this.circuitBreaker,
      queueSize: this.queuedRequests.size,
      lastSuccessfulRequest: this.lastSuccessfulRequest
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<FallbackConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.logger.info('Fallback manager configuration updated')
  }
}