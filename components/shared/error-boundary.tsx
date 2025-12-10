'use client'

/**
 * Error Boundary Component
 * Epic 1, Story 1.11: Error Handling and Monitoring
 *
 * Catches React errors and provides graceful fallback UI
 * Integrates with Sentry for error tracking
 */

import React from 'react'
import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { log } from '@/lib/logger/client'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to Sentry
    if (typeof window !== 'undefined') {
      try {
        // Dynamic import to avoid issues if Sentry is not configured
        import('@sentry/nextjs').then((Sentry) => {
          Sentry.captureException(error, {
            contexts: {
              react: {
                componentStack: errorInfo.componentStack,
              },
            },
          })
        })
      } catch (e) {
        log.error('Failed to log to Sentry:', e)
      }
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      log.error('Error Boundary caught an error', error, { componentStack: errorInfo.componentStack })
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    this.setState({ errorInfo })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      )
    }

    return this.props.children
  }
}

interface DefaultErrorFallbackProps {
  error: Error | null
  onReset: () => void
}

function DefaultErrorFallback({ error, onReset }: DefaultErrorFallbackProps) {
  return (
    <div className="flex min-h-[600px] flex-col items-center justify-center p-8">
      <div className="max-w-md text-center space-y-6">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Something went wrong</h2>
          <p className="text-muted-foreground">
            We encountered an unexpected error. Our team has been notified and
            we&apos;re working on it.
          </p>
        </div>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === 'development' && error && (
          <details className="text-left">
            <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
              Error Details (Dev Only)
            </summary>
            <pre className="mt-2 overflow-auto rounded-lg bg-muted p-4 text-xs">
              {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
          </details>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={onReset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard" className="gap-2">
              <Home className="h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
        </div>

        {/* Support Link */}
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground mb-3">
            Need help? Contact our support team
          </p>
          <Button variant="ghost" size="sm" asChild>
            <Link href="#support" className="gap-2">
              <Mail className="h-4 w-4" />
              Contact Support
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Page-level error boundary wrapper
 * Use this to wrap entire pages
 */
export function PageErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="container py-8">
          <DefaultErrorFallback error={null} onReset={() => window.location.reload()} />
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Feature-level error boundary wrapper
 * Use this for specific features/sections that can fail independently
 */
export function FeatureErrorBoundary({
  children,
  featureName,
}: {
  children: React.ReactNode
  featureName?: string
}) {
  return (
    <ErrorBoundary
      fallback={
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold">
                {featureName ? `${featureName} Error` : 'Feature Error'}
              </h3>
              <p className="text-sm text-muted-foreground">
                This section encountered an error. Try refreshing the page.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.location.reload()}
                className="gap-2"
              >
                <RefreshCw className="h-3 w-3" />
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}
