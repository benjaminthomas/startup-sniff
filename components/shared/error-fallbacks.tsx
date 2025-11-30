/**
 * Error Fallback Components
 * Epic 1, Story 1.11: Error Handling and Monitoring
 *
 * Provides graceful fallback UI for different error scenarios
 */

import React from 'react'
import {
  AlertTriangle,
  RefreshCw,
  WifiOff,
  Clock,
  FileQuestion,
  ServerCrash,
  AlertCircle,
  Mail,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

/**
 * Network Error Fallback
 * Shows when there's a network connectivity issue
 */
export function NetworkErrorFallback({
  onRetry,
  message,
}: {
  onRetry?: () => void
  message?: string
}) {
  return (
    <Alert variant="destructive" className="animate-in fade-in-50">
      <WifiOff className="h-4 w-4" />
      <AlertTitle>Network Connection Issue</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          {message ||
            "We're having trouble connecting to our servers. Please check your internet connection and try again."}
        </p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="gap-2"
          >
            <RefreshCw className="h-3 w-3" />
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

/**
 * Timeout Error Fallback
 * Shows when a request takes too long
 */
export function TimeoutErrorFallback({
  onRetry,
  message,
}: {
  onRetry?: () => void
  message?: string
}) {
  return (
    <Alert variant="destructive" className="animate-in fade-in-50">
      <Clock className="h-4 w-4" />
      <AlertTitle>Request Timeout</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          {message ||
            'The request is taking longer than expected. This might be due to high server load. Please try again.'}
        </p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="gap-2"
          >
            <RefreshCw className="h-3 w-3" />
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

/**
 * Reddit API Error Fallback
 * Shows when Reddit API fails, with option to show cached data
 */
export function RedditApiErrorFallback({
  onRetry,
  showingCachedData = false,
  message,
}: {
  onRetry?: () => void
  showingCachedData?: boolean
  message?: string
}) {
  if (showingCachedData) {
    return (
      <Alert className="animate-in fade-in-50 border-orange-500/50 bg-orange-500/10">
        <AlertCircle className="h-4 w-4 text-orange-500" />
        <AlertTitle className="text-orange-500">
          Showing Cached Data
        </AlertTitle>
        <AlertDescription className="space-y-3">
          <p>
            {message ||
              "We're having trouble fetching the latest data from Reddit. Don't worry - we're showing you cached data from our last successful fetch."}
          </p>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="gap-2"
            >
              <RefreshCw className="h-3 w-3" />
              Try Loading Fresh Data
            </Button>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert variant="destructive" className="animate-in fade-in-50">
      <ServerCrash className="h-4 w-4" />
      <AlertTitle>Reddit API Unavailable</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          {message ||
            "We're currently unable to fetch data from Reddit. This is usually temporary. Please try again in a few moments."}
        </p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="gap-2"
          >
            <RefreshCw className="h-3 w-3" />
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

/**
 * OpenAI API Error Fallback
 * Shows when OpenAI/AI processing fails
 */
export function OpenAiErrorFallback({
  onRetry,
  isAnalyzing = false,
  message,
}: {
  onRetry?: () => void
  isAnalyzing?: boolean
  message?: string
}) {
  if (isAnalyzing) {
    return (
      <Alert className="animate-in fade-in-50 border-blue-500/50 bg-blue-500/10">
        <Clock className="h-4 w-4 text-blue-500 animate-spin" />
        <AlertTitle className="text-blue-500">
          AI Analysis in Progress...
        </AlertTitle>
        <AlertDescription>
          <p>
            {message ||
              "We're analyzing this data with AI. This might take a moment. Please wait..."}
          </p>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert variant="destructive" className="animate-in fade-in-50">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>AI Analysis Failed</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          {message ||
            "We couldn't complete the AI analysis at this time. Please try again, or the content will be shown without AI enhancements."}
        </p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="gap-2"
          >
            <RefreshCw className="h-3 w-3" />
            Retry Analysis
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

/**
 * Empty Results Fallback
 * Shows when filters return no results
 */
export function EmptyResultsFallback({
  onClearFilters,
  message,
  icon: Icon = FileQuestion,
}: {
  onClearFilters?: () => void
  message?: string
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <Alert className="animate-in fade-in-50">
      <Icon className="h-4 w-4" />
      <AlertTitle>No Results Found</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          {message ||
            "We couldn't find any results matching your filters. Try adjusting your search criteria or clearing filters."}
        </p>
        {onClearFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="gap-2"
          >
            <RefreshCw className="h-3 w-3" />
            Clear Filters
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

/**
 * Generic API Error Fallback
 * Shows for general API failures
 */
export function ApiErrorFallback({
  onRetry,
  onContactSupport,
  error,
  message,
}: {
  onRetry?: () => void
  onContactSupport?: () => void
  error?: Error | null
  message?: string
}) {
  return (
    <Alert variant="destructive" className="animate-in fade-in-50">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Something Went Wrong</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          {message ||
            "We encountered an error while processing your request. This has been logged and we're looking into it."}
        </p>

        {/* Show error message in development */}
        {process.env.NODE_ENV === 'development' && error && (
          <details className="text-xs">
            <summary className="cursor-pointer font-medium">
              Error Details (Dev Only)
            </summary>
            <pre className="mt-2 overflow-auto rounded bg-muted p-2">
              {error.message}
            </pre>
          </details>
        )}

        <div className="flex gap-2">
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="gap-2"
            >
              <RefreshCw className="h-3 w-3" />
              Try Again
            </Button>
          )}
          {onContactSupport && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onContactSupport}
              className="gap-2"
            >
              <Mail className="h-3 w-3" />
              Contact Support
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}

/**
 * Banner component for non-blocking errors
 * Shows at top of content when there's an error but content can still be shown
 */
export function ErrorBanner({
  message,
  onDismiss,
  onRetry,
  type = 'error',
}: {
  message: string
  onDismiss?: () => void
  onRetry?: () => void
  type?: 'error' | 'warning' | 'info'
}) {
  const variantMap = {
    error: 'destructive',
    warning: 'default',
    info: 'default',
  } as const

  const iconMap = {
    error: AlertTriangle,
    warning: AlertCircle,
    info: AlertCircle,
  }

  const Icon = iconMap[type]

  return (
    <div className="sticky top-0 z-50 animate-in slide-in-from-top">
      <Alert variant={variantMap[type]} className="rounded-none border-x-0">
        <Icon className="h-4 w-4" />
        <AlertTitle className="flex items-center justify-between">
          <span>{message}</span>
          <div className="flex gap-2">
            {onRetry && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRetry}
                className="h-6 gap-1 px-2"
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </Button>
            )}
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="h-6 px-2"
              >
                Dismiss
              </Button>
            )}
          </div>
        </AlertTitle>
      </Alert>
    </div>
  )
}

/**
 * Inline error message for form fields and smaller components
 */
export function InlineError({
  message,
  icon: Icon = AlertCircle,
}: {
  message: string
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-destructive animate-in fade-in-50">
      <Icon className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
