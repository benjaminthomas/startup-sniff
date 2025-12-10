/**
 * Centralized Logging Configuration
 * Replaces scattered console.log statements with structured logging
 */

import type * as WinstonTypes from 'winston'
import type DailyRotateFileType from 'winston-daily-rotate-file'

// Conditional imports for server-only
let winston: typeof import('winston') | null = null
let DailyRotateFile: typeof DailyRotateFileType | null = null

const isServer = typeof window === 'undefined'

if (isServer) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    winston = require('winston')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    DailyRotateFile = require('winston-daily-rotate-file')
  } catch {
    // Winston not available
  }
}

// Fallback format functions for client-side (won't actually be used)
const fallbackFormat = {
  combine: (...args: unknown[]) => args[0],
  timestamp: () => ({}),
  printf: (fn: unknown) => fn,
  colorize: () => ({}),
  errors: () => ({})
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { combine, timestamp, printf, colorize, errors } = (winston?.format || fallbackFormat) as any

// Environment configuration
const isProduction = process.env.NODE_ENV === 'production'
const isDevelopment = process.env.NODE_ENV === 'development'
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug')

/**
 * Custom log format for better readability
 */
const customFormat = printf(({ level, message, timestamp, requestId, userId, ...metadata }: Record<string, unknown>) => {
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
  const metadataKeys = Object.keys(metadata)
  if (metadataKeys.length > 0) {
    msg += ` ${JSON.stringify(metadata)}`
  }

  return msg
})

/**
 * Create Winston logger instance
 */
function createLogger(): WinstonTypes.Logger | null {
  // If winston is not available (client-side), return null
  if (!winston) {
    return null
  }

  const transports: WinstonTypes.transport[] = []

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

  // File transports (production only, server-side only)
  if (isProduction && isServer && DailyRotateFile && winston) {
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
    exitOnError: false,
  })
}

export const logger = createLogger()
export const LOG_LEVEL = logLevel
export const IS_PRODUCTION = isProduction
export const IS_DEVELOPMENT = isDevelopment
