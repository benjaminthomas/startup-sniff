# Message Rate Limiting - Epic 2, Story 2.4

## Overview

Message rate limiting protects users' Reddit accounts from spam detection by enforcing a daily limit of **5 messages per user per day**. The limit resets at midnight UTC.

## Implementation

### Architecture

- **Redis-based**: Uses Upstash Redis for atomic counter operations
- **Automatic Reset**: Counters expire at midnight UTC (no manual reset needed)
- **Graceful Degradation**: Falls back gracefully if Redis is unavailable
- **Real-time UI**: Live countdown timer showing time until reset

### Components

#### 1. Rate Limiter Service (`/lib/services/rate-limiter.ts`)

Core rate limiting logic:

```typescript
import { getRateLimiter } from '@/lib/services/rate-limiter';

const rateLimiter = getRateLimiter();

// Check if user can send
const result = await rateLimiter.checkLimit({
  userId: 'user-123',
  dailyLimit: 5
});

if (!result.allowed) {
  console.log(`Limit reached. Resets in ${result.resetInSeconds}s`);
}

// Increment after sending
await rateLimiter.increment('user-123');
```

**Key Methods**:
- `checkLimit(config)` - Check if user can send
- `increment(userId)` - Increment counter after send
- `getQuota(userId)` - Get current quota status
- `reset(userId)` - Admin only: reset user's limit

#### 2. Server Action (`/modules/reddit/actions/send-message.ts`)

Integrated rate limiting in send message flow:

```typescript
// Check rate limit before sending
const rateLimit = await rateLimiter.checkLimit({
  userId: session.userId,
  dailyLimit: 5
});

if (!rateLimit.allowed) {
  return {
    success: false,
    error: `Daily limit reached. Resets in ${hours}h ${minutes}m`
  };
}

// ... send message ...

// Increment counter after successful send
await rateLimiter.increment(session.userId);
```

#### 3. Quota Display Component (`/components/features/messages/message-quota-display.tsx`)

React component showing quota status:

```typescript
import { MessageQuotaDisplay } from '@/components/features/messages/message-quota-display';

<MessageQuotaDisplay onQuotaUpdate={(remaining) => {
  console.log(`${remaining} messages remaining`);
}} />
```

**Features**:
- Real-time countdown timer
- Visual progress bar
- Color-coded status (green/orange/red)
- Warning alerts
- Automatic refresh on reset

## Configuration

### Environment Variables

Required for Redis (Upstash):

```bash
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

### Rate Limit Settings

Default: **5 messages per day**

To change the limit, update `DAILY_MESSAGE_LIMIT` in:
- `/modules/reddit/actions/send-message.ts`
- `/lib/services/rate-limiter.ts` (DEFAULT_DAILY_LIMIT)

## Redis Key Structure

Keys use the format:
```
rate_limit:messages:{userId}:{YYYY-MM-DD}
```

Example:
```
rate_limit:messages:user-123:2025-10-22
```

**TTL**: Automatically expires at midnight UTC

## User Experience

### UI States

**Normal (3+ remaining)**:
- Green theme
- Shows remaining count
- Info about why limit exists

**Warning (1-2 remaining)**:
- Orange theme
- Alert message
- Countdown prominent

**Limit Reached (0 remaining)**:
- Red theme
- Blocked from sending
- Clear reset time

### Error Messages

```
Daily limit reached (5 messages/day). Resets in 4h 23m
```

## Testing

### Manual Testing

1. **Send Messages**: Send 5 messages rapidly
2. **Check Quota**: Should show 0 remaining
3. **Try 6th Message**: Should be blocked with error
4. **Wait for Reset**: Timer should count down
5. **After Reset**: Quota should refresh to 5

### Admin Reset

For testing, reset a user's quota:

```typescript
const rateLimiter = getRateLimiter();
await rateLimiter.reset('user-id');
```

### Redis Commands

Check current count:
```bash
GET rate_limit:messages:user-123:2025-10-22
```

Check TTL:
```bash
TTL rate_limit:messages:user-123:2025-10-22
```

Delete key (reset):
```bash
DEL rate_limit:messages:user-123:2025-10-22
```

## Business Logic

### Why 5 Messages/Day?

1. **Spam Protection**: Reddit's spam filters trigger on high-volume DMs
2. **Quality Over Quantity**: Forces users to craft thoughtful messages
3. **Sustainable Growth**: Prevents platform abuse
4. **Account Safety**: Protects users from Reddit bans

### Future Enhancements

**Story 2.4 Extension (Optional)**:
- Premium tier: 10 messages/day ($50/month)
- Custom limits per subscription tier
- Analytics on quota usage patterns
- Email alert when quota resets

## Monitoring

### Metrics to Track

- Average messages sent per user per day
- % of users hitting daily limit
- Time distribution of sends
- Reset countdown engagement

### Redis Health

Monitor in production:
- Connection failures
- Increment errors
- Graceful degradation triggers

## Troubleshooting

### "Quota not resetting"

**Cause**: Redis TTL not set correctly

**Fix**: Check key TTL and ensure midnight UTC calculation is correct

### "Redis connection failed"

**Cause**: Upstash credentials missing or invalid

**Fix**:
1. Check environment variables
2. Verify Upstash dashboard
3. System falls back gracefully (allows sends)

### "Counter incremented twice"

**Cause**: Duplicate API calls or race condition

**Fix**: Redis INCR is atomic, but check for retry logic in send action

## Security

- **Rate keys are user-scoped**: No cross-user pollution
- **TTL prevents memory leaks**: Keys auto-expire
- **No PII in keys**: Uses user ID, not email/name
- **Admin reset requires auth**: Protected endpoint

## Related Files

- `/lib/services/rate-limiter.ts` - Core rate limiting service
- `/modules/reddit/actions/send-message.ts` - Integration in send flow
- `/components/features/messages/message-quota-display.tsx` - UI component
- `/lib/services/redis-cache.ts` - Redis client wrapper

## References

- Epic 2, Story 2.4: Rate Limiting and Compliance
- Reddit API Guidelines: https://www.reddit.com/wiki/api
- Upstash Redis Docs: https://docs.upstash.com/redis
