/**
 * Next.js Instrumentation Hook
 * Epic 1, Story 1.11: Error Handling and Monitoring
 *
 * This file is automatically loaded by Next.js to register instrumentation.
 * Sentry will only initialize if NEXT_PUBLIC_SENTRY_DSN is configured.
 * To enable Sentry in production:
 * 1. Set NEXT_PUBLIC_SENTRY_DSN environment variable in Vercel
 * 2. Deploy - Sentry will automatically start tracking errors
 */

export async function register() {
  // Only load Sentry if DSN is configured
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      await import('./sentry.server.config')
    }

    if (process.env.NEXT_RUNTIME === 'edge') {
      await import('./sentry.edge.config')
    }
  }
}
