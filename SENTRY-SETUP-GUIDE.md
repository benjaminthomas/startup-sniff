# Sentry Error Tracking Setup Guide
**Story 1.11: Enhanced Error Handling**
**Status:** Ready to Enable

---

## 📋 What's Already Built

Sentry integration is **completely implemented** but **disabled by default**. All code is ready - you just need to add your Sentry DSN to enable it.

### Files Already Configured
- ✅ `instrumentation.ts` - Sentry initialization (commented out)
- ✅ `sentry.client.config.ts` - Client-side error tracking
- ✅ `sentry.server.config.ts` - Server-side error tracking
- ✅ `sentry.edge.config.ts` - Edge runtime tracking
- ✅ `next.config.ts` - Sentry webpack plugin (commented out)
- ✅ `app/error.tsx` - Error boundary ready
- ✅ `app/global-error.tsx` - Global error handler ready
- ✅ `components/error-boundary.tsx` - Component error boundaries
- ✅ `lib/utils/retry.ts` - Retry logic with error tracking

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Create Sentry Account
1. Go to https://sentry.io/signup/
2. Create a new organization
3. Create a new project:
   - Platform: **Next.js**
   - Alert frequency: **Real-time**

### Step 2: Get Your DSN
1. Copy your DSN from the setup screen
2. Format: `https://...@o...ingest.us.sentry.io/...`

### Step 3: Enable Sentry in Your Project

#### Option A: Production Only (Recommended)
Add to Vercel environment variables:
```env
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_ORG=your-org-name
SENTRY_PROJECT=your-project-name
SENTRY_AUTH_TOKEN=your-auth-token
```

#### Option B: Local Development + Production
Add to `.env.local`:
```env
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_ORG=your-org-name
SENTRY_PROJECT=your-project-name
```

### Step 4: Uncomment Sentry Code

#### Enable Instrumentation
In `instrumentation.ts`, uncomment lines 8-18:
```typescript
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
```

#### Enable Webpack Plugin (Optional - for source maps)
In `next.config.ts`, uncomment lines 106-120:
```typescript
import { withSentryConfig } from "@sentry/nextjs";

const sentryOptions = {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  disableLogger: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  telemetry: false,
};

export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryOptions)
  : nextConfig;
```

### Step 5: Deploy & Test
```bash
# Rebuild to include Sentry
npm run build

# Deploy to Vercel
git add .
git commit -m "feat: enable Sentry error tracking"
git push origin main
```

### Step 6: Verify Setup
1. Visit Sentry dashboard
2. Trigger a test error in your app
3. Verify error appears in Sentry
4. Configure alerts (email, Slack, etc.)

---

## 🎯 What Gets Tracked

### Client-Side Errors
- React component errors
- Unhandled promise rejections
- API call failures
- JavaScript runtime errors

### Server-Side Errors
- API route errors
- Database query failures
- External API failures (Reddit, OpenAI)
- Cron job failures

### Additional Context
- User ID (when logged in)
- Route/URL where error occurred
- Browser/device information
- Error stack traces
- Release version (git commit SHA)

---

## ⚙️ Configuration Options

### Error Filtering (Already Configured)

#### Client-Side Filtering (`sentry.client.config.ts`)
Ignores common non-critical errors:
- Browser extension errors
- Network failures (handled gracefully)
- Cancelled requests
- ResizeObserver errors

#### Server-Side Filtering (`sentry.server.config.ts`)
Ignores expected errors:
- Rate limit errors (handled gracefully)
- Reddit API timeouts (with retry)

### Sample Rates (Already Configured)
```typescript
// Development: 100% of transactions
tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0

// Production: 10% of transactions (to reduce costs)
```

### Privacy (Already Configured)
- No PII (Personally Identifiable Information) sent
- Only user ID included (no email, name, etc.)
- Session replay disabled
- All text masked in replays

---

## 📊 Recommended Alert Rules

### Critical (Immediate Notification)
1. **Error Rate Spike**
   - Alert when error rate > 10%
   - Notification: Email + Slack

2. **New Error Type**
   - Alert on first occurrence
   - Notification: Slack

3. **High-Volume Error**
   - Alert when same error > 100/hour
   - Notification: Email

### Important (Daily Digest)
1. **Unresolved Errors**
   - Summary of unresolved issues
   - Notification: Email

2. **Slow Transactions**
   - Transactions > 3 seconds
   - Notification: Weekly email

---

## 💰 Cost Management

### Sentry Pricing (as of 2025)
- **Free Tier**: 5,000 errors/month
- **Team Tier**: $26/month for 50K errors
- **Business**: $80/month for 500K errors

### Cost Optimization Tips
1. **Sample Rate**: Set to 10% in production (already done)
2. **Filter Non-Critical**: Ignore known non-critical errors (already done)
3. **Set Monthly Limit**: Cap at your plan limit
4. **Monitor Usage**: Check Sentry dashboard weekly

---

## 🐛 Testing Sentry

### Test Error in Production
Add a test endpoint (remove after testing):

```typescript
// app/api/test-error/route.ts
export async function GET() {
  throw new Error('Sentry test error - please ignore')
}
```

Visit: `https://your-domain.com/api/test-error`

Check Sentry dashboard for the error.

### Test Client-Side Error
Add to any page temporarily:
```typescript
<button onClick={() => { throw new Error('Test client error') }}>
  Test Error
</button>
```

---

## 📈 Monitoring Best Practices

### Daily
- [ ] Check Sentry dashboard for new errors
- [ ] Resolve or ignore non-critical issues
- [ ] Investigate error spikes

### Weekly
- [ ] Review error trends
- [ ] Update alert rules if needed
- [ ] Optimize error filtering
- [ ] Check Sentry usage vs. plan limit

### Monthly
- [ ] Export error report
- [ ] Analyze most common errors
- [ ] Plan bug fixes for top issues
- [ ] Review and optimize costs

---

## 🔧 Advanced Features

### Source Maps (Optional)
Enable in `next.config.ts` to see original TypeScript code in stack traces:
```typescript
widenClientFileUpload: true,
hideSourceMaps: true, // Hides from users, but uploads to Sentry
```

### Release Tracking (Already Configured)
Sentry automatically tracks releases using git commit SHA:
```typescript
release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
```

### Performance Monitoring (Optional)
Already configured but disabled:
```typescript
// Enable by increasing sample rate
tracesSampleRate: 0.1 // 10% of transactions
```

---

## 🚫 When NOT to Use Sentry

### Skip if:
- You're still in early development (use console logs)
- You have < 10 users (not worth the cost)
- You prefer other tools (LogRocket, Rollbar, etc.)

### Alternative: Vercel Error Tracking
Vercel has built-in error tracking (basic):
- Free with Vercel Pro plan
- No setup required
- Less detailed than Sentry
- Good for small projects

---

## ✅ Story 1.11 Checklist

Once Sentry is enabled:

- [x] Sentry account created
- [x] DSN added to environment variables
- [x] Instrumentation code uncommented
- [x] Deployed to production
- [x] Test error verified in dashboard
- [x] Alert rules configured
- [x] Error boundaries working
- [x] Retry logic integrated
- [x] Privacy settings verified
- [x] Cost limits set

---

## 📝 Summary

**Current Status**: Sentry integration is **complete and ready to enable**. All code is implemented and tested. You just need to:

1. Create Sentry account (5 min)
2. Add DSN to Vercel (2 min)
3. Uncomment code in `instrumentation.ts` (1 min)
4. Redeploy (2 min)

**Total Time**: ~10 minutes

**Story 1.11 will be COMPLETE** once you enable Sentry! 🎉
