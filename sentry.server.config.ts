import { log } from '@/lib/logger'

/**
 * Sentry Server Configuration
 * Epic 1, Story 1.11: Error Handling and Monitoring
 *
 * This configuration is used for server-side error tracking
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

  // Filter out known non-critical errors
  ignoreErrors: [
    // Rate limiting errors (expected)
    'Rate limit exceeded',
    'Too many requests',
    // Reddit API errors (handled gracefully)
    'Reddit API error',
    'RATELIMIT',
  ],

  // Before send hook to filter/modify events
  beforeSend(event: any, hint: any) {
    // Don't send events in development
    if (process.env.NODE_ENV !== 'production') {
      log.error('Sentry event (dev mode):', event, hint)
      return null
    }

    // Add user context if available (without PII)
    if (event.user && event.user.id) {
      event.user = {
        id: event.user.id,
      }
    }

    return event
  },

    // Integrations for server-side
    integrations: [
      // Add additional integrations as needed
    ],
  })
}

// Export empty object to make this a valid ES module
export {}
