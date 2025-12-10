/**
 * Redis Cache Service
 *
 * Provides a simple key-value cache with TTL support.
 * Uses Upstash Redis REST API for serverless compatibility.
 *
 * Features:
 * - Get/Set/Delete operations
 * - TTL (Time To Live) support
 * - JSON serialization/deserialization
 * - Graceful degradation (falls back if Redis unavailable)
 * - Type-safe operations
 */

import { Redis } from '@upstash/redis'
import { log } from '@/lib/logger'

export interface CacheOptions {
  ttlSeconds?: number // Time to live in seconds (default: 3600 = 1 hour)
  prefix?: string // Key prefix for namespacing
}

export interface CacheStats {
  hits: number
  misses: number
  sets: number
  deletes: number
  errors: number
}

/**
 * Redis cache client with graceful degradation
 */
export class RedisCache {
  private redis: Redis | null = null
  private enabled: boolean = false
  private prefix: string
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0
  }

  constructor(options: { redisUrl?: string; prefix?: string } = {}) {
    this.prefix = options.prefix || 'cache'

    try {
      const redisUrl = process.env.UPSTASH_REDIS_REST_URL
      const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

      if (redisUrl && redisToken) {
        // Initialize Upstash Redis client
        this.redis = new Redis({
          url: redisUrl,
          token: redisToken,
        })

        this.enabled = true
        log.info('[RedisCache] Upstash Redis initialized')
      } else {
        log.warn('[RedisCache] No Upstash Redis credentials found - caching disabled')
        this.enabled = false
      }
    } catch (error) {
      log.error('[RedisCache] Failed to initialize Redis:', error)
      this.enabled = false
    }
  }

  /**
   * Check if cache is enabled and available
   */
  isEnabled(): boolean {
    return this.enabled && this.redis !== null
  }

  /**
   * Generate prefixed cache key
   */
  private getKey(key: string): string {
    return `${this.prefix}:${key}`
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isEnabled()) {
      return null
    }

    try {
      const fullKey = this.getKey(key)
      const value = await this.redis!.get<T>(fullKey)

      if (value === null) {
        this.stats.misses++
        return null
      }

      this.stats.hits++

      // Upstash Redis automatically deserializes JSON
      return value
    } catch (error) {
      this.stats.errors++
      log.error('[RedisCache] Get error:', error)
      return null
    }
  }

  /**
   * Set value in cache with optional TTL
   */
  async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<boolean> {
    if (!this.isEnabled()) {
      return false
    }

    try {
      const fullKey = this.getKey(key)
      const ttl = options.ttlSeconds || 3600 // Default 1 hour

      // Upstash Redis automatically serializes JSON and accepts EX option
      await this.redis!.set(fullKey, value, { ex: ttl })

      this.stats.sets++
      return true
    } catch (error) {
      this.stats.errors++
      log.error('[RedisCache] Set error:', error)
      return false
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    if (!this.isEnabled()) {
      return false
    }

    try {
      const fullKey = this.getKey(key)
      await this.redis!.del(fullKey)

      this.stats.deletes++
      return true
    } catch (error) {
      this.stats.errors++
      log.error('[RedisCache] Delete error:', error)
      return false
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isEnabled()) {
      return false
    }

    try {
      const fullKey = this.getKey(key)
      const exists = await this.redis!.exists(fullKey)
      return exists === 1
    } catch (error) {
      this.stats.errors++
      log.error('[RedisCache] Exists error:', error)
      return false
    }
  }

  /**
   * Get remaining TTL for a key (in seconds)
   */
  async ttl(key: string): Promise<number> {
    if (!this.isEnabled()) {
      return -1
    }

    try {
      const fullKey = this.getKey(key)
      return await this.redis!.ttl(fullKey)
    } catch (error) {
      this.stats.errors++
      log.error('[RedisCache] TTL error:', error)
      return -1
    }
  }

  /**
   * Delete all keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    if (!this.isEnabled()) {
      return 0
    }

    try {
      const fullPattern = this.getKey(pattern)
      const keys = await this.redis!.keys(fullPattern)

      if (keys.length === 0) {
        return 0
      }

      await this.redis!.del(...keys)
      this.stats.deletes += keys.length
      return keys.length
    } catch (error) {
      this.stats.errors++
      log.error('[RedisCache] Delete pattern error:', error)
      return 0
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    }
  }

  /**
   * Get cache hit rate (percentage)
   */
  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses
    if (total === 0) return 0
    return (this.stats.hits / total) * 100
  }

  /**
   * Increment a counter in cache
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    if (!this.isEnabled()) {
      return 0
    }

    try {
      const fullKey = this.getKey(key)
      return await this.redis!.incrby(fullKey, amount)
    } catch (error) {
      this.stats.errors++
      log.error('[RedisCache] Increment error:', error)
      return 0
    }
  }

  /**
   * Get multiple keys at once
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (!this.isEnabled()) {
      return keys.map(() => null)
    }

    try {
      const fullKeys = keys.map(k => this.getKey(k))
      const values = await this.redis!.mget(...fullKeys) as (T | null)[]

      return values.map(v => {
        if (v === null) {
          this.stats.misses++
          return null
        } else {
          this.stats.hits++
          // Upstash Redis automatically deserializes JSON
          return v
        }
      })
    } catch (error) {
      this.stats.errors++
      log.error('[RedisCache] Mget error:', error)
      return keys.map(() => null)
    }
  }

  /**
   * Set multiple keys at once
   */
  async mset<T>(
    entries: Array<{ key: string; value: T }>,
    options: CacheOptions = {}
  ): Promise<boolean> {
    if (!this.isEnabled()) {
      return false
    }

    try {
      const ttl = options.ttlSeconds || 3600

      // Set each key individually (Upstash doesn't support mset with TTL)
      const promises = entries.map(({ key, value }) =>
        this.set(key, value, { ttlSeconds: ttl })
      )

      await Promise.all(promises)
      return true
    } catch (error) {
      this.stats.errors++
      log.error('[RedisCache] Mset error:', error)
      return false
    }
  }
}

/**
 * Singleton instance for global cache access
 */
let cacheInstance: RedisCache | null = null

export function getCache(prefix?: string): RedisCache {
  if (!cacheInstance) {
    cacheInstance = new RedisCache({ prefix })
  }
  return cacheInstance
}

/**
 * Cache decorator for functions
 */
export function cached<T>(
  key: string | ((...args: unknown[]) => string),
  options: CacheOptions = {}
) {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: unknown[]) {
      const cache = getCache()
      const cacheKey = typeof key === 'function' ? key(...args) : key

      // Try to get from cache
      const cached = await cache.get<T>(cacheKey)
      if (cached !== null) {
        return cached
      }

      // Execute original method
      const result = await originalMethod.apply(this, args)

      // Store in cache
      await cache.set(cacheKey, result, options)

      return result
    }

    return descriptor
  }
}
