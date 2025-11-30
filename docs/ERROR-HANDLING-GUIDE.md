# Error Handling & Monitoring Guide

**Epic 1, Story 1.11: Error Handling and Graceful Degradation**

This guide covers the comprehensive error handling and monitoring system implemented in StartupSniff.

## Table of Contents

1. [Overview](#overview)
2. [Sentry Integration](#sentry-integration)
3. [Error Boundaries](#error-boundaries)
4. [Retry Logic](#retry-logic)
5. [Error Fallback Components](#error-fallback-components)
6. [Support Contact Form](#support-contact-form)
7. [API Error Handling](#api-error-handling)
8. [Best Practices](#best-practices)

---

## Overview

The error handling system provides:

- **Sentry Integration**: Automatic error tracking and reporting
- **Error Boundaries**: React error boundaries for graceful UI failures
- **Retry Logic**: Exponential backoff for API failures
- **Fallback UI**: User-friendly error messages and recovery options
- **Support Contact**: Easy way for users to report issues

## Sentry Integration

### Setup

Sentry is enabled in production when `NEXT_PUBLIC_SENTRY_DSN` environment variable is set.

**Configuration Files:**
- `instrumentation.ts` - Next.js instrumentation hook
- `sentry.client.config.ts` - Client-side Sentry config
- `sentry.server.config.ts` - Server-side Sentry config
- `sentry.edge.config.ts` - Edge runtime Sentry config

### Features

- **Automatic Error Capture**: All unhandled errors are sent to Sentry
- **Performance Monitoring**: 10% trace sample rate in production
- **Release Tracking**: Uses Vercel Git SHA for release tracking
- **Error Filtering**: Filters out known non-critical errors
- **Development Safety**: No events sent in development mode

### Environment Variables

```bash
# Required for Sentry to work
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...

# Optional - automatically set by Vercel
NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA=abc123...
```

### Manual Error Reporting

```typescript
import * as Sentry from '@sentry/nextjs'

// Capture an exception
try {
  riskyOperation()
} catch (error) {
  Sentry.captureException(error, {
    contexts: {
      operation: {
        name: 'riskyOperation',
        params: { /* ... */ },
      },
    },
  })
}

// Capture a message
Sentry.captureMessage('Something important happened', {
  level: 'info',
  contexts: {
    custom: {
      userId: user.id,
    },
  },
})
```

---

## Error Boundaries

Error boundaries catch React errors and provide graceful fallback UI.

### Usage

```typescript
import { ErrorBoundary, PageErrorBoundary, FeatureErrorBoundary } from '@/components/shared/error-boundary'

// Page-level error boundary
export default function MyPage() {
  return (
    <PageErrorBoundary>
      <YourPageContent />
    </PageErrorBoundary>
  )
}

// Feature-level error boundary
function MyFeature() {
  return (
    <FeatureErrorBoundary featureName="Analytics Dashboard">
      <AnalyticsDashboard />
    </FeatureErrorBoundary>
  )
}

// Custom error boundary
function CustomBoundary() {
  return (
    <ErrorBoundary
      fallback={<CustomErrorUI />}
      onError={(error, errorInfo) => {
        console.log('Custom error handler', error, errorInfo)
      }}
    >
      <YourComponent />
    </ErrorBoundary>
  )
}
```

### Error Boundary Types

| Type | Use Case | Fallback UI |
|------|----------|-------------|
| `PageErrorBoundary` | Entire pages | Full-page error with navigation |
| `FeatureErrorBoundary` | Specific features | Inline error with refresh option |
| `ErrorBoundary` | Custom scenarios | Custom or default fallback |

---

## Retry Logic

Automatic retry with exponential backoff for transient failures.

### Basic Usage

```typescript
import { retry, retryPresets } from '@/lib/utils/retry'

// Simple retry
const data = await retry(
  async () => {
    const response = await fetch('/api/data')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.json()
  },
  retryPresets.standard // 3 retries with 1s initial delay
)

// Custom retry configuration
const result = await retry(
  async () => fetchData(),
  {
    maxAttempts: 5,
    initialDelay: 2000,
    maxDelay: 30000,
    backoffMultiplier: 3,
    shouldRetry: (error) => {
      // Only retry network errors
      return error.message.includes('network')
    },
    onRetry: (error, attempt) => {
      console.log(`Retry ${attempt}:`, error.message)
    }
  }
)
```

### Retry Presets

| Preset | Max Attempts | Initial Delay | Max Delay | Use Case |
|--------|-------------|---------------|-----------|----------|
| `quick` | 2 | 500ms | 2s | Fast operations (DB queries) |
| `standard` | 3 | 1s | 5s | Most operations |
| `patient` | 4 | 2s | 15s | Slow operations (external APIs) |
| `redditApi` | 3 | 2s | 10s | Reddit API calls |
| `rateLimit` | 2 | 5s | 30s | Rate-limited APIs |

### Circuit Breaker

Prevents cascading failures by opening circuit after too many failures:

```typescript
import { CircuitBreaker } from '@/lib/utils/retry'

const breaker = new CircuitBreaker({
  failureThreshold: 5,    // Open after 5 failures
  resetTimeout: 60000,    // Try again after 1 minute
})

const result = await breaker.execute(async () => {
  return await callExternalApi()
})
```

---

## Error Fallback Components

User-friendly error messages for different scenarios.

### Network Errors

```typescript
import { NetworkErrorFallback } from '@/components/shared/error-fallbacks'

<NetworkErrorFallback
  message="Custom network error message"
  onRetry={() => refetch()}
/>
```

### Timeout Errors

```typescript
import { TimeoutErrorFallback } from '@/components/shared/error-fallbacks'

<TimeoutErrorFallback
  message="Request is taking longer than expected"
  onRetry={() => refetch()}
/>
```

### Reddit API Errors (with Cached Data)

```typescript
import { RedditApiErrorFallback } from '@/components/shared/error-fallbacks'

// Show cached data banner
<RedditApiErrorFallback
  showingCachedData={true}
  message="Showing data from 2 hours ago"
  onRetry={() => fetchFresh()}
/>

// Show error without cached data
<RedditApiErrorFallback
  showingCachedData={false}
  onRetry={() => refetch()}
/>
```

### OpenAI Errors

```typescript
import { OpenAiErrorFallback } from '@/components/shared/error-fallbacks'

// Analyzing state
<OpenAiErrorFallback
  isAnalyzing={true}
  message="AI is processing your request..."
/>

// Error state
<OpenAiErrorFallback
  isAnalyzing={false}
  message="AI analysis failed"
  onRetry={() => retryAnalysis()}
/>
```

### Empty Results

```typescript
import { EmptyResultsFallback } from '@/components/shared/error-fallbacks'

<EmptyResultsFallback
  message="No results found with current filters"
  onClearFilters={() => clearFilters()}
/>
```

### Generic API Errors

```typescript
import { ApiErrorFallback } from '@/components/shared/error-fallbacks'

<ApiErrorFallback
  error={error}
  message="Failed to load data"
  onRetry={() => refetch()}
  onContactSupport={() => openSupportForm()}
/>
```

### Error Banner (Non-blocking)

```typescript
import { ErrorBanner } from '@/components/shared/error-fallbacks'

<ErrorBanner
  type="error"  // 'error' | 'warning' | 'info'
  message="Failed to save changes"
  onRetry={() => retrySave()}
  onDismiss={() => closeBanner()}
/>
```

### Inline Errors (Form Fields)

```typescript
import { InlineError } from '@/components/shared/error-fallbacks'

<InlineError message="Email is required" />
```

---

## Support Contact Form

Accessible support form for error reporting.

### Usage

```typescript
import { SupportContactForm, SupportLink } from '@/components/features/support/support-contact-form'

// Full form with error context
<SupportContactForm
  errorContext={{
    errorMessage: error.message,
    errorStack: error.stack,
    userAgent: navigator.userAgent,
    url: window.location.href,
  }}
  onSuccess={() => {
    console.log('Support ticket submitted')
  }}
/>

// Quick support link
<SupportLink
  errorContext={errorContext}
>
  Need help? Contact support
</SupportLink>

// Custom trigger button
<SupportContactForm
  trigger={
    <Button variant="outline">Get Help</Button>
  }
/>
```

---

## API Error Handling

### Reddit API with Fallback

The Reddit fallback manager provides:
- Automatic caching of successful responses
- Circuit breaker pattern
- Request queueing during failures
- Degraded mode operation

```typescript
// Backend example (already implemented)
const fallbackManager = new RedditFallbackManager(config, redis, logger)

// Check if should use fallback
const check = await fallbackManager.shouldUseFallback(subreddit)
if (check.useFallback) {
  // Use cached data
  const cached = await fallbackManager.getCachedData(subreddit)
  return cached
}

// Handle API failure
const result = await fallbackManager.handleApiFailure(error, subreddit, options)
if (result.fallbackData) {
  return result.fallbackData
}
```

### OpenAI with Retry

OpenAI calls automatically retry on transient failures:

```typescript
// Implemented in OpportunityDeepAnalyzer
const analyzer = new OpportunityDeepAnalyzer()

try {
  const analysis = await analyzer.analyzePost(post)
  // Analysis will retry automatically on rate limits, timeouts, 5xx errors
} catch (error) {
  // Handle permanent failures (auth errors, invalid requests)
  console.error('AI analysis failed permanently:', error)
}
```

---

## Best Practices

### 1. Always Use Error Boundaries

Wrap pages and critical features in error boundaries:

```typescript
// ✅ Good
export default function Page() {
  return (
    <PageErrorBoundary>
      <Content />
    </PageErrorBoundary>
  )
}

// ❌ Bad
export default function Page() {
  return <Content /> // Uncaught errors crash entire app
}
```

### 2. Provide Retry Actions

Always give users a way to recover:

```typescript
// ✅ Good
<NetworkErrorFallback
  onRetry={() => refetch()}
/>

// ❌ Bad
<div>Network error occurred</div>
```

### 3. Use Appropriate Retry Presets

Match retry strategy to operation type:

```typescript
// ✅ Good - Fast DB query
await retry(fetchFromDB, retryPresets.quick)

// ✅ Good - External API
await retry(callExternalApi, retryPresets.patient)

// ❌ Bad - Wrong preset
await retry(callExternalApi, retryPresets.quick) // Too aggressive
```

### 4. Log Errors with Context

Provide helpful context for debugging:

```typescript
// ✅ Good
Sentry.captureException(error, {
  contexts: {
    operation: {
      name: 'fetchOpportunities',
      subreddit,
      limit,
    },
  },
})

// ❌ Bad
Sentry.captureException(error) // No context
```

### 5. Show User-Friendly Messages

Don't expose technical details to users:

```typescript
// ✅ Good
<ApiErrorFallback
  message="We couldn't load your data. Please try again."
  error={error} // Only shown in dev mode
/>

// ❌ Bad
<div>Error: ECONNREFUSED 127.0.0.1:5432</div>
```

### 6. Handle Empty States

Empty results are not errors, but need clear messaging:

```typescript
// ✅ Good
{results.length === 0 ? (
  <EmptyResultsFallback
    message="No opportunities match your filters"
    onClearFilters={() => clearFilters()}
  />
) : (
  <ResultsList results={results} />
)}
```

### 7. Test Error Scenarios

Test how your app handles failures:

```typescript
// Simulate network error
throw new Error('Network request failed')

// Simulate timeout
await new Promise((resolve) => setTimeout(resolve, 31000))

// Simulate rate limit
throw new Error('429 Too Many Requests')
```

---

## Acceptance Criteria Checklist

- [x] Sentry or Bugsnag integrated with error context
- [x] Reddit API failure shows cached data + banner
- [x] OpenAI failure shows "Analyzing..." placeholder
- [x] Network timeout has clear messaging
- [x] Empty filter results show helpful guidance
- [x] 3 retries with exponential backoff on API failures
- [x] Support contact form accessible from errors

---

## Files Reference

### Error Handling Infrastructure
- `instrumentation.ts` - Sentry initialization
- `sentry.client.config.ts` - Client Sentry config
- `sentry.server.config.ts` - Server Sentry config
- `sentry.edge.config.ts` - Edge Sentry config

### Components
- `components/shared/error-boundary.tsx` - Error boundaries
- `components/shared/error-fallbacks.tsx` - Fallback UI components
- `components/features/support/support-contact-form.tsx` - Support form

### Utilities
- `lib/utils/retry.ts` - Retry logic and circuit breaker
- `lib/reddit/fallback-manager.ts` - Reddit API fallback system

### Services
- `lib/services/opportunity-deep-analyzer.ts` - OpenAI with retry logic

---

## Next Steps

1. **Set SENTRY_DSN** in Vercel environment variables
2. **Test error scenarios** in production
3. **Monitor Sentry** dashboard for error patterns
4. **Iterate** on error messages based on user feedback

For questions or issues, see [DEPLOYMENT-READY-SUMMARY.md](../DEPLOYMENT-READY-SUMMARY.md).
