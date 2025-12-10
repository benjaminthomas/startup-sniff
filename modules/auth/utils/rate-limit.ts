import { headers } from 'next/headers'
import { RateLimitDatabase } from '../services/database'

/**
 * Rate limiting utilities for authentication endpoints
 */

/**
 * Get client IP address for rate limiting
 */
export async function getClientIP(): Promise<string> {
  const headersList = await headers()
  const forwarded = headersList.get('x-forwarded-for')
  const realIp = headersList.get('x-real-ip')
  return forwarded?.split(',')[0] || realIp || 'unknown'
}

/**
 * Check rate limit for a specific endpoint
 * Returns true if request is allowed, false if rate limit exceeded
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  maxAttempts: number,
  windowMinutes: number
): Promise<boolean> {
  try {
    const rateLimit = await RateLimitDatabase.get(identifier, endpoint)
    const now = new Date()
    const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000)

    if (!rateLimit) {
      // First attempt
      await RateLimitDatabase.upsert({
        identifier,
        endpoint,
        attempts: 1,
        window_start: now.toISOString(),
      })
      return true
    }

    const rateLimitWindowStart = new Date(rateLimit.window_start)

    if (rateLimitWindowStart < windowStart) {
      // Window expired, reset
      await RateLimitDatabase.upsert({
        identifier,
        endpoint,
        attempts: 1,
        window_start: now.toISOString(),
        blocked_until: null,
      })
      return true
    }

    if (rateLimit.attempts >= maxAttempts) {
      // Rate limit exceeded
      const blockUntil = new Date(now.getTime() + windowMinutes * 60 * 1000)
      await RateLimitDatabase.upsert({
        identifier,
        endpoint,
        attempts: rateLimit.attempts + 1,
        window_start: rateLimit.window_start,
        blocked_until: blockUntil.toISOString(),
      })
      return false
    }

    // Increment attempts
    await RateLimitDatabase.upsert({
      identifier,
      endpoint,
      attempts: rateLimit.attempts + 1,
      window_start: rateLimit.window_start,
      blocked_until: rateLimit.blocked_until,
    })

    return true
  } catch (error) {
    console.error('Rate limiting error:', error)
    return true // Fail open for availability
  }
}
