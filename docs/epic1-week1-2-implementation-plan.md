# Epic 1 - Week 1-2 Implementation Plan
# Foundation Phase: Database, Reddit API, and Caching Infrastructure

**Project:** startup-sniff - Magical Reddit Extraction Engine
**Timeline:** Week 1-2 (14 days)
**Effort:** 15-20 hours/week = 30-40 total hours
**Developer:** Benjamin (solo)
**Date Created:** 2025-10-13

---

## Overview

This document breaks down the first 2 weeks of Epic 1 implementation into daily, actionable tasks. Week 1-2 focuses on **backend foundation** - setting up the data pipeline from Reddit API → Database with caching and background jobs.

**Stories Covered:**
- **Story 1.1:** Cross-Subreddit Pain Point Aggregation (backend foundation)
- **Story 1.10:** Performance Optimization and Caching (setup)

**Success Criteria for Week 1-2:**
- ✅ Database migration applied with new Epic 1 fields
- ✅ Reddit API fetching 15+ subreddits successfully
- ✅ Redis caching layer operational (4-hour TTL)
- ✅ Background job running every 4 hours via Vercel Cron
- ✅ Minimum 50 posts stored in database with proper deduplication
- ✅ All infrastructure testable manually before building UI

---

## Daily Task Breakdown

### Day 1: Database Migration and Verification (2-3 hours)

**Goal:** Apply migration to add Epic 1 fields to reddit_posts table

**Tasks:**

1. **Apply Database Migration** (30 min)
   - File: `supabase/migrations/20251013120000_add_epic1_viability_and_trend_fields.sql`
   - Command: `npx supabase db push` (if using Supabase CLI) OR apply via Supabase dashboard
   - Verify no migration errors in output

2. **Verify Migration Success** (15 min)
   - Open Supabase dashboard → Database → Tables → `reddit_posts`
   - Check new columns exist:
     - `viability_score` (integer, 1-10 constraint)
     - `viability_explanation` (text)
     - `weekly_frequency` (integer)
     - `trend_direction` (text with enum check)
     - `trend_percentage` (decimal)
     - `is_emerging` (boolean)
     - `search_vector` (tsvector)
   - Check indexes created:
     - `idx_reddit_posts_viability_score`
     - `idx_reddit_posts_trend_direction`
     - `idx_reddit_posts_search` (GIN index)

3. **Test Manual Insert** (30 min)
   - Use Supabase SQL editor or psql
   - Insert 2-3 test posts with new fields populated:
   ```sql
   INSERT INTO reddit_posts (
     reddit_id, subreddit, title, content, author, score, comments,
     created_utc, hash, viability_score, viability_explanation,
     trend_direction, trend_percentage, is_emerging
   ) VALUES (
     'test_123', 'entrepreneur', 'Looking for SaaS ideas',
     'Has anyone validated a SaaS idea recently?', 'test_user',
     45, 12, NOW(), 'abc123hash', 8,
     'High engagement, specific ask, community validation signals',
     'up', 23.5, FALSE
   );
   ```
   - Verify full-text search works:
   ```sql
   SELECT title FROM reddit_posts
   WHERE search_vector @@ to_tsquery('english', 'SaaS');
   ```

4. **Document Completion** (15 min)
   - Update this document with any migration issues encountered
   - Screenshot of successful table structure (save to docs/screenshots/)
   - Note any deviations from expected schema

**Outputs:**
- ✅ Migration applied successfully
- ✅ New fields verified in Supabase
- ✅ Test inserts successful
- ✅ Full-text search functional

**Blockers/Risks:**
- If migration fails: Check Supabase logs, may need to fix constraint syntax
- If search_vector trigger fails: Manually update trigger function

---

### Day 2: TypeScript Types and Reddit API Review (3-4 hours)

**Goal:** Update types for new fields and verify existing Reddit infrastructure

**Tasks:**

1. **Update TypeScript Types** (45 min)
   - File: `types/supabase.ts` (or wherever Supabase types are)
   - Add new fields to `RedditPost` interface:
   ```typescript
   export interface RedditPost {
     // ... existing fields ...
     viability_score: number | null  // 1-10
     viability_explanation: string | null
     weekly_frequency: number | null
     trend_direction: 'up' | 'down' | 'stable' | null
     trend_percentage: number | null
     is_emerging: boolean | null
     search_vector?: string  // Not directly used in TS, but present
   }
   ```
   - Regenerate types if using Supabase CLI: `npx supabase gen types typescript`
   - Fix any TypeScript errors from new fields

2. **Review Existing Reddit API Client** (60 min)
   - File: `lib/reddit/api-client.ts`
   - Read through RedditAPIClient class
   - Document what currently works:
     - ✅ OAuth 2.0 authentication (`authenticate()`)
     - ✅ Rate limiting (`rateLimiter.checkLimit()`)
     - ✅ Single subreddit fetching (`fetchSubredditPosts()`)
     - ✅ Multi-subreddit fetching (`fetchMultipleSubreddits()`)
     - ✅ Deduplication by hash (`deduplicatePosts()`)
   - Note any gaps vs. tech spec requirements

3. **Test Reddit API Authentication** (60 min)
   - Create test script: `scripts/test-reddit-auth.ts`
   ```typescript
   import { RedditAPIClient } from '@/lib/reddit/api-client'
   import { RedditRateLimiter } from '@/lib/reddit/rate-limiter'

   const client = new RedditAPIClient(
     {
       userAgent: process.env.REDDIT_USER_AGENT!,
       clientId: process.env.REDDIT_CLIENT_ID!,
       clientSecret: process.env.REDDIT_CLIENT_SECRET!,
       refreshToken: process.env.REDDIT_REFRESH_TOKEN!
     },
     new RedditRateLimiter(/* ... */),
     console
   )

   async function test() {
     const authenticated = await client.authenticate()
     console.log('Auth successful:', authenticated)

     const result = await client.fetchSubredditPosts('entrepreneur', {
       limit: 5,
       timeRange: '7d',
       sortBy: 'hot'
     })
     console.log('Fetched posts:', result.data.length)
   }

   test()
   ```
   - Run: `npx tsx scripts/test-reddit-auth.ts`
   - Verify auth works and 5 posts fetched

4. **Check Environment Variables** (15 min)
   - Verify these exist in `.env.local`:
     - `REDDIT_USER_AGENT`
     - `REDDIT_CLIENT_ID`
     - `REDDIT_CLIENT_SECRET`
     - `REDDIT_REFRESH_TOKEN`
   - If missing, need to register Reddit app at https://reddit.com/prefs/apps
   - Document any missing credentials

**Outputs:**
- ✅ TypeScript types updated and compiling
- ✅ Reddit API client reviewed and documented
- ✅ Authentication test successful
- ✅ List of missing credentials (if any)

**Blockers/Risks:**
- If Reddit credentials missing: Need to register app (30 min setup)
- If rate limiter fails: May need to adjust Redis connection

---

### Day 3: Reddit API Configuration and Multi-Subreddit Testing (3-4 hours)

**Goal:** Configure Reddit credentials and test fetching from multiple subreddits

**Tasks:**

1. **Configure Reddit API Credentials (if missing)** (30-60 min)
   - Go to https://www.reddit.com/prefs/apps
   - Click "Create App" or "Create Another App"
   - Settings:
     - Name: StartupSniff Development
     - Type: Script
     - Description: Reddit data collection for startup validation
     - Redirect URI: http://localhost:3000 (not used for script type)
   - Copy `client_id` and `client_secret`
   - Generate refresh token using OAuth flow or existing tools
   - Add to `.env.local`:
   ```
   REDDIT_USER_AGENT="StartupSniff/1.0 by YourUsername"
   REDDIT_CLIENT_ID="your_client_id"
   REDDIT_CLIENT_SECRET="your_client_secret"
   REDDIT_REFRESH_TOKEN="your_refresh_token"
   ```

2. **Test Multi-Subreddit Fetching** (60 min)
   - Update test script from Day 2:
   ```typescript
   const subreddits = ['entrepreneur', 'SaaS', 'startups']
   const result = await client.fetchMultipleSubreddits(subreddits, {
     limit: 10,
     timeRange: '7d',
     sortBy: 'hot'
   })

   console.log('Total posts:', result.data.length)
   console.log('Errors:', result.error)
   console.log('Sample post:', result.data[0])
   ```
   - Verify:
     - ✅ Posts fetched from all 3 subreddits
     - ✅ Deduplication working (no duplicate hashes)
     - ✅ Rate limiting respected (1 second delay between subreddits)

3. **Create Hardcoded Subreddit List** (15 min)
   - File: `lib/reddit/constants.ts` (create new)
   ```typescript
   export const STARTUP_SUBREDDITS = [
     'entrepreneur',
     'startups',
     'SaaS',
     'Entrepreneur',
     'smallbusiness',
     'digitalnomad',
     'sidehustle',
     'freelance',
     'indiehackers',
     'webdev',
     'marketing',
     'productivity',
     'business',
     'technology',
     'growmybusiness'
   ] as const

   export type StartupSubreddit = typeof STARTUP_SUBREDDITS[number]
   ```
   - Reference in tech spec: 15+ subreddits required

4. **Test with Full Subreddit List** (30 min)
   - Update test to use all 15 subreddits
   - Run and monitor:
     - Time to complete (should be <5 seconds per subreddit = ~75 sec total)
     - Posts fetched (expect 100-200 posts total)
     - API rate limit warnings (should see Redis rate limiter in action)

**Outputs:**
- ✅ Reddit API credentials configured
- ✅ Multi-subreddit fetching tested (3 subreddits)
- ✅ Full subreddit list constant created
- ✅ Full list fetch tested (15 subreddits)

**Blockers/Risks:**
- Reddit OAuth may require manual token generation (use existing tools)
- Rate limiting may slow down full 15-subreddit fetch
- Some subreddits may be private/quarantined (handle gracefully)

---

### Day 4: Redis Caching Layer Setup (3-4 hours)

**Goal:** Set up Redis connection and implement caching for Reddit API calls

**Tasks:**

1. **Set Up Redis Connection** (45 min)
   - **Option A: Upstash (serverless, recommended)**
     - Sign up at https://upstash.com
     - Create Redis database
     - Copy REST URL to `.env.local`:
     ```
     REDIS_URL="redis://default:password@host.upstash.io:6379"
     ```
   - **Option B: Local Redis (development)**
     - Install: `brew install redis` (Mac) or Docker
     - Start: `redis-server`
     - Use: `REDIS_URL="redis://localhost:6379"`

   - Test connection:
   ```typescript
   import Redis from 'ioredis'
   const redis = new Redis(process.env.REDIS_URL!)
   await redis.set('test', 'hello')
   console.log(await redis.get('test'))  // Should print 'hello'
   ```

2. **Create Redis Cache Utility** (60 min)
   - File: `lib/services/redis-cache.ts` (create new)
   ```typescript
   import Redis from 'ioredis'

   const redis = new Redis(process.env.REDIS_URL!)

   export class RedisCache {
     async get<T>(key: string): Promise<T | null> {
       const value = await redis.get(key)
       return value ? JSON.parse(value) : null
     }

     async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
       await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds)
     }

     async delete(key: string): Promise<void> {
       await redis.del(key)
     }

     async has(key: string): Promise<boolean> {
       return (await redis.exists(key)) === 1
     }
   }

   export const cache = new RedisCache()
   ```

3. **Implement Caching in Reddit API Client** (90 min)
   - Modify `fetchSubredditPosts()` in `lib/reddit/api-client.ts`
   - Add cache check before API call:
   ```typescript
   async fetchSubredditPosts(subreddit: string, options: FetchOptions = {}) {
     const cacheKey = `reddit:posts:${subreddit}:${options.sortBy}:${options.timeRange}`

     // Check cache first
     const cached = await cache.get<RedditPostInsert[]>(cacheKey)
     if (cached) {
       this.logger.info(`Cache HIT for ${subreddit}`)
       return { success: true, data: cached }
     }

     // Cache MISS - fetch from API
     this.logger.info(`Cache MISS for ${subreddit}`)
     const result = await this.makeRequest<RedditListingResponse>(endpoint)

     // ... process posts ...

     // Store in cache (4 hours = 14400 seconds)
     if (processedPosts.length > 0) {
       await cache.set(cacheKey, processedPosts, 14400)
     }

     return { success: true, data: processedPosts }
   }
   ```

4. **Test Caching Behavior** (30 min)
   - First fetch: Should be slow (~2-3 seconds per subreddit)
   - Second fetch (immediate): Should be instant (cache hit)
   - Wait 4+ hours: Should fetch fresh data (cache expired)
   - Monitor Redis:
   ```bash
   redis-cli KEYS "reddit:posts:*"  # Should show cached keys
   redis-cli TTL "reddit:posts:entrepreneur:hot:7d"  # Should show ~14400 seconds
   ```

**Outputs:**
- ✅ Redis connection established (Upstash or local)
- ✅ RedisCache utility class created and tested
- ✅ Caching implemented in Reddit API client
- ✅ Cache hit/miss behavior verified

**Blockers/Risks:**
- Redis connection issues: Check REDIS_URL format
- Cache serialization errors: Ensure data is JSON-serializable
- TTL not working: Verify Redis version supports 'EX' flag

---

### Day 5: Background Job API Endpoint (4-5 hours)

**Goal:** Create API endpoint for background Reddit data collection

**Tasks:**

1. **Create API Route for Data Fetching** (60 min)
   - File: `app/api/reddit/fetch/route.ts` (create new)
   ```typescript
   import { NextRequest, NextResponse } from 'next/server'
   import { createClient } from '@supabase/supabase-js'
   import { RedditAPIClient } from '@/lib/reddit/api-client'
   import { STARTUP_SUBREDDITS } from '@/lib/reddit/constants'

   export const dynamic = 'force-dynamic'
   export const runtime = 'nodejs'  // Not edge, needs full Node runtime

   export async function POST(request: NextRequest) {
     // Authentication check
     const authHeader = request.headers.get('authorization')
     const cronSecret = process.env.CRON_SECRET || 'dev-secret'

     if (authHeader !== `Bearer ${cronSecret}`) {
       return NextResponse.json(
         { error: 'Unauthorized' },
         { status: 401 }
       )
     }

     try {
       // Initialize clients
       const supabase = createClient(
         process.env.NEXT_PUBLIC_SUPABASE_URL!,
         process.env.SUPABASE_SERVICE_ROLE_KEY!
       )

       const redditClient = new RedditAPIClient(/* ... */)

       // Fetch posts from all subreddits
       const result = await redditClient.fetchMultipleSubreddits(
         [...STARTUP_SUBREDDITS],
         { limit: 25, timeRange: '7d', sortBy: 'hot' }
       )

       // Store in database (next task)
       // ...

       return NextResponse.json({
         success: true,
         postsFetched: result.data.length,
         timestamp: new Date().toISOString()
       })
     } catch (error) {
       console.error('Reddit fetch job failed:', error)
       return NextResponse.json(
         { error: 'Job failed', details: error instanceof Error ? error.message : 'Unknown' },
         { status: 500 }
       )
     }
   }
   ```

2. **Implement Batch Processing Logic** (60 min)
   - In the API route, add parallel fetching with Promise.all
   - But respect rate limits (already handled by client)
   - Add progress tracking:
   ```typescript
   const results = {
     successful: 0,
     failed: 0,
     totalPosts: 0,
     errors: [] as string[]
   }

   const allPosts = result.data  // Already deduplicated
   results.totalPosts = allPosts.length
   results.successful = STARTUP_SUBREDDITS.length  // Adjust based on actual success
   ```

3. **Add Database Insertion Logic** (90 min)
   - Still in `app/api/reddit/fetch/route.ts`
   - Bulk insert with upsert to handle duplicates:
   ```typescript
   // Upsert posts to database (insert or update if reddit_id exists)
   const { data: insertedPosts, error: insertError } = await supabase
     .from('reddit_posts')
     .upsert(
       result.data,
       {
         onConflict: 'reddit_id',  // Use reddit_id as unique constraint
         ignoreDuplicates: false   // Update existing posts
       }
     )
     .select()

   if (insertError) {
     throw new Error(`Database insert failed: ${insertError.message}`)
   }

   results.postsStored = insertedPosts?.length || 0
   ```

   - Add error handling for insert failures
   - Log statistics: new posts, updated posts, skipped posts

4. **Add Logging and Monitoring** (30 min)
   - Log to console with structured format:
   ```typescript
   console.log(JSON.stringify({
     timestamp: new Date().toISOString(),
     event: 'reddit_fetch_completed',
     subreddits: STARTUP_SUBREDDITS.length,
     posts_fetched: result.data.length,
     posts_stored: results.postsStored,
     duration_ms: Date.now() - startTime,
     errors: results.errors
   }))
   ```
   - Consider adding to monitoring service (Sentry, Better Stack) later

**Outputs:**
- ✅ API endpoint `/api/reddit/fetch` created
- ✅ Batch processing logic implemented
- ✅ Database insertion with upsert working
- ✅ Structured logging in place

**Blockers/Risks:**
- Database unique constraint on reddit_id: May need to add if missing
- Bulk insert performance: If 200+ posts, may take 2-3 seconds
- Memory issues: If fetching too many posts at once, may need pagination

---

### Day 6: Manual Testing and Vercel Cron Setup (3-4 hours)

**Goal:** Test the complete data pipeline and set up automated cron job

**Tasks:**

1. **Test Manual API Call** (45 min)
   - Use curl or Postman to call the endpoint:
   ```bash
   curl -X POST http://localhost:3000/api/reddit/fetch \
     -H "Authorization: Bearer dev-secret"
   ```

   - Verify response:
   ```json
   {
     "success": true,
     "postsFetched": 187,
     "postsStored": 182,
     "timestamp": "2025-10-13T12:00:00.000Z"
   }
   ```

   - Check Supabase database:
   ```sql
   SELECT COUNT(*) FROM reddit_posts;  -- Should show 182+ posts
   SELECT subreddit, COUNT(*) FROM reddit_posts GROUP BY subreddit;
   ```

   - Verify posts have required fields populated (not null where expected)

2. **Set Up Vercel Cron Job** (45 min)
   - File: `vercel.json` (create or update in project root)
   ```json
   {
     "crons": [
       {
         "path": "/api/reddit/fetch",
         "schedule": "0 */4 * * *"
       }
     ]
   }
   ```
   - Schedule explanation: "0 */4 * * *" = every 4 hours at minute 0
     - Runs at: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00 UTC

   - Note: Cron only works in production deployment, not localhost
   - For testing, we'll deploy to Vercel preview

3. **Add Authentication to Fetch Endpoint** (30 min)
   - Update `.env.local` and Vercel environment variables:
   ```
   CRON_SECRET="your-random-secret-here-use-uuid"
   ```

   - Generate secret:
   ```bash
   node -e "console.log(require('crypto').randomUUID())"
   ```

   - Vercel will automatically add `Authorization: Bearer <cron_secret>` header
   - Update API route to verify this header (already done in Day 5)

4. **Deploy to Vercel Preview** (60 min)
   - Commit changes:
   ```bash
   git add .
   git commit -m "feat: Epic 1 Week 1-2 foundation - Reddit data pipeline"
   ```

   - Push to branch:
   ```bash
   git checkout -b feature/epic1-foundation
   git push origin feature/epic1-foundation
   ```

   - Vercel will auto-deploy preview
   - Add CRON_SECRET to Vercel environment variables (dashboard)
   - Test cron job trigger via Vercel dashboard or wait for next scheduled run
   - Check Vercel function logs to verify execution

**Outputs:**
- ✅ Manual API call successful, posts in database
- ✅ Vercel cron configured in vercel.json
- ✅ CRON_SECRET configured
- ✅ Preview deployment successful

**Blockers/Risks:**
- Vercel cron may not trigger in preview: Need production deploy to test
- Authentication failures: Check CRON_SECRET matches in Vercel env
- Function timeout: Vercel has 10-second limit on Hobby plan (may need Pro)

---

### Day 7: Monitoring, Testing, and Documentation (2-3 hours)

**Goal:** Add monitoring, run end-to-end tests, and document completion

**Tasks:**

1. **Create Monitoring Dashboard** (60 min)
   - File: `app/api/reddit/status/route.ts` (create new)
   ```typescript
   export async function GET() {
     const supabase = createClient(/* ... */)

     // Get post statistics
     const { data: stats } = await supabase
       .from('reddit_posts')
       .select('subreddit, created_at')
       .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

     const postsBySubreddit = stats?.reduce((acc, post) => {
       acc[post.subreddit] = (acc[post.subreddit] || 0) + 1
       return acc
     }, {} as Record<string, number>)

     return NextResponse.json({
       total_posts_24h: stats?.length || 0,
       posts_by_subreddit: postsBySubreddit,
       last_updated: new Date().toISOString(),
       cache_status: 'healthy'  // TODO: Add Redis health check
     })
   }
   ```

   - Create simple status page: `app/admin/status/page.tsx`
   - Display metrics from `/api/reddit/status`

2. **Test Full Pipeline End-to-End** (45 min)
   - **Manual Cron Trigger Test:**
     - Call `/api/reddit/fetch` via curl
     - Watch Vercel logs in real-time
     - Verify 50+ posts inserted into database

   - **Database Verification:**
   ```sql
   -- Check post distribution by subreddit
   SELECT subreddit, COUNT(*) as post_count, MAX(created_utc) as latest_post
   FROM reddit_posts
   GROUP BY subreddit
   ORDER BY post_count DESC;

   -- Check deduplication (should be no duplicates)
   SELECT reddit_id, COUNT(*)
   FROM reddit_posts
   GROUP BY reddit_id
   HAVING COUNT(*) > 1;  -- Should return 0 rows

   -- Verify new fields (should all be NULL for now, populated in Week 3-4)
   SELECT viability_score, trend_direction, search_vector
   FROM reddit_posts
   LIMIT 5;
   ```

   - **Cache Performance Test:**
     - First call to `/api/reddit/fetch`: Note duration
     - Immediate second call: Should be much faster (cache hit)
     - Check Redis keys: `redis-cli KEYS "reddit:*"`

3. **Document Completion Status** (30 min)
   - Update this file with actual completion status
   - Create checklist:

   **Week 1-2 Completion Checklist:**
   - [ ] Database migration applied successfully
   - [ ] TypeScript types updated
   - [ ] Reddit API authentication working
   - [ ] Multi-subreddit fetching tested (15 subreddits)
   - [ ] Redis caching operational (4-hour TTL verified)
   - [ ] API endpoint `/api/reddit/fetch` functional
   - [ ] Database upsert logic working (no duplicates)
   - [ ] Vercel cron configured (deployed to preview)
   - [ ] Monitoring endpoint created
   - [ ] End-to-end test passed (50+ posts in DB)

   - **Blockers Encountered:**
     - (List any issues that need resolution before Week 3)

   - **Ready for Week 3:** YES / NO
     - If NO, list what needs completion

4. **Prepare for Week 3** (15 min)
   - Review Week 3-4 tasks from tech spec (AI scoring, trend analysis)
   - Note any dependencies or prerequisites
   - Create GitHub issue for Week 3 kickoff (optional)

**Outputs:**
- ✅ Monitoring endpoint and status page created
- ✅ Full pipeline tested end-to-end
- ✅ Database verified with 50+ posts
- ✅ Week 1-2 completion documented

**Blockers/Risks:**
- If <50 posts: Reddit API may be rate limiting, or subreddits inactive
- If cron not triggering: May need production deploy to test fully
- If performance slow: May need to optimize batch processing

---

## Time Estimates Summary

| Day | Focus Area | Estimated Hours | Cumulative |
|-----|------------|----------------|------------|
| Day 1 | Database Migration | 2-3 hours | 2-3 hours |
| Day 2 | TypeScript & Reddit API | 3-4 hours | 5-7 hours |
| Day 3 | Multi-Subreddit Testing | 3-4 hours | 8-11 hours |
| Day 4 | Redis Caching | 3-4 hours | 11-15 hours |
| Day 5 | Background Job Endpoint | 4-5 hours | 15-20 hours |
| Day 6 | Testing & Cron Setup | 3-4 hours | 18-24 hours |
| Day 7 | Monitoring & Documentation | 2-3 hours | 20-27 hours |

**Total:** 20-27 hours over 7 days (matches 15-20 hrs/week pace for solo developer)

---

## Success Criteria Checklist

At the end of Week 1-2, the following must be true:

**Infrastructure:**
- [ ] Database has all Epic 1 fields (viability_score, trend_direction, etc.)
- [ ] Full-text search index operational on reddit_posts
- [ ] Redis connection established and testable

**Reddit API:**
- [ ] Authentication working with OAuth 2.0
- [ ] Fetching from 15+ subreddits successfully
- [ ] Deduplication preventing duplicate posts
- [ ] Rate limiting respected (no API bans)

**Caching:**
- [ ] 4-hour cache TTL operational
- [ ] Cache hit rate >50% on repeated fetches
- [ ] Redis keys follow naming convention: `reddit:posts:{subreddit}:{sortBy}:{timeRange}`

**Background Job:**
- [ ] API endpoint `/api/reddit/fetch` functional
- [ ] Upsert logic preventing duplicates
- [ ] Vercel cron configured (deployed to preview/production)
- [ ] Structured logging capturing metrics

**Data Quality:**
- [ ] Minimum 50 posts in database
- [ ] Posts distributed across multiple subreddits (not all from one)
- [ ] No duplicate reddit_id values
- [ ] created_utc within last 7 days

**Monitoring:**
- [ ] Status endpoint showing current metrics
- [ ] Ability to manually trigger data fetch for testing
- [ ] Logs viewable in Vercel dashboard

---

## Common Issues and Solutions

**Issue: "Migration fails with constraint error"**
- **Cause:** Existing data violates new constraints (e.g., viability_score outside 1-10)
- **Solution:** Clear test data or adjust constraints to allow NULL
- **Command:** `DELETE FROM reddit_posts WHERE viability_score IS NULL;`

**Issue: "Reddit API returns 401 Unauthorized"**
- **Cause:** Invalid credentials or expired refresh token
- **Solution:** Regenerate refresh token, verify client_id/client_secret
- **Tool:** Use Reddit OAuth helper or manual flow

**Issue: "Redis connection timeout"**
- **Cause:** REDIS_URL incorrect or Redis server unreachable
- **Solution:** Test connection with `redis-cli` or verify Upstash URL
- **Check:** `redis-cli -u $REDIS_URL ping` should return "PONG"

**Issue: "Vercel function timeout after 10 seconds"**
- **Cause:** Hobby plan has 10s limit, fetching 15 subreddits may take longer
- **Solution:**
  - Reduce subreddits to 10 for initial test
  - Use parallel Promise.all (already implemented)
  - Upgrade to Pro plan for 60s timeout
  - Split into multiple smaller jobs

**Issue: "No posts inserted after running job"**
- **Cause:** Deduplication rejecting all posts (already exist) OR insert error
- **Solution:** Check Vercel logs for errors, verify upsert logic
- **Debug:** `SELECT COUNT(*), MAX(created_at) FROM reddit_posts;`

**Issue: "Cron job not triggering on Vercel"**
- **Cause:** Cron only works in production, not preview deployments
- **Solution:**
  - Deploy to production: `git push origin main`
  - Or manually trigger via curl for testing
  - Wait up to 5 minutes after deployment for cron to activate

---

## Next Steps (Week 3-4)

After completing Week 1-2, the following tasks begin:

**Week 3-4 Focus: AI Scoring and Trend Analysis**
- Create OpenAI viability scorer service (`lib/ai/viability-scorer.ts`)
- Build trend analyzer service (`lib/ai/trend-analyzer.ts`)
- Create background jobs for AI scoring (process unscored posts)
- Create weekly job for trend metric updates
- Add cost tracking for OpenAI API usage

**Prerequisites for Week 3:**
- ✅ Week 1-2 completed (50+ posts in database)
- ✅ OpenAI API key configured (`OPENAI_API_KEY`)
- ✅ Understanding of GPT-4 cost structure (~$0.03 per post)

**Dependencies:**
- All Week 1-2 tasks must be complete before starting Week 3
- Cannot score posts without posts in database
- Cannot calculate trends without historical data (need 2+ weeks)

---

## Resources and References

**Documentation:**
- Reddit API: https://www.reddit.com/dev/api
- Reddit OAuth: https://github.com/reddit-archive/reddit/wiki/OAuth2
- Vercel Cron: https://vercel.com/docs/cron-jobs
- Supabase Migrations: https://supabase.com/docs/guides/cli/local-development
- Redis Commands: https://redis.io/commands

**Code References:**
- Tech Spec: `/docs/tech-spec-epic-1.md`
- Epics: `/docs/epics.md`
- PRD: `/docs/PRD.md`
- Existing Reddit Client: `/lib/reddit/api-client.ts`

**Tools:**
- Supabase CLI: `npx supabase`
- Redis CLI: `redis-cli`
- Vercel CLI: `npx vercel`
- TypeScript execution: `npx tsx <file>`

---

**Document Version:** 1.0
**Last Updated:** 2025-10-13
**Status:** Ready for Implementation
