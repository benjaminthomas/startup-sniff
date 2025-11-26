# Technical Specification - Epic 2: Guided Human Contact Workflow

**Project:** startup-sniff
**Epic ID:** Epic 2
**Timeline:** Weeks 9-16 (Month 3-4)
**Author:** Benjamin
**Date:** 2025-10-13
**Status:** Ready for Implementation (Pending Epic 1 GREEN zone validation)
**Prerequisites:** Epic 1 validated in GREEN zone (>2min session, >25% return rate)

---

## 1. Overview and Scope

### 1.1 Epic Goal

Bridge the catastrophic gap between validation and first customer contact by making human outreach so easy that anxious founders actually do it. This epic transforms StartupSniff from a passive research tool into an active momentum engine, introducing the $20/month paid tier.

**Key Success Metrics:**
- Free-to-paid conversion rate >5% (GREEN zone)
- Message send rate >10% of paid users (GREEN zone)
- Template response rate >15% (GREEN zone)
- Monthly Recurring Revenue (MRR) $200+ by Month 3 (GREEN zone)
- Churn rate <15% monthly (GREEN zone)

### 1.2 Objectives and Scope

**In Scope:**
- Human discovery from pain points (5 Reddit users per pain point, ranked by engagement)
- Reddit OAuth integration (user authorization for message sending)
- AI-generated personalized message templates (GPT-4, 3 variants per contact)
- Rate limiting and compliance (5 messages/day per user, business logic enforcement)
- Message send workflow (select contacts → review templates → send → track)
- Conversation tracking dashboard (sent, replied, call scheduled, customer acquired)
- Freemium tier management (free Pillar 1, paid Pillar 2, feature flags)
- Razorpay subscription integration ($20/month, cancel anytime, webhooks)
- Email notifications (message sent confirmation, weekly summary, onboarding drip)
- Template A/B testing (Professional, Casual, Concise, Value-first variants)
- Mobile message workflow (optimized for 320px+ viewports)
- Epic 2 validation dashboard (conversion, send rate, response rate, MRR, churn)

**Out of Scope (Epic 3+):**
- Network intelligence and pattern recognition (Epic 3)
- Predictive validation scoring (Epic 3)
- Advanced tier ($50-100/month) with higher message limits (Future)
- Multi-platform messaging (LinkedIn, Discord, Twitter) (Future)

### 1.3 System Architecture Alignment

This epic extends the existing architecture with **Pillar 2: Human Contact Workflow** components.

**New/Enhanced Components:**
- `modules/reddit/` - Add OAuth flow, user token storage, message sending API
- `modules/billing/` - Razorpay integration, subscription management, webhooks
- `modules/contact/` - Email service for notifications
- `app/(dashboard)/dashboard/conversations/` - New page for conversation tracking (SSR)
- `modules/usage/` - Enhance with message send rate limiting

**Database Tables (New/Enhanced):**
- `users` - Add `razorpay_customer_id`, `razorpay_subscription_id` (⚠️ rename from stripe_*)
- `subscriptions` - Add `razorpay_plan_id` (⚠️ rename from stripe_price_id)
- `reddit_contacts` - NEW: Store discovered contacts per pain point
- `messages` - NEW: Sent message tracking with outcome logging
- `usage_limits` - Enhance with `messages_sent_today` field

**External Dependencies (New):**
- Reddit API (User OAuth, message sending: POST /api/compose)
- Razorpay (Subscription management, webhooks)

---

## 2. Detailed Design

### 2.1 Services and Modules

| Service/Module | Responsibility | Inputs | Outputs | Owner |
|----------------|----------------|--------|---------|-------|
| **reddit/services/oauth.ts** | Reddit OAuth 2.0 flow, token management | User auth code, refresh token | Access token, refresh token | Backend |
| **reddit/services/messaging.ts** | Send Reddit DMs via user's OAuth token | User ID, recipient, message text | Send status (success/failure) | Backend |
| **reddit/actions/connect-account.ts** | Server action to initiate OAuth | User session | OAuth authorization URL | Backend |
| **reddit/actions/discover-contacts.ts** | Find Reddit users who posted about pain point | Pain point ID | Array of 5 ranked contacts | Backend |
| **ai/services/template-generator.ts** | Generate personalized message templates | Contact info, pain point, variant | Message template (150-250 words) | Backend |
| **billing/services/razorpay-client.ts** | Razorpay SDK client, checkout, webhooks | Subscription plan, user ID | Subscription ID, customer ID | Backend |
| **billing/actions/create-subscription.ts** | Server action to start paid subscription | User session, plan_type | Razorpay checkout URL | Backend |
| **billing/actions/cancel-subscription.ts** | Server action to cancel subscription | User session | Cancellation confirmation | Backend |
| **modules/contact/services/email.ts** | Send transactional emails via Mailgun | Template name, recipient, data | Email sent status | Backend |
| **modules/usage/actions/track-message-send.ts** | Track sent messages, enforce rate limit | User ID | Remaining quota (0-5) | Backend |
| **app/(dashboard)/dashboard/conversations/page.tsx** | Conversation tracking dashboard UI | User session | Rendered conversation list | Frontend |
| **components/features/contact-card.tsx** | Individual contact card with send button | Contact data | Card UI with template preview | Frontend |
| **components/features/message-composer.tsx** | Message template editor and sender | Template, contact | Editable message + send confirmation | Frontend |

### 2.2 Data Models

#### reddit_contacts (NEW)

```typescript
export interface RedditContact {
  id: string                        // UUID primary key
  pain_point_id: string             // FK to reddit_posts
  reddit_username: string           // Reddit username
  reddit_user_id: string            // Reddit internal ID
  post_id: string                   // Specific post they authored
  post_excerpt: string              // First 200 chars of post
  karma: number                     // User karma score
  account_age_days: number          // How long account exists
  posting_frequency: number         // Posts per week
  engagement_score: number          // Calculated ranking score
  discovered_at: string             // When contact was discovered
  created_at: string
  updated_at: string
}
```

**Indexes:**
```sql
CREATE INDEX idx_reddit_contacts_pain_point_id ON reddit_contacts(pain_point_id);
CREATE INDEX idx_reddit_contacts_engagement_score ON reddit_contacts(engagement_score DESC);
```

#### messages (NEW)

```typescript
export interface Message {
  id: string                        // UUID primary key
  user_id: string                   // FK to users
  pain_point_id: string             // FK to reddit_posts
  contact_id: string                // FK to reddit_contacts
  reddit_username: string           // Recipient username
  template_variant: 'professional' | 'casual' | 'concise' | 'value_first'
  message_text: string              // Final message sent (user may edit)
  send_status: 'pending' | 'sent' | 'failed'
  outcome: 'sent' | 'replied' | 'call_scheduled' | 'customer_acquired' | 'dead_end' | null
  sent_at: string | null            // When message was sent
  replied_at: string | null         // When user logged reply (manual)
  error_message: string | null      // Error if send failed
  created_at: string
  updated_at: string
}
```

**Indexes:**
```sql
CREATE INDEX idx_messages_user_id_sent_at ON messages(user_id, sent_at DESC);
CREATE INDEX idx_messages_outcome ON messages(outcome) WHERE outcome IS NOT NULL;
CREATE INDEX idx_messages_template_variant ON messages(template_variant);
```

#### users (Enhanced)

```sql
-- Add Reddit OAuth fields
ALTER TABLE users ADD COLUMN reddit_access_token TEXT;
ALTER TABLE users ADD COLUMN reddit_refresh_token TEXT;
ALTER TABLE users ADD COLUMN reddit_token_expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN reddit_connected_at TIMESTAMPTZ;
```

**Security Note:** Reddit OAuth tokens stored encrypted via database-level encryption (Supabase).

#### usage_limits (Enhanced)

```typescript
export interface UsageLimits {
  // ... existing fields from Epic 1 ...
  messages_sent_today: number       // NEW: Messages sent today (resets daily)
  message_reset_date: string        // NEW: When message quota resets
}
```

**Daily Reset Logic:**
```sql
-- Cron job resets message quota daily at midnight UTC
UPDATE usage_limits
SET messages_sent_today = 0,
    message_reset_date = NOW() + INTERVAL '1 day'
WHERE message_reset_date < NOW();
```

### 2.3 APIs and Interfaces

#### Server Actions (Epic 2)

```typescript
// modules/reddit/actions/connect-account.ts
export async function connectRedditAccountAction(): Promise<{
  authUrl: string                   // Reddit OAuth authorization URL
}>

// modules/reddit/actions/oauth-callback.ts
export async function handleOAuthCallbackAction(
  code: string                      // OAuth authorization code from Reddit
): Promise<{
  success: boolean
  tokens?: { access_token: string, refresh_token: string }
  error?: string
}>

// modules/reddit/actions/discover-contacts.ts
export async function discoverContactsAction(
  painPointId: string
): Promise<{
  contacts: RedditContact[]         // Top 5 ranked contacts
  totalFound: number                // Total contacts discovered
}>

// modules/ai/actions/generate-template.ts
export async function generateMessageTemplateAction(
  contactId: string,
  variant: 'professional' | 'casual' | 'concise' | 'value_first'
): Promise<{
  template: string                  // Generated message (150-250 words)
  tokens_used: number               // For cost tracking
}>

// modules/reddit/actions/send-message.ts
export async function sendRedditMessageAction(
  contactId: string,
  messageText: string,              // User may have edited template
  templateVariant: string
): Promise<{
  success: boolean
  message?: Message
  quotaRemaining: number            // Messages left today (0-5)
  error?: string                    // "Rate limit exceeded", "OAuth expired", etc.
}>

// modules/reddit/actions/send-message-batch.ts
export async function sendRedditMessageBatchAction(
  contactIds: string[],             // 1-5 contacts
  messages: Record<string, string>  // { contactId: messageText }
): Promise<{
  results: Array<{
    contactId: string
    success: boolean
    error?: string
  }>
  quotaRemaining: number
}>

// modules/billing/actions/create-subscription.ts
export async function createSubscriptionAction(
  planType: 'pro_monthly' | 'pro_yearly'
): Promise<{
  checkoutUrl: string               // Razorpay checkout URL
  subscriptionId: string
}>

// modules/billing/actions/cancel-subscription.ts
export async function cancelSubscriptionAction(): Promise<{
  success: boolean
  cancelAtPeriodEnd: boolean        // Subscription active until period ends
}>

// modules/contact/actions/log-outcome.ts
export async function logMessageOutcomeAction(
  messageId: string,
  outcome: 'replied' | 'call_scheduled' | 'customer_acquired' | 'dead_end'
): Promise<{
  message: Message
}>
```

#### API Routes (Razorpay Webhooks)

```typescript
// app/api/billing/webhooks/razorpay/route.ts
POST /api/billing/webhooks/razorpay
Headers: { 'x-razorpay-signature': '...' }
Request: {
  event: 'subscription.activated' | 'subscription.cancelled' | 'payment.failed',
  payload: { subscription_id, customer_id, status }
}
Response: { received: true }

// Webhook Handler Logic:
async function handleWebhook(event: RazorpayEvent) {
  // 1. Verify webhook signature
  const isValid = verifyRazorpaySignature(request)
  if (!isValid) return 401

  // 2. Handle event
  switch (event.event) {
    case 'subscription.activated':
      await updateUserSubscription(event.payload.customer_id, 'active')
      break
    case 'subscription.cancelled':
      await updateUserSubscription(event.payload.customer_id, 'cancelled')
      break
    case 'payment.failed':
      await sendDunningEmail(event.payload.customer_id)
      break
  }

  return 200
}
```

#### Reddit API Integration (User OAuth)

```typescript
// lib/services/reddit-api.ts (Enhanced)
class RedditAPIClient {
  // Initiate OAuth flow
  async getAuthorizationUrl(
    clientId: string,
    redirectUri: string,
    state: string                   // CSRF token
  ): Promise<string>

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(
    code: string,
    redirectUri: string
  ): Promise<{
    access_token: string
    refresh_token: string
    expires_in: number              // Seconds until expiration
  }>

  // Refresh expired access token
  async refreshAccessToken(
    refreshToken: string
  ): Promise<{
    access_token: string
    expires_in: number
  }>

  // Send direct message (user OAuth)
  async sendDirectMessage(
    accessToken: string,
    to: string,                     // Reddit username
    subject: string,
    text: string
  ): Promise<{
    success: boolean
    error?: string                  // "USER_DOESNT_EXIST", "RATE_LIMIT_EXCEEDED"
  }>

  // Get user profile (for contact discovery)
  async getUserProfile(
    username: string
  ): Promise<{
    username: string
    id: string
    karma: number
    created_utc: number
  }>
}
```

**Reddit API Rate Limits (User OAuth):**
- 60 requests/minute per user (not per application)
- Message sending limit: 5 messages/day (our business rule, not Reddit's)
- OAuth token expiration: 1 hour (refresh required)

#### Razorpay API Integration

```typescript
// lib/services/razorpay-client.ts
class RazorpayClient {
  // Create subscription
  async createSubscription(
    planId: string,                 // razorpay_plan_id
    customerId: string,             // razorpay_customer_id
    notifyInfo: { notify_email: string, notify_sms: string }
  ): Promise<{
    id: string                      // subscription_id
    status: 'created' | 'authenticated' | 'active'
    short_url: string               // Checkout URL
  }>

  // Create customer
  async createCustomer(
    email: string,
    name: string,
    phone?: string
  ): Promise<{
    id: string                      // customer_id
  }>

  // Cancel subscription
  async cancelSubscription(
    subscriptionId: string,
    cancelAtCycleEnd: boolean
  ): Promise<{
    id: string
    status: 'cancelled'
    ended_at: number | null
  }>

  // Verify webhook signature
  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean
}
```

**Razorpay Plans:**
- **Pro Monthly**: `plan_monthly_20` - $20/month, 5 messages/day
- **Pro Yearly**: `plan_yearly_200` - $200/year ($16.67/month), 5 messages/day (Future)

### 2.4 Workflows and Sequencing

#### Human Contact Discovery Flow

```
1. User clicks "View contacts" on pain point (Paid tier only)
   ↓
2. Check user subscription status (middleware)
   - If free tier → Show upgrade modal
   - If paid tier → Proceed
   ↓
3. Server action: discoverContactsAction(painPointId)
   - Query reddit_posts for all authors of related posts
   - Fetch Reddit user profiles (karma, account age, posting frequency)
   - Calculate engagement_score (formula: karma * 0.3 + posting_frequency * 0.5 + (1 / account_age_days) * 0.2)
   - Rank contacts by engagement_score DESC
   - Return top 5
   ↓
4. Store contacts in reddit_contacts table (cache for 24h)
   ↓
5. Render contact cards (ContactCard component)
   - Show username, karma, post excerpt, "Why this person?" explanation
   ↓
6. User selects 1-5 contacts (checkboxes)
   ↓
7. User clicks "Generate templates" button
```

#### Message Send Flow

```
1. User selects contacts (1-5 checkboxes checked)
   ↓
2. Check Reddit OAuth status
   - If not connected → Prompt "Connect Reddit Account"
   - OAuth flow: Redirect to Reddit → User authorizes → Callback stores tokens
   ↓
3. Check message quota (usePlanLimits hook)
   - Query: SELECT messages_sent_today FROM usage_limits WHERE user_id = ...
   - If >= 5 → Show "Daily limit reached. Resets in X hours."
   - If < 5 → Proceed
   ↓
4. Generate templates for each selected contact
   - Call generateMessageTemplateAction(contactId, variant='professional')
   - GPT-4 prompt: "Write a personalized message to {username} about their Reddit post: {post_excerpt}. Be empathetic, not salesy. Offer value-first."
   - Render templates in MessageComposer component
   ↓
5. User reviews and edits templates (inline editing)
   ↓
6. User clicks "Send 3 messages" button
   - Confirmation modal: "This will send 3 Reddit DMs from your account. Continue?"
   ↓
7. Server action: sendRedditMessageBatchAction(contactIds, messages)
   - For each contact:
     a. Check quota again (race condition prevention)
     b. Send message via Reddit API (POST /api/compose)
     c. Store in messages table (send_status, sent_at)
     d. Increment messages_sent_today
   - Return results: { success: [c1, c2], failed: [c3] }
   ↓
8. Show success notification
   - "2 messages sent successfully! 1 failed (retry?)"
   - Update quota display: "3 of 5 messages remaining today"
   ↓
9. Redirect to /dashboard/conversations
```

#### Conversation Tracking Flow

```
1. User navigates to /dashboard/conversations
   ↓
2. Server fetches sent messages
   - Query: SELECT * FROM messages WHERE user_id = ... ORDER BY sent_at DESC
   ↓
3. Render ConversationTracker component
   - Aggregate metrics: 5 sent, 2 replied, 1 call scheduled, 0 customers
   - Individual message cards: sent_at, recipient, outcome status
   ↓
4. User logs outcome manually
   - Click message card → Dropdown: "Reply received", "Call scheduled", "Customer acquired", "Dead end"
   - Server action: logMessageOutcomeAction(messageId, outcome)
   - Update message.outcome, message.replied_at (or outcome_logged_at)
   ↓
5. Analytics update
   - Track response rate: COUNT(outcome='replied') / COUNT(*) WHERE sent_at > NOW() - INTERVAL '7 days'
   - Display celebratory animation if "Customer acquired" logged
   ↓
6. Weekly email summary
   - "You sent 5 messages this week, 2 replied (40% response rate). Keep the momentum!"
```

#### Subscription Upgrade Flow

```
1. Free tier user clicks "Upgrade to Pro" CTA
   ↓
2. Server action: createSubscriptionAction(planType='pro_monthly')
   - Create Razorpay customer (if not exists)
   - Create Razorpay subscription (plan_monthly_20)
   - Return checkout URL
   ↓
3. Redirect to Razorpay checkout page
   - User enters payment details (credit card, UPI, netbanking)
   ↓
4. User completes payment
   - Razorpay webhook: subscription.activated
   ↓
5. Webhook handler updates database
   - UPDATE users SET plan_type = 'pro_monthly', subscription_status = 'active', razorpay_subscription_id = ...
   - UPDATE subscriptions SET status = 'active', current_period_start = NOW(), current_period_end = NOW() + INTERVAL '1 month'
   ↓
6. Send confirmation email
   - "Welcome to Pro! You can now send 5 messages/day."
   ↓
7. Redirect to /dashboard (now with Pro features unlocked)
```

---

## 3. Non-Functional Requirements

### 3.1 Performance

**Latency Targets:**
- Contact discovery: <3 seconds (fetch user profiles in parallel)
- Template generation: <3 seconds per template (GPT-4 turbo)
- Message send: <2 seconds per message (Reddit API)
- Razorpay checkout redirect: <1 second
- Conversation dashboard load: <1 second (query optimization)

**Cost Controls:**
- Template generation: ~$0.01 per template (500 input tokens, 250 output tokens)
- Target: <$100/month at 500 templates/month
- Cache templates for 1 hour (if user regenerates for same contact)

### 3.2 Security

**OAuth Security:**
- Reddit OAuth tokens stored encrypted in database (Supabase encryption at rest)
- CSRF protection: State parameter in OAuth flow (random token, session-verified)
- Token refresh: Automatic refresh before expiration (1 hour lifetime)
- Token revocation: User can disconnect account in settings (delete tokens from DB)

**Payment Security:**
- Razorpay Checkout (PCI-DSS compliant, no card data touches our servers)
- Webhook signature verification (HMAC SHA256)
- HTTPS-only (Vercel enforced)
- No credit card storage (Razorpay handles all payment data)

**Rate Limiting:**
- Message sending: 5/day per user (business logic, not relying on Redis alone)
- API endpoints: 100 req/min per user (middleware rate limiter)
- Webhook replay protection: Check event_id uniqueness

### 3.3 Reliability

**Fault Tolerance:**
- Reddit API failures: Queue failed messages for retry (3 attempts, exponential backoff)
- Razorpay webhook failures: Webhook replay (Razorpay retries for 3 days)
- OAuth token expiration: Auto-refresh, graceful re-auth prompt if refresh fails
- Transaction safety: Use database transactions for subscription updates

**Data Integrity:**
- Idempotency: Webhook events processed exactly once (check event_id before processing)
- Quota enforcement: Atomic increment of messages_sent_today (prevent race conditions)
- Message send logging: Store all sends (success and failure) for audit trail

### 3.4 Observability

**Logging:**
- Log all Reddit API calls (request, response, latency)
- Log all Razorpay events (webhook payloads, signature verification results)
- Log all message sends (user_id, contact_id, send_status, error_message)
- ERROR level: OAuth failures, payment failures, message send failures

**Metrics:**
- Free-to-paid conversion rate (track signup_date → first_subscription_date)
- Message send rate (COUNT(messages sent) / COUNT(active paid users))
- Template response rate (COUNT(outcome='replied') / COUNT(messages sent))
- MRR (SUM(subscription price) WHERE status='active')
- Churn rate (COUNT(subscriptions cancelled) / COUNT(active subscriptions) * 100)

**Alerts:**
- Critical: Razorpay webhook signature verification failed >3 times
- Warning: Template response rate <10% (below RED zone)
- Info: New subscription created, subscription cancelled

---

## 4. Dependencies and Integrations

### 4.1 External Dependencies

**Reddit API (User OAuth):**
- OAuth 2.0 Authorization Code Grant
- Scopes required: `identity`, `privatemessages`, `read`
- Token endpoint: POST https://www.reddit.com/api/v1/access_token
- Message endpoint: POST https://oauth.reddit.com/api/compose
- Rate limits: 60 req/min per user
- Error codes: 401 (invalid token), 429 (rate limit), 500 (server error)

**Razorpay API:**
- SDK: razorpay v2.9.6
- Authentication: API key + secret (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)
- Endpoints: /subscriptions, /customers, /plans
- Webhook events: subscription.activated, subscription.cancelled, payment.failed
- Webhook signature: HMAC SHA256 with webhook secret

**OpenAI API (Enhanced for Epic 2):**
- Additional use case: Message template generation
- Model: GPT-4 Turbo (gpt-4-turbo-preview)
- Prompt: Personalized message generation (500 input tokens, 250 output tokens)
- Cost: ~$0.01 per template
- Cache: 1 hour TTL (same contact + variant → reuse template)

### 4.2 Internal Dependencies

**From Epic 1:**
- `modules/auth/` - Session validation for protected routes
- `modules/usage/` - Quota enforcement (ideas + messages)
- `lib/supabase/server.ts` - Database client
- `components/ui/` - shadcn/ui components (Dialog, Button, Badge)

**New Modules:**
- `modules/billing/` - Razorpay integration (100% new)
- `modules/contact/` - Email service (Mailgun)
- `modules/reddit/` - OAuth flow, messaging API (50% new, 50% enhancement)

---

## 5. Acceptance Criteria and Traceability

### 5.1 Key Acceptance Criteria (Sampled)

**Story 2.1: Human Discovery**
1. ✅ Clicking "View contacts" shows 5 real Reddit users from last 48 hours
2. ✅ Each contact shows: username, post excerpt, profile link, karma, "Why this person?"
3. ✅ Loading state <3 seconds

**Story 2.2: Reddit OAuth**
1. ✅ "Connect Reddit Account" triggers OAuth popup/redirect
2. ✅ OAuth permissions clearly explain message sending
3. ✅ Tokens encrypted and stored securely
4. ✅ Token refresh handles expiration automatically

**Story 2.3: AI Templates**
1. ✅ Template generated within 3 seconds
2. ✅ Template references specific Reddit post
3. ✅ Template demonstrates empathy, not sales pitch
4. ✅ Template 150-250 words
5. ✅ User can edit before sending
6. ✅ 3 variants available (Professional, Casual, Concise)

**Story 2.4: Rate Limiting**
1. ✅ Rate limit: 5 messages/day per user
2. ✅ UI shows remaining quota with countdown
3. ✅ Quota resets at midnight UTC
4. ✅ Beyond quota shows friendly block message

**Story 2.5: Message Send**
1. ✅ Workflow completable in <2 minutes
2. ✅ Multi-select UI for 3 of 5 contacts
3. ✅ "Review messages" modal side-by-side editing
4. ✅ Optimistic UI: "Sending..." then confirmed async
5. ✅ Error handling per message (show which succeeded/failed)

**Story 2.7: Freemium Paywall**
1. ✅ Free tier: Unlimited Pillar 1, blocked Pillar 2
2. ✅ Paywall: "View contacts" blocked with upgrade prompt
3. ✅ Paid tier ($20/month): All Pillar 2 unlocked
4. ✅ Non-intrusive upgrade CTAs (not blocking modals)

**Story 2.8: Razorpay Integration**
1. ✅ "Upgrade to Pro" redirects to Razorpay Checkout
2. ✅ Checkout shows "$20/month, cancel anytime"
3. ✅ Successful payment → Immediate account upgrade
4. ✅ Webhook handling for subscription.activated, cancelled, payment_failed

**Story 2.12: Epic 2 Validation Dashboard**
1. ✅ Free-to-paid conversion: >5% (GREEN), 3-5% (YELLOW), <3% (RED)
2. ✅ Message send rate: >10% (GREEN), 5-10% (YELLOW), <5% (RED)
3. ✅ Template response rate: >15% (GREEN), 10-15% (YELLOW), <10% (RED)
4. ✅ MRR: $200+ Month 3 (GREEN), $100-200 (YELLOW), <$100 (RED)

### 5.2 Traceability Matrix (Sampled)

| Acceptance Criteria | Spec Section | Component/API | Test Strategy |
|---------------------|--------------|---------------|---------------|
| AC 2.1.1: 5 contacts in <3s | 2.3 APIs, 3.1 Performance | discoverContactsAction | Performance test: Parallel profile fetching |
| AC 2.2.2: OAuth explains permissions | 2.4 Workflows | connectRedditAccountAction | E2E: Verify OAuth consent screen text |
| AC 2.3.1: Template in 3s | 3.1 Performance | generateMessageTemplateAction | Performance test: GPT-4 latency |
| AC 2.4.1: 5 messages/day limit | 2.2 Data Models, 3.2 Security | trackMessageSendAction | Integration test: Enforce quota, reject 6th message |
| AC 2.5.4: Optimistic UI | 2.4 Workflows | sendRedditMessageBatchAction | E2E: UI shows "Sending..." immediately |
| AC 2.8.4: Webhook handling | 2.3 APIs, 3.3 Reliability | /api/billing/webhooks/razorpay | Integration test: Verify signature, update DB |
| AC 2.12.1: Conversion >5% (GREEN) | 5.1 AC, 3.4 Observability | Validation dashboard | Analytics: Calculate conversion from events |

---

## 6. Risks, Assumptions, and Questions

### 6.1 Risks

**Risk 1: Reddit OAuth User Confusion**
- **Description**: Users may not understand why they need to connect Reddit account (trust issue).
- **Mitigation**:
  - Clear explanation: "Messages sent from YOUR account (not StartupSniff) to protect against spam bans"
  - Trust-building content: Blog post, video demo, FAQ
  - Show example message before connection required
- **Severity**: Medium

**Risk 2: Low Free-to-Paid Conversion (<3% RED zone)**
- **Description**: Users may not see value in $20/month for 5 messages/day.
- **Mitigation**:
  - A/B test pricing ($15, $20, $25)
  - 7-day free trial (test conversion impact)
  - Show social proof: "234 founders sent messages, 89 got replies"
  - Emphasize time savings: "2 minutes vs. 2 hours per conversation"
- **Severity**: High (revenue risk)

**Risk 3: Low Message Send Rate (<5% RED zone)**
- **Description**: Paid users may sign up but never send messages (activation failure).
- **Mitigation**:
  - Onboarding flow: Prompt to send first message within 24h
  - Email drip: Day 1, 3, 7 with "Send your first message" CTA
  - In-app prompts: "You have 5 messages available. Start a conversation!"
  - Gamification: Badge for "First message sent"
- **Severity**: High (churn risk)

**Risk 4: Template Response Rate <10% (RED zone)**
- **Description**: Templates may be too generic or salesy, recipients don't respond.
- **Mitigation**:
  - A/B test template variants (Professional, Casual, Concise, Value-first)
  - User feedback: "Did this template work?" thumbs up/down
  - Iterate GPT-4 prompts based on response data
  - Manual review of 100 templates for quality check
- **Severity**: High (value proposition risk)

**Risk 5: Razorpay Webhook Failures**
- **Description**: Webhook events may be missed, causing subscription status desync.
- **Mitigation**:
  - Razorpay retries webhooks for 3 days (automatic)
  - Idempotency: Check event_id before processing (prevent duplicates)
  - Daily reconciliation job: Sync subscription status via Razorpay API
  - Alert on signature verification failures (potential attack)
- **Severity**: Medium (mitigated by reconciliation)

### 6.2 Assumptions

**Assumption 1**: Users have Reddit accounts
- **Validation**: Survey during onboarding, track Reddit OAuth connection rate
- **Fallback**: If >30% don't have Reddit accounts, add "Create Reddit account" guide

**Assumption 2**: 5 messages/day is sufficient for most users
- **Validation**: Track % of users hitting daily limit, survey feedback
- **Fallback**: Offer $50/month tier with 10 messages/day (Epic 2.5 enhancement)

**Assumption 3**: $20/month is acceptable price point
- **Validation**: A/B test pricing during launch
- **Fallback**: Adjust pricing based on conversion data (target >5%)

**Assumption 4**: Message sending via user OAuth bypasses Reddit platform ban risk
- **Validation**: Monitor user feedback on account suspensions
- **Fallback**: Add warning banner, reduce daily limit to 3 if suspensions occur

### 6.3 Open Questions

**Q1**: Should we implement automatic reply detection or rely on manual outcome logging?
- **Decision Needed By**: Week 11 (Story 2.6 implementation)
- **Implications**: Auto-detection requires Reddit API polling (complex), manual logging is simpler but less accurate
- **Recommendation**: Start with manual logging, add auto-detection in Epic 3 if users request

**Q2**: Should message templates be editable before sending or after?
- **Decision Needed By**: Week 10 (Story 2.3 implementation)
- **Implications**: Before = better UX, After = faster send flow
- **Recommendation**: Editable before sending (Story 2.3 AC requires inline editing)

**Q3**: Should we offer annual plan ($200/year = 17% discount) in Epic 2 or defer?
- **Decision Needed By**: Week 12 (Story 2.8 Razorpay integration)
- **Implications**: Annual plan improves LTV but adds complexity
- **Recommendation**: Defer to Epic 2.5 (focus on monthly plan first, add annual if MRR >$500)

**Q4**: Should conversation tracking show all messages or just recent (last 30 days)?
- **Decision Needed By**: Week 13 (Story 2.6 implementation)
- **Implications**: All = better for long-term users, Recent = faster queries
- **Recommendation**: Default to last 30 days, "View all" button for full history

---

## 7. Test Strategy

### 7.1 Test Levels

**Unit Tests:**
- `reddit/services/oauth.ts` - Token exchange, refresh logic
- `ai/services/template-generator.ts` - Template generation
- `billing/services/razorpay-client.ts` - Subscription creation, webhook verification
- `modules/usage/actions/track-message-send.ts` - Rate limit enforcement

**Integration Tests:**
- Reddit OAuth flow: Authorization → Callback → Token storage
- Razorpay webhook: Event received → Signature verified → DB updated
- Message send: Check quota → Send via Reddit API → Log in DB → Decrement quota
- Subscription creation: Create customer → Create subscription → Redirect to checkout

**End-to-End Tests (Playwright):**
1. **Free-to-Paid Conversion Flow**
   - Free user clicks "View contacts" → Paywall modal → "Upgrade to Pro" → Razorpay checkout → Payment success → Account upgraded
2. **Message Send Flow**
   - Connect Reddit account → Select pain point → View contacts → Select 3 contacts → Generate templates → Edit → Send → Success notification
3. **Conversation Tracking Flow**
   - Send 3 messages → Navigate to /dashboard/conversations → Log outcome "Reply received" → See metrics update

**Load Testing:**
- Simulate 50 concurrent message sends (stress test rate limiter)
- Webhook handling: Send 100 webhook events in parallel (idempotency test)

### 7.2 Test Coverage (Epic 2)

| Story | Unit Tests | Integration Tests | E2E Tests |
|-------|------------|-------------------|-----------|
| 2.1 Human Discovery | RedditAPIClient.getUserProfile() | discoverContactsAction full flow | User views contacts, sees 5 results |
| 2.2 Reddit OAuth | Token exchange, refresh | OAuth callback flow | User connects Reddit, tokens stored |
| 2.3 AI Templates | generateTemplate() | GPT-4 API call | User sees template in <3s |
| 2.4 Rate Limiting | Quota enforcement logic | trackMessageSendAction | User hits 5-message limit |
| 2.5 Message Send | N/A (integration heavy) | Send batch, handle failures | User sends 3 messages successfully |
| 2.6 Conversation Tracking | Outcome logging | logMessageOutcomeAction | User logs "Reply received" |
| 2.7 Freemium Paywall | Feature flag logic | Middleware blocks free users | Free user sees paywall on "View contacts" |
| 2.8 Razorpay Integration | verifyWebhookSignature() | Webhook handler updates DB | User completes checkout, upgraded |
| 2.9 Email Notifications | Email template rendering | Mailgun API send | User receives confirmation email |
| 2.10 Template A/B Testing | Variant assignment | Store variant with message | Analytics shows response rate by variant |
| 2.12 Validation Dashboard | Metric calculation | Analytics queries | Admin sees GREEN/YELLOW/RED zones |

---

## 8. Implementation Checklist

### Week 9-10: Reddit OAuth and Contact Discovery

- [ ] Setup Reddit API OAuth application (client ID, secret, redirect URI)
- [ ] Create `reddit_contacts` table with indexes
- [ ] Implement RedditAPIClient OAuth methods (getAuthorizationUrl, exchangeCodeForTokens, refreshAccessToken)
- [ ] Implement connectRedditAccountAction, handleOAuthCallbackAction
- [ ] Add Reddit OAuth fields to users table (encrypted token storage)
- [ ] Implement discoverContactsAction (fetch profiles, rank by engagement)
- [ ] Create ContactCard component (username, karma, post excerpt)
- [ ] Test: OAuth flow end-to-end, tokens refresh automatically

### Week 11-12: Message Templates and Sending

- [ ] Implement generateMessageTemplateAction (GPT-4 prompt engineering)
- [ ] Create `messages` table with indexes
- [ ] Enhance `usage_limits` table (messages_sent_today, message_reset_date)
- [ ] Implement sendRedditMessageAction (quota check, Reddit API POST /api/compose)
- [ ] Implement sendRedditMessageBatchAction (parallel sends with error handling)
- [ ] Create MessageComposer component (inline editing, character count)
- [ ] Implement rate limiting (trackMessageSendAction, daily reset cron job)
- [ ] Test: Send 5 messages, 6th blocked, quota resets next day

### Week 13: Razorpay Integration

- [ ] Setup Razorpay account (test mode + production mode)
- [ ] Create Razorpay subscription plans (plan_monthly_20, plan_yearly_200)
- [ ] Implement RazorpayClient (createCustomer, createSubscription, cancelSubscription)
- [ ] Implement createSubscriptionAction, cancelSubscriptionAction
- [ ] Create webhook endpoint: POST /api/billing/webhooks/razorpay
- [ ] Implement webhook signature verification (HMAC SHA256)
- [ ] Handle webhook events: subscription.activated, cancelled, payment.failed
- [ ] Test: Complete subscription flow, webhook updates DB, cancellation works

### Week 14: Conversation Tracking and Analytics

- [ ] Create /dashboard/conversations page (SSR)
- [ ] Implement ConversationTracker component (message list, outcome logging)
- [ ] Implement logMessageOutcomeAction (update message.outcome)
- [ ] Calculate metrics: send rate, response rate, MRR, churn
- [ ] Create validation dashboard (GREEN/YELLOW/RED zones)
- [ ] Test: Log outcomes, metrics update correctly

### Week 15: Email Notifications and Polish

- [ ] Setup Mailgun account, verify domain (SPF, DKIM)
- [ ] Implement email service (Mailgun API)
- [ ] Create email templates (message sent confirmation, weekly summary, onboarding drip)
- [ ] Implement email actions (sendConfirmationEmail, sendWeeklySummary)
- [ ] Setup email drip campaign (Day 1, 3, 7)
- [ ] Mobile optimization (conversation tracker, message composer)
- [ ] Test: User receives emails, drip campaign triggers

### Week 16: Template A/B Testing and Validation

- [ ] Implement template variant assignment (random, consistent hashing)
- [ ] Store template_variant with each message
- [ ] Calculate response rate by variant (analytics dashboard)
- [ ] Implement template quality feedback ("Was this helpful?")
- [ ] Final E2E testing (free-to-paid flow, message send flow, conversation tracking)
- [ ] Performance testing (50 concurrent message sends)
- [ ] Deploy to production, monitor for 30 days

---

## 9. Success Metrics and Validation

**GREEN Zone (Proceed to Epic 3):**
- ✅ Free-to-paid conversion >5%
- ✅ Message send rate >10% of paid users
- ✅ Template response rate >15%
- ✅ MRR $200+ by Month 3
- ✅ Churn rate <15%

**YELLOW Zone (Iterate for 2-4 Weeks):**
- ⚠️ Conversion 3-5%
- ⚠️ Send rate 5-10%
- ⚠️ Response rate 10-15%
- ⚠️ MRR $100-200
- ⚠️ Churn 15-25%
- **Action**: A/B test pricing, improve templates, enhance onboarding, add 7-day trial

**RED Zone (Pivot or Kill Epic 3):**
- ❌ Conversion <3%
- ❌ Send rate <5%
- ❌ Response rate <10%
- ❌ MRR <$100
- ❌ Churn >25%
- **Action**: Fundamental value proposition issue, reconsider paid tier strategy, may need to pivot before Epic 3

---

_This technical specification is ready for implementation pending Epic 1 GREEN zone validation. All acceptance criteria, architecture alignment, and test strategy are defined. Estimated implementation timeline: 8 weeks with 15-20 hours/week (solo developer)._

**Next Steps:**
1. Epic 1 validation (Week 8)
2. Decision: Proceed to Epic 2 if Epic 1 GREEN
3. Sprint planning: 4 two-week sprints
4. Development kickoff (Week 9)
5. Epic 2 validation checkpoint (Week 16 + 30 days monitoring)
