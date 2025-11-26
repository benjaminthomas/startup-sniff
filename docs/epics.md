# startup-sniff - Epic Breakdown

**Author:** Benjamin
**Date:** 2025-10-13
**Project Level:** Level 3 (Full Product)
**Target Scale:** 3 epics, 30-40 user stories, 14-20 week timeline

---

## Epic Overview

StartupSniff transformation consists of 3 sequential epics, each validating critical assumptions before proceeding to the next phase. This phased approach minimizes risk by enforcing clear kill criteria and ensures each investment delivers standalone value.

**Epic 1: Magical Reddit Extraction Engine** (Weeks 1-8)
- **Scope:** 10-12 user stories
- **Goal:** Create "holy shit moment" proving 10-30 hours of manual work → 10 minutes
- **Validation:** >2 min session time, >25% 7-day return rate
- **Deployment:** Free tier, maximum viral spread

**Epic 2: Guided Human Contact Workflow** (Weeks 9-16)
- **Scope:** 12-16 user stories
- **Goal:** Bridge validation → first customer gap through guided outreach
- **Validation:** >10% message send rate, >15% response rate, $200+ MRR
- **Deployment:** $20/month paid tier, free Pillar 1 continues

**Epic 3: Network Intelligence Foundation** (Weeks 17-24)
- **Scope:** 8-12 user stories
- **Goal:** Build defensive data moat through collective intelligence
- **Validation:** 500+ experiments, measurable patterns, >70% opt-in
- **Deployment:** Data collection + basic insights, advanced tier later

**Total Timeline:** 14-20 weeks solo development (15-20 hrs/week)

**Sequencing:** Epic 1 GREEN zone validation required before Epic 2 development begins. Epic 2 >10% send rate required before Epic 3 investment.

---

## Epic 1: Magical Reddit Extraction Engine

**Epic Goal:** Create the "holy shit moment" that compresses 10-30 hours of manual Reddit browsing into 10 minutes of intelligent analysis, earning user trust before monetization.

**Timeline:** Weeks 1-8 (Month 1-2)
**Story Count:** 10-12 stories
**Success Criteria:** >2 min session time, >25% return rate, >2 pain points explored per session

---

### Story 1.1: Cross-Subreddit Pain Point Aggregation

**As a** founder seeking startup ideas
**I want to** see pain points aggregated from multiple subreddits simultaneously
**So that** I can discover opportunities I'd never find through manual browsing

**Prerequisites:**
- Reddit API credentials configured
- Database schema for storing pain points
- Subreddit list hardcoded (r/entrepreneur, r/SaaS, r/startups, r/productivity, r/smallbusiness, + 10 more)

**Acceptance Criteria:**
1. System fetches posts from 15+ subreddits in parallel within 5 seconds (95th percentile)
2. Posts from last 7 days are displayed, sorted by recency and engagement (upvotes + comments)
3. Each pain point shows: subreddit source, post title, excerpt, author, upvotes, comments, timestamp
4. Minimum 50 pain points displayed on initial load with infinite scroll or pagination
5. Results are cached for 4 hours to optimize Reddit API usage and performance
6. Loading states display skeleton screens, not blank pages
7. Mobile-responsive grid layout works on 320px minimum viewport

**Technical Notes:**
- Use Reddit API with caching layer (Redis) for 4-hour TTL
- Background job fetches and processes posts every 4 hours
- Store in PostgreSQL with indexes on subreddit, created_at, engagement_score
- Consider using PRAW (Python) or Snoowrap (Node.js) for Reddit API wrapper

---

### Story 1.2: AI Commercial Viability Scoring

**As a** founder exploring opportunities
**I want to** see AI-generated commercial viability scores for each pain point
**So that** I can quickly identify high-potential opportunities worth pursuing

**Prerequisites:**
- Story 1.1 complete (pain points aggregated)
- OpenAI GPT-4 API integration
- Caching infrastructure for API cost control

**Acceptance Criteria:**
1. Each pain point displays a commercial viability score (1-10 scale) with visual indicator (color-coded: 1-4 red, 5-7 yellow, 8-10 green)
2. Score includes brief explanation (2-3 sentences) highlighting key factors: sentiment, urgency, buying signals, market potential
3. Example: "7/10 - High urgency, 12 mentions of willingness to pay, specific pain point articulated clearly"
4. Scores are generated on first fetch and cached for 24 hours to control OpenAI API costs
5. Total OpenAI cost per 100 pain points < $3 (budget constraint)
6. Batch processing of scores to optimize API usage (max 20 concurrent requests)
7. Graceful degradation if OpenAI API unavailable: show cached scores or "Score pending"
8. Users can expand to see detailed analysis breakdown (sentiment analysis, urgency signals, buying intent indicators)

**Technical Notes:**
- GPT-4 prompt engineering for consistent scoring methodology
- Store scores in database with timestamp for cache invalidation
- Monitor API costs via dashboard (target <$500/month at scale)
- Consider GPT-3.5 for cost optimization if quality sufficient

---

### Story 1.3: Trend Detection and Frequency Analysis

**As a** founder researching opportunities
**I want to** see trend indicators showing whether a pain point is emerging, stable, or declining
**So that** I can identify opportunities before they become saturated

**Prerequisites:**
- Story 1.1 complete (pain point aggregation)
- Historical data collection (minimum 2 weeks of posts)

**Acceptance Criteria:**
1. Each pain point displays frequency metric: "Mentioned 47 times this week"
2. Trend indicator shows directional change: "Trending up 23%" with arrow (↑ green, ↓ red, → gray)
3. Trend calculation compares current week vs. previous week mention frequency
4. Visual sparkline chart shows last 4 weeks of activity for each pain point (optional enhancement)
5. Ability to sort pain points by trend velocity (fastest growing first)
6. "Emerging" tag appears on pain points with >50% week-over-week growth and <10 total mentions
7. Data visualization loads without blocking page render (progressive enhancement)

**Technical Notes:**
- Requires time-series data storage for historical tracking
- Calculate trends via SQL aggregation or pre-computed materialized view
- Consider using Chart.js or Recharts for sparkline visualization
- Update trend calculations daily via background job

---

### Story 1.4: Search and Filtering Capabilities

**As a** user exploring pain points
**I want to** filter and search to find specific opportunities relevant to my skills
**So that** I can quickly narrow down to the most relevant opportunities

**Prerequisites:**
- Story 1.1, 1.2, 1.3 complete (core pain point display)

**Acceptance Criteria:**
1. Filter by subreddit: Multi-select dropdown showing all 15+ subreddits with post counts
2. Filter by timeframe: Radio buttons for 24h, 7d (default), 30d
3. Filter by commercial viability score: Slider for minimum score threshold (e.g., "Show only 7+ scores")
4. Filter by trend status: Checkboxes for "Emerging", "Trending Up", "Stable", "Declining"
5. Keyword search: Full-text search across pain point titles and content with highlighting
6. Filters apply instantly without page reload (client-side filtering preferred, server-side acceptable)
7. URL parameters preserve filter state for sharing (e.g., ?subreddit=entrepreneur&min_score=7)
8. "Clear all filters" button restores default view
9. Results count updates dynamically: "Showing 23 of 150 pain points"

**Technical Notes:**
- Client-side filtering with React/Vue state management for instant feedback
- Server-side filtering for large datasets (fallback)
- Full-text search via PostgreSQL `tsvector` or Elasticsearch if scaling
- Consider using URL query params for shareable filter states

---

### Story 1.5: Pain Point Detail View

**As a** user evaluating an opportunity
**I want to** see comprehensive details about a specific pain point
**So that** I can assess whether it's worth pursuing before contacting people

**Prerequisites:**
- Story 1.1, 1.2 complete (pain points with scores)

**Acceptance Criteria:**
1. Clicking any pain point opens detail modal or dedicated page
2. Detail view shows: full original Reddit post content, author profile link, post URL, engagement metrics (upvotes, comments, awards)
3. AI analysis breakdown displayed: sentiment score, urgency level, buying signal confidence, market size estimate
4. "Similar pain points" section shows 3-5 related discussions with similarity scoring
5. Comment highlights section shows top 3 most relevant comments discussing the problem
6. Time-on-page tracking for analytics (measure engagement depth)
7. Mobile-optimized scrolling and navigation (swipe to next/previous pain point)
8. "Bookmark" functionality for saving pain points to explore later (requires auth)

**Technical Notes:**
- Modal component with deep linking support
- Similarity detection via text embeddings (OpenAI ada-002) or basic keyword matching
- Comment analysis via GPT-4 to extract most relevant discussions
- Analytics tracking for detail view engagement

---

### Story 1.6: Fast, Magical UI Experience

**As a** skeptical first-time visitor
**I want to** experience instant value within 3 seconds of page load
**So that** I'm convinced the platform is worth exploring further

**Prerequisites:**
- Stories 1.1, 1.2, 1.3 complete (core features functional)

**Acceptance Criteria:**
1. Landing page loads in <2 seconds on 4G connection (Lighthouse performance score >90)
2. Above-the-fold content displays live pain points immediately (no loading spinner >3s)
3. Skeleton screens used during data fetching (perceived performance)
4. First 5-10 pain points load instantly from cache, remaining load progressively
5. Page transitions are smooth (60fps animations, no jank)
6. Core Web Vitals meet "Good" thresholds: LCP <2.5s, FID <100ms, CLS <0.1
7. No signup wall or paywall blocking initial exploration (free tier instant access)
8. Interactive demo or live scrolling feed on landing page showing real-time pain points

**Technical Notes:**
- Implement SSR/SSG with Next.js for instant first paint
- Aggressive caching strategy (CDN + Redis)
- Code splitting to minimize initial bundle size
- Optimize images (WebP, lazy loading, responsive images)
- Consider skeleton screens library or custom CSS

---

### Story 1.7: User Registration and Onboarding

**As a** visitor who sees value
**I want to** create an account to access personalized features
**So that** I can track my exploration and prepare for paid features

**Prerequisites:**
- Story 1.6 complete (users have explored free tier)

**Acceptance Criteria:**
1. Signup flow accessible from top navigation: "Sign up free" CTA
2. Email/password signup with email verification OR OAuth (Google, GitHub)
3. Minimal onboarding form: Name, email, password, "What brings you here?" (optional)
4. No credit card required for free tier signup
5. Email verification sent within 30 seconds, account functional immediately (verify later)
6. Onboarding captures: Experience level (first-timer vs. experienced), goals (customer discovery, idea validation, market research)
7. Privacy policy and terms acceptance checkbox (GDPR compliance)
8. Post-signup redirect to personalized dashboard or pain point feed
9. Welcome email with getting started guide and feature highlights

**Technical Notes:**
- Use Supabase Auth or NextAuth.js for authentication
- Email service: SendGrid, Postmark, or AWS SES
- Store user preferences in user profile table
- Consider progressive profiling (gather data over time, not all upfront)

---

### Story 1.8: Basic Analytics and Engagement Tracking

**As a** product owner
**I want to** track user engagement metrics
**So that** I can validate Epic 1 success criteria and optimize the experience

**Prerequisites:**
- Stories 1.1-1.7 complete (full free tier functional)

**Acceptance Criteria:**
1. Track key metrics: Session duration, pain points explored per session, filter usage, detail view clicks
2. Track funnel: Landing → Exploration → Signup → Return visit
3. 7-day return rate calculation: % of users who return within 7 days of first visit
4. Bounce rate tracking: % of users leaving within 60 seconds
5. Dashboard displays GREEN/YELLOW/RED zone status based on success criteria
6. Individual user activity log for support and debugging (privacy-compliant)
7. A/B testing capability for future experimentation (optional enhancement)
8. Export capability for offline analysis (CSV or API)

**Technical Notes:**
- Use PostHog (privacy-friendly) or Mixpanel for product analytics
- Event tracking: pageview, pain_point_viewed, filter_applied, signup_completed
- Custom dashboards for Epic 1 validation metrics
- Ensure GDPR/CCPA compliance with cookie consent and opt-out

---

### Story 1.9: Mobile-Responsive Experience

**As a** mobile user browsing during commute or downtime
**I want to** explore pain points seamlessly on my phone
**So that** I can validate ideas during moments of inspiration

**Prerequisites:**
- Stories 1.1-1.6 complete (core features functional)

**Acceptance Criteria:**
1. Full functionality works on viewport widths 320px - 1920px
2. Touch-optimized UI: Tap targets minimum 44x44px, swipe gestures for navigation
3. Mobile navigation: Hamburger menu or bottom tab bar for primary actions
4. Filters accessible via slide-out panel or modal (not cluttering main view)
5. Infinite scroll or pagination optimized for mobile (thumb-reachable load more)
6. Pain point cards stack vertically on mobile, grid on desktop
7. Detail view full-screen on mobile with swipe-to-dismiss
8. Performance optimized: Lazy load images, minimize bundle size for mobile networks
9. PWA-capable: Add to home screen, works offline with cached data (optional enhancement)

**Technical Notes:**
- CSS Grid/Flexbox for responsive layouts
- Tailwind CSS breakpoints or custom media queries
- Test on real devices: iPhone SE (320px), iPhone 12, Android mid-range
- Consider PWA manifest and service worker for offline support

---

### Story 1.10: Performance Optimization and Caching

**As a** product owner
**I want to** minimize Reddit API and OpenAI API costs while maintaining fast UX
**So that** the platform remains profitable at scale

**Prerequisites:**
- Stories 1.1, 1.2 complete (core data fetching)

**Acceptance Criteria:**
1. Reddit API calls reduced by 90% through 4-hour caching of pain point data
2. OpenAI API calls reduced by 95% through 24-hour caching of viability scores
3. Database query optimization: All queries <100ms for 95th percentile
4. CDN caching for static assets with cache-busting on deploy
5. Redis caching layer for frequently accessed data (pain points, scores, trends)
6. Background jobs for data refresh (not triggered by user requests)
7. API cost dashboard showing spend per day/week/month vs. budget
8. Graceful degradation when APIs unavailable: Serve stale cache with notification

**Technical Notes:**
- Redis (Upstash serverless) for cache layer
- Background jobs via Vercel Cron or Inngest
- Monitor API costs via custom dashboard or Grafana
- Database indexes on subreddit, created_at, score for fast queries
- Consider implementing request coalescing to prevent cache stampede

---

### Story 1.11: Error Handling and Graceful Degradation

**As a** user encountering errors
**I want to** see helpful messages and recovery options
**So that** I don't feel frustrated or blame myself for system issues

**Prerequisites:**
- Stories 1.1-1.10 complete (full feature set)

**Acceptance Criteria:**
1. Reddit API failure: Display cached pain points with banner "Showing recent data, refresh coming soon"
2. OpenAI API failure: Display pain points without scores, show "Analyzing..." placeholder
3. Network timeout: "Connection slow, still loading..." message, not blank screen
4. No results from filter: "No pain points match these filters. Try broadening criteria." + one-click reset
5. 500 errors: User-friendly message "Something went wrong, we're on it" + contact support link
6. Error tracking via Sentry with context (user ID, action, timestamp)
7. Automatic retry logic for transient API failures (3 retries with exponential backoff)
8. Support contact form accessible from error states

**Technical Notes:**
- Centralized error boundary in React
- Sentry or Bugsnag for error tracking and alerting
- Retry logic with exponential backoff for API calls
- Fallback UI components for each error scenario
- User-friendly error messages (no stack traces to end users)

---

### Story 1.12: Epic 1 Validation Dashboard

**STATUS: REMOVED FROM APPLICATION** (User decision - November 2025)

**Decision:** This story has been removed from the application. Epic 1 validation metrics should be tracked through external analytics tools (Google Analytics, Mixpanel, Posthog) rather than building custom validation dashboards within the application.

**What Was Removed:**
- ❌ Epic 1 validation dashboard page (`/dashboard/epic1-validation`)
- ❌ Validation dashboard components
- ❌ Analytics database tables
- ❌ Calculate metrics cron job

**Rationale:**
- Validation metrics are better suited for external analytics platforms
- Building custom dashboards adds maintenance overhead without unique value
- External tools provide richer analytics capabilities and integrations

**Alternative Approach:**
Use external analytics tools to track Epic 1 success criteria:
- Session time, return rate, bounce rate → Google Analytics, Mixpanel, Posthog
- User feedback surveys → Typeform, Google Forms
- Custom event tracking via analytics SDK

~~**Original Story (for reference):**~~
~~**As a** product owner~~
~~**I want to** see real-time validation of Epic 1 success criteria~~
~~**So that** I can make data-driven decision to proceed to Epic 2 or pivot~~

---

## Epic 2: Guided Human Contact Workflow

**Epic Goal:** Bridge the catastrophic gap between validation and first customer contact by making human outreach so easy that anxious founders actually do it.

**Timeline:** Weeks 9-16 (Month 3-4)
**Story Count:** 12-16 stories
**Success Criteria:** >10% send rate, >15% response rate, $200+ MRR, >5% free-to-paid conversion

---

### Story 2.1: Human Discovery from Pain Points

**As a** paid subscriber
**I want to** see specific people who recently posted about a pain point
**So that** I can start conversations with real potential customers

**Prerequisites:**
- Epic 1 complete and validated (GREEN zone)
- User upgraded to paid tier ($20/month)
- Reddit API profile fetching capability

**Acceptance Criteria:**
1. Clicking "View contacts" on any pain point shows 5 real Reddit users who posted about this problem in last 48 hours
2. Each contact shows: Reddit username, post excerpt, profile link, posting frequency, karma score, account age
3. Contacts ranked by engagement level and early adopter likelihood (active posters, high karma, relevant subreddit participation)
4. "Why this person?" explanation for each contact (e.g., "Active in r/SaaS, posted 3 times about this problem, 2K karma")
5. Filter/refresh to see different 5 contacts if initial set not relevant
6. Loading state <3 seconds for contact discovery
7. Graceful handling if <5 contacts found: Show available contacts + suggestion to check back later
8. Paywall enforcement: Free tier sees "Upgrade to view contacts" with clear value proposition

**Technical Notes:**
- Reddit API to fetch user profiles and post history
- Ranking algorithm based on karma, post frequency, subreddit relevance
- Cache contact lists for 24 hours per pain point
- Store discovered contacts in database for tracking

---

### Story 2.2: Reddit OAuth Integration

**As a** user wanting to send messages
**I want to** authenticate with my own Reddit credentials
**So that** messages come from my account (not StartupSniff) and I'm protected from platform bans

**Prerequisites:**
- Story 2.1 complete (contacts discoverable)
- Reddit API OAuth 2.0 application registered

**Acceptance Criteria:**
1. "Connect Reddit Account" button triggers Reddit OAuth flow in popup or redirect
2. OAuth permissions request clearly explains: "StartupSniff will send messages on your behalf using your Reddit account"
3. User grants permission → OAuth token securely stored encrypted in database (per-user)
4. Token refresh logic handles expiration automatically
5. Disconnect option available in user settings with confirmation dialog
6. OAuth flow works on mobile (not broken by popup blockers)
7. Error handling if OAuth fails: Clear message + retry option + support link
8. Privacy page explains token storage, encryption, and usage (GDPR compliance)

**Technical Notes:**
- Reddit OAuth 2.0 implementation (user authorization flow)
- Token encryption at rest (AES-256)
- Token refresh automation via background job
- Store tokens per user in secure column (not shared across accounts)
- Test OAuth flow on desktop + mobile browsers

---

### Story 2.3: AI-Generated Personalized Message Templates

**As a** user preparing to contact someone
**I want to** have a high-quality, personalized message template
**So that** I don't have to write from scratch and the recipient feels it's genuine

**Prerequisites:**
- Story 2.1, 2.2 complete (contacts discoverable, OAuth connected)

**Acceptance Criteria:**
1. Selecting contact shows AI-generated message template within 3 seconds
2. Template references specific Reddit post: "I saw your post in r/entrepreneur about [specific pain point]..."
3. Template demonstrates empathy and understanding, not sales pitch: "I'm also exploring solutions to this problem"
4. Template offers value-first: "I'd love to learn more about your experience. Would you be open to a quick 15-min chat?"
5. Template length 150-250 words (not too long, not too short)
6. User can edit template before sending (inline editing with character count)
7. Multiple template variations available: "Professional", "Casual", "Concise" (dropdown selector)
8. Template quality measured: >15% response rate = success, <10% = iterate
9. A/B testing capability for template optimization (future enhancement)

**Technical Notes:**
- GPT-4 prompt engineering for personalized, non-salesy templates
- Reference Reddit post content in prompt for specificity
- Store template variations for A/B testing
- Track template used per message for performance analysis
- Cost: ~$0.01 per template generation (budget <$100/month)

---

### Story 2.4: Rate Limiting and Compliance

**As a** platform owner
**I want to** enforce rate limits on message sending
**So that** users don't spam Reddit and risk platform bans

**Prerequisites:**
- Story 2.2, 2.3 complete (OAuth + templates ready)

**Acceptance Criteria:**
1. Rate limit: 5 messages per user per day (business logic enforcement)
2. UI shows remaining quota: "3 of 5 messages remaining today, resets in 8 hours"
3. Quota resets at midnight UTC with clear countdown timer
4. Attempting to send beyond quota shows friendly block: "Daily limit reached. This helps keep your Reddit account safe."
5. Premium tier option ($50/month): 10 messages/day with clear upgrade path (future enhancement)
6. Rate limit bypass for testing accounts (admin only)
7. Logs all message sends with timestamp for audit trail
8. Redis-based rate limiting (atomic counter operations)

**Technical Notes:**
- Redis INCR with TTL for rate limit tracking
- Per-user rate limit keys: `rate_limit:user:{userId}:messages`
- Reset logic via TTL expiration (24-hour window)
- UI updates in real-time based on quota remaining
- Admin panel to adjust limits for testing

---

### Story 2.5: Message Send Workflow

**As a** user ready to reach out
**I want to** review and send messages with minimal friction
**So that** I can complete outreach in <2 minutes while feeling confident

**Prerequisites:**
- Stories 2.1-2.4 complete (full workflow components ready)

**Acceptance Criteria:**
1. Workflow: Select pain point → View contacts → Select 1-5 recipients → Review/edit templates → Send
2. Multi-select UI for choosing 3 of 5 contacts (checkboxes with visual selection state)
3. "Review messages" modal shows all 3 templates side-by-side for final editing
4. "Send 3 messages" button with confirmation: "This will send 3 Reddit DMs from your account"
5. Optimistic UI: Messages marked "Sending..." immediately, confirmed async
6. Success confirmation: "3 messages sent successfully! Check back in 24h for replies."
7. Error handling per message: If 1 of 3 fails, show which succeeded + retry option for failed
8. Entire workflow completable in <2 minutes (timed user testing)
9. Mobile-optimized for one-handed operation

**Technical Notes:**
- Reddit API: POST to /api/compose for message sending
- Queue system for reliable message delivery (Inngest or BullMQ)
- Transaction log: Store sent messages with status (pending, sent, failed)
- Retry logic for failed sends (3 attempts with exponential backoff)
- User notification on completion (in-app + email optional)

---

### Story 2.6: Conversation Tracking Dashboard

**As a** user who sent messages
**I want to** track conversation outcomes and momentum
**So that** I feel productive even before getting first customer

**Prerequisites:**
- Story 2.5 complete (messages sendable)

**Acceptance Criteria:**
1. Dashboard shows aggregate metrics: "5 messages sent, 2 replies received, 1 call scheduled, 0 customers"
2. Individual message tracking: List of all sent messages with status (sent, replied, no response, customer acquired)
3. Manual outcome logging: User can mark conversation as "Reply received", "Call scheduled", "Customer acquired", "Dead end"
4. Timeline view showing conversation progression over days/weeks
5. Momentum visualization: Progress bar or chart showing "conversations started per week" (North Star metric)
6. Contextual prompts: "You sent 5 messages 2 days ago. Log any replies yet?"
7. Export conversation log to CSV for offline analysis
8. Celebratory micro-animations when logging positive outcomes (gamification)

**Technical Notes:**
- Messages table with FK to user, contact, outcome_type, updated_at
- Outcome enum: sent, replied, call_scheduled, customer_acquired, dead_end
- Analytics aggregation for dashboard metrics
- Manual logging form with dropdown selectors
- Chart.js or Recharts for visualization

---

### Story 2.7: Freemium Tier Management and Paywall

**As a** product owner
**I want to** enforce paywall on Pillar 2 features
**So that** the business generates revenue while keeping Pillar 1 free

**Prerequisites:**
- Epic 1 complete (free tier functional)
- Stripe integration ready

**Acceptance Criteria:**
1. Free tier: Unlimited access to Pillar 1 (pain point exploration, filtering, detail views)
2. Paywall: "View contacts" blocked with upgrade prompt showing value: "Start conversations with real potential customers"
3. Paid tier ($20/month): Unlocks all Pillar 2 features (contacts, templates, tracking)
4. Non-intrusive upgrade prompts: Contextual CTAs, not blocking modals
5. Trial period consideration: 7-day free trial of paid features (optional, test conversion impact)
6. Clear feature comparison: Free vs. Paid tier table on pricing page
7. Downgrade support: User can cancel subscription, data retained for 30 days
8. Prorated billing on mid-month upgrades/downgrades

**Technical Notes:**
- Feature flags per subscription tier (free, paid, enterprise)
- Middleware/guards on protected routes and API endpoints
- Stripe subscription management (create, upgrade, downgrade, cancel)
- Database: users.subscription_tier and users.subscription_status fields
- Trial period via Stripe trial_period_days setting

---

### Story 2.8: Stripe Subscription Integration

**As a** user upgrading to paid tier
**I want to** complete checkout seamlessly
**So that** I can start sending messages immediately

**Prerequisites:**
- Story 2.7 complete (paywall enforced)
- Stripe account configured

**Acceptance Criteria:**
1. "Upgrade to Pro" CTA redirects to Stripe Checkout or embedded form
2. Checkout shows clear pricing: "$20/month, cancel anytime"
3. Payment methods: Credit card, Apple Pay, Google Pay
4. Successful payment → Immediate account upgrade (no delay)
5. Confirmation email with receipt and getting started guide
6. Failed payment: Clear error message + retry option + support link
7. Subscription management portal: View billing, update card, cancel subscription (Stripe customer portal)
8. Webhook handling for subscription events: created, updated, canceled, payment_failed
9. Dunning logic: Handle failed renewal payments with grace period

**Technical Notes:**
- Stripe Checkout Session API or Payment Intents
- Webhook endpoint for subscription lifecycle events
- Store Stripe customer_id and subscription_id in users table
- Test mode for development, production mode for live
- Handle edge cases: Duplicate payments, refunds, disputes

---

### Story 2.9: Email Notifications and Engagement

**As a** user waiting for replies
**I want to** receive email notifications when activity happens
**So that** I stay engaged and return to the platform

**Prerequisites:**
- Story 2.6 complete (conversation tracking)
- Email service configured (SendGrid, Postmark, AWS SES)

**Acceptance Criteria:**
1. Email notifications for key events: Message sent confirmation, weekly summary, upgrade reminders
2. Optional reply detection notification (future enhancement if Reddit API supports)
3. Weekly engagement email: "You sent 5 messages this week, here's what's trending"
4. Onboarding drip campaign: Day 1, 3, 7 emails with tips and success stories
5. Unsubscribe link in all emails (CAN-SPAM compliance)
6. Email preferences in user settings: Toggle each notification type independently
7. Transactional emails: Receipt, password reset, account deletion confirmation
8. Professional email templates with brand consistency

**Technical Notes:**
- Transactional email service (SendGrid, Postmark, AWS SES)
- Email queue for reliable delivery (separate from message queue)
- Email templates with variables (user_name, message_count, etc.)
- Track email opens and clicks for engagement analysis (optional)
- Respect user preferences stored in user_settings table

---

### Story 2.10: Template A/B Testing and Optimization

**As a** product owner
**I want to** test different message template approaches
**So that** I can improve response rates over time

**Prerequisites:**
- Story 2.3 complete (templates generating)
- Minimum 100 messages sent

**Acceptance Criteria:**
1. Template variants: Professional, Casual, Concise, Value-first
2. Random assignment of variant to each user/message
3. Track template_variant on each sent message
4. Analytics dashboard showing response rate by variant
5. Statistical significance calculation (minimum sample size 50 per variant)
6. Winning variant becomes default once significance reached
7. Continuous testing: Periodically introduce new variants to beat current champion
8. User override: Advanced users can select preferred variant manually

**Technical Notes:**
- Template variant field in messages table
- A/B test framework: Random assignment with consistent hashing
- Statistical significance testing (Chi-square or t-test)
- Dashboard showing variant performance metrics
- Automated winner selection after significance threshold

---

### Story 2.11: Mobile Message Workflow Optimization

**As a** mobile user
**I want to** send messages entirely from my phone
**So that** I can act on inspiration during commute or downtime

**Prerequisites:**
- Story 2.5 complete (message workflow functional)

**Acceptance Criteria:**
1. Full message workflow accessible and optimized for mobile (320px+ viewport)
2. Contact selection: Large tap targets, swipe to select
3. Template editing: Mobile keyboard optimized, word count visible
4. Send button: Thumb-reachable, clear confirmation dialog
5. Reddit OAuth: Works on mobile browsers without popup issues
6. Dashboard: Swipeable cards for message tracking
7. Performance: Workflow completes in <2 min on mobile (same as desktop)
8. Offline support: Cache templates for offline editing, queue for send when online (PWA enhancement)

**Technical Notes:**
- Touch event handling for swipe gestures
- Mobile-first CSS with touch-friendly UI components
- Test on iOS Safari, Chrome Android, Samsung Internet
- PWA service worker for offline capability (optional)

---

### Story 2.12: Epic 2 Validation Dashboard

**STATUS: REMOVED FROM APPLICATION** (User decision - November 2025)

**Decision:** This story has been removed from the application. Epic 2 validation metrics should be tracked through external analytics tools and Razorpay's built-in reporting rather than building custom validation dashboards within the application.

**What Was Removed:**
- ❌ Epic 2 validation dashboard page (`/dashboard/epic2-validation`)
- ❌ Epic 2 analytics components
- ❌ Epic 2 analytics backend modules
- ❌ Epic 2 analytics database tables
- ❌ Calculate metrics cron job

**Rationale:**
- External analytics tools provide better funnel and conversion tracking
- Razorpay dashboard already provides MRR, subscription, and churn metrics
- Custom dashboards add development and maintenance overhead
- Template A/B testing dashboard (Story 2.10) remains as it provides unique value

**Alternative Approach:**
Use combination of tools for Epic 2 validation:
- Conversion funnel, send rate → Google Analytics, Mixpanel, Posthog
- MRR, churn rate, cohort analysis → Razorpay Dashboard
- Template performance → Story 2.10 dashboard (`/dashboard/analytics/template-variants`)
- Custom event tracking via analytics SDK

~~**Original Story (for reference):**~~
~~**As a** product owner~~
~~**I want to** see real-time validation of Epic 2 success criteria~~
~~**So that** I can decide to proceed to Epic 3 or iterate~~

---

## Epic 3: Network Intelligence Foundation

**Epic Goal:** Build the defensive data moat by collecting anonymized experiment data and surfacing initial pattern recognition that competitors cannot replicate.

**Timeline:** Weeks 17-24 (Month 5-6)
**Story Count:** 8-12 stories
**Success Criteria:** 500+ experiments, >70% opt-in, measurable patterns, >40% reference insights

---

### Story 3.1: Anonymized Experiment Data Collection

**As a** platform owner
**I want to** collect experiment data from all users
**So that** I can build network intelligence that improves for everyone

**Prerequisites:**
- Epic 2 complete (conversation tracking functional)
- Privacy policy and consent framework ready

**Acceptance Criteria:**
1. Explicit opt-in during onboarding: "Help improve StartupSniff by sharing anonymized experiment data"
2. Clear explanation of what's collected: Pain points explored, messages sent, response rates, outcomes (NO message content)
3. Opt-out available anytime in user settings
4. Data anonymization: Strip user_id, replace with anonymous_id before pattern analysis
5. Data retention: Store raw experiment data for 12 months, aggregated insights indefinitely
6. GDPR compliance: Right to export, right to delete (permanent anonymization)
7. Transparency page: Show exactly what data is used and how
8. Consent recorded with timestamp in database

**Technical Notes:**
- experiments table with FKs: user_id, pain_point_id, outcome, sent_at, response_at
- Anonymization logic: Hash user_id to anonymous_id for pattern analysis queries
- Separate aggregated_insights table (no link back to individual users)
- GDPR export/delete automation
- Privacy-first architecture review

---

### Story 3.2: Social Proof Display

**As a** user evaluating a pain point
**I want to** see how many others explored it and what results they got
**So that** I feel confident this is worth pursuing

**Prerequisites:**
- Story 3.1 complete (data collection active)
- Minimum 100 experiments logged

**Acceptance Criteria:**
1. Each pain point shows social proof: "127 founders explored this, 89 sent messages, 34 got replies, 8 scheduled calls"
2. Funnel visualization: Explored → Messaged → Replied → Customer (with percentages)
3. Real-time updates: Social proof refreshes as new experiments complete
4. Contextual display: Show social proof near "View contacts" button to reduce friction
5. Trust indicators: "Success rate: 27% response rate" based on aggregated data
6. Privacy-preserving: No individual user data shown, only aggregates
7. Minimum threshold: Hide social proof if <10 experiments to avoid misleading small samples
8. Trend over time: "Response rate improving: 15% → 22% over last month"

**Technical Notes:**
- Aggregation queries: COUNT by pain_point_id, outcome_type
- Cache aggregated metrics for performance (refresh hourly)
- Display logic: Show only if sample size > minimum threshold
- Chart visualization for funnel and trends

---

### Story 3.3: Pattern Recognition MVP

**As a** platform owner
**I want to** identify patterns in experiment data
**So that** I can surface "what works" insights to users

**Prerequisites:**
- Story 3.1, 3.2 complete (data collection + social proof)
- Minimum 500 experiments logged

**Acceptance Criteria:**
1. Pattern detection: Response rate by subreddit (e.g., "r/entrepreneur: 12% vs. r/startups: 8%")
2. Pattern detection: Response rate by time of day (e.g., "Morning sends: 18% vs. Evening: 11%")
3. Pattern detection: Response rate by template variant (Professional: 16% vs. Casual: 14%)
4. Pattern detection: Time-to-first-customer by user segment (first-timer: 72 days vs. experienced: 38 days)
5. Statistical significance filtering: Only show patterns with p-value <0.05 and sample size >30
6. Pattern quality score: Confidence level based on sample size and variance
7. Pattern update frequency: Recalculate weekly as new data arrives
8. Admin dashboard showing all detected patterns with significance scores

**Technical Notes:**
- SQL aggregation queries with GROUP BY subreddit, time_bucket, template_variant
- Statistical significance testing (Chi-square for categorical, t-test for continuous)
- Materialized views or scheduled jobs for pattern computation
- Pattern quality scoring algorithm
- Consider ML model for more complex pattern detection (future enhancement)

---

### Story 3.4: "What Worked for Others" Insights

**As a** user preparing to send messages
**I want to** see insights from successful experiments
**So that** I can optimize my approach based on collective intelligence

**Prerequisites:**
- Story 3.3 complete (patterns detected)

**Acceptance Criteria:**
1. Contextual insight display: When composing message, show "Messages sent in morning get 2x replies"
2. Insight types: Best subreddits, optimal timing, effective templates, success sequences
3. Insight confidence indicator: "High confidence (234 experiments)" vs. "Emerging pattern (47 experiments)"
4. Actionable suggestions: "Try sending at 9 AM EST for best results" with one-click schedule option
5. Insight library: Dedicated page showing all discovered patterns organized by category
6. User feedback: "Was this insight helpful?" to improve relevance
7. Personalized insights: Tailor to user segment (first-timer gets different insights than experienced)
8. >40% of users reference insights before sending (tracked via analytics)

**Technical Notes:**
- Insights table: pattern_type, description, confidence_score, sample_size
- Contextual display logic based on user action (preparing message → timing insights)
- A/B test impact of showing insights on user behavior
- Personalization based on user profile (experience level, goals)

---

### Story 3.5: Predictive Validation Scoring (Foundation)

**As a** user considering a pain point
**I want to** see likelihood of success before investing time
**So that** I can prioritize high-probability opportunities

**Prerequisites:**
- Story 3.3, 3.4 complete (pattern recognition mature)
- Minimum 1,000 experiments logged

**Acceptance Criteria:**
1. Predictive score displayed on pain point card: "85% likelihood of first customer based on 47 similar experiments"
2. Prediction model considers: Subreddit, commercial viability score, trend status, user segment match
3. Explanation of prediction: "Similar founders (first-timers in SaaS) achieved 85% response rate"
4. Confidence interval: "70-95% range" based on variance in similar experiments
5. Prediction accuracy tracking: Compare predicted vs. actual outcomes to improve model
6. Minimum data requirement: Hide prediction if <30 similar experiments
7. Model retraining: Monthly update as new experiment data accumulates
8. Disclaimer: "Predictions based on historical data, your results may vary"

**Technical Notes:**
- Machine learning model: Logistic regression or random forest for classification
- Feature engineering: Subreddit, score, trend, user_segment, timing
- Model training pipeline: Scikit-learn or TensorFlow
- Prediction API endpoint served from model inference
- A/B test impact on user behavior and conversion
- Model performance monitoring (precision, recall, F1)

---

### Story 3.6: Data Contribution Gamification

**As a** user logging experiment outcomes
**I want to** feel recognized for contributing to collective intelligence
**So that** I'm motivated to provide high-quality data

**Prerequisites:**
- Story 3.1 complete (data collection active)

**Acceptance Criteria:**
1. Contribution tracking: "You've contributed 12 experiments, helping 500+ founders"
2. Badges/achievements: "Early Contributor", "Data Champion (50+ experiments)", "Pattern Pioneer"
3. Leaderboard (optional, privacy-conscious): Top anonymous contributors by experiment count
4. Impact visualization: "Your data improved response rate predictions by 3%"
5. Thank you messaging: "Thanks for logging outcomes! This helps everyone succeed."
6. Contribution streaks: "7-day streak of logging outcomes"
7. Incentive consideration: Extra features or credit for high-quality contributors (test carefully)
8. Privacy-first: All recognition is anonymous or opt-in only

**Technical Notes:**
- User contributions table tracking experiment count, quality score
- Badge system with unlock criteria
- Gamification UI components (progress bars, badges, animations)
- Test impact on data quality and opt-in rates
- Ensure gamification doesn't encourage fake data

---

### Story 3.7: Privacy Dashboard and Data Controls

**As a** privacy-conscious user
**I want to** understand and control what data is collected
**So that** I trust the platform with my experiment data

**Prerequisites:**
- Story 3.1 complete (data collection)

**Acceptance Criteria:**
1. Privacy dashboard showing: What data is collected, how it's used, who has access
2. Data export: One-click download of all personal data in JSON format (GDPR right to access)
3. Data deletion: Request permanent deletion with confirmation (GDPR right to erasure)
4. Opt-out controls: Toggle data collection on/off at any time
5. Anonymization status: Show which data has been anonymized for pattern analysis
6. Data retention policy: Clear timeline for how long data is stored
7. Third-party sharing: List of any third parties (should be: NONE for experiment data)
8. Privacy policy linked and easy to understand (plain language, not legalese)

**Technical Notes:**
- Privacy dashboard page with data visualization
- Export feature: Query user data, format as JSON, trigger download
- Deletion workflow: Soft delete → anonymization after 30 days → hard delete after 90 days
- Audit log of data access and modifications
- GDPR compliance review with legal counsel

---

### Story 3.8: Network Intelligence Analytics Dashboard

**As a** product owner
**I want to** monitor network intelligence health and growth
**So that** I can validate the data moat is building as planned

**Prerequisites:**
- All Epic 3 stories complete

**Acceptance Criteria:**
1. Dashboard shows: Total experiments, opt-in rate, pattern count, prediction accuracy
2. Growth metrics: Experiments per week, data quality score (completeness)
3. Pattern library growth: New patterns discovered over time
4. User engagement with insights: % of users referencing insights before messaging
5. Prediction model performance: Accuracy, precision, recall trending over time
6. Competitive moat indicator: "Impossible to replicate score" based on unique data volume
7. Data quality breakdown: % complete experiments (outcome logged) vs. incomplete
8. Recommendations: Insights to improve data collection and opt-in rates

**Technical Notes:**
- Custom analytics dashboard
- Data quality scoring algorithm
- Model performance tracking integrated with MLOps tools
- Competitive moat calculation (heuristic based on experiment volume and pattern uniqueness)

---

### Story 3.9: Epic 3 Validation Dashboard

**As a** product owner
**I want to** validate Epic 3 success and readiness for scale phase
**So that** I can confirm the network intelligence moat is established

**Prerequisites:**
- All Epic 3 stories complete
- Minimum 6 months of operation

**Acceptance Criteria:**
1. Dashboard displays Epic 3 metrics with GREEN/YELLOW/RED zones
2. Experiments logged: Target 500+ (GREEN), 300-500 (YELLOW), <300 (RED)
3. Data opt-in rate: Target >70% (GREEN), 50-70% (YELLOW), <50% (RED)
4. Pattern differentiation: Target measurable differences (GREEN), marginal (YELLOW), none (RED)
5. Insight usage: Target >40% reference insights (GREEN), 20-40% (YELLOW), <20% (RED)
6. Prediction accuracy: Target >70% (GREEN), 60-70% (YELLOW), <60% (RED)
7. Competitive moat assessment: "Strong" (competitors need 12+ months to replicate) vs. "Weak"
8. Recommendation: "SCALE TO GROWTH PHASE", "ITERATE DATA COLLECTION", or "RECONSIDER PILLAR 3"

**Technical Notes:**
- Comprehensive analytics dashboard
- Automated zone calculation
- Competitive moat scoring heuristic
- Stakeholder reporting and decision-making framework

---

## Summary and Next Steps

**Epic Completion Status:**
- Epic 1: 10-12 stories defined ✓
- Epic 2: 12-16 stories defined ✓
- Epic 3: 8-12 stories defined ✓

**Total Story Count:** 30-40 user stories across 14-20 weeks

**Next Actions:**
1. **Architecture Phase:** Handoff to technical architect for system design, database schema, API specifications
2. **Story Refinement:** Detailed estimation, dependency mapping, sprint planning
3. **Epic 1 Kickoff:** Begin development on Magical Reddit Extraction Engine
4. **Validation Checkpoints:** Epic 1 GREEN zone before Epic 2, Epic 2 >10% send rate before Epic 3

**Critical Path:**
Epic 1 (Weeks 1-8) → Validation Gate → Epic 2 (Weeks 9-16) → Validation Gate → Epic 3 (Weeks 17-24)

Each validation gate has explicit GREEN/YELLOW/RED criteria to prevent wasteful investment in features that don't deliver value.

---

_This epic breakdown provides the detailed story mapping required for development sprint planning and technical architecture design._
