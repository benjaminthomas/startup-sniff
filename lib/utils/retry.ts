/**
 * Retry Utilities
 * Epic 1, Story 1.11: Error Handling and Monitoring
 *
 * Utilities for retrying failed operations with exponential backoff
 */

export interface RetryOptions {
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxAttempts?: number

  /**
   * Initial delay in milliseconds before first retry
   * @default 1000
   */
  initialDelay?: number

  /**
   * Maximum delay in milliseconds between retries
   * @default 10000
   */
  maxDelay?: number

  /**
   * Multiplier for exponential backoff
   * @default 2
   */
  backoffMultiplier?: number

  /**
   * Predicate function to determine if error should be retried
   * @default () => true
   */
  shouldRetry?: (error: Error, attempt: number) => boolean

  /**
   * Callback invoked before each retry attempt
   */
  onRetry?: (error: Error, attempt: number) => void
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    shouldRetry = () => true,
    onRetry,
  } = options

  let lastError: Error
  let attempt = 0

  while (attempt < maxAttempts) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      attempt++

      // Check if we should retry this error
      if (!shouldRetry(lastError, attempt)) {
        throw lastError
      }

      // If we've exhausted all attempts, throw the error
      if (attempt >= maxAttempts) {
        // Log final failure to Sentry would happen here when configured
        throw lastError
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelay * Math.pow(backoffMultiplier, attempt - 1),
        maxDelay
      )

      // Call retry callback
      onRetry?.(lastError, attempt)

      console.warn(
        `[retry] Attempt ${attempt}/${maxAttempts} failed. Retrying in ${delay}ms...`,
        lastError.message
      )

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError!
}

/**
 * Common retry predicates
 */
export const retryPredicates = {
  /**
   * Retry network errors (timeouts, connection issues)
   */
  networkErrors: (error: Error) => {
    const message = error.message.toLowerCase()
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('fetch') ||
      message.includes('econnrefused') ||
      message.includes('enotfound') ||
      error.name === 'AbortError'
    )
  },

  /**
   * Retry rate limit errors (with longer delays)
   */
  rateLimitErrors: (error: Error) => {
    const message = error.message.toLowerCase()
    return (
      message.includes('rate limit') ||
      message.includes('too many requests') ||
      message.includes('ratelimit')
    )
  },

  /**
   * Retry transient Reddit API errors
   */
  redditApiErrors: (error: Error) => {
    const message = error.message.toLowerCase()
    // Retry on network errors and certain Reddit API errors
    // Don't retry on 401/403 (auth errors) or 404 (not found)
    return (
      retryPredicates.networkErrors(error) ||
      message.includes('service unavailable') ||
      message.includes('internal server error') ||
      message.includes('bad gateway')
    )
  },

  /**
   * Retry database connection errors
   */
  databaseErrors: (error: Error) => {
    const message = error.message.toLowerCase()
    return (
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes('deadlock')
    )
  },
}

/**
 * Preset retry configurations for common scenarios
 */
export const retryPresets = {
  /**
   * Quick retries for fast operations (e.g., database queries)
   */
  quick: {
    maxAttempts: 2,
    initialDelay: 500,
    maxDelay: 2000,
  } as RetryOptions,

  /**
   * Standard retries for most operations
   */
  standard: {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 5000,
  } as RetryOptions,

  /**
   * Patient retries for slow operations (e.g., external APIs)
   */
  patient: {
    maxAttempts: 4,
    initialDelay: 2000,
    maxDelay: 15000,
    backoffMultiplier: 3,
  } as RetryOptions,

  /**
   * Reddit API specific retries
   */
  redditApi: {
    maxAttempts: 3,
    initialDelay: 2000,
    maxDelay: 10000,
    shouldRetry: retryPredicates.redditApiErrors,
  } as RetryOptions,

  /**
   * Rate limit retries (longer delays)
   */
  rateLimit: {
    maxAttempts: 2,
    initialDelay: 5000,
    maxDelay: 30000,
    shouldRetry: retryPredicates.rateLimitErrors,
  } as RetryOptions,
}

/**
 * Retry with circuit breaker pattern
 * Opens circuit after too many failures, preventing cascading failures
 */
export class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'

  constructor(
    private options: {
      failureThreshold: number
      resetTimeout: number
      monitorInterval?: number
    }
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === 'open') {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime
      if (timeSinceLastFailure < this.options.resetTimeout) {
        throw new Error('Circuit breaker is open')
      }
      // Try to close circuit
      this.state = 'half-open'
    }

    try {
      const result = await fn()
      // Success - reset circuit
      if (this.state === 'half-open') {
        this.state = 'closed'
        this.failures = 0
      }
      return result
    } catch (error) {
      this.failures++
      this.lastFailureTime = Date.now()

      // Open circuit if threshold exceeded
      if (this.failures >= this.options.failureThreshold) {
        this.state = 'open'
        console.error('[circuit-breaker] Circuit opened after', this.failures, 'failures')
      }

      throw error
    }
  }
}
