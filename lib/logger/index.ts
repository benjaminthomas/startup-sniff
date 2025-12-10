/**
 * Structured Logging Module
 * Provides type-safe logging utilities with Sentry integration
 */

import { logger as winstonLogger, IS_PRODUCTION } from './config'
import * as Sentry from '@sentry/nextjs'

export { winstonLogger as logger }

/**
 * Log context interface for structured logging
 */
export interface LogContext {
  requestId?: string
  userId?: string
  email?: string
  action?: string
  [key: string]: unknown
}

/**
 * Logger class with convenience methods
 */
class Logger {
  /**
   * Debug level - detailed information for debugging
   */
  debug(message: string, context?: LogContext) {
    winstonLogger.debug(message, context)
  }

  /**
   * Info level - general informational messages
   */
  info(message: string, context?: LogContext) {
    winstonLogger.info(message, context)
  }

  /**
   * Warn level - warning messages for potentially harmful situations
   */
  warn(message: string, context?: LogContext) {
    winstonLogger.warn(message, context)

    // Send warnings to Sentry in production
    if (IS_PRODUCTION) {
      Sentry.captureMessage(message, {
        level: 'warning',
        extra: context,
      })
    }
  }

  /**
   * Error level - error events that might still allow the app to continue
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorObj = error instanceof Error ? error : new Error(String(error))

    winstonLogger.error(message, {
      ...context,
      error: errorObj.message,
      stack: errorObj.stack,
    })

    // Send errors to Sentry
    Sentry.captureException(errorObj, {
      extra: {
        message,
        ...context,
      },
    })
  }

  /**
   * Request logger - logs HTTP requests with timing
   */
  request(method: string, path: string, context?: LogContext) {
    this.info(`${method} ${path}`, context)
  }

  /**
   * Database query logger
   */
  query(query: string, duration?: number, context?: LogContext) {
    this.debug('Database query', {
      query: query.substring(0, 200), // Truncate long queries
      duration,
      ...context,
    })
  }

  /**
   * Authentication logger
   */
  auth(action: string, success: boolean, context?: LogContext) {
    const level = success ? 'info' : 'warn'
    winstonLogger[level](`Auth: ${action}`, {
      success,
      ...context,
    })
  }

  /**
   * Payment logger - logs payment events
   */
  payment(action: string, amount?: number, context?: LogContext) {
    this.info(`Payment: ${action}`, {
      amount,
      ...context,
    })
  }

  /**
   * Validation logger - logs validation events
   */
  validation(ideaId: string, success: boolean, context?: LogContext) {
    this.info(`Validation: ${success ? 'success' : 'failed'}`, {
      ideaId,
      success,
      ...context,
    })
  }

  /**
   * AI logger - logs AI API calls
   */
  ai(provider: string, model: string, tokens?: number, context?: LogContext) {
    this.info(`AI: ${provider} ${model}`, {
      provider,
      model,
      tokens,
      ...context,
    })
  }

  /**
   * Email logger - logs email sending events
   */
  email(type: string, recipient: string, success: boolean, context?: LogContext) {
    const level = success ? 'info' : 'error'
    winstonLogger[level](`Email: ${type}`, {
      recipient,
      success,
      ...context,
    })
  }
}

// Export singleton instance
export const log = new Logger()

// Export for backward compatibility with console patterns
export default log
