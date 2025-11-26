'use client'

/**
 * Global Error Handler
 * Epic 1, Story 1.11: Error Handling and Monitoring
 *
 * Catches errors that occur outside of the normal React tree
 */

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to Sentry would happen here when configured
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-8">
          <div className="max-w-md text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <h2 className="mb-2 text-2xl font-semibold">Something went wrong</h2>
            <p className="mb-6 text-gray-600">
              We&apos;re sorry, but something unexpected happened. Our team has been notified.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={reset} variant="outline">
                Try Again
              </Button>
              <Button onClick={() => (window.location.href = '/')}>Go Home</Button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm font-medium">Error Details</summary>
                <pre className="mt-2 overflow-auto rounded bg-gray-100 p-4 text-xs">
                  {error.toString()}
                  {'\n\n'}
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      </body>
    </html>
  )
}
