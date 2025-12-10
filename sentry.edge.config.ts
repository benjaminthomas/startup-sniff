import { log } from '@/lib/logger'

/**
 * Sentry Edge Configuration
 * Epic 1, Story 1.11: Error Handling and Monitoring
 *
 * This configuration is used for edge runtime error tracking (middleware, edge functions)
 */

// Only initialize Sentry if DSN is configured
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Sentry = require('@sentry/nextjs')

  Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Environment
  environment: process.env.NODE_ENV || 'development',

  // Release tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

  // Before send hook to filter/modify events
  beforeSend(event: any) {
    // Don't send events in development
    if (process.env.NODE_ENV !== 'production') {
      log.error('Sentry event (dev mode - edge):', event)
      return null
    }

    return event
  },
  })
}

// Export empty object to make this a valid ES module
export {}
