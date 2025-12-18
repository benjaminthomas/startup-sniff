/**
 * Logging Utility Functions
 * Helper functions for common logging patterns
 */

import { log, type LogContext } from './index'

/**
 * Generate a unique request ID for tracing
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Log function execution time
 */
export async function logExecutionTime<T>(
  name: string,
  fn: () => Promise<T>,
  context?: LogContext
): Promise<T> {
  const start = Date.now()
  try {
    const result = await fn()
    const duration = Date.now() - start
    log.debug(`${name} completed`, { duration, ...context })
    return result
  } catch (error) {
    const duration = Date.now() - start
    log.error(`${name} failed`, error, { duration, ...context })
    throw error
  }
}

/**
 * Log function execution time (sync version)
 */
export function logExecutionTimeSync<T>(
  name: string,
  fn: () => T,
  context?: LogContext
): T {
  const start = Date.now()
  try {
    const result = fn()
    const duration = Date.now() - start
    log.debug(`${name} completed`, { duration, ...context })
    return result
  } catch (error) {
    const duration = Date.now() - start
    log.error(`${name} failed`, error, { duration, ...context })
    throw error
  }
}

/**
 * Create a child logger with preset context
 */
export function createContextLogger(baseContext: LogContext) {
  return {
    debug: (message: string, context?: LogContext) =>
      log.debug(message, { ...baseContext, ...context }),
    info: (message: string, context?: LogContext) =>
      log.info(message, { ...baseContext, ...context }),
    warn: (message: string, context?: LogContext) =>
      log.warn(message, { ...baseContext, ...context }),
    error: (message: string, error?: Error | unknown, context?: LogContext) =>
      log.error(message, error, { ...baseContext, ...context }),
  }
}

/**
 * Sanitize sensitive data before logging
 */
export function sanitizeLogData(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = [
    'password',
    'passwordHash',
    'password_hash',
    'token',
    'apiKey',
    'api_key',
    'secret',
    'authorization',
    'cookie',
    'csrfToken',
    'csrf_token',
  ]

  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase()
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]'
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeLogData(value as Record<string, unknown>)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Log API response with timing
 */
export function logApiResponse(
  endpoint: string,
  statusCode: number,
  duration: number,
  context?: LogContext
) {
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'
  log[level](`API ${endpoint} - ${statusCode}`, {
    endpoint,
    statusCode,
    duration,
    ...context,
  })
}

/**
 * Log user action for analytics
 */
export function logUserAction(
  action: string,
  userId: string,
  metadata?: Record<string, unknown>
) {
  log.info(`User action: ${action}`, {
    action,
    userId,
    ...metadata,
  })
}
