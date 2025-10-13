# Technical Specification - Epic 1: Magical Reddit Extraction Engine

**Project:** startup-sniff
**Epic ID:** Epic 1
**Timeline:** Weeks 1-8 (Month 1-2)
**Author:** Benjamin
**Date:** 2025-10-13
**Status:** Ready for Implementation

---

## 1. Overview and Scope

### 1.1 Epic Goal

Create the "holy shit moment" that compresses 10-30 hours of manual Reddit browsing into 10 minutes of intelligent analysis, earning user trust before monetization. This epic establishes the free tier value proposition that will drive viral growth and validate product-market fit.

**Key Success Metrics:**
- Average session time >2 minutes (GREEN zone)
- 7-day return rate >25% (GREEN zone)
- Pain points explored per session >2 (GREEN zone)
- Bounce rate <60% (GREEN zone)

### 1.2 Objectives and Scope

**In Scope:**
- Cross-subreddit pain point aggregation from 15+ hardcoded subreddits
- AI commercial viability scoring using GPT-4 (1-10 scale with explanation)
- Trend detection and frequency analysis (weekly comparison)
- Search and filtering capabilities (subreddit, timeframe, score, trend status, keywords)
- Pain point detail views with AI analysis breakdown and related discussions
- Fast, magical UI experience (<2s page load, skeleton screens, no signup wall)
- User registration and basic onboarding (email/password + OAuth)
- Analytics and engagement tracking (session duration, funnel, return rate)
- Mobile-responsive experience (320px-1920px viewports)
- Performance optimization (4-hour Reddit caching, 24-hour OpenAI caching)
- Error handling and graceful degradation (API failures, network timeouts)
- Validation dashboard (GREEN/YELLOW/RED zone tracking)

**Out of Scope (Epic 2+):**
- Human contact discovery (paid tier feature)
- Reddit OAuth for messaging (Epic 2)
- Message templates and conversation tracking (Epic 2)
- Network intelligence and pattern recognition (Epic 3)
- Subscription management (Epic 2)

### 1.3 System Architecture Alignment

This epic implements the **Pillar 1: Reddit Extraction Engine** within the existing Next.js 15 + Supabase architecture.

**Primary Components:**
- `modules/reddit/` - Reddit API integration, OAuth, post fetching, caching
- `modules/ai/` - OpenAI integration, viability scoring, cost tracking
- `app/(marketing)/` - Landing page (SSG)
- `app/(dashboard)/dashboard/generate/` - Pain point exploration UI (SSR)
- `modules/auth/` - User registration, session management
- `modules/usage/` - Free tier quota enforcement

**Database Tables:**
- `reddit_posts` - Cached pain points with analysis metadata
- `users` - User accounts (plan_type: free)
- `usage_limits` - Free tier quotas (5 ideas/month)

**External Dependencies:**
- Reddit API (REST + OAuth 2.0)
- OpenAI API (GPT-4 Turbo + text-embedding-ada-002)
- Redis (Upstash) - Caching layer
- Vercel Analytics - Product analytics

---

## 2. Detailed Design

### 2.1 Services and Modules

| Service/Module | Responsibility | Inputs | Outputs | Owner |
|----------------|----------------|--------|---------|-------|
| **reddit/services/api.ts** | Reddit API client, rate limiting, caching | Subreddit list, search query, timeframe | Array of RedditPost objects | Backend |
| **reddit/services/cache.ts** | Redis caching layer for Reddit data | Cache key, TTL, data | Cached or fresh data | Backend |
| **reddit/actions/fetch-posts.ts** | Server action to fetch pain points | Filters (subreddits, timeframe) | Paginated pain point list | Backend |
| **ai/services/viability-scorer.ts** | GPT-4 commercial viability scoring | Reddit post (title, content, metadata) | Viability score (1-10), explanation | Backend |
| **ai/services/trend-analyzer.ts** | Frequency analysis and trend detection | Historical post data, time window | Trend metrics (↑↓→, frequency, %change) | Backend |
| **app/(dashboard)/dashboard/generate/page.tsx** | Main pain point exploration UI | User session, filters | Rendered pain point feed | Frontend |
| **components/features/reddit-search.tsx** | Search and filter UI component | Filter state, pain point data | Interactive filter panel | Frontend |
| **components/features/pain-point-card.tsx** | Individual pain point card | RedditPost with viability score | Card UI with score badge, trend | Frontend |
| **components/features/pain-point-detail.tsx** | Modal detail view | Post ID | Full post details, AI analysis | Frontend |
| **modules/auth/actions/signup.ts** | User registration server action | Email, password, name | User session, redirect to dashboard | Backend |
| **modules/usage/actions/track-usage.ts** | Free tier usage tracking | User ID, action type | Updated usage limits | Backend |
| **lib/services/analytics.ts** | Vercel Analytics event tracking | Event name, properties | Event logged | Backend |

### 2.2 Data Models

#### reddit_posts (Enhanced from Architecture)

```typescript
// types/supabase.ts extension
export interface RedditPost {
  id: string                        // UUID primary key
  reddit_id: string                 // Reddit post ID (unique)
  subreddit: string                 // Source subreddit (indexed)
  author: string                    // Reddit username
  title: string                     // Post title (full-text searchable)
  content: string | null            // Post self-text
  url: string | null                // External URL if link post
  score: number                     // Upvotes (engagement metric)
  comments: number                  // Comment count (engagement metric)
  created_utc: string               // Post timestamp (indexed DESC)
  hash: string                      // Deduplication hash (indexed unique)

  // AI Analysis Fields
  sentiment: number | null          // -1.00 to 1.00 (GPT-4 sentiment)
  viability_score: number | null    // 1-10 commercial viability (NEW)
  viability_explanation: string | null // 2-3 sentence explanation (NEW)
  intent_flags: string[]            // ['pain_point', 'feature_request', 'complaint']
  analysis_data: Json | null        // {urgency, buying_signals, market_size_estimate}

  // Trend Analysis Fields (NEW)
  weekly_frequency: number | null   // Mentions this week
  trend_direction: 'up' | 'down' | 'stable' | null // Trend indicator
  trend_percentage: number | null   // Week-over-week % change
  is_emerging: boolean | null       // >50% growth + <10 mentions

  // Metadata
  processed_at: string | null       // AI processing timestamp
  created_at: string                // Record creation
  updated_at: string                // Last update
}
```

**New Indexes for Epic 1:**
```sql
-- Performance indexes for filtering
CREATE INDEX idx_reddit_posts_viability_score ON reddit_posts(viability_score DESC) WHERE viability_score IS NOT NULL;
CREATE INDEX idx_reddit_posts_trend_direction ON reddit_posts(trend_direction);
CREATE INDEX idx_reddit_posts_created_utc_subreddit ON reddit_posts(created_utc DESC, subreddit);

-- Full-text search index (PostgreSQL tsvector)
ALTER TABLE reddit_posts ADD COLUMN search_vector tsvector;
CREATE INDEX idx_reddit_posts_search ON reddit_posts USING GIN(search_vector);

-- Update trigger for search_vector
CREATE TRIGGER update_reddit_posts_search_vector
BEFORE INSERT OR UPDATE ON reddit_posts
FOR EACH ROW EXECUTE FUNCTION
  tsvector_update_trigger(search_vector, 'pg_catalog.english', title, content);
```

#### users (No changes from Architecture)

Free tier users only in Epic 1. `plan_type` defaults to 'free'.

#### usage_limits (Free tier quotas)

```typescript
export interface UsageLimits {
  id: string
  user_id: string
  plan_type: 'free' | 'pro_monthly' | 'pro_yearly'
  monthly_limit_ideas: number       // Free: 5, Pro: 50
  monthly_limit_validations: number // Free: 0, Pro: unlimited
  ideas_generated: number           // Current count
  validations_completed: number     // Epic 2 feature
  reset_date: string                // Monthly reset timestamp
  created_at: string
  updated_at: string
}
```

**Free Tier Defaults:**
- `monthly_limit_ideas`: 5 (can explore unlimited pain points, generate 5 ideas)
- `monthly_limit_validations`: 0 (Epic 2 paid feature)

### 2.3 APIs and Interfaces

#### Server Actions (Next.js App Router)

```typescript
// modules/reddit/actions/fetch-posts.ts
export async function fetchRedditPostsAction(
  filters: {
    subreddits?: string[]          // Multi-select filter
    timeframe?: '24h' | '7d' | '30d' // Default: '7d'
    minScore?: number               // Minimum viability score (1-10)
    trendStatus?: ('emerging' | 'trending_up' | 'stable' | 'declining')[]
    searchQuery?: string            // Keyword search
    page?: number                   // Pagination (default: 1)
    limit?: number                  // Results per page (default: 50)
  }
): Promise<{
  posts: RedditPost[]
  totalCount: number
  hasNextPage: boolean
}>

// modules/reddit/actions/get-post-detail.ts
export async function getPostDetailAction(
  postId: string
): Promise<{
  post: RedditPost
  similarPosts: RedditPost[]      // 3-5 related posts
  topComments: Array<{            // Top 3 relevant comments
    author: string
    body: string
    score: number
  }>
}>

// modules/ai/actions/generate-idea.ts (Triggered when user converts pain point to idea)
export async function generateIdeaAction(
  postId: string
): Promise<{
  idea: StartupIdea
  usageRemaining: number          // Ideas left this month
}>

// modules/auth/actions/signup.ts
export async function signUpAction(
  data: {
    email: string
    password: string
    fullName: string
    experienceLevel?: 'first_timer' | 'experienced'
    goals?: string[]
  }
): Promise<{
  success: boolean
  user?: User
  error?: string
}>
```

#### API Routes (External Integrations)

```typescript
// app/api/reddit/fetch/route.ts (Background job trigger)
POST /api/reddit/fetch
Request: { subreddits: string[], force?: boolean }
Response: { postsProcessed: number, cacheUpdated: boolean }
Auth: API key (Vercel Cron)

// app/api/analytics/track/route.ts
POST /api/analytics/track
Request: { event: string, properties: Record<string, any> }
Response: { tracked: boolean }
Auth: Session cookie
```

#### Reddit API Integration

```typescript
// lib/services/reddit-api.ts
class RedditAPIClient {
  // Fetch posts from multiple subreddits
  async fetchPostsBatch(
    subreddits: string[],
    params: {
      timeframe: 'day' | 'week' | 'month'
      limit: number
      sort: 'hot' | 'top' | 'new'
    }
  ): Promise<RedditPost[]>

  // Search posts by keyword
  async searchPosts(
    subreddit: string,
    query: string,
    params: { timeframe: string, limit: number }
  ): Promise<RedditPost[]>

  // Fetch post comments
  async fetchComments(
    postId: string,
    limit: number
  ): Promise<Comment[]>
}
```

**Rate Limiting:**
- 60 requests/minute per application (Reddit API limit)
- 4-hour cache TTL reduces API calls by 90%+
- Background job fetches data every 4 hours (not user-triggered)

#### OpenAI API Integration

```typescript
// lib/services/openai-api.ts
class OpenAIClient {
  // Generate viability score (batch processing)
  async scoreViabilityBatch(
    posts: Array<{ title: string, content: string, metadata: any }>
  ): Promise<Array<{
    score: number         // 1-10
    explanation: string   // 2-3 sentences
    confidence: number    // 0.0-1.0
  }>>

  // Extract sentiment and urgency
  async analyzeSentiment(
    text: string
  ): Promise<{
    sentiment: number     // -1.0 to 1.0
    urgency: 'low' | 'medium' | 'high'
    buyingSignals: string[]
  }>

  // Find similar posts (embeddings)
  async findSimilar(
    postId: string,
    limit: number
  ): Promise<string[]>    // Post IDs
}
```

**Cost Controls:**
- GPT-4 Turbo: $0.01/1K input tokens, $0.03/1K output tokens
- Target: <$3 per 100 pain points scored
- 24-hour cache TTL for scores
- Batch processing (max 20 concurrent requests)
- Monthly budget cap: $500 (alert at 80% threshold)

### 2.4 Workflows and Sequencing

#### Pain Point Discovery Flow

```
1. User lands on dashboard (/dashboard/generate)
   ↓
2. Server fetches cached pain points (Redis → PostgreSQL)
   - Query: SELECT * FROM reddit_posts
     WHERE created_utc > NOW() - INTERVAL '7 days'
     AND viability_score IS NOT NULL
     ORDER BY created_utc DESC, score DESC
     LIMIT 50
   ↓
3. Client renders pain point cards (skeleton → data)
   - Each card shows: title, subreddit, score, viability badge, trend indicator
   ↓
4. User applies filters (client-side or server-side)
   - Subreddit multi-select → Re-query with WHERE subreddit IN (...)
   - Viability score slider → WHERE viability_score >= minScore
   - Keyword search → WHERE search_vector @@ to_tsquery(query)
   ↓
5. User clicks card → Detail modal opens
   - Fetch post detail (server action)
   - Show full content, AI analysis, similar posts, top comments
   ↓
6. User decides to generate idea
   - Trigger generateIdeaAction(postId)
   - Check usage quota (usePlanLimits hook)
   - If quota exceeded → Upgrade prompt
   - If quota available → Generate idea, decrement quota
   ↓
7. Idea saved to startup_ideas table
   - Redirect to /dashboard/ideas/{ideaId}
```

#### Background Data Refresh Flow

```
Every 4 hours (Vercel Cron):

1. Trigger: POST /api/reddit/fetch
   ↓
2. Fetch posts from 15 subreddits in parallel
   - Use Reddit API: GET /r/{subreddit}/top?t=week&limit=100
   ↓
3. Deduplicate posts (hash-based)
   - Calculate hash: md5(reddit_id)
   - Skip if hash exists in database
   ↓
4. Store new posts in reddit_posts table
   - Set processed_at = NULL (pending AI analysis)
   ↓
5. Trigger AI analysis (batch)
   - Select posts WHERE processed_at IS NULL LIMIT 100
   - Call OpenAI scoreViabilityBatch()
   - Update viability_score, viability_explanation, sentiment
   - Set processed_at = NOW()
   ↓
6. Calculate trend metrics (weekly job)
   - Group posts by subreddit, week
   - Calculate weekly_frequency (COUNT)
   - Calculate trend_direction (compare to previous week)
   - Update trend_percentage, is_emerging flag
   ↓
7. Invalidate Redis cache
   - DEL redis:reddit_posts:*
   ↓
8. Log job completion
   - Store in job_logs table for monitoring
```

---

## 3. Non-Functional Requirements

### 3.1 Performance

**Latency Targets (from PRD):**
- Initial page load: <2 seconds on 4G connection (LCP <2.5s)
- Cross-subreddit search: <5 seconds for 15+ subreddits (95th percentile)
- API response times: <500ms for 95th percentile
- Pain point detail view: <1 second to interactive

**Optimization Strategies:**
- Redis caching: 4-hour TTL for Reddit posts (reduces API calls by 90%)
- Database indexes: subreddit, created_utc, viability_score, search_vector
- Next.js SSR with streaming: Progressive hydration for faster perceived performance
- Code splitting: Lazy load detail modal, charts (reduce initial bundle by 30%)
- Image optimization: WebP format, lazy loading, responsive srcset

**Performance Budget:**
- First Load JS: <100KB (critical path)
- Total JS: <300KB (entire app)
- Lighthouse Performance: >90 score

### 3.2 Security

**Authentication & Authorization:**
- Supabase Auth: Email/password with argon2 hashing
- Session management: HttpOnly cookies (SameSite=Lax)
- CSRF protection: Double-submit cookie pattern
- RLS policies: Users can only access own data

**Data Protection:**
- HTTPS-only (enforced by Vercel)
- Environment variables encrypted at rest
- No sensitive data in client bundles (API keys server-side only)
- Rate limiting: 60 req/min per user (Redis-based)

**Input Validation:**
- Zod schemas on all server actions
- Sanitize user input before database queries (prevent SQL injection)
- Escape HTML in user-generated content (prevent XSS)

### 3.3 Reliability

**Availability:**
- Target: 99.5% uptime (Vercel SLA: 99.99%)
- Graceful degradation: Serve stale cache if Reddit API unavailable
- Error boundaries: Catch React errors, show user-friendly fallback

**Data Integrity:**
- Deduplication: Hash-based (prevent duplicate posts)
- Transaction safety: Use database transactions for multi-table updates
- Backup strategy: Supabase automated daily backups, point-in-time recovery

**Fault Tolerance:**
- Retry logic: Exponential backoff for Reddit API failures (3 retries)
- Circuit breaker: Stop calling failing services after 5 consecutive errors
- Fallback: Show cached data with banner "Data may be stale"

### 3.4 Observability

**Logging:**
- Structured logging: JSON format with context (user_id, action, timestamp)
- Log levels: ERROR (always), WARN (API failures), INFO (key events), DEBUG (dev only)
- Centralized logs: Vercel logs (short-term), consider Better Stack (long-term)

**Metrics:**
- Vercel Analytics: Page views, Core Web Vitals (LCP, FID, CLS)
- Custom metrics: Pain points viewed, filters applied, ideas generated
- API cost tracking: OpenAI spend per day/week/month vs. budget

**Tracing:**
- Error tracking: Sentry for production errors with context
- Performance monitoring: Vercel Speed Insights for real user metrics
- User journey tracking: Funnel analysis (landing → exploration → signup → return)

**Alerts:**
- Critical: API failures >5 consecutive, database errors, 500 errors >10/min
- Warning: OpenAI cost >$400/month (80% of budget), cache miss rate >20%
- Info: Weekly summary email with key metrics

---

## 4. Dependencies and Integrations

### 4.1 External Dependencies

**Reddit API (v1):**
- Documentation: https://www.reddit.com/dev/api
- Authentication: OAuth 2.0 (application-only in Epic 1, user OAuth in Epic 2)
- Rate Limits: 60 requests/minute per application
- Endpoints Used:
  - `GET /r/{subreddit}/top` - Top posts by timeframe
  - `GET /r/{subreddit}/search` - Search posts by keyword
  - `GET /r/{subreddit}/comments/{postId}` - Fetch post comments
- Error Handling: 429 (rate limit) → Exponential backoff, 503 (service unavailable) → Serve cache

**OpenAI API:**
- Models: GPT-4 Turbo (gpt-4-turbo-preview), text-embedding-ada-002
- Authentication: API key (OPENAI_API_KEY environment variable)
- Rate Limits: 10,000 requests/min (Tier 2), 500 tokens/min per model
- Cost: ~$0.01 per viability score (2K input tokens, 200 output tokens)
- Error Handling: 429 (rate limit) → Queue for retry, 500 → Skip scoring, log error

**Redis (Upstash):**
- Use Case: Caching Reddit posts, rate limiting
- Connection: UPSTASH_REDIS_URL environment variable
- TTL Strategy: 4 hours for Reddit data, 1 hour for rate limits
- Persistence: In-memory with periodic snapshots

**Vercel Analytics:**
- Package: @vercel/analytics (v1.5.0)
- Integration: Single-line in root layout
- Data: Automatic page views, custom events, Core Web Vitals
- Privacy: GDPR-compliant, no cookies

### 4.2 Internal Dependencies (Shared Modules)

**From Solution Architecture:**

| Dependency | Version | Usage in Epic 1 |
|------------|---------|-----------------|
| Next.js | 15.5.2 | App Router, SSR, API routes |
| React | 19.1.0 | UI components, hooks |
| TypeScript | 5.x | Type safety across codebase |
| Supabase | Latest | Database, Auth, RLS |
| @supabase/supabase-js | 2.56.1 | Database client |
| @supabase/ssr | 0.7.0 | Session management |
| Tailwind CSS | 4.1.14 | Styling, design system |
| shadcn/ui | Latest | UI components (Button, Card, Dialog) |
| ioredis | 5.7.0 | Redis client for caching |
| OpenAI | 5.16.0 | GPT-4 API client |
| zod | 3.25.76 | Schema validation |
| date-fns | 4.1.0 | Date formatting, calculations |
| recharts | 2.15.4 | Trend charts (sparklines) |
| lucide-react | 0.542.0 | Icons |
| framer-motion | 12.23.12 | Animations (card transitions) |

**Shared Modules:**
- `modules/auth/` - User registration, session validation
- `modules/usage/` - Free tier quota enforcement
- `lib/supabase/server.ts` - Supabase server client
- `lib/services/redis.ts` - Redis caching utilities
- `components/ui/` - shadcn/ui base components

---

## 5. Acceptance Criteria and Traceability

### 5.1 Story-Level Acceptance Criteria

#### Story 1.1: Cross-Subreddit Pain Point Aggregation

1. ✅ System fetches posts from 15+ subreddits in parallel within 5 seconds (95th percentile)
2. ✅ Posts from last 7 days displayed, sorted by recency and engagement (upvotes + comments)
3. ✅ Each pain point shows: subreddit source, title, excerpt, author, upvotes, comments, timestamp
4. ✅ Minimum 50 pain points displayed on initial load with infinite scroll or pagination
5. ✅ Results cached for 4 hours to optimize Reddit API usage and performance
6. ✅ Loading states display skeleton screens, not blank pages
7. ✅ Mobile-responsive grid layout works on 320px minimum viewport

**Test Coverage:**
- Unit: RedditAPIClient.fetchPostsBatch() returns expected data structure
- Integration: Background job fetches and stores posts in database
- E2E: User sees 50+ pain points on dashboard within 5 seconds

#### Story 1.2: AI Commercial Viability Scoring

1. ✅ Each pain point displays a viability score (1-10 scale) with visual indicator (1-4 red, 5-7 yellow, 8-10 green)
2. ✅ Score includes brief explanation (2-3 sentences) highlighting key factors
3. ✅ Example: "7/10 - High urgency, 12 mentions of willingness to pay, specific pain point"
4. ✅ Scores generated on first fetch and cached for 24 hours
5. ✅ Total OpenAI cost per 100 pain points < $3
6. ✅ Batch processing of scores to optimize API usage (max 20 concurrent requests)
7. ✅ Graceful degradation if OpenAI API unavailable: show cached scores or "Score pending"
8. ✅ Users can expand to see detailed analysis breakdown

**Test Coverage:**
- Unit: OpenAIClient.scoreViabilityBatch() returns scores with explanations
- Integration: Background job processes unscored posts in batches
- Performance: OpenAI cost tracking logs expense per 100 posts

#### Story 1.3: Trend Detection and Frequency Analysis

1. ✅ Each pain point displays frequency metric: "Mentioned 47 times this week"
2. ✅ Trend indicator shows directional change: "Trending up 23%" with arrow
3. ✅ Trend calculation compares current week vs. previous week mention frequency
4. ✅ Visual sparkline chart shows last 4 weeks of activity (optional enhancement)
5. ✅ Ability to sort pain points by trend velocity (fastest growing first)
6. ✅ "Emerging" tag appears on pain points with >50% growth and <10 total mentions
7. ✅ Data visualization loads without blocking page render (progressive enhancement)

**Test Coverage:**
- Unit: Trend calculation function returns correct % change
- Integration: Weekly job updates trend metrics for all posts
- E2E: User sees trend indicators and can sort by trend

#### Story 1.4: Search and Filtering Capabilities

1. ✅ Filter by subreddit: Multi-select dropdown with post counts
2. ✅ Filter by timeframe: Radio buttons for 24h, 7d (default), 30d
3. ✅ Filter by commercial viability score: Slider for minimum threshold
4. ✅ Filter by trend status: Checkboxes for emerging/trending/stable/declining
5. ✅ Keyword search: Full-text search with highlighting
6. ✅ Filters apply instantly without page reload
7. ✅ URL parameters preserve filter state for sharing
8. ✅ "Clear all filters" button restores default view
9. ✅ Results count updates dynamically: "Showing 23 of 150 pain points"

**Test Coverage:**
- Unit: Filter logic correctly applies to dataset
- Integration: Database query uses indexes for fast filtering
- E2E: User applies filters, sees updated results, URL params update

#### Story 1.5: Pain Point Detail View

1. ✅ Clicking pain point opens detail modal or dedicated page
2. ✅ Detail view shows: full post content, author profile link, engagement metrics
3. ✅ AI analysis breakdown displayed: sentiment, urgency, buying signals, market size
4. ✅ "Similar pain points" section shows 3-5 related discussions
5. ✅ Comment highlights section shows top 3 most relevant comments
6. ✅ Time-on-page tracking for analytics
7. ✅ Mobile-optimized scrolling and navigation (swipe to next/previous)
8. ✅ "Bookmark" functionality for saving (requires auth)

**Test Coverage:**
- Unit: getSimilarPosts() returns semantically related posts
- E2E: User opens detail view, sees AI analysis, navigates to similar posts

#### Story 1.6: Fast, Magical UI Experience

1. ✅ Landing page loads in <2 seconds on 4G connection (Lighthouse >90)
2. ✅ Above-the-fold content displays live pain points immediately (<3s)
3. ✅ Skeleton screens used during data fetching
4. ✅ First 5-10 pain points load instantly from cache, remaining load progressively
5. ✅ Page transitions are smooth (60fps animations, no jank)
6. ✅ Core Web Vitals meet "Good" thresholds: LCP <2.5s, FID <100ms, CLS <0.1
7. ✅ No signup wall blocking initial exploration
8. ✅ Interactive demo or live scrolling feed on landing page

**Test Coverage:**
- Performance: Lighthouse CI checks on every deployment
- E2E: User sees content within 2 seconds (Playwright performance timing)

#### Story 1.7: User Registration and Onboarding

1. ✅ Signup flow accessible from top navigation: "Sign up free" CTA
2. ✅ Email/password signup with email verification OR OAuth (Google, GitHub)
3. ✅ Minimal onboarding form: Name, email, password, "What brings you here?" (optional)
4. ✅ No credit card required for free tier signup
5. ✅ Email verification sent within 30 seconds, account functional immediately
6. ✅ Onboarding captures: Experience level, goals
7. ✅ Privacy policy and terms acceptance checkbox (GDPR compliance)
8. ✅ Post-signup redirect to personalized dashboard
9. ✅ Welcome email with getting started guide

**Test Coverage:**
- Integration: Supabase Auth creates user record, sends verification email
- E2E: User completes signup, receives email, can log in

#### Story 1.8: Basic Analytics and Engagement Tracking

1. ✅ Track key metrics: Session duration, pain points explored, filter usage, detail clicks
2. ✅ Track funnel: Landing → Exploration → Signup → Return visit
3. ✅ 7-day return rate calculation: % of users returning within 7 days
4. ✅ Bounce rate tracking: % of users leaving within 60 seconds
5. ✅ Dashboard displays GREEN/YELLOW/RED zone status
6. ✅ Individual user activity log for support and debugging (privacy-compliant)
7. ✅ A/B testing capability for future experimentation (optional)
8. ✅ Export capability for offline analysis (CSV or API)

**Test Coverage:**
- Integration: Vercel Analytics events tracked correctly
- Analytics: Custom dashboard queries return accurate metrics

#### Story 1.9: Mobile-Responsive Experience

1. ✅ Full functionality works on viewport widths 320px - 1920px
2. ✅ Touch-optimized UI: Tap targets minimum 44x44px, swipe gestures
3. ✅ Mobile navigation: Hamburger menu or bottom tab bar
4. ✅ Filters accessible via slide-out panel or modal
5. ✅ Infinite scroll or pagination optimized for mobile
6. ✅ Pain point cards stack vertically on mobile, grid on desktop
7. ✅ Detail view full-screen on mobile with swipe-to-dismiss
8. ✅ Performance optimized: Lazy load images, minimize bundle size
9. ✅ PWA-capable: Add to home screen, works offline with cached data (optional)

**Test Coverage:**
- Visual Regression: Playwright screenshots on iPhone SE (320px), iPad (768px), Desktop (1440px)
- E2E: Touch gesture testing on mobile viewports

#### Story 1.10: Performance Optimization and Caching

1. ✅ Reddit API calls reduced by 90% through 4-hour caching
2. ✅ OpenAI API calls reduced by 95% through 24-hour caching
3. ✅ Database query optimization: All queries <100ms for 95th percentile
4. ✅ CDN caching for static assets with cache-busting on deploy
5. ✅ Redis caching layer for frequently accessed data
6. ✅ Background jobs for data refresh (not user-triggered)
7. ✅ API cost dashboard showing spend per day/week/month vs. budget
8. ✅ Graceful degradation when APIs unavailable

**Test Coverage:**
- Performance: Load testing with 100 concurrent users (k6)
- Monitoring: API cost dashboard validates <$500/month

#### Story 1.11: Error Handling and Graceful Degradation

1. ✅ Reddit API failure: Display cached pain points with banner
2. ✅ OpenAI API failure: Display pain points without scores, show "Analyzing..." placeholder
3. ✅ Network timeout: "Connection slow, still loading..." message
4. ✅ No results from filter: "No pain points match these filters. Try broadening criteria."
5. ✅ 500 errors: User-friendly message "Something went wrong" + contact support
6. ✅ Error tracking via Sentry with context (user ID, action, timestamp)
7. ✅ Automatic retry logic for transient API failures (3 retries with exponential backoff)
8. ✅ Support contact form accessible from error states

**Test Coverage:**
- Unit: Error boundary catches errors, renders fallback UI
- Integration: Retry logic tested with mock API failures

#### Story 1.12: Epic 1 Validation Dashboard

1. ✅ Dashboard displays Epic 1 metrics with GREEN/YELLOW/RED zone indicators
2. ✅ Average session time: Target >2 min (GREEN), 60-120s (YELLOW), <60s (RED)
3. ✅ 7-day return rate: Target >25% (GREEN), 15-25% (YELLOW), <15% (RED)
4. ✅ Pain points explored per session: Target >2 (GREEN), 1-2 (YELLOW), <1 (RED)
5. ✅ Bounce rate: Target <60% (GREEN), 60-75% (YELLOW), >75% (RED)
6. ✅ User feedback survey results: Sentiment analysis
7. ✅ Recommendation: "PROCEED TO EPIC 2", "ITERATE FOR 2 WEEKS", or "PIVOT/KILL"
8. ✅ Exportable report for stakeholder review (PDF or Google Docs)

**Test Coverage:**
- Analytics: Validation dashboard queries calculate zones correctly
- E2E: Admin user views dashboard, sees accurate metrics

### 5.2 Traceability Matrix

| Acceptance Criteria | Spec Section | Component/API | Test Strategy |
|---------------------|--------------|---------------|---------------|
| AC 1.1.1: Fetch 15+ subreddits in <5s | 2.3 APIs, 3.1 Performance | reddit/services/api.ts | Performance test: Load testing with 15 parallel requests |
| AC 1.1.2: Sort by recency + engagement | 2.2 Data Models, 2.4 Workflows | fetchRedditPostsAction | Integration test: Query returns correct ORDER BY |
| AC 1.1.3: Display post metadata | 2.1 Services, 2.2 Data Models | pain-point-card.tsx | E2E test: Card shows all required fields |
| AC 1.2.1: Viability score 1-10 with color | 2.2 Data Models, 2.3 APIs | ai/services/viability-scorer.ts | Unit test: Score in range 1-10, explanation generated |
| AC 1.2.5: Cost <$3 per 100 posts | 3.1 Performance, 4.1 Dependencies | OpenAIClient.scoreViabilityBatch() | Monitoring: Cost tracking dashboard |
| AC 1.3.2: Trend indicator with % change | 2.2 Data Models, 2.4 Workflows | ai/services/trend-analyzer.ts | Unit test: Calculate correct % change |
| AC 1.4.1-9: All filter types functional | 2.3 APIs, 2.4 Workflows | reddit-search.tsx, fetchRedditPostsAction | E2E test: Apply each filter, verify results |
| AC 1.5.4: Similar posts (3-5) | 2.3 APIs, 4.1 Dependencies | getPostDetailAction, OpenAIClient | Integration test: Embedding similarity query |
| AC 1.6.1: Page load <2s, Lighthouse >90 | 3.1 Performance | app/(marketing)/(home)/page.tsx | Performance test: Lighthouse CI on every deploy |
| AC 1.6.6: Core Web Vitals "Good" | 3.1 Performance | All pages | Monitoring: Vercel Analytics tracks LCP/FID/CLS |
| AC 1.7.2: Email/password + OAuth signup | 2.1 Services, 4.2 Dependencies | modules/auth/actions/signup.ts | E2E test: Complete signup flow, verify session |
| AC 1.8.3: 7-day return rate calculation | 3.4 Observability | lib/services/analytics.ts | Analytics test: Calculate return rate from events |
| AC 1.9.1: Works on 320px-1920px | 3.1 Performance, UX Spec | All components | Visual regression: Playwright screenshots |
| AC 1.10.1: 90% API call reduction | 3.1 Performance, 4.1 Dependencies | reddit/services/cache.ts | Monitoring: Redis cache hit rate >90% |
| AC 1.11.6: Sentry error tracking | 3.4 Observability | Error boundaries | Integration test: Trigger error, verify Sentry event |
| AC 1.12.1-7: Validation dashboard zones | 3.4 Observability, 5.1 AC | Validation dashboard page | E2E test: Dashboard displays correct zone colors |

---

## 6. Risks, Assumptions, and Questions

### 6.1 Risks

**Risk 1: Reddit API Rate Limiting**
- **Description**: Reddit API has 60 requests/minute limit. Fetching 15 subreddits with 100 posts each = 1,500 posts might exceed limit during peak usage.
- **Mitigation**:
  - Background job fetches data every 4 hours (not user-triggered)
  - 4-hour cache TTL reduces API calls to <10 per hour
  - Exponential backoff on 429 errors
  - Circuit breaker after 5 consecutive failures
- **Severity**: Medium (mitigated by caching)

**Risk 2: OpenAI API Costs**
- **Description**: GPT-4 Turbo costs $0.01 per 1K input tokens. Scoring 1,000 posts/day = $30/day = $900/month (exceeds $500 budget).
- **Mitigation**:
  - 24-hour cache TTL for scores (re-score only if post content changes)
  - Process only new posts (WHERE processed_at IS NULL)
  - Budget alerts at 80% threshold
  - Consider GPT-3.5 Turbo for cost reduction (test quality first)
- **Severity**: High (requires active monitoring)

**Risk 3: Supabase Free Tier Limits**
- **Description**: Free tier limits: 500MB database, 2GB bandwidth/month. 1,000 posts/day with full content = ~50MB/day = 1.5GB/month (may exceed).
- **Mitigation**:
  - Text compression for post content (GZIP)
  - Rotate old posts after 90 days (keep only aggregated metrics)
  - Monitor database size via Supabase dashboard
  - Upgrade to Pro tier ($25/month) if needed
- **Severity**: Low (can upgrade easily)

**Risk 4: Low User Engagement (Epic 1 Validation Failure)**
- **Description**: Users may not find enough value in free tier to return. If 7-day return rate <15% (RED zone), Epic 2 investment is risky.
- **Mitigation**:
  - A/B test landing page messaging to emphasize "holy shit moment"
  - Add onboarding tooltips to guide first-time users
  - Email drip campaign (Day 1, 3, 7) to re-engage
  - Iterate on AI scoring quality based on user feedback
- **Severity**: High (critical validation gate)

### 6.2 Assumptions

**Assumption 1**: Reddit API stability
- **Validation**: Monitor Reddit API status page, implement circuit breaker
- **Fallback**: If Reddit API unreliable, consider scraping (legal review required)

**Assumption 2**: GPT-4 viability scoring quality
- **Validation**: Manual review of 100 scores, user feedback ("Was this score accurate?")
- **Fallback**: Iterate on prompts, consider hybrid AI + rule-based scoring

**Assumption 3**: 15 hardcoded subreddits cover most founder pain points
- **Validation**: User feedback on subreddit coverage, track "No results" filter states
- **Fallback**: Allow user-suggested subreddits (Epic 2 feature)

**Assumption 4**: Free tier users will tolerate ads or upgrade prompts
- **Validation**: A/B test upgrade prompt frequency and placement
- **Fallback**: Reduce upgrade prompts if causing high churn

### 6.3 Open Questions

**Q1**: Should we implement full-text search client-side (Fuse.js) or server-side (PostgreSQL tsvector)?
- **Decision Needed By**: Week 2 (Story 1.4 implementation)
- **Implications**: Client-side = faster UX, server-side = more scalable
- **Recommendation**: Start server-side (PostgreSQL tsvector), optimize later if needed

**Q2**: Should detail modal be a modal or a dedicated page (/dashboard/pain-point/{id})?
- **Decision Needed By**: Week 3 (Story 1.5 implementation)
- **Implications**: Modal = better mobile UX, dedicated page = better SEO, shareable links
- **Recommendation**: Dedicated page with modal-like UI for mobile

**Q3**: What's the minimum sample size for trend "emerging" tag to avoid misleading users?
- **Decision Needed By**: Week 3 (Story 1.3 implementation)
- **Implications**: Too low = false positives, too high = missed opportunities
- **Recommendation**: 10 mentions minimum (from AC), iterate based on feedback

**Q4**: Should we implement PWA (offline support) in Epic 1 or defer to Epic 3?
- **Decision Needed By**: Week 6 (Story 1.9 implementation)
- **Implications**: PWA adds complexity but improves mobile retention
- **Recommendation**: Defer to Epic 3 (focus on core value first)

---

## 7. Test Strategy

### 7.1 Test Levels

**Unit Tests (70% coverage target):**
- All business logic in `modules/` and `lib/services/`
- Focus areas: RedditAPIClient, OpenAIClient, trend calculation, filter logic
- Framework: Vitest (faster than Jest, native ESM)
- Mock external APIs (Reddit, OpenAI) with MSW (Mock Service Worker)

**Integration Tests:**
- Database queries with real Supabase connection (local instance)
- Server actions with Next.js test environment
- Background jobs (Vercel Cron simulation)
- Focus: Data flow from API → Database → UI

**End-to-End Tests (Playwright):**
- Critical user journeys:
  1. Landing → Explore pain points → Filter → Detail view
  2. Signup → Dashboard → Generate idea (quota enforcement)
  3. Mobile: Touch gestures, responsive layouts
- Performance testing: Lighthouse CI on every deployment
- Visual regression: Screenshot comparison on key viewports

**Load Testing (k6):**
- Simulate 100 concurrent users exploring pain points
- Target: <5s response time for 95th percentile
- Redis cache hit rate >90%

### 7.2 Test Coverage

| Story | Unit Tests | Integration Tests | E2E Tests |
|-------|------------|-------------------|-----------|
| 1.1 Cross-Subreddit Aggregation | RedditAPIClient methods | Background job fetches posts | User sees 50+ pain points |
| 1.2 AI Viability Scoring | OpenAIClient.scoreViability() | Batch scoring job | User sees color-coded scores |
| 1.3 Trend Detection | Trend calculation function | Weekly trend update job | User sorts by trend |
| 1.4 Search and Filtering | Filter logic (client-side) | Database query with filters | User applies filters, sees results |
| 1.5 Pain Point Detail | getSimilarPosts() logic | Fetch post + comments | User opens detail modal |
| 1.6 Fast UI | N/A (performance test) | N/A | Lighthouse CI >90 score |
| 1.7 User Registration | Password hashing | Supabase Auth integration | User completes signup flow |
| 1.8 Analytics Tracking | Event tracking function | Vercel Analytics API | Events appear in dashboard |
| 1.9 Mobile Responsive | N/A (visual test) | N/A | Playwright mobile viewports |
| 1.10 Performance Optimization | Cache logic (Redis) | Cache hit/miss rates | Load test: 100 concurrent users |
| 1.11 Error Handling | Error boundary component | Retry logic with mock failures | User sees error message |
| 1.12 Validation Dashboard | Metric calculation logic | Analytics queries | Admin views dashboard |

### 7.3 Edge Cases and Error Scenarios

**Reddit API Failures:**
- 429 Rate Limit: Exponential backoff, retry after 60s
- 503 Service Unavailable: Serve stale cache, banner "Data may be stale"
- 404 Subreddit Not Found: Skip subreddit, log warning
- Invalid JSON response: Log error, skip post

**OpenAI API Failures:**
- 429 Rate Limit: Queue for retry, show "Score pending"
- 500 Internal Error: Skip scoring, log error, alert if >10 consecutive failures
- Timeout (>30s): Cancel request, retry once
- Invalid response format: Log error, skip post

**Database Failures:**
- Connection timeout: Retry 3 times, show "Service unavailable" error
- Constraint violation: Log error, skip record
- Query timeout (>5s): Cancel query, show cached results

**User Input Edge Cases:**
- Empty search query: Show all results
- Filter with zero results: "No pain points match these filters. Try broadening criteria."
- Quota exceeded (5 ideas generated): Show upgrade prompt
- Invalid email format: Client-side validation + server-side Zod validation

---

## 8. Implementation Checklist

### Week 1-2: Foundation

- [ ] Setup Reddit API credentials (application-only OAuth)
- [ ] Create `reddit_posts` table with all fields (viability_score, trend_direction, etc.)
- [ ] Add database indexes (subreddit, created_utc, viability_score, search_vector)
- [ ] Implement RedditAPIClient (fetchPostsBatch, searchPosts, fetchComments)
- [ ] Implement Redis caching layer (4-hour TTL)
- [ ] Create background job: POST /api/reddit/fetch (Vercel Cron every 4 hours)
- [ ] Test: Fetch 15 subreddits, store in database, verify deduplication

### Week 3-4: AI Scoring and Trends

- [ ] Setup OpenAI API key
- [ ] Implement OpenAIClient (scoreViabilityBatch, analyzeSentiment)
- [ ] Create background job: AI scoring for unprocessed posts
- [ ] Implement batch processing (max 20 concurrent)
- [ ] Add cost tracking (log OpenAI spend per request)
- [ ] Implement trend calculation logic (weekly comparison)
- [ ] Create weekly job: Update trend metrics (frequency, direction, %)
- [ ] Test: Verify scores cached for 24h, trends update weekly

### Week 5-6: UI and UX

- [ ] Create `/dashboard/generate` page (SSR)
- [ ] Implement `pain-point-card.tsx` component (score badge, trend indicator)
- [ ] Implement `reddit-search.tsx` filter panel (subreddit, timeframe, score, trend, keyword)
- [ ] Implement `pain-point-detail.tsx` modal (full content, AI analysis, similar posts)
- [ ] Add skeleton loading states (react-loading-skeleton)
- [ ] Implement pagination or infinite scroll (react-infinite-scroll-component)
- [ ] Mobile responsive testing (320px, 768px, 1440px viewports)
- [ ] Test: User flow from landing → exploration → detail view

### Week 7: Auth and Analytics

- [ ] Implement signup flow (email/password + OAuth with Supabase Auth)
- [ ] Create onboarding form (experience level, goals)
- [ ] Implement usage tracking (free tier quota: 5 ideas/month)
- [ ] Add Vercel Analytics tracking (page views, custom events)
- [ ] Implement validation dashboard (session time, return rate, bounce rate)
- [ ] Create admin view for analytics (GREEN/YELLOW/RED zones)
- [ ] Test: User signs up, generates idea, quota enforced

### Week 8: Polish and Validation

- [ ] Performance optimization (code splitting, image optimization, bundle analysis)
- [ ] Error handling (Reddit API failures, OpenAI failures, network timeouts)
- [ ] Sentry integration for error tracking
- [ ] Lighthouse CI setup (run on every deployment, target >90 score)
- [ ] E2E test suite (Playwright: 10+ critical scenarios)
- [ ] Load testing (k6: 100 concurrent users)
- [ ] Final validation: Check all Epic 1 acceptance criteria
- [ ] Deploy to production, monitor for 2 weeks

---

## 9. Success Metrics and Validation

**GREEN Zone (Proceed to Epic 2):**
- ✅ Average session time >2 minutes
- ✅ 7-day return rate >25%
- ✅ Pain points explored per session >2
- ✅ Bounce rate <60%
- ✅ User feedback: "Saves me hours vs. manual Reddit" (sentiment >70% positive)

**YELLOW Zone (Iterate for 2 Weeks):**
- ⚠️ Session time 60-120 seconds
- ⚠️ Return rate 15-25%
- ⚠️ Pain points explored 1-2 per session
- ⚠️ Bounce rate 60-75%
- **Action**: A/B test landing page, improve onboarding, optimize AI scoring quality

**RED Zone (Pivot or Kill):**
- ❌ Session time <60 seconds
- ❌ Return rate <15%
- ❌ Pain points explored <1 per session
- ❌ Bounce rate >75%
- **Action**: Fundamental rethink of value proposition, consider pivot or kill project

**Monitoring Dashboard:**
- Real-time metrics updated daily
- Weekly email report to stakeholders
- Automated alerts if metrics drop below thresholds

---

_This technical specification is ready for implementation. All acceptance criteria, architecture alignment, and test strategy are defined. Estimated implementation timeline: 8 weeks with 15-20 hours/week (solo developer)._

**Next Steps:**
1. Review and approval from stakeholders
2. Sprint planning: Break into 2-week sprints
3. Development kickoff (Week 1)
4. Validation checkpoint (Week 8)
5. Decision: Proceed to Epic 2 or iterate
