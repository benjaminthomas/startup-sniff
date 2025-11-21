'use client'

/**
 * Root Error Handler
 * Epic 1, Story 1.11: Error Handling and Monitoring
 *
 * Catches errors in the root layout
 */

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to Sentry would happen here when configured
    console.error('[Error]', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-md text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
        <h2 className="mb-2 text-2xl font-semibold">Something went wrong</h2>
        <p className="mb-6 text-muted-foreground">
          We&apos;re sorry, but something unexpected happened. Our team has been notified and is
          working on a fix.
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
            <pre className="mt-2 overflow-auto rounded bg-muted p-4 text-xs">
              {error.toString()}
              {'\n\n'}
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
