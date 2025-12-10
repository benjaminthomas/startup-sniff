# Structured Logging

Centralized logging system replacing scattered `console.log` statements with structured, searchable logs.

## Features

- **Structured Logging**: JSON-formatted logs with consistent fields
- **Log Levels**: debug, info, warn, error
- **Sentry Integration**: Automatic error reporting in production
- **Request Tracing**: Track requests across services with request IDs
- **File Rotation**: Automatic log file rotation in production
- **Type-Safe**: Full TypeScript support

## Basic Usage

```typescript
import { log } from '@/lib/logger'

// Simple logging
log.info('User signed in')
log.error('Payment failed', error)
log.warn('Rate limit approaching')
log.debug('Cache hit', { key: 'user:123' })
```

## Logging with Context

```typescript
import { log } from '@/lib/logger'

log.info('User updated profile', {
  userId: '123',
  email: 'user@example.com',
  action: 'profile_update'
})
```

## Specialized Loggers

### Authentication

```typescript
log.auth('login', true, {
  userId: '123',
  email: 'user@example.com'
})
```

### Payment

```typescript
log.payment('subscription_created', 2000, {
  userId: '123',
  planType: 'pro_monthly'
})
```

### AI Calls

```typescript
log.ai('openai', 'gpt-4', 1500, {
  userId: '123',
  action: 'validate_idea'
})
```

### Email

```typescript
log.email('welcome', 'user@example.com', true, {
  userId: '123'
})
```

### Validation

```typescript
log.validation(ideaId, true, {
  userId: '123',
  score: 85
})
```

## Execution Timing

```typescript
import { logExecutionTime } from '@/lib/logger/utils'

const result = await logExecutionTime(
  'validateIdea',
  async () => {
    return await validateWithAI(idea)
  },
  { userId: '123', ideaId: 'abc' }
)
```

## Context Logger

```typescript
import { createContextLogger } from '@/lib/logger/utils'

// Create logger with preset context
const userLogger = createContextLogger({
  userId: '123',
  requestId: 'req_abc'
})

userLogger.info('Profile updated')
userLogger.error('Update failed', error)
```

## Request Tracing

```typescript
import { generateRequestId } from '@/lib/logger/utils'

const requestId = generateRequestId()

log.info('Processing request', {
  requestId,
  method: 'POST',
  path: '/api/validate'
})
```

## Sanitizing Sensitive Data

```typescript
import { sanitizeLogData } from '@/lib/logger/utils'

const userData = {
  email: 'user@example.com',
  password: 'secret123',
  name: 'John'
}

log.info('User data', sanitizeLogData(userData))
// Logs: { email: '...', password: '[REDACTED]', name: 'John' }
```

## Migration from console.log

### Before

```typescript
console.log('User signed in')
console.error('Payment failed:', error)
console.log('Validating idea...', ideaId)
```

### After

```typescript
log.info('User signed in', { userId, email })
log.error('Payment failed', error, { userId, amount })
log.info('Validating idea', { ideaId, userId })
```

## Environment Configuration

Set log level via environment variable:

```bash
# Development (default: debug)
LOG_LEVEL=debug

# Production (default: info)
LOG_LEVEL=info
```

## Log Files (Production Only)

Logs are automatically written to:
- `logs/error-YYYY-MM-DD.log` - Error logs only (14 day retention)
- `logs/combined-YYYY-MM-DD.log` - All logs (7 day retention)

Files auto-rotate daily with max size of 20MB.

## Best Practices

1. **Use appropriate log levels**
   - `debug`: Detailed debugging information
   - `info`: General informational messages
   - `warn`: Warning messages
   - `error`: Error events

2. **Include context**
   ```typescript
   // Good
   log.info('User created', { userId, email, planType })

   // Bad
   log.info('User created')
   ```

3. **Use specialized loggers**
   ```typescript
   // Good
   log.auth('login', true, { userId })

   // Acceptable but less specific
   log.info('User logged in', { userId })
   ```

4. **Don't log sensitive data**
   - Use `sanitizeLogData()` for user input
   - Passwords, tokens, API keys should never be logged

5. **Log errors with context**
   ```typescript
   try {
     await validateIdea(ideaId)
   } catch (error) {
     log.error('Validation failed', error, { ideaId, userId })
     throw error
   }
   ```

## Sentry Integration

Errors and warnings are automatically sent to Sentry in production with:
- Full stack traces
- Context data
- User information
- Request details

No additional configuration needed - Sentry client is already configured in the project.
