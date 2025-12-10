/**
 * Structured Logging Module
 * Provides type-safe logging utilities with Sentry integration
 * Automatically uses server-side winston logger or client-side console logger
 */

import type * as WinstonTypes from 'winston'

const isServer = typeof window === 'undefined'

// Conditionally import based on environment
let winstonLogger: WinstonTypes.Logger | null = null
let IS_PRODUCTION = process.env.NODE_ENV === 'production'

if (isServer) {
  try {
    // Dynamic import for server-only winston
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require('./config')
    winstonLogger = config.logger
    IS_PRODUCTION = config.IS_PRODUCTION
  } catch {
    // Winston not available, will use fallback
  }
}

export { winstonLogger as logger, IS_PRODUCTION }

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
 * Works on both server (winston) and client (console) side
 */
class Logger {
  /**
   * Debug level - detailed information for debugging
   */
  debug(message: string, context?: LogContext) {
    if (winstonLogger) {
      winstonLogger.debug(message, context)
    } else if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, context || '')
    }
  }

  /**
   * Info level - general informational messages
   */
  info(message: string, context?: LogContext) {
    if (winstonLogger) {
      winstonLogger.info(message, context)
    } else {
      console.info(`[INFO] ${message}`, context || '')
    }
  }

  /**
   * Warn level - warning messages for potentially harmful situations
   */
  warn(message: string, context?: LogContext) {
    if (winstonLogger) {
      winstonLogger.warn(message, context)
    } else {
      console.warn(`[WARN] ${message}`, context || '')
    }

    // Send warnings to Sentry in production (if available)
    if (IS_PRODUCTION && typeof window !== 'undefined') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Sentry = require('@sentry/nextjs')
        Sentry.captureMessage(message, {
          level: 'warning',
          extra: context,
        })
      } catch {
        // Sentry not available
      }
    }
  }

  /**
   * Error level - error events that might still allow the app to continue
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorObj = error instanceof Error ? error : new Error(String(error))

    if (winstonLogger) {
      winstonLogger.error(message, {
        ...context,
        error: errorObj.message,
        stack: errorObj.stack,
      })
    } else {
      console.error(`[ERROR] ${message}`, {
        ...context,
        error: errorObj.message,
        stack: errorObj.stack,
      })
    }

    // Send errors to Sentry (if available)
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Sentry = require('@sentry/nextjs')
      Sentry.captureException(errorObj, {
        extra: {
          message,
          ...context,
        },
      })
    } catch {
      // Sentry not available
    }
  }

  /**
   * Authentication logger
   */
  auth(action: string, success: boolean, context?: LogContext) {
    const level = success ? 'info' : 'warn'
    this[level](`Auth: ${action}`, {
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
    this[level](`Email: ${type}`, {
      recipient,
      success,
      ...context,
    })
  }
}

export const log = new Logger()
export default log
