/**
 * Client-Safe Logger
 * Simple console wrapper for client-side logging
 * Does not use winston/file transports which require Node.js APIs
 */

export interface LogContext {
  [key: string]: unknown
}

class ClientLogger {
  /**
   * Debug level - detailed information for debugging
   */
  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, context || '')
    }
  }

  /**
   * Info level - general informational messages
   */
  info(message: string, context?: LogContext) {
    console.info(`[INFO] ${message}`, context || '')
  }

  /**
   * Warn level - warning messages for potentially harmful situations
   */
  warn(message: string, context?: LogContext) {
    console.warn(`[WARN] ${message}`, context || '')
  }

  /**
   * Error level - error events that might still allow the app to continue
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorObj = error instanceof Error ? error : new Error(String(error))
    console.error(`[ERROR] ${message}`, {
      ...context,
      error: errorObj.message,
      stack: errorObj.stack,
    })
  }

  /**
   * Authentication logger
   */
  auth(action: string, success: boolean, context?: LogContext) {
    const level = success ? 'info' : 'warn'
    this[level](`Auth: ${action}`, { success, ...context })
  }

  /**
   * Payment logger - logs payment events
   */
  payment(action: string, amount?: number, context?: LogContext) {
    this.info(`Payment: ${action}`, { amount, ...context })
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

export const log = new ClientLogger()
export default log
