/**
 * Centralized Logging Configuration
 * Replaces scattered console.log statements with structured logging
 */

import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'

const { combine, timestamp, printf, colorize, errors } = winston.format

// Environment configuration
const isProduction = process.env.NODE_ENV === 'production'
const isDevelopment = process.env.NODE_ENV === 'development'
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug')

/**
 * Custom log format for better readability
 */
const customFormat = printf(({ level, message, timestamp, requestId, userId, ...metadata }) => {
  let msg = `${timestamp} [${level}]`

  // Add request ID if available (for tracing)
  if (requestId) {
    msg += ` [req:${requestId}]`
  }

  // Add user ID if available
  if (userId) {
    msg += ` [user:${userId}]`
  }

  msg += `: ${message}`

  // Add metadata if present
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`
  }

  return msg
})

/**
 * Create Winston logger instance
 */
function createLogger() {
  const transports: winston.transport[] = []

  // Console transport (always enabled)
  transports.push(
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        customFormat
      ),
      level: logLevel,
    })
  )

  // File transports (production only)
  if (isProduction) {
    // Error logs
    transports.push(
      new DailyRotateFile({
        filename: 'logs/error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxFiles: '14d',
        maxSize: '20m',
        format: combine(
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          errors({ stack: true }),
          winston.format.json()
        ),
      })
    )

    // Combined logs
    transports.push(
      new DailyRotateFile({
        filename: 'logs/combined-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxFiles: '7d',
        maxSize: '20m',
        format: combine(
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.json()
        ),
      })
    )
  }

  return winston.createLogger({
    level: logLevel,
    format: combine(
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      winston.format.json()
    ),
    transports,
    // Don't exit on errors
    exitOnError: false,
  })
}

// Singleton logger instance
export const logger = createLogger()

// Export log level for conditional logging
export const LOG_LEVEL = logLevel
export const IS_PRODUCTION = isProduction
export const IS_DEVELOPMENT = isDevelopment
