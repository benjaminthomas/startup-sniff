# Subscription Cancellation and Expiration Flow

## Overview

This document explains how subscription cancellation works, including the no-refund policy and read-only access for expired subscriptions.

## Cancellation Policy

**No Refunds**: When a user cancels their subscription, they are NOT refunded. Instead:

1. **During Billing Period**: User retains FULL access until the end of their current billing period (month or year)
2. **Recurring Payment**: Stopped immediately - no auto-renewal
3. **After Period Ends**: User loses ability to create new content but can VIEW previously generated ideas (read-only access)

## User States

### 1. Active Subscription (Full Access)
- **Database**: `subscriptions.status = 'active'` AND `cancel_at_period_end = false/null`
- **Access Level**: Full - can create and view all content
- **Actions**: Can cancel, upgrade, or manage subscription

### 2. Cancelled but Active (Full Access Until Period End)
- **Database**: `subscriptions.status = 'active'` AND `cancel_at_period_end = true`
- **Access Level**: Full - same as active, but renewal is cancelled
- **Period**: From cancellation until `current_period_end` date
- **UI**: Shows warning that access ends on `current_period_end`

### 3. Expired Subscription (Read-Only Access)
- **Database**: `subscriptions.status = 'cancelled'` AND past `current_period_end`
- **Access Level**: Read-only - can view old ideas but not create new ones
- **User Plan**: Automatically set to `free` by expiration cron job
- **UI**: Shows upgrade prompts, hides create buttons

### 4. Free User (No Access)
- **Database**: No subscription record or `users.plan_type = 'free'`
- **Access Level**: None - must upgrade to access pro features
- **UI**: Paywall blocks access to pro pages

## Technical Implementation

### 1. Cancellation Flow

**File**: `modules/billing/actions/index.ts:cancelSubscription()`

```typescript
// User clicks "Cancel Subscription"
cancelSubscription(subscriptionId) {
  // 1. Check if manual subscription (skip Razorpay API)
  // 2. Cancel in Razorpay (if real subscription)
  // 3. Update database:
  //    - Keep status = 'active'
  //    - Set cancel_at_period_end = true
  // 4. Return success message
}
```

**Key Point**: Status stays `'active'` until expiration cron job runs.

### 2. Expiration Processing

**Cron Job**: `scripts/process-expired-subscriptions.ts`
**API Route**: `app/api/cron/expire-subscriptions/route.ts`
**Schedule**: Run daily or hourly

```sql
-- Finds subscriptions to expire
SELECT * FROM subscriptions
WHERE status = 'active'
  AND cancel_at_period_end = true
  AND current_period_end < NOW();
```

For each expired subscription:
1. Update `subscriptions.status = 'cancelled'`
2. Update `users.plan_type = 'free'`
3. Update `users.subscription_status = 'inactive'`
4. Reset `usage_limits` to free tier

### 3. Access Control

**File**: `lib/paywall.ts`

**Function**: `checkPaidAccess()`
- Queries both `users` and `subscriptions` tables
- Uses `hasFullAccess()` and `hasReadOnlyAccess()` utilities
- Returns access level: `'full' | 'readonly' | 'none'`

**Function**: `enforcePaidAccess(feature, message, allowReadOnly)`
- Call in page components to enforce access
- `allowReadOnly = true` for pages that support viewing old content
- `allowReadOnly = false` for pages that require active subscription

### 4. Subscription Status Utilities

**File**: `modules/billing/utils/subscription-status.ts`

```typescript
// Check if subscription has expired
isSubscriptionExpired(subscription): boolean

// Check if user has full access (active and not expired)
hasFullAccess(subscription): boolean

// Check if user has read-only access (cancelled and expired)
hasReadOnlyAccess(subscription): boolean

// Get user's access level
getUserAccessLevel(subscription): 'full' | 'readonly' | 'none'
```

## Implementation Guide

### For Pages with Idea Lists (Allow Read-Only)

```typescript
// app/(dashboard)/dashboard/ideas/page.tsx
export default async function IdeasPage() {
  const session = await getCurrentSession();
  if (!session) redirect('/auth/signin');

  // Allow read-only access to view old ideas
  const accessCheck = await enforcePaidAccess('ideas', undefined, true);

  // Get ideas from database
  const ideas = await getIdeas(session.userId);

  return (
    <div>
      {accessCheck.accessLevel === 'readonly' && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Read-Only Access</AlertTitle>
          <AlertDescription>
            Your subscription has expired. You can view your ideas but cannot generate new ones.
            <Link href="/dashboard/billing">Upgrade to continue</Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Show ideas list - always visible */}
      <IdeaList ideas={ideas} readOnly={accessCheck.accessLevel === 'readonly'} />

      {/* Hide create button for read-only */}
      {accessCheck.accessLevel === 'full' && (
        <Button onClick={() => generateNewIdea()}>Generate New Idea</Button>
      )}
    </div>
  );
}
```

### For Pages with Idea Details (Block Read-Only)

```typescript
// app/(dashboard)/dashboard/ideas/[id]/page.tsx
export default async function IdeaDetailPage({ params }: { params: { id: string } }) {
  const session = await getCurrentSession();
  if (!session) redirect('/auth/signin');

  // Block read-only access - must have active subscription
  await enforcePaidAccess('ideas', 'Upgrade to view idea details', false);

  // If we reach here, user has full access
  const idea = await getIdeaWithDetails(params.id);

  return <IdeaDetails idea={idea} />;
}
```

### For Pages Requiring Active Subscription (No Read-Only)

```typescript
// app/(dashboard)/dashboard/conversations/page.tsx
export default async function ConversationsPage() {
  const session = await getCurrentSession();
  if (!session) redirect('/auth/signin');

  // Conversations feature requires active subscription
  await enforcePaidAccess('conversations'); // allowReadOnly defaults to false

  // Only users with full access reach here
  return <ConversationDashboard />;
}
```

## Setting Up Cron Job

### Option 1: Vercel Cron (Recommended for Vercel deployments)

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/expire-subscriptions",
    "schedule": "0 */6 * * *"
  }]
}
```

### Option 2: External Cron Service (EasyCron, cron-job.org, etc.)

1. Set `CRON_SECRET` environment variable to a secure random string
2. Configure cron service to call:
   ```
   POST https://yourdomain.com/api/cron/expire-subscriptions
   Header: Authorization: Bearer YOUR_CRON_SECRET
   ```
3. Schedule: Run every 6 hours or daily

### Option 3: Manual Script (Development/Testing)

```bash
npm run subscription:expire
```

## Database Schema Requirements

Ensure these fields exist in `subscriptions` table:
- `status`: enum('trial', 'active', 'inactive', 'cancelled')
- `cancel_at_period_end`: boolean (nullable)
- `current_period_start`: timestamp
- `current_period_end`: timestamp
- `razorpay_subscription_id`: string

## UI/UX Considerations

### For Cancelled Users (Still Active)
- Show banner: "Your subscription will end on [date]. You will retain access to your ideas."
- Show upgrade button if they change their mind
- Maybe offer incentive to reactivate

### For Expired Users (Read-Only)
- Show alert at top of pages: "Your subscription has expired"
- Disable create/edit buttons
- Show upgrade CTA prominently
- List should be visible but grayed out with padlock icons on premium features

### For Idea List Display
```typescript
<IdeaCard
  idea={idea}
  isLocked={accessLevel === 'readonly'}
  onClick={() => {
    if (accessLevel === 'readonly') {
      // Show upgrade modal
      showUpgradeModal('View full idea details by upgrading');
    } else {
      // Navigate to details
      router.push(`/ideas/${idea.id}`);
    }
  }}
/>
```

## Testing Checklist

- [ ] User cancels subscription → retains full access until period end
- [ ] Cancelled subscription past period end → read-only access to old ideas
- [ ] Cron job properly expires subscriptions
- [ ] Free users cannot access pro features
- [ ] Read-only users can view lists but not details
- [ ] Read-only users cannot create new content
- [ ] Upgrade flow works for expired users
- [ ] Manual subscriptions handle cancellation correctly

## Monitoring

Log these events for monitoring:
- Subscription cancellations (who, when, which plan)
- Subscription expirations processed (how many, success/failure rate)
- Read-only access attempts (track if users try to create while expired)
- Upgrade conversions from expired users

## Future Enhancements

1. **Grace Period**: Allow 7-day grace period before expiring
2. **Reactivation Flow**: Let users reactivate within X days without paying again
3. **Email Notifications**:
   - Send email when user cancels
   - Reminder 7 days before expiration
   - Notification when access becomes read-only
4. **Partial Refunds**: Calculate prorated refund if policy changes
5. **Export Feature**: Let expired users export their ideas before access is limited
