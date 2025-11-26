/**
 * Sentry Client Configuration
 * Epic 1, Story 1.11: Error Handling and Monitoring
 *
 * This configuration is used for client-side error tracking
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

  // Disable replay for now (can be enabled later for session replay)
  replaysOnErrorSampleRate: 0,
  replaysSessionSampleRate: 0,

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Environment
  environment: process.env.NODE_ENV || 'development',

  // Release tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

  // Filter out known non-critical errors
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    // Network errors
    'Network request failed',
    'NetworkError',
    'Failed to fetch',
    // Cancelled requests
    'The operation was aborted',
    'cancelled',
    'AbortError',
  ],

  // Before send hook to filter/modify events
  beforeSend(event: any, hint: any) {
    // Don't send events in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('Sentry event (dev mode):', event, hint)
      return null
    }

    // Filter out low-severity console errors
    if (event.level === 'warning') {
      return null
    }

    return event
  },
  })
}

// Export empty object to make this a valid ES module
export {}
