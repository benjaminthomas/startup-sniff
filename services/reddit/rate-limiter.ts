import type { Redis } from 'ioredis'
import { log } from '@/lib/logger'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime?: Date
  retryAfter?: number
  queued?: boolean
  queuePosition?: number
  priority?: 'high' | 'medium' | 'low'
  planTier?: 'free' | 'pro_monthly' | 'pro_yearly'
  error?: string
}

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  keyPrefix: string
}

export interface RateLimitMetrics {
  totalRequests: number
  currentUsage: number
  utilizationPercent: number
  rejectionRate: number
  averageUtilization: number
  peakUsage: number
}

export interface EfficiencyMetrics {
  averageUtilization: number
  peakUsage: number
  rejectionRate: number
}

export interface AnomalyDetection {
  detected: boolean
  type: 'usage_spike' | 'burst_pattern' | 'unusual_timing'
  severity: 'low' | 'medium' | 'high'
  description: string
}

export class RedditRateLimiter {
  private redis: Redis
  private config: RateLimitConfig

  constructor(redis: Redis, config: RateLimitConfig) {
    this.redis = redis
    this.config = config
  }

  /**
   * Check if request is allowed under rate limit
   */
  async checkLimit(
    key: string, 
    customLimit?: number, 
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<RateLimitResult> {
    const fullKey = `${this.config.keyPrefix}:${key}`
    const maxRequests = customLimit || this.config.maxRequests
    const windowSeconds = Math.floor(this.config.windowMs / 1000)

    try {
      // Handle unlimited plans
      if (maxRequests === -1) {
        return {
          allowed: true,
          remaining: -1,
          planTier: 'pro_yearly',
          priority
        }
      }

      // Get current usage
      const currentUsage = await this.redis.get(fullKey)
      const usageCount = currentUsage ? parseInt(currentUsage) : 0

      // Check if over limit
      if (usageCount >= maxRequests) {
        const ttl = await this.redis.ttl(fullKey)
        const resetTime = new Date(Date.now() + (ttl * 1000))
        
        // Handle low priority requests by queueing
        if (priority === 'low') {
          const queuePosition = await this.queueRequest(key, priority)
          return {
            allowed: false,
            remaining: 0,
            resetTime,
            retryAfter: ttl,
            queued: true,
            queuePosition,
            priority
          }
        }

        return {
          allowed: false,
          remaining: 0,
          resetTime,
          retryAfter: ttl,
          priority
        }
      }

      // Increment counter and set expiry
      const newCount = await this.redis.incr(fullKey)
      
      // Set expiry if this is the first request
      if (newCount === 1) {
        await this.redis.expire(fullKey, windowSeconds)
      }

      return {
        allowed: true,
        remaining: Math.max(0, maxRequests - newCount),
        resetTime: new Date(Date.now() + windowSeconds * 1000),
        priority
      }
    } catch (error) {
      log.error('Rate limiter error:', error)
      
      // Fail open - allow request when Redis is unavailable
      return {
        allowed: true,
        remaining: maxRequests,
        error: error instanceof Error ? error.message : 'Rate limiter error'
      }
    }
  }

  /**
   * Queue a low priority request
   */
  async queueRequest(key: string, priority: 'high' | 'medium' | 'low'): Promise<number> {
    const queueKey = `${this.config.keyPrefix}:queue:${priority}`
    
    try {
      const position = await this.redis.lpush(queueKey, JSON.stringify({
        key,
        timestamp: Date.now(),
        priority
      }))
      
      return position
    } catch (error) {
      log.error('Queue request error:', error)
      return 1
    }
  }

  /**
   * Process queued requests
   */
  async processQueue(maxItems: number = 10): Promise<Array<{ key: string; priority: string }>> {
    const processedItems: Array<{ key: string; priority: string }> = []
    
    // Process high priority first, then medium, then low
    const priorities = ['high', 'medium', 'low']
    
    for (const priority of priorities) {
      const queueKey = `${this.config.keyPrefix}:queue:${priority}`
      
      try {
        const items = await this.redis.rpop(queueKey, Math.min(maxItems - processedItems.length, 5))
        
        if (items) {
          for (const item of items) {
            try {
              const parsed = JSON.parse(item)
              processedItems.push({
                key: parsed.key,
                priority: parsed.priority
              })
            } catch (parseError) {
              log.error('Failed to parse queued item:', parseError)
            }
          }
        }
        
        if (processedItems.length >= maxItems) {
          break
        }
      } catch (error) {
        log.error(`Failed to process ${priority} priority queue:`, error)
      }
    }
    
    return processedItems
  }

  /**
   * Calculate exponential backoff delay with jitter
   */
  getBackoffDelay(retryCount: number): number {
    const baseDelay = 1000 // 1 second
    const maxDelay = 30000 // 30 seconds
    const jitter = Math.random() * 1000 // Add up to 1 second of jitter
    
    const delay = Math.min(baseDelay * Math.pow(2, retryCount) + jitter, maxDelay)
    return Math.floor(delay)
  }

  /**
   * Parse rate limit headers from HTTP response
   */
  parseRateLimitHeaders(headers: Headers): {
    remaining?: number
    resetTime?: Date
    used?: number
  } {
    const remaining = headers.get('x-ratelimit-remaining')
    const reset = headers.get('x-ratelimit-reset')
    const used = headers.get('x-ratelimit-used')

    return {
      remaining: remaining ? parseInt(remaining) : undefined,
      resetTime: reset ? new Date(parseInt(reset) * 1000) : undefined,
      used: used ? parseInt(used) : undefined
    }
  }

  /**
   * Update rate limit state from response headers
   */
  async updateFromHeaders(key: string, headers: Headers): Promise<void> {
    const parsed = this.parseRateLimitHeaders(headers)
    
    if (parsed.remaining !== undefined && parsed.resetTime) {
      const fullKey = `${this.config.keyPrefix}:${key}`
      const used = this.config.maxRequests - parsed.remaining
      const ttlSeconds = Math.floor((parsed.resetTime.getTime() - Date.now()) / 1000)
      
      if (ttlSeconds > 0) {
        try {
          await this.redis.set(fullKey, used, 'EX', ttlSeconds)
        } catch (error) {
          log.error('Failed to update rate limit from headers:', error)
        }
      }
    }
  }

  /**
   * Get rate limit metrics for a specific key
   */
  async getMetrics(key: string): Promise<RateLimitMetrics> {
    const fullKey = `${this.config.keyPrefix}:${key}`
    
    try {
      const currentUsage = await this.redis.get(fullKey)
      const usageCount = currentUsage ? parseInt(currentUsage) : 0
      
      // Get historical data for averages (simplified)
      const metricsKey = `${fullKey}:metrics`
      const totalRequests = await this.redis.get(`${metricsKey}:total`) || '0'
      const rejectedRequests = await this.redis.get(`${metricsKey}:rejected`) || '0'
      
      const total = parseInt(totalRequests)
      const rejected = parseInt(rejectedRequests)
      
      return {
        totalRequests: total,
        currentUsage: usageCount,
        utilizationPercent: (usageCount / this.config.maxRequests) * 100,
        rejectionRate: total > 0 ? (rejected / total) * 100 : 0,
        averageUtilization: 0, // Would need time-series data
        peakUsage: usageCount // Simplified - would track actual peak
      }
    } catch (error) {
      log.error('Failed to get rate limit metrics:', error)
      return {
        totalRequests: 0,
        currentUsage: 0,
        utilizationPercent: 0,
        rejectionRate: 0,
        averageUtilization: 0,
        peakUsage: 0
      }
    }
  }

  /**
   * Get efficiency metrics across all keys
   */
  async getEfficiencyMetrics(): Promise<EfficiencyMetrics> {
    try {
      // Simplified implementation - would scan all keys with prefix
      const pattern = `${this.config.keyPrefix}:*:metrics:*`
      const keys = await this.redis.keys(pattern)
      
      // Calculate aggregated metrics
      const totalUtilization = 0
      const peakUsage = 0
      let totalRejections = 0
      let totalRequests = 0
      
      for (const key of keys) {
        if (key.includes(':total')) {
          const requests = await this.redis.get(key)
          totalRequests += parseInt(requests || '0')
        } else if (key.includes(':rejected')) {
          const rejected = await this.redis.get(key)
          totalRejections += parseInt(rejected || '0')
        }
      }
      
      return {
        averageUtilization: keys.length > 0 ? totalUtilization / keys.length : 0,
        peakUsage,
        rejectionRate: totalRequests > 0 ? (totalRejections / totalRequests) * 100 : 0
      }
    } catch (error) {
      log.error('Failed to get efficiency metrics:', error)
      return {
        averageUtilization: 0,
        peakUsage: 0,
        rejectionRate: 0
      }
    }
  }

  /**
   * Detect rate limit anomalies
   */
  async detectAnomaly(key: string): Promise<AnomalyDetection> {
    const fullKey = `${this.config.keyPrefix}:${key}`
    
    try {
      const currentUsage = await this.redis.get(fullKey)
      const usageCount = currentUsage ? parseInt(currentUsage) : 0
      
      // Simple spike detection
      const utilizationPercent = (usageCount / this.config.maxRequests) * 100
      
      if (utilizationPercent > 90) {
        return {
          detected: true,
          type: 'usage_spike',
          severity: 'high',
          description: `Usage at ${utilizationPercent.toFixed(1)}% of limit`
        }
      } else if (utilizationPercent > 70) {
        return {
          detected: true,
          type: 'usage_spike',
          severity: 'medium',
          description: `Usage at ${utilizationPercent.toFixed(1)}% of limit`
        }
      }
      
      return {
        detected: false,
        type: 'usage_spike',
        severity: 'low',
        description: 'Normal usage pattern'
      }
    } catch (error) {
      log.error('Failed to detect anomaly:', error)
      return {
        detected: false,
        type: 'usage_spike',
        severity: 'low',
        description: 'Error detecting anomalies'
      }
    }
  }

  /**
   * Clean up old rate limit data
   */
  async cleanup(): Promise<number> {
    try {
      const pattern = `${this.config.keyPrefix}:*`
      const keys = await this.redis.keys(pattern)
      
      let cleanedUp = 0
      
      for (const key of keys) {
        const ttl = await this.redis.ttl(key)
        
        // Remove keys that have expired but somehow weren't cleaned up
        if (ttl === -1) { // No expiry set
          const exists = await this.redis.exists(key)
          if (exists) {
            await this.redis.del(key)
            cleanedUp++
          }
        }
      }
      
      return cleanedUp
    } catch (error) {
      log.error('Rate limiter cleanup error:', error)
      return 0
    }
  }
}