/**
 * Rate Limiter Service - Epic 2, Story 2.4
 *
 * Enforces message sending limits to protect users from Reddit spam bans.
 * Uses Redis for atomic counter operations with daily reset at midnight UTC.
 */

import { getCache } from './redis-cache';
import { log } from '@/lib/logger'

export interface RateLimitConfig {
  dailyLimit: number; // Maximum messages per day
  userId: string; // User to check rate limit for
}

export interface RateLimitResult {
  allowed: boolean; // Whether the action is allowed
  remaining: number; // Messages remaining today
  limit: number; // Total daily limit
  resetAt: Date; // When the limit resets (midnight UTC)
  resetInSeconds: number; // Seconds until reset
}

/**
 * Message rate limiting per user
 */
export class MessageRateLimiter {
  private cache = getCache('rate_limit');
  private readonly DEFAULT_DAILY_LIMIT = 5;

  /**
   * Get rate limit key for a user
   */
  private getRateLimitKey(userId: string): string {
    const today = this.getTodayString();
    return `messages:${userId}:${today}`;
  }

  /**
   * Get today's date string in UTC (YYYY-MM-DD)
   */
  private getTodayString(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  /**
   * Get seconds until midnight UTC
   */
  private getSecondsUntilMidnightUTC(): number {
    const now = new Date();
    const tomorrow = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0, 0, 0, 0
    ));
    return Math.floor((tomorrow.getTime() - now.getTime()) / 1000);
  }

  /**
   * Get reset time (midnight UTC)
   */
  private getResetTime(): Date {
    const now = new Date();
    const tomorrow = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0, 0, 0, 0
    ));
    return tomorrow;
  }

  /**
   * Check if user can send a message
   * Returns rate limit information
   */
  async checkLimit(config: RateLimitConfig): Promise<RateLimitResult> {
    const limit = config.dailyLimit || this.DEFAULT_DAILY_LIMIT;
    const key = this.getRateLimitKey(config.userId);

    try {
      // Get current count from Redis
      const currentCount = await this.cache.get<number>(key) || 0;
      const remaining = Math.max(0, limit - currentCount);
      const allowed = remaining > 0;

      return {
        allowed,
        remaining,
        limit,
        resetAt: this.getResetTime(),
        resetInSeconds: this.getSecondsUntilMidnightUTC()
      };
    } catch (error) {
      log.error('[RateLimiter] Error checking limit:', error);

      // Graceful degradation: If Redis fails, allow the action but log the error
      // In production, you might want to be more conservative
      return {
        allowed: true,
        remaining: limit,
        limit,
        resetAt: this.getResetTime(),
        resetInSeconds: this.getSecondsUntilMidnightUTC()
      };
    }
  }

  /**
   * Increment message count for user
   * Call this AFTER successfully sending a message
   */
  async increment(userId: string): Promise<RateLimitResult> {
    const key = this.getRateLimitKey(userId);
    const ttl = this.getSecondsUntilMidnightUTC();

    try {
      // Increment counter atomically
      const newCount = await this.cache.increment(key, 1);

      // Set TTL if this is the first increment today
      if (newCount === 1) {
        // We need to set the expiration on the key
        // The increment doesn't automatically set TTL
        await this.cache.set(key, newCount, { ttlSeconds: ttl });
      }

      const limit = this.DEFAULT_DAILY_LIMIT;
      const remaining = Math.max(0, limit - newCount);

      return {
        allowed: remaining > 0,
        remaining,
        limit,
        resetAt: this.getResetTime(),
        resetInSeconds: this.getSecondsUntilMidnightUTC()
      };
    } catch (error) {
      log.error('[RateLimiter] Error incrementing:', error);

      return {
        allowed: false,
        remaining: 0,
        limit: this.DEFAULT_DAILY_LIMIT,
        resetAt: this.getResetTime(),
        resetInSeconds: this.getSecondsUntilMidnightUTC()
      };
    }
  }

  /**
   * Get current quota status for user
   */
  async getQuota(userId: string): Promise<RateLimitResult> {
    return this.checkLimit({
      userId,
      dailyLimit: this.DEFAULT_DAILY_LIMIT
    });
  }

  /**
   * Reset rate limit for user (admin only)
   */
  async reset(userId: string): Promise<void> {
    const key = this.getRateLimitKey(userId);
    await this.cache.delete(key);
  }

  /**
   * Get formatted quota message for UI
   */
  async getQuotaMessage(userId: string): Promise<string> {
    const quota = await this.getQuota(userId);

    if (quota.remaining === 0) {
      const hours = Math.floor(quota.resetInSeconds / 3600);
      const minutes = Math.floor((quota.resetInSeconds % 3600) / 60);
      return `Daily limit reached. Resets in ${hours}h ${minutes}m`;
    }

    return `${quota.remaining} of ${quota.limit} messages remaining today`;
  }
}

/**
 * Singleton instance
 */
let rateLimiterInstance: MessageRateLimiter | null = null;

export function getRateLimiter(): MessageRateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new MessageRateLimiter();
  }
  return rateLimiterInstance;
}
