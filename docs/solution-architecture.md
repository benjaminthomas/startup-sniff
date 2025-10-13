# Solution Architecture Document

**Project:** startup-sniff
**Date:** 2025-10-13
**Author:** Benjamin

## Executive Summary

StartupSniff is a full-stack web application built with Next.js 15 and Supabase, designed to transform founders from passive validation to active momentum through three distinct pillars: (1) Magical Reddit extraction with cross-subreddit AI analysis, (2) Guided human contact workflow with message templates and conversation tracking, and (3) Network intelligence foundation building a defensive data moat.

**Architecture Pattern:** Monolithic Next.js application with App Router (SSR/SSG hybrid)
**Repository Strategy:** Monorepo
**Deployment:** Serverless on Vercel with PostgreSQL via Supabase
**Scale Target:** 500 → 5,000 → 50,000 users over 14-20 weeks

This document captures the existing architecture currently in production and establishes standards for ongoing development across all three pillars.

---

## 1. Technology Stack and Decisions

### 1.1 Technology and Library Decision Table

| Category              | Technology                  | Version     | Justification                                                                                      |
| --------------------- | --------------------------- | ----------- | -------------------------------------------------------------------------------------------------- |
| Framework             | Next.js                     | 15.5.2      | App Router with React Server Components, SSR/SSG hybrid, API routes, optimal for SEO and performance |
| Language              | TypeScript                  | 5.x         | Type safety, excellent IDE support, prevents runtime errors, required for enterprise-grade code     |
| Runtime               | Node.js                     | 20.x        | Required by Next.js 15, modern features, excellent performance                                      |
| React                 | React                       | 19.1.0      | Latest stable, concurrent features, server components support                                       |
| Database              | PostgreSQL                  | 15.x        | Via Supabase, ACID compliance, JSON support, excellent for relational data with complex queries    |
| Database Platform     | Supabase                    | Latest      | Managed PostgreSQL + Auth + Realtime + Storage, generous free tier, excellent DX, built-in RLS     |
| ORM/Client            | @supabase/supabase-js       | 2.56.1      | Official Supabase client, type-safe, real-time subscriptions, auto-generated TypeScript types      |
| Authentication        | Supabase Auth + Argon2      | Latest/0.44 | Built-in OAuth (Reddit), secure password hashing with argon2, session management via @supabase/ssr |
| Session Management    | @supabase/ssr               | 0.7.0       | Server-side session handling for Next.js App Router, secure cookie management                      |
| Payment Gateway       | Razorpay                    | 2.9.6       | Subscription management, webhook handling, international payment support (India-focused)            |
| Styling               | Tailwind CSS                | 4.1.14      | Utility-first, rapid development, consistent design system, excellent tree-shaking                  |
| UI Components         | shadcn/ui (Radix UI)        | Latest      | Accessible primitives, copy-paste approach, full customization, WCAG 2.1 AA compliant              |
| Component Utilities   | class-variance-authority    | 0.7.1       | Type-safe component variants, pairs with shadcn/ui                                                  |
| CSS Utilities         | clsx + tailwind-merge       | 2.1.1/3.3.1 | Conditional class merging, prevents Tailwind conflicts                                             |
| Icons                 | lucide-react                | 0.542.0     | Beautiful, consistent icons, excellent TypeScript support, tree-shakeable                           |
| Form Handling         | react-hook-form             | 7.62.0      | Performant forms, minimal re-renders, excellent validation support                                  |
| Form Validation       | zod + @hookform/resolvers   | 3.25.76     | Type-safe schema validation, runtime type checking, excellent error messages                        |
| Animation             | framer-motion               | 12.23.12    | Declarative animations, gesture support, layout animations, respects prefers-reduced-motion         |
| AI/LLM Integration    | OpenAI                      | 5.16.0      | GPT-4 for viability scoring, text-embedding-ada-002 for pattern matching, official SDK             |
| Caching               | ioredis                     | 5.7.0       | Redis client for rate limiting, session caching, performance optimization via Upstash               |
| Background Jobs       | cron                        | 4.3.3       | Scheduled tasks for Reddit data fetching, trend analysis, usage reconciliation                      |
| Analytics             | @vercel/analytics           | 1.5.0       | Privacy-friendly, automatic page views, custom event tracking, Vercel integration                   |
| Email Service         | mailgun.js                  | 12.1.0      | Transactional emails, verification, password reset, high deliverability                             |
| Date Utilities        | date-fns                    | 4.1.0       | Lightweight date manipulation, tree-shakeable, excellent TypeScript support                         |
| PDF Generation        | jspdf                       | 3.0.2       | Client-side PDF generation for reports and exports                                                  |
| Unique IDs            | nanoid                      | 3.3.7       | Secure, URL-safe unique ID generation, faster than UUID                                             |
| JWT Handling          | jose                        | 6.1.0       | Modern JWT library for Next.js Edge Runtime, secure token handling                                  |
| Toast Notifications   | sonner                      | 2.0.7       | Beautiful toast notifications, accessible, customizable                                             |
| Theme Management      | next-themes                 | 0.4.6       | Dark mode support, SSR-compatible, respects user preferences                                        |
| Charts/Visualizations | recharts                    | 2.15.4      | Declarative charts built on D3, responsive, excellent for analytics dashboards                      |
| Testing (E2E)         | @playwright/test            | 1.55.0      | Cross-browser E2E testing, excellent debugging, parallel execution                                  |
| Linting               | eslint + eslint-config-next | 9.x/15.5.2  | Code quality, Next.js-specific rules, consistent code style                                         |
| Hosting               | Vercel                      | Latest      | Zero-config Next.js deployment, global CDN, serverless functions, excellent DX                      |
| Deployment            | Vercel Git Integration      | Latest      | Automatic deployments from Git, preview deployments, instant rollback                               |

### 1.2 Additional Dependencies

**Development:**
- **dotenv** 17.2.1: Environment variable management for local development
- **shadcn CLI** 3.4.0: Component scaffolding and updates
- **Supabase CLI**: Database migrations, type generation, local development

**Type Definitions:**
- @types/node, @types/react, @types/react-dom, @types/cron, @types/ioredis, @types/nodemailer, @types/jspdf

---

## 2. Application Architecture

### 2.1 Architecture Pattern

**Modular Monolith with Domain-Driven Modules**

The application follows a modular monolith pattern within a single Next.js codebase, organized into distinct domain modules:

```
startup-sniff/
├── app/                    # Next.js App Router (presentation layer)
├── modules/                # Domain modules (business logic)
├── components/             # Shared UI components
├── lib/                    # Shared utilities and services
└── server/                 # Server-side utilities (queries, actions)
```

**Why Modular Monolith:**
- **Simplicity**: Single deployment, no distributed system complexity
- **Cost Efficiency**: Serverless pricing favorable for startup phase
- **Development Velocity**: Solo founder can iterate quickly without microservice overhead
- **Future Flexibility**: Clear module boundaries enable extraction to microservices if needed

**Module Domains:**
1. **auth**: Authentication, authorization, session management, CSRF protection
2. **billing**: Subscription management, Razorpay integration, plan limits
3. **usage**: Usage tracking, quota enforcement, reconciliation
4. **ideas**: Startup idea generation, validation, favorites
5. **reddit**: Reddit API integration, post fetching, OAuth flow
6. **ai**: OpenAI integration, viability scoring, embeddings
7. **content**: Generated content (marketing copy, blog posts)
8. **contact**: Email service, contact form handling
9. **validation**: User experiment tracking, results logging
10. **marketing**: Landing pages, SEO, public content

### 2.2 Server-Side Rendering Strategy

**Hybrid SSR/SSG/CSR Approach:**

| Route Type           | Rendering Strategy | Rationale                                                                 |
| -------------------- | ------------------ | ------------------------------------------------------------------------- |
| Marketing pages      | SSG                | SEO optimization, fast load times, infrequent updates                     |
| Dashboard pages      | SSR with streaming | User-specific data, real-time usage limits, personalized content          |
| Auth pages           | SSR                | Server-side validation, secure session handling, no client-side auth data |
| API routes           | Server-side only   | Business logic, database queries, third-party API calls                   |
| Static assets        | CDN cached         | Images, fonts, design references served via Vercel CDN                    |

**Performance Optimizations:**
- React Server Components for data fetching (no client-side waterfalls)
- Streaming SSR for progressive page hydration
- Redis caching for Reddit data (4-hour TTL) and rate limits
- Static generation for marketing content with ISR (revalidate: 3600)

### 2.3 Page Routing and Navigation

**App Router Structure (Next.js 15):**

```
app/
├── (marketing)/                  # Marketing routes (SSG)
│   ├── (home)/page.tsx          # Landing page
│   ├── T&C/page.tsx             # Terms & Conditions
│   ├── privacy_policy/page.tsx  # Privacy Policy
│   ├── refund_policy/page.tsx   # Refund Policy
│   └── contact/page.tsx         # Contact form
├── (dashboard)/                  # Protected routes (SSR)
│   └── dashboard/
│       ├── generate/page.tsx    # Pillar 1: Reddit extraction UI
│       ├── trends/page.tsx      # Trend analysis dashboard
│       └── content/page.tsx     # Generated content library
├── auth/                         # Authentication flows (SSR)
│   ├── signin/page.tsx
│   ├── signup/page.tsx
│   ├── verify-email/page.tsx
│   ├── forgot-password/page.tsx
│   └── reset-password/page.tsx
├── api/                          # API routes (Server-side)
│   ├── auth/                    # Auth endpoints
│   ├── ideas/                   # Idea CRUD operations
│   ├── reddit/                  # Reddit OAuth callback, data fetching
│   ├── billing/                 # Razorpay webhooks, subscription management
│   └── webhooks/                # External service webhooks
├── layout.tsx                    # Root layout with providers
└── middleware.ts                 # Auth, CSRF, rate limiting middleware
```

**Route Groups:**
- **(marketing)**: Public routes with SSG
- **(dashboard)**: Protected routes requiring authentication
- **api/**: Server-side API endpoints

### 2.4 Data Fetching Approach

**Server-First Data Fetching:**

1. **React Server Components (RSC):**
   - Primary data fetching mechanism
   - Direct database queries via Supabase client
   - No client-side waterfalls
   - Example: Dashboard page fetches user data, usage limits, ideas in parallel server-side

2. **Server Actions:**
   - Form submissions (idea generation, content creation)
   - Mutations (create, update, delete)
   - Located in `modules/*/actions/index.ts`
   - CSRF protection via `csrf-server-action.ts`

3. **API Routes:**
   - Third-party integrations (Reddit OAuth, Razorpay webhooks)
   - Complex business logic requiring middleware
   - Background job triggers (cron jobs)

4. **Client-Side Fetching (Minimal):**
   - Real-time updates (usage quotas after action)
   - Optimistic UI updates
   - Polling for long-running operations (AI generation)

**Caching Strategy:**
- **Redis (Upstash)**: Reddit posts (4h TTL), rate limits, session data
- **Next.js Cache**: RSC responses, static pages (ISR)
- **HTTP Cache-Control**: Vercel CDN for static assets

---

## 3. Data Architecture

### 3.1 Database Schema

**PostgreSQL via Supabase - 6 Core Tables**

#### users
Primary user account table with plan and subscription tracking.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  plan_type plan_type DEFAULT 'free',
  subscription_status subscription_status DEFAULT 'inactive',
  stripe_customer_id TEXT,              -- ⚠️ Legacy field (rename to razorpay_customer_id)
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enums
CREATE TYPE plan_type AS ENUM ('free', 'pro_monthly', 'pro_yearly');
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'inactive', 'cancelled');
```

**⚠️ MIGRATION REQUIRED:** The database currently uses legacy Stripe field names. This is a naming issue only - the application uses Razorpay, not Stripe. Required migration:

```sql
-- Rename stripe_customer_id to razorpay_customer_id
ALTER TABLE users RENAME COLUMN stripe_customer_id TO razorpay_customer_id;
```

**Indexes:**
- `users_email_idx` on `email` (unique)
- `users_stripe_customer_id_idx` on `stripe_customer_id` (⚠️ rename to `users_razorpay_customer_id_idx`)
- `users_plan_type_idx` on `plan_type` (filter queries)

#### subscriptions
Razorpay subscription details linked to users.

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_type plan_type NOT NULL,
  stripe_subscription_id TEXT,           -- ⚠️ Legacy field (rename to razorpay_subscription_id)
  stripe_price_id TEXT NOT NULL,         -- ⚠️ Legacy field (rename to razorpay_plan_id)
  status subscription_status DEFAULT 'inactive',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**⚠️ MIGRATION REQUIRED:** Rename Stripe legacy fields to Razorpay:

```sql
-- Rename subscription table fields
ALTER TABLE subscriptions RENAME COLUMN stripe_subscription_id TO razorpay_subscription_id;
ALTER TABLE subscriptions RENAME COLUMN stripe_price_id TO razorpay_plan_id;
```

**Indexes:**
- `subscriptions_user_id_idx` on `user_id`
- `subscriptions_stripe_subscription_id_idx` (⚠️ rename to `subscriptions_razorpay_subscription_id_idx`)

#### usage_limits
Monthly usage tracking and quota enforcement.

```sql
CREATE TABLE usage_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_type plan_type NOT NULL,
  monthly_limit_ideas INTEGER NOT NULL,
  monthly_limit_validations INTEGER NOT NULL,
  ideas_generated INTEGER DEFAULT 0,
  validations_completed INTEGER DEFAULT 0,
  reset_date TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Constraints:**
- `ideas_generated <= monthly_limit_ideas`
- `validations_completed <= monthly_limit_validations`

**Indexes:**
- `usage_limits_user_id_idx` on `user_id`
- `usage_limits_reset_date_idx` on `reset_date` (cron job queries)

#### startup_ideas
Core business object storing validated startup ideas.

```sql
CREATE TABLE startup_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  problem_statement TEXT NOT NULL,
  solution JSONB NOT NULL,              -- {description, features[], differentiators[]}
  target_market JSONB NOT NULL,         -- {segments[], size, geography}
  market_analysis JSONB NOT NULL,       -- {competitors[], trends[], opportunities[]}
  implementation JSONB NOT NULL,        -- {mvp_features[], timeline, resources}
  success_metrics JSONB NOT NULL,       -- {kpis[], targets[], validation_criteria[]}
  ai_confidence_score NUMERIC(3,2),     -- 0.00 to 1.00 (GPT-4 viability score)
  validation_data JSONB,                -- {experiments[], results[], learnings[]}
  source_data JSONB,                    -- {reddit_posts[], other_sources[]}
  is_validated BOOLEAN DEFAULT FALSE,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `startup_ideas_user_id_idx` on `user_id`
- `startup_ideas_is_favorite_idx` on `is_favorite` WHERE `is_favorite = TRUE`
- `startup_ideas_created_at_idx` on `created_at DESC` (recent ideas)
- GIN index on `source_data` for JSONB queries

#### reddit_posts
Cached Reddit posts with AI analysis metadata.

```sql
CREATE TABLE reddit_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reddit_id TEXT UNIQUE NOT NULL,
  subreddit TEXT NOT NULL,
  author TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  url TEXT,
  score INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  created_utc TIMESTAMPTZ NOT NULL,
  hash TEXT NOT NULL,                   -- Deduplication hash
  sentiment NUMERIC(3,2),               -- -1.00 to 1.00 (AI sentiment analysis)
  intent_flags TEXT[],                  -- ['pain_point', 'feature_request', 'complaint']
  analysis_data JSONB,                  -- {themes[], patterns[], insights[]}
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `reddit_posts_reddit_id_idx` on `reddit_id` (unique)
- `reddit_posts_subreddit_idx` on `subreddit`
- `reddit_posts_created_utc_idx` on `created_utc DESC`
- `reddit_posts_hash_idx` on `hash` (deduplication)
- GIN index on `intent_flags` for array queries
- GIN index on `analysis_data` for JSONB queries

#### generated_content
Marketing content generated via OpenAI (blog posts, social media).

```sql
CREATE TABLE generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  startup_idea_id UUID REFERENCES startup_ideas(id) ON DELETE SET NULL,
  content_type TEXT NOT NULL,           -- 'blog_post', 'twitter_thread', 'linkedin_post'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  brand_voice TEXT,                     -- 'professional', 'casual', 'technical'
  seo_keywords TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `generated_content_user_id_idx` on `user_id`
- `generated_content_startup_idea_id_idx` on `startup_idea_id`
- `generated_content_content_type_idx` on `content_type`

### 3.2 Data Models and Relationships

```
users (1) ──────────┬──────── (N) startup_ideas
                    ├──────── (N) subscriptions
                    ├──────── (N) usage_limits
                    └──────── (N) generated_content

startup_ideas (1) ── (N) generated_content

reddit_posts        (independent - cached data, no FK relationships)
```

**Key Relationships:**
1. **users → startup_ideas**: One-to-many (user owns multiple ideas)
2. **users → subscriptions**: One-to-many (historical subscriptions)
3. **users → usage_limits**: One-to-one active record (current month)
4. **startup_ideas → generated_content**: One-to-many (idea can have multiple content pieces)
5. **reddit_posts**: No FK relationships (cached aggregate data, referenced via JSONB in `startup_ideas.source_data`)

**Row-Level Security (RLS) Policies:**

All tables have RLS enabled via Supabase:

```sql
-- users: Users can only read/update their own record
CREATE POLICY users_select_own ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_update_own ON users FOR UPDATE USING (auth.uid() = id);

-- startup_ideas: Users can CRUD their own ideas
CREATE POLICY ideas_all_own ON startup_ideas FOR ALL USING (auth.uid() = user_id);

-- usage_limits: Users can read their own limits
CREATE POLICY usage_select_own ON usage_limits FOR SELECT USING (auth.uid() = user_id);

-- subscriptions: Users can read their own subscriptions
CREATE POLICY subs_select_own ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- reddit_posts: Public read (cached data)
CREATE POLICY reddit_select_all ON reddit_posts FOR SELECT TO authenticated USING (true);

-- generated_content: Users can CRUD their own content
CREATE POLICY content_all_own ON generated_content FOR ALL USING (auth.uid() = user_id);
```

### 3.3 Data Migrations Strategy

**Supabase Migrations (SQL-based):**

Location: `/supabase/migrations/*.sql`

**Migration Naming Convention:**
```
YYYYMMDD_HHMMSS_descriptive_name.sql
```

**Current Migrations:**
1. `20250829174112_create_initial_schema.sql` - Initial tables (users, startup_ideas, subscriptions)
2. `20250830032313_create_rate_limits_table.sql` - Rate limiting for API abuse prevention
3. `20250830033600_create_security_events_table.sql` - Security audit logging
4. `20250904035058_create_reddit_trend_engine_tables.sql` - reddit_posts table
5. `20250904035134_create_reddit_trend_rls_policies.sql` - RLS policies for reddit_posts
6. `20250904035158_create_reddit_trend_indexes.sql` - Performance indexes
7. `20250113000000_create_reddit_posts_table.sql` - Reddit posts schema update
8. `20250113000001_update_pricing_strategy_free_premium.sql` - Free tier + premium pricing
9. `20241009_update_plan_types.sql` - Plan type enum expansion

**Migration Workflow:**
```bash
# Local development
supabase db reset                    # Reset local DB to clean state
supabase migration new <name>        # Create new migration
supabase db push                     # Apply to local DB

# Production deployment
supabase db push --linked           # Apply to production (via Supabase dashboard)
npm run db:types                    # Regenerate TypeScript types
```

**Migration Best Practices:**
- ✅ Idempotent migrations (use `CREATE TABLE IF NOT EXISTS`)
- ✅ Separate DDL (schema) and DML (data) migrations
- ✅ Test locally before production push
- ✅ Backward-compatible changes when possible
- ✅ RLS policies created in separate migration files

**Rollback Strategy:**
- No automatic rollback (PostgreSQL migrations are committed)
- Manual rollback migrations created for critical changes
- Database backups via Supabase (daily automated backups, point-in-time recovery)

---

## 4. API Design

### 4.1 API Structure

**Three-Layer API Architecture:**

1. **Next.js App Router API Routes** (`app/api/`)
   - Webhook handlers (Razorpay, external services)
   - OAuth callbacks (Reddit API)
   - Complex middleware chains (rate limiting, auth)

2. **Server Actions** (`modules/*/actions/`)
   - Form submissions
   - CRUD operations
   - Mutation-heavy flows
   - Direct database access via Supabase client

3. **Server Utilities** (`server/queries/`)
   - Reusable database queries
   - Data access layer (DAL)
   - Shared business logic

**Why This Architecture:**
- **Server Actions**: Simplify form handling, automatic revalidation, progressive enhancement
- **API Routes**: Required for webhooks, OAuth, and third-party integrations
- **Server Utilities**: DRY principle, shared queries across routes and actions

### 4.2 API Routes

**Authentication & Authorization:**
```
POST   /api/auth/signup              # Create new user account
POST   /api/auth/signin              # Email/password login
POST   /api/auth/signout             # Logout
POST   /api/auth/forgot-password     # Initiate password reset
POST   /api/auth/reset-password      # Complete password reset
GET    /api/auth/verify-email        # Email verification callback
```

**Reddit Integration:**
```
GET    /api/reddit/oauth/authorize   # Initiate Reddit OAuth flow
GET    /api/reddit/oauth/callback    # OAuth callback handler
POST   /api/reddit/fetch-posts       # Fetch posts from subreddits
GET    /api/reddit/posts/:id         # Get cached post details
```

**Startup Ideas:**
```
POST   /api/ideas/generate           # Generate idea from Reddit data
GET    /api/ideas                    # List user's ideas (paginated)
GET    /api/ideas/:id                # Get idea details
PATCH  /api/ideas/:id                # Update idea
DELETE /api/ideas/:id                # Delete idea
POST   /api/ideas/:id/favorite       # Toggle favorite
```

**Billing & Subscriptions:**
```
POST   /api/billing/create-checkout   # Create Razorpay checkout session
POST   /api/billing/webhooks/razorpay # Razorpay webhook handler
GET    /api/billing/plans             # List available plans
POST   /api/billing/cancel            # Cancel subscription
GET    /api/billing/portal            # Get billing portal URL
```

**Content Generation:**
```
POST   /api/content/generate          # Generate marketing content
GET    /api/content                   # List user's generated content
DELETE /api/content/:id               # Delete content
```

**Usage Tracking:**
```
GET    /api/usage/limits              # Get current usage limits
POST   /api/usage/reconcile           # Manual usage reconciliation (admin)
```

### 4.3 Server Actions and Mutations

**Authentication Actions** (`modules/auth/actions/`)
```typescript
// modules/auth/actions/index.ts
export async function signUpAction(formData: FormData): Promise<ActionResult>
export async function signInAction(formData: FormData): Promise<ActionResult>
export async function signOutAction(): Promise<void>
export async function resetPasswordAction(formData: FormData): Promise<ActionResult>
```

**Idea Actions** (`modules/ideas/actions/`)
```typescript
// modules/ideas/actions/index.ts
export async function generateIdeaAction(data: GenerateIdeaInput): Promise<StartupIdea>
export async function updateIdeaAction(id: string, data: UpdateIdeaInput): Promise<StartupIdea>
export async function deleteIdeaAction(id: string): Promise<void>
export async function toggleFavoriteAction(id: string): Promise<StartupIdea>
```

**Content Actions** (`modules/content/actions/`)
```typescript
// modules/content/actions/index.ts
export async function generateContentAction(data: GenerateContentInput): Promise<GeneratedContent>
export async function deleteContentAction(id: string): Promise<void>
```

**Usage Actions** (`modules/usage/actions/`)
```typescript
// modules/usage/actions/usage.ts
export async function trackUsageAction(type: 'idea' | 'validation'): Promise<UsageLimits>
export async function getPlanLimitsAction(): Promise<UsageLimits>
```

**CSRF Protection:**
All server actions protected via `modules/auth/actions/csrf-server-action.ts`:
```typescript
export function withCSRF<T>(action: (formData: FormData) => Promise<T>) {
  return async (formData: FormData) => {
    const token = formData.get('csrf_token') as string
    await verifyCSRFToken(token)
    return action(formData)
  }
}
```

### 4.4 External API Integrations

**Reddit API (OAuth 2.0 + REST):**
- **Authentication**: User OAuth flow (distributed sending to avoid API bans)
- **Endpoints Used**:
  - `GET /api/v1/me` - User profile
  - `GET /r/{subreddit}/search` - Search posts by keyword
  - `GET /r/{subreddit}/top` - Top posts
  - `POST /api/compose` - Send direct messages (Pillar 2)
- **Rate Limits**: 60 requests/minute (user OAuth), 5 messages/day per user (app limit)
- **Caching**: Reddit posts cached 4 hours in `reddit_posts` table + Redis
- **Error Handling**: Exponential backoff, graceful degradation if API unavailable

**OpenAI API:**
- **Models Used**:
  - `gpt-4-turbo` - Viability scoring, idea generation, content writing
  - `text-embedding-ada-002` - Semantic search, pattern matching (Pillar 3)
- **Cost Controls**:
  - Aggressive caching of embeddings (permanent storage)
  - Batch processing for trend analysis
  - Token limits: 2000 tokens/request (viability scoring), 500 tokens/request (content generation)
  - Monthly budget cap: $500 (alerts at 80% threshold)
- **Error Handling**: Retry with exponential backoff, fallback to cached results

**Razorpay (Payments):**
- **Integration Type**: Server-side SDK + webhooks
- **Webhooks**:
  - `subscription.activated` - Update user plan
  - `subscription.cancelled` - Mark subscription cancelled
  - `payment.failed` - Send dunning email
- **Security**: Webhook signature verification via Razorpay SDK
- **Reconciliation**: Daily cron job to sync subscription status

**Mailgun (Email):**
- **Use Cases**: Verification emails, password reset, billing notifications
- **Templates**: HTML templates stored in `modules/auth/services/email-mailgun-official.ts`
- **Deliverability**: SPF/DKIM configured, dedicated IP (if volume increases)
- **Rate Limits**: 10,000 emails/month (free tier)

---

## 5. Authentication and Authorization

### 5.1 Auth Strategy

**Supabase Auth + Custom Password Hashing:**

- **Primary Auth**: Supabase Auth (email/password, OAuth providers)
- **Password Security**: Argon2 hashing (argon2 v0.44.0) - more secure than bcrypt
- **Session Management**: Server-side sessions via `@supabase/ssr` (HttpOnly cookies)
- **CSRF Protection**: Double-submit cookie pattern (`modules/auth/utils/csrf.ts`)

**Auth Flow:**
1. User signs up/signs in via Supabase Auth
2. Password hashed with Argon2 before storage
3. JWT token issued by Supabase (1-hour expiry, auto-refresh)
4. Session stored in HttpOnly cookie (secure, SameSite=Lax)
5. Middleware validates session on protected routes

### 5.2 Session Management

**Server-Side Sessions (Next.js App Router):**

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'

export async function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
```

**Session Persistence:**
- **Storage**: HttpOnly cookies (not accessible via JavaScript)
- **Expiry**: 1 hour (JWT), auto-refresh on valid session
- **Security Headers**:
  - `Secure`: HTTPS only
  - `SameSite=Lax`: CSRF protection
  - `HttpOnly`: XSS protection

### 5.3 Protected Routes

**Middleware-Based Protection:**

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const supabase = createServerClient(/* ... */)
  const { data: { session } } = await supabase.auth.getSession()

  // Protect /dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }
  }

  // Redirect authenticated users away from auth pages
  if (request.nextUrl.pathname.startsWith('/auth')) {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
}
```

**Protected Route Groups:**
- `/dashboard/*` - Requires authentication
- `/api/ideas/*` - Requires authentication
- `/api/billing/*` - Requires authentication

**Public Routes:**
- `/` - Landing page
- `/auth/*` - Sign in, sign up, reset password
- `/T&C`, `/privacy_policy`, `/refund_policy` - Legal pages

### 5.4 Role-Based Access Control

**Current Implementation (Single-Tier):**
- **Roles**: Authenticated user (single role)
- **Authorization**: Plan-based feature access (free vs. pro)

**Plan-Based Feature Gates:**

```typescript
// modules/usage/hooks/use-plan-limits.ts
export function usePlanLimits() {
  const { user } = useAuth()
  const planType = user?.plan_type ?? 'free'

  return {
    canGenerateIdea: usage.ideas_generated < limits.monthly_limit_ideas,
    canValidateIdea: usage.validations_completed < limits.monthly_limit_validations,
    canAccessTrends: planType !== 'free', // Pillar 1 premium feature
    canSendMessages: planType !== 'free', // Pillar 2 (paid tier)
  }
}
```

**Future RBAC (Pillar 3+):**
- **Admin Role**: Dashboard access, usage analytics, manual reconciliation
- **Beta Tester Role**: Early access to Pillar 3 features
- Implementation: Add `role` column to `users` table + RLS policy updates

---

## 6. State Management

### 6.1 Server State

**React Server Components (Primary):**
- All server-side data fetching via RSC
- No client-side data fetching libraries (no React Query, SWR)
- Direct database queries in server components

**Example (Dashboard Page):**
```typescript
// app/(dashboard)/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Parallel data fetching
  const [
    { data: user },
    { data: ideas },
    { data: usageLimits },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('startup_ideas').select('*').order('created_at', { ascending: false }),
    supabase.from('usage_limits').select('*').eq('user_id', userId).single(),
  ])

  return <DashboardContent user={user} ideas={ideas} usageLimits={usageLimits} />
}
```

**Benefits:**
- No client-side data fetching waterfalls
- Reduced bundle size (no data fetching library)
- Automatic revalidation via Next.js cache

### 6.2 Client State

**Minimal Client State (No Global State Library):**

**React useState for Local UI State:**
- Form inputs (controlled components)
- Modal open/close state
- Toast notifications
- Dropdown selections

**URL State for Sharable State:**
- Search query parameters
- Pagination (page number)
- Filters (subreddit, date range)

**Example (Search Filters):**
```typescript
// components/features/reddit-search.tsx
'use client'

export function RedditSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const subreddit = searchParams.get('subreddit') ?? 'all'
  const query = searchParams.get('q') ?? ''

  function handleSearch(newQuery: string) {
    const params = new URLSearchParams(searchParams)
    params.set('q', newQuery)
    router.push(`/dashboard/generate?${params.toString()}`)
  }

  return <SearchInput value={query} onChange={handleSearch} />
}
```

**No Zustand/Redux/Jotai:**
- Server state managed by RSC + Supabase
- Client state kept minimal in React useState
- Complex client state deferred to future (Pillar 3 real-time features may require Zustand)

### 6.3 Form State

**react-hook-form + zod Validation:**

```typescript
// components/auth/signup-form.tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
})

export function SignupForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(signupSchema),
  })

  async function onSubmit(data: z.infer<typeof signupSchema>) {
    await signUpAction(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      {/* ... */}
    </form>
  )
}
```

**Form State Best Practices:**
- Controlled components via `register()`
- Schema validation before submission
- Optimistic UI updates (ideas list, content library)
- Server action revalidation on success

### 6.4 Caching Strategy

**Multi-Layer Caching:**

1. **Next.js Cache (Default):**
   - RSC responses cached automatically
   - Static pages cached indefinitely
   - Dynamic pages cached per request

2. **Redis Cache (Upstash):**
   - **Reddit posts**: 4-hour TTL (reduce API calls)
   - **Rate limits**: 1-minute TTL (prevent abuse)
   - **Session data**: 1-hour TTL (JWT refresh)

   ```typescript
   // lib/services/redis.ts
   import Redis from 'ioredis'

   export const redis = new Redis(process.env.UPSTASH_REDIS_URL!)

   export async function getCachedRedditPosts(subreddit: string) {
     const cached = await redis.get(`reddit:${subreddit}`)
     if (cached) return JSON.parse(cached)

     const posts = await fetchRedditPosts(subreddit)
     await redis.setex(`reddit:${subreddit}`, 14400, JSON.stringify(posts)) // 4 hours
     return posts
   }
   ```

3. **Database-Level Caching:**
   - `reddit_posts` table caches Reddit API responses
   - Deduplication via `hash` column (avoid duplicate fetches)

4. **Vercel CDN:**
   - Static assets (images, fonts) cached globally
   - Cache-Control headers for marketing pages: `public, max-age=3600, stale-while-revalidate=86400`

**Cache Invalidation:**
- Manual revalidation: `revalidatePath('/dashboard')` in server actions
- Time-based: ISR (Incremental Static Regeneration) for marketing pages
- Event-based: Webhook handlers clear relevant cache keys

---

## 7. UI/UX Architecture

### 7.1 Component Structure

**Three-Tier Component Architecture:**

```
components/
├── ui/                     # shadcn/ui base components (Radix UI primitives)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── tabs.tsx
│   └── ... (25+ components)
├── features/               # Domain-specific composite components
│   ├── idea-card.tsx       # Idea list item
│   ├── idea-detail.tsx     # Idea detail page
│   ├── reddit-search.tsx   # Reddit search UI
│   ├── trend-chart.tsx     # Recharts trend visualization
│   └── content-editor.tsx  # Content generation UI
└── auth/                   # Auth-specific components
    ├── signup-form.tsx
    ├── signin-form.tsx
    └── password-reset-form.tsx
```

**Component Naming Conventions:**
- **Base UI**: Lowercase with hyphens (`button.tsx`, `dialog.tsx`)
- **Feature Components**: PascalCase (`IdeaCard.tsx`, `TrendChart.tsx`)
- **Page Components**: `page.tsx` (Next.js App Router convention)

**shadcn/ui Components (Installed):**

Base components available via `npx shadcn@latest add <component>`:

- **Forms**: button, input, select, checkbox, radio-group, label
- **Feedback**: dialog, toast (sonner), progress, avatar
- **Layout**: card, separator, tabs, accordion, scroll-area
- **Navigation**: dropdown-menu, navigation-menu
- **Data Display**: tooltip

All components:
- Built on Radix UI primitives (accessible, keyboard-navigable)
- Customizable via Tailwind CSS
- Type-safe with TypeScript
- WCAG 2.1 AA compliant

### 7.2 Styling Approach

**Tailwind CSS 4 + CSS Variables:**

**Tailwind Configuration:**
```javascript
// tailwind.config.ts (Tailwind 4 - CSS-first config)
@import "tailwindcss";

@theme {
  --color-primary-50: #eff6ff;
  --color-primary-500: #3b82f6;
  --color-primary-700: #1d4ed8;

  --color-success-500: #22c55e;
  --color-warning-500: #eab308;
  --color-danger-500: #ef4444;

  --font-sans: Inter, system-ui, sans-serif;
  --font-display: "Space Grotesk", Inter, sans-serif;
}
```

**Design Tokens (from UX Spec):**
- **Colors**: Primary blue (#3b82f6), semantic colors (success, warning, danger)
- **Typography**: Inter (body), Space Grotesk (headings)
- **Spacing**: 4px base unit, 8-128px scale
- **Breakpoints**: sm(640px), md(768px), lg(1024px), xl(1280px), 2xl(1536px)

**Component Styling Pattern:**
```typescript
// components/ui/button.tsx
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary-500 text-white hover:bg-primary-700',
        outline: 'border border-primary-500 text-primary-500 hover:bg-primary-50',
        ghost: 'hover:bg-gray-100',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return <button className={buttonVariants({ variant, size, className })} {...props} />
}
```

**CSS Utilities:**
- `clsx`: Conditional class merging
- `tailwind-merge`: Prevents Tailwind class conflicts

### 7.3 Responsive Design

**Mobile-First Approach:**

**Target Devices:**
- **Mobile**: iPhone SE (320px) → iPhone 14 (390px)
- **Tablet**: iPad (768px) → iPad Pro (1024px)
- **Desktop**: Laptop (1440px) → Large desktop (1920px)

**Responsive Patterns (from UX Spec):**

1. **Navigation:**
   - Mobile: Bottom tab bar (fixed, 4 primary actions)
   - Tablet: Side navigation (collapsed by default)
   - Desktop: Full sidebar navigation

2. **Idea Cards:**
   - Mobile: 1 column, full-width
   - Tablet: 2 columns, grid gap-4
   - Desktop: 3 columns, grid gap-6

3. **Dashboard Layout:**
   - Mobile: Stacked sections (usage → recent ideas → trends)
   - Tablet: 2-column grid (usage + trends | recent ideas)
   - Desktop: 3-column grid (sidebar | main | insights)

**Responsive Utility Classes:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
  {ideas.map(idea => <IdeaCard key={idea.id} idea={idea} />)}
</div>
```

### 7.4 Accessibility

**WCAG 2.1 Level AA Compliance:**

**Color Contrast:**
- Primary blue on white: 4.5:1 (AA pass)
- Text on backgrounds: Minimum 4.5:1 (body), 3:1 (large text)
- Error states: Red (#ef4444) with icon + text (not color-only)

**Keyboard Navigation:**
- All interactive elements focusable (buttons, links, form inputs)
- Visible focus indicators: 2px blue ring (`ring-2 ring-primary-500 ring-offset-2`)
- Skip to content link for screen readers
- Escape key closes modals/dialogs

**Screen Reader Support:**
- Semantic HTML (`<nav>`, `<main>`, `<article>`, `<aside>`)
- ARIA labels for icon-only buttons
- ARIA live regions for dynamic content (toast notifications, loading states)
- Alt text for images (decorative images: `alt=""`)

**Touch Targets:**
- Minimum 44x44px on mobile (iOS Human Interface Guidelines)
- Minimum 32x32px on desktop
- Adequate spacing between clickable elements (8px minimum)

**Motion Preferences:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Accessibility Testing:**
- Playwright E2E tests include accessibility audits
- Manual keyboard navigation testing per release
- Screen reader testing (VoiceOver on macOS, NVDA on Windows)

---

## 8. Performance Optimization

### 8.1 SSR Caching

**Next.js ISR (Incremental Static Regeneration):**

```typescript
// app/(marketing)/(home)/page.tsx
export const revalidate = 3600 // Revalidate every 1 hour

export default async function HomePage() {
  const stats = await getMarketingStats() // Cached for 1 hour
  return <LandingPage stats={stats} />
}
```

**Vercel Edge Caching:**
- Marketing pages: `Cache-Control: public, max-age=3600, stale-while-revalidate=86400`
- Static assets: `Cache-Control: public, max-age=31536000, immutable`

### 8.2 Static Generation

**Marketing Pages (SSG):**
- Landing page (`/`)
- Legal pages (`/T&C`, `/privacy_policy`, `/refund_policy`)

**Build-Time Generation:**
```bash
next build # Generates static HTML for SSG pages
```

**Benefits:**
- Near-instant page loads (<100ms TTFB)
- Global CDN distribution via Vercel
- SEO optimization (full HTML on first load)

### 8.3 Image Optimization

**Next.js Image Component:**

```tsx
import Image from 'next/image'

<Image
  src="/design-reference/landing-hero.png"
  alt="StartupSniff dashboard preview"
  width={1920}
  height={1080}
  priority // Above-the-fold images
  placeholder="blur" // LQIP (low-quality image placeholder)
/>
```

**Optimizations:**
- Automatic WebP/AVIF conversion
- Responsive image srcset (multiple resolutions)
- Lazy loading (below-the-fold images)
- Blur-up placeholders (better perceived performance)

### 8.4 Code Splitting

**Automatic Code Splitting (Next.js Default):**
- Each route automatically split into separate bundle
- Shared components extracted to common chunk
- Dynamic imports for heavy components

**Manual Code Splitting (Dynamic Imports):**

```typescript
// Heavy chart component loaded only when needed
import dynamic from 'next/dynamic'

const TrendChart = dynamic(() => import('@/components/features/trend-chart'), {
  loading: () => <Skeleton className="h-64 w-full" />,
  ssr: false, // Client-side only (recharts not SSR-compatible)
})

export function TrendsPage() {
  return <TrendChart data={trendData} />
}
```

**Bundle Analysis:**
```bash
ANALYZE=true npm run build # Generate bundle size report
```

**Target Bundle Sizes:**
- First Load JS: <100KB (critical path)
- Total JS: <300KB (entire app)
- Route bundles: <50KB each

---

## 9. SEO and Meta Tags

### 9.1 Meta Tag Strategy

**Next.js Metadata API:**

```typescript
// app/(marketing)/(home)/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'StartupSniff - Turn Reddit Pain Points Into Validated Startup Ideas',
  description: 'AI-powered startup idea generation from Reddit. Discover pain points, validate with human contact, and build defensible network intelligence. Free tier available.',
  keywords: ['startup ideas', 'reddit validation', 'customer development', 'pain point discovery'],
  openGraph: {
    title: 'StartupSniff - AI-Powered Startup Idea Validation',
    description: 'Transform Reddit pain points into validated startup ideas in 60-90 days.',
    url: 'https://startupsniff.com',
    siteName: 'StartupSniff',
    images: [
      {
        url: 'https://startupsniff.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'StartupSniff dashboard preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StartupSniff - Validate Startup Ideas Faster',
    description: 'AI-powered idea discovery and validation platform for anxious first-time founders.',
    images: ['https://startupsniff.com/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}
```

**Dynamic Metadata (Idea Detail Pages):**

```typescript
// app/(dashboard)/dashboard/ideas/[id]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const idea = await getIdeaById(params.id)

  return {
    title: `${idea.title} - StartupSniff`,
    description: idea.problem_statement.slice(0, 160),
    openGraph: {
      title: idea.title,
      description: idea.problem_statement,
      type: 'article',
    },
  }
}
```

### 9.2 Sitemap

**Dynamic Sitemap Generation:**

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://startupsniff.com'

  // Static pages
  const staticPages = ['', '/T&C', '/privacy_policy', '/refund_policy', '/contact'].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1.0 : 0.5,
  }))

  // Public blog posts (future)
  const blogPosts = await getPublicBlogPosts()
  const blogPages = blogPosts.map(post => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...blogPages]
}
```

### 9.3 Structured Data

**JSON-LD Schema (Organization):**

```typescript
// app/(marketing)/(home)/page.tsx
export default function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'StartupSniff',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free tier with 5 ideas/month, Pro tier $20/month',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '127',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage />
    </>
  )
}
```

---

## 10. Deployment Architecture

### 10.1 Hosting Platform

**Vercel (Next.js Optimized):**

**Deployment Configuration:**
```json
// vercel.json
{
  "buildCommand": "next build",
  "devCommand": "next dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase_anon_key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase_service_role_key",
    "OPENAI_API_KEY": "@openai_api_key",
    "UPSTASH_REDIS_URL": "@upstash_redis_url",
    "RAZORPAY_KEY_ID": "@razorpay_key_id",
    "RAZORPAY_KEY_SECRET": "@razorpay_key_secret",
    "MAILGUN_API_KEY": "@mailgun_api_key"
  }
}
```

**Regions:**
- Primary: `iad1` (Washington, D.C., USA)
- Rationale: Target audience primarily US-based, lowest latency to Supabase US East

### 10.2 CDN Strategy

**Vercel Edge Network:**
- 100+ global edge locations
- Automatic asset optimization (compression, format conversion)
- Cache-Control headers respected

**Static Asset Caching:**
```typescript
// next.config.ts
export default {
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png|webp|avif|woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}
```

### 10.3 Edge Functions

**Middleware (Edge Runtime):**

```typescript
// middleware.ts
export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
  runtime: 'edge', // Runs on Vercel Edge (sub-50ms latency)
}

export async function middleware(request: NextRequest) {
  // Auth check, CSRF validation, rate limiting
  // Runs globally at edge (no cold starts)
}
```

**Use Cases:**
- Authentication checks
- Rate limiting
- A/B testing (feature flags)
- Geo-based redirects (future internationalization)

### 10.4 Environment Configuration

**Environment Variables:**

```bash
# .env.local (local development)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
SUPABASE_SERVICE_ROLE_KEY=eyJhb... # Server-side only
OPENAI_API_KEY=sk-...
UPSTASH_REDIS_URL=rediss://...
RAZORPAY_KEY_ID=rzp_...
RAZORPAY_KEY_SECRET=xxx
MAILGUN_API_KEY=xxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Production Secrets (Vercel Environment Variables):**
- Stored securely in Vercel project settings
- Encrypted at rest
- Scoped to production/preview/development environments
- Auto-injected during build and runtime

**Secret Rotation:**
- Quarterly rotation for API keys
- Immediate rotation on suspected compromise
- Supabase service role key rotated via dashboard

---

## 11. Component and Integration Overview

### 11.1 Major Modules

**Domain Modules (Business Logic):**

1. **auth** (`modules/auth/`)
   - User authentication (sign up, sign in, sign out)
   - Password hashing (argon2)
   - Session management (@supabase/ssr)
   - CSRF protection
   - Security event logging
   - JWT token handling (jose)
   - Email verification and password reset

2. **billing** (`modules/billing/`)
   - Razorpay integration (checkout, webhooks)
   - Subscription management (create, cancel, update)
   - Plan limits enforcement
   - Invoice generation
   - Dunning management (failed payments)

3. **usage** (`modules/usage/`)
   - Usage tracking (ideas generated, validations completed)
   - Quota enforcement (prevent over-usage)
   - Monthly reset automation (cron job)
   - Reconciliation (sync usage with actual records)
   - Plan limits hooks (usePlanLimits, useServerPlanLimits)

4. **ideas** (`modules/ideas/`)
   - Startup idea generation (OpenAI GPT-4)
   - Idea CRUD operations
   - Favorite management
   - Viability scoring (AI confidence)
   - Validation tracking

5. **reddit** (`modules/reddit/`)
   - Reddit OAuth flow (user authorization)
   - Post fetching (cross-subreddit search)
   - Rate limiting (60 req/min per user)
   - Post caching (4-hour TTL)
   - Deduplication (hash-based)

6. **ai** (`modules/ai/`)
   - OpenAI integration (GPT-4, embeddings)
   - Viability scoring engine
   - Pattern recognition (Pillar 3)
   - Content generation
   - Cost tracking and budget enforcement

7. **content** (`modules/content/`)
   - Marketing content generation (blog posts, social media)
   - SEO keyword optimization
   - Brand voice selection
   - Content library management

8. **contact** (`modules/contact/`)
   - Email service (Mailgun)
   - Contact form handling
   - Transactional emails (verification, password reset)

9. **validation** (`modules/validation/`)
   - Experiment tracking (human contact attempts)
   - Results logging
   - Success metrics calculation
   - Network intelligence data collection (Pillar 3)

10. **marketing** (`modules/marketing/`)
    - Landing page content
    - SEO optimization
    - Analytics integration (Vercel Analytics)
    - Conversion tracking

### 11.2 Page Structure

**App Router Organization:**

```
app/
├── (marketing)/              # Public marketing pages (SSG)
│   ├── layout.tsx           # Marketing layout (header, footer)
│   ├── (home)/page.tsx      # Landing page (/)
│   ├── T&C/page.tsx         # Terms & Conditions
│   ├── privacy_policy/      # Privacy Policy
│   ├── refund_policy/       # Refund Policy
│   └── contact/page.tsx     # Contact form
│
├── (dashboard)/              # Protected dashboard (SSR)
│   ├── layout.tsx           # Dashboard layout (sidebar, header)
│   └── dashboard/
│       ├── page.tsx         # Dashboard home (ideas overview)
│       ├── generate/        # Pillar 1: Reddit extraction UI
│       ├── trends/          # Trend analysis dashboard
│       ├── content/         # Generated content library
│       ├── conversations/   # Pillar 2: Human contact tracking (future)
│       ├── insights/        # Pillar 3: Network intelligence (future)
│       └── settings/        # Account settings, billing
│
├── auth/                     # Authentication flows (SSR)
│   ├── layout.tsx           # Auth layout (centered, minimal)
│   ├── signin/page.tsx      # Sign in
│   ├── signup/page.tsx      # Sign up
│   ├── verify-email/        # Email verification
│   ├── forgot-password/     # Password reset request
│   └── reset-password/      # Password reset completion
│
├── api/                      # API routes (server-side)
│   ├── auth/                # Auth endpoints
│   ├── ideas/               # Idea CRUD
│   ├── reddit/              # Reddit OAuth, data fetching
│   ├── billing/             # Razorpay webhooks
│   ├── content/             # Content generation
│   └── webhooks/            # External webhooks
│
├── layout.tsx                # Root layout (providers, fonts)
├── globals.css               # Global styles (Tailwind base)
├── icon.tsx                  # App icon (favicon)
└── middleware.ts             # Auth, CSRF, rate limiting
```

### 11.3 Shared Components

**UI Components (`components/ui/`):**

shadcn/ui base components (25+ components):
- **Forms**: Button, Input, Select, Checkbox, RadioGroup, Label
- **Feedback**: Dialog, Toast, Progress, Avatar, Badge
- **Layout**: Card, Separator, Tabs, Accordion, ScrollArea
- **Navigation**: DropdownMenu, NavigationMenu, Tooltip

**Feature Components (`components/features/`):**

Domain-specific composite components:
- **IdeaCard**: Idea list item (title, description, viability score, actions)
- **IdeaDetail**: Full idea detail page (problem, solution, market, implementation)
- **RedditSearch**: Reddit search UI (subreddit selector, keyword input, filters)
- **TrendChart**: Recharts visualization (trend analysis over time)
- **ContentEditor**: Rich text editor for generated content
- **UsageBadge**: Current usage vs. limits (progress bar, upgrade CTA)
- **PlanComparisonTable**: Free vs. Pro feature comparison

**Auth Components (`components/auth/`):**

Authentication-specific forms:
- **SignupForm**: Email, password, full name input
- **SigninForm**: Email, password input
- **PasswordResetForm**: Email input for password reset
- **VerifyEmailNotice**: Email verification reminder

### 11.4 Third-Party Integrations

**1. Supabase (Database + Auth):**
- **Integration Type**: Official SDK (@supabase/supabase-js, @supabase/ssr)
- **Features Used**: PostgreSQL, Auth, RLS, Realtime (future)
- **Configuration**: Environment variables, middleware session handling
- **Data Flow**: Server components → Supabase client → PostgreSQL

**2. OpenAI (AI/LLM):**
- **Integration Type**: Official SDK (openai v5.16.0)
- **Models Used**: GPT-4 Turbo, text-embedding-ada-002
- **Cost Controls**: Token limits, monthly budget cap ($500), aggressive caching
- **Use Cases**: Viability scoring, idea generation, content writing, pattern recognition

**3. Upstash (Redis):**
- **Integration Type**: ioredis client
- **Use Cases**: Rate limiting, Reddit post caching (4h TTL), session storage
- **Configuration**: UPSTASH_REDIS_URL environment variable
- **Persistence**: In-memory cache with TTL-based expiration

**4. Razorpay (Payments):**
- **Integration Type**: Server-side SDK (razorpay v2.9.6)
- **Features Used**: Subscription management, checkout, webhooks
- **Webhook Events**: subscription.activated, subscription.cancelled, payment.failed
- **Security**: Signature verification, HTTPS-only webhooks

**5. Mailgun (Email):**
- **Integration Type**: Official SDK (mailgun.js v12.1.0)
- **Use Cases**: Transactional emails (verification, password reset, billing notifications)
- **Configuration**: MAILGUN_API_KEY, domain verification (SPF/DKIM)
- **Deliverability**: Dedicated IP (if volume increases), bounce handling

**6. Vercel Analytics:**
- **Integration Type**: Official package (@vercel/analytics v1.5.0)
- **Features Used**: Page views, custom events, conversion tracking
- **Privacy**: Privacy-friendly (GDPR compliant), no cookies
- **Implementation**: Single-line integration in root layout

**7. Reddit API:**
- **Integration Type**: REST API (OAuth 2.0)
- **Features Used**: User OAuth, post search, subreddit listings, direct messaging (Pillar 2)
- **Rate Limits**: 60 requests/minute (user OAuth), 5 messages/day (app limit)
- **Caching**: 4-hour TTL in redis + reddit_posts table

---

## 12. Architecture Decision Records

### Key Architectural Decisions

**1. Why Next.js 15 App Router?**
- **Decision**: Use Next.js 15 with App Router (not Pages Router)
- **Rationale**:
  - React Server Components eliminate client-side data fetching waterfalls
  - Server Actions simplify form submissions and mutations
  - Built-in SSR/SSG/ISR for SEO optimization
  - Excellent TypeScript support and developer experience
  - Vercel deployment optimization (zero-config)
  - Future-proof (App Router is the recommended approach)
- **Alternatives Considered**:
  - **Remix**: Better data fetching patterns, but smaller ecosystem and less mature
  - **SvelteKit**: Excellent DX, but React ecosystem is larger and team is more familiar
  - **Pure React SPA**: Poor SEO, slower initial load, complex state management
- **Trade-offs**: Steeper learning curve for App Router, but long-term benefits outweigh

**2. SSR vs SSG - Hybrid Approach**
- **Decision**: Hybrid SSR (dashboard) + SSG (marketing pages)
- **Rationale**:
  - Marketing pages rarely change → SSG for instant load times and SEO
  - Dashboard pages user-specific → SSR for personalization and security
  - Streaming SSR for progressive hydration (faster perceived performance)
- **Performance Impact**: Marketing pages <100ms TTFB, dashboard pages <500ms TTFB

**3. Database Choice - PostgreSQL via Supabase**
- **Decision**: Supabase (managed PostgreSQL) over self-hosted or other DBaaS
- **Rationale**:
  - **Generous free tier**: 500MB database, 2GB bandwidth (sufficient for MVP)
  - **Built-in auth**: Reduces custom auth code, proven security
  - **Row-Level Security**: Database-level authorization (defense in depth)
  - **TypeScript integration**: Auto-generated types from schema
  - **Real-time subscriptions**: Future Pillar 3 features (collaborative editing)
  - **Local development**: Supabase CLI for migrations and type generation
- **Alternatives Considered**:
  - **PlanetScale**: Great DX, but more expensive, no built-in auth
  - **Neon**: Serverless Postgres, but newer and less proven
  - **Self-hosted**: More control, but operational overhead for solo founder
- **Trade-offs**: Vendor lock-in, but migration path exists (standard PostgreSQL)

**4. Hosting Platform - Vercel**
- **Decision**: Vercel for hosting (not AWS, Netlify, or Cloudflare Pages)
- **Rationale**:
  - **Zero-config Next.js**: Optimal performance out-of-the-box
  - **Global CDN**: 100+ edge locations, automatic asset optimization
  - **Serverless functions**: Auto-scaling, no infrastructure management
  - **Preview deployments**: Every PR gets a staging URL
  - **Analytics integration**: Built-in performance monitoring
  - **Cost-effective**: $20/month Pro plan sufficient for 5,000 users
- **Alternatives Considered**:
  - **AWS Amplify**: More complex, slower deployments
  - **Netlify**: Good DX, but less optimized for Next.js
  - **Cloudflare Pages**: Great edge network, but Next.js support incomplete
- **Trade-offs**: Higher cost at scale (vs. self-hosted), but acceptable for bootstrapped MVP

**5. Monorepo vs Polyrepo**
- **Decision**: Monorepo (single repository)
- **Rationale**:
  - **Solo founder**: Simpler coordination, no cross-repo sync issues
  - **Shared types**: Database types, API contracts shared across frontend/backend
  - **Unified deployment**: Single build, deploy, and rollback
  - **Faster iteration**: No need to publish/consume internal packages
- **Future Consideration**: Extract modules to microservices if team grows or scale requires

**6. No Client-Side State Management Library**
- **Decision**: No Zustand, Redux, or Jotai (for now)
- **Rationale**:
  - **React Server Components**: Most state managed server-side
  - **URL state**: Filters, pagination in query parameters (shareable URLs)
  - **Local component state**: useState sufficient for UI state
  - **Reduced bundle size**: Eliminate 10-20KB of state management library
- **Future Consideration**: Pillar 3 real-time features may require Zustand for optimistic updates

**7. Styling - Tailwind CSS 4 + shadcn/ui**
- **Decision**: Tailwind CSS 4 with shadcn/ui (not CSS-in-JS or CSS Modules)
- **Rationale**:
  - **Rapid development**: Utility-first classes speed up prototyping
  - **Consistency**: Design tokens enforce consistent spacing, colors, typography
  - **Performance**: Zero runtime cost (compiled to CSS)
  - **shadcn/ui**: Accessible components (WCAG 2.1 AA), full customization, copy-paste approach
  - **Dark mode**: Built-in support via next-themes
- **Alternatives Considered**:
  - **CSS-in-JS (Emotion/Styled-components)**: Runtime cost, hydration issues
  - **CSS Modules**: More boilerplate, harder to enforce consistency
- **Trade-offs**: Large HTML class lists, but gzip compression mitigates

---

## 13. Implementation Guidance

### 13.1 Development Workflow

**Local Development Setup:**

```bash
# 1. Clone repository
git clone https://github.com/benjaminthomas/startup-sniff.git
cd startup-sniff

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# 4. Start Supabase local instance
supabase start

# 5. Run database migrations
supabase db reset

# 6. Generate TypeScript types from database
npm run db:types

# 7. Start development server
npm run dev
```

**Development Commands:**
```bash
npm run dev              # Start Next.js dev server (localhost:3000)
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Run ESLint
npm run test:e2e         # Run Playwright E2E tests
npm run test:e2e:ui      # Run Playwright with UI mode
npm run db:types         # Regenerate Supabase types
npm run db:reset         # Reset local database
supabase migration new <name>  # Create new migration
```

**Git Workflow:**
1. Create feature branch from `main`: `git checkout -b feature/reddit-oauth`
2. Make changes, commit frequently with descriptive messages
3. Push to remote: `git push origin feature/reddit-oauth`
4. Open Pull Request on GitHub
5. Vercel auto-deploys preview URL for testing
6. Merge to `main` after review
7. Vercel auto-deploys to production

### 13.2 File Organization

**Project Structure (Complete):**

```
startup-sniff/
├── .claude/                      # Claude Code configuration
│   ├── agents/                   # Custom agents
│   └── commands/                 # Custom slash commands
├── app/                          # Next.js App Router
│   ├── (marketing)/              # Marketing pages (SSG)
│   ├── (dashboard)/              # Dashboard pages (SSR)
│   ├── auth/                     # Auth pages (SSR)
│   ├── api/                      # API routes
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles
│   └── middleware.ts             # Middleware
├── bmad/                         # BMad workflow system (internal tooling)
├── components/                   # React components
│   ├── ui/                       # shadcn/ui base components
│   ├── features/                 # Domain components
│   └── auth/                     # Auth components
├── constants/                    # App constants
│   ├── contact/                  # Contact form constants
│   └── policies/                 # Legal policy text
├── docs/                         # Documentation
│   ├── PRD.md                    # Product Requirements
│   ├── epics.md                  # Epic breakdown
│   ├── ux-specification.md       # UX/UI spec
│   ├── solution-architecture.md  # This document
│   └── ...                       # Other docs
├── hooks/                        # Custom React hooks
├── lib/                          # Shared utilities
│   ├── data/                     # Data utilities
│   ├── reddit/                   # Reddit API client
│   ├── services/                 # External services (Redis, etc.)
│   ├── supabase/                 # Supabase clients (server, client)
│   └── utils/                    # Helper functions
├── modules/                      # Domain modules (business logic)
│   ├── ai/                       # OpenAI integration
│   ├── auth/                     # Authentication
│   ├── billing/                  # Razorpay integration
│   ├── contact/                  # Email service
│   ├── content/                  # Content generation
│   ├── ideas/                    # Idea management
│   ├── marketing/                # Marketing content
│   ├── reddit/                   # Reddit integration
│   ├── supabase/                 # Supabase utilities
│   ├── usage/                    # Usage tracking
│   └── validation/               # Experiment tracking
├── public/                       # Static assets
│   ├── design-reference/         # Design files
│   └── screenshots/              # App screenshots
├── server/                       # Server utilities
│   └── queries/                  # Database queries
├── styles/                       # Additional styles
├── supabase/                     # Supabase configuration
│   └── migrations/               # Database migrations
├── tests/                        # Playwright E2E tests
│   └── e2e/                      # E2E test specs
├── types/                        # TypeScript types
│   └── supabase.ts               # Auto-generated DB types
├── .env.local                    # Environment variables (gitignored)
├── .gitignore                    # Git ignore rules
├── components.json               # shadcn/ui config
├── eslint.config.mjs             # ESLint configuration
├── middleware.ts                 # Global middleware
├── next.config.ts                # Next.js configuration
├── package.json                  # Dependencies
├── playwright.config.ts          # Playwright config
├── postcss.config.mjs            # PostCSS config
├── tailwind.config.ts            # Tailwind config
├── tsconfig.json                 # TypeScript config
└── vercel.json                   # Vercel deployment config
```

### 13.3 Naming Conventions

**Files:**
- **React Components**: PascalCase (`IdeaCard.tsx`, `RedditSearch.tsx`)
- **UI Components**: lowercase with hyphens (`button.tsx`, `dialog.tsx`)
- **Page Components**: `page.tsx` (App Router convention)
- **Layout Components**: `layout.tsx` (App Router convention)
- **Utilities**: camelCase (`formatDate.ts`, `validateEmail.ts`)
- **Types**: PascalCase (`UserProfile.ts`, `ApiResponse.ts`)
- **Server Actions**: camelCase with `Action` suffix (`signUpAction`, `generateIdeaAction`)

**Variables:**
- **Constants**: UPPER_SNAKE_CASE (`MAX_IDEAS_FREE`, `REDIS_TTL_HOURS`)
- **Functions**: camelCase (`getUserById`, `calculateUsage`)
- **React Hooks**: camelCase with `use` prefix (`useAuth`, `usePlanLimits`)
- **Types/Interfaces**: PascalCase (`User`, `StartupIdea`, `ApiResponse`)
- **Enums**: PascalCase enum name, UPPER_SNAKE_CASE values (`PlanType.PRO_MONTHLY`)

**Database:**
- **Tables**: snake_case plural (`users`, `startup_ideas`, `reddit_posts`)
- **Columns**: snake_case (`created_at`, `user_id`, `ai_confidence_score`)
- **Indexes**: `{table}_{column}_idx` (`users_email_idx`)
- **Foreign Keys**: `{table}_{column}_fkey` (`startup_ideas_user_id_fkey`)

**API Routes:**
- **RESTful naming**: `/api/{resource}/{id}/{action}`
- **Kebab-case**: `/api/startup-ideas` (not `/api/startupIdeas`)

### 13.4 Best Practices

**React Server Components:**
- ✅ Fetch data in server components (async components)
- ✅ Pass data to client components via props
- ❌ Don't use useState/useEffect in server components
- ❌ Don't import client-only libraries in server components

**Server Actions:**
- ✅ Validate input with Zod schemas
- ✅ Use `revalidatePath()` or `revalidateTag()` after mutations
- ✅ Return structured results (`{ success: boolean, data?, error? }`)
- ❌ Don't expose sensitive data in action responses

**Database Queries:**
- ✅ Use Supabase RLS policies for authorization
- ✅ Select only required columns (not `SELECT *`)
- ✅ Use indexes for WHERE clauses
- ❌ Don't bypass RLS with service role key (except admin operations)

**Caching:**
- ✅ Cache Reddit API responses (4-hour TTL)
- ✅ Cache OpenAI embeddings (permanent storage)
- ✅ Use `unstable_cache` for expensive computations
- ❌ Don't cache user-specific data in shared cache (Redis)

**Error Handling:**
- ✅ Use try/catch in server actions
- ✅ Log errors to console (or error tracking service)
- ✅ Return user-friendly error messages
- ❌ Don't expose stack traces to users

**Security:**
- ✅ Validate all user input (Zod schemas)
- ✅ Use CSRF tokens for mutations
- ✅ Sanitize user-generated content before display
- ✅ Rate limit API endpoints (Redis-based)
- ❌ Don't trust client-side data (re-validate server-side)

---

## 14. Proposed Source Tree

```
startup-sniff/
├── app/                                    # Next.js App Router (presentation layer)
│   ├── (marketing)/                        # Marketing pages (SSG)
│   │   ├── layout.tsx                      # Marketing layout (header, footer)
│   │   ├── (home)/page.tsx                 # Landing page (/)
│   │   ├── T&C/page.tsx                    # Terms & Conditions
│   │   ├── privacy_policy/page.tsx         # Privacy Policy
│   │   ├── refund_policy/page.tsx          # Refund Policy
│   │   └── contact/page.tsx                # Contact form
│   ├── (dashboard)/                        # Protected dashboard (SSR)
│   │   ├── layout.tsx                      # Dashboard layout (sidebar, nav)
│   │   └── dashboard/
│   │       ├── page.tsx                    # Dashboard home
│   │       ├── generate/page.tsx           # Pillar 1: Reddit extraction
│   │       ├── trends/page.tsx             # Trend analysis
│   │       ├── content/page.tsx            # Content library
│   │       └── settings/page.tsx           # Account settings
│   ├── auth/                               # Authentication flows (SSR)
│   │   ├── layout.tsx                      # Auth layout (centered)
│   │   ├── signin/page.tsx                 # Sign in
│   │   ├── signup/page.tsx                 # Sign up
│   │   ├── verify-email/page.tsx           # Email verification
│   │   ├── forgot-password/page.tsx        # Password reset request
│   │   └── reset-password/page.tsx         # Password reset
│   ├── api/                                # API routes (server-side)
│   │   ├── auth/                           # Auth endpoints
│   │   ├── ideas/                          # Idea CRUD
│   │   ├── reddit/                         # Reddit OAuth, fetch
│   │   ├── billing/                        # Razorpay webhooks
│   │   └── webhooks/                       # External webhooks
│   ├── layout.tsx                          # Root layout (providers, fonts)
│   ├── globals.css                         # Global styles (Tailwind)
│   ├── icon.tsx                            # App icon (favicon)
│   └── middleware.ts                       # Auth, CSRF, rate limiting
│
├── components/                             # React components
│   ├── ui/                                 # shadcn/ui base components
│   │   ├── button.tsx                      # Button component
│   │   ├── card.tsx                        # Card component
│   │   ├── dialog.tsx                      # Dialog/modal
│   │   ├── input.tsx                       # Input field
│   │   ├── select.tsx                      # Select dropdown
│   │   └── ... (25+ components)
│   ├── features/                           # Domain components
│   │   ├── idea-card.tsx                   # Idea list item
│   │   ├── idea-detail.tsx                 # Idea detail view
│   │   ├── reddit-search.tsx               # Reddit search UI
│   │   ├── trend-chart.tsx                 # Recharts visualization
│   │   └── content-editor.tsx              # Content generation UI
│   └── auth/                               # Auth components
│       ├── signup-form.tsx                 # Sign up form
│       ├── signin-form.tsx                 # Sign in form
│       └── password-reset-form.tsx         # Password reset form
│
├── modules/                                # Domain modules (business logic)
│   ├── ai/                                 # OpenAI integration
│   │   ├── index.ts                        # Module exports
│   │   ├── services/                       # AI services
│   │   └── actions/                        # AI server actions
│   ├── auth/                               # Authentication
│   │   ├── index.ts
│   │   ├── actions/                        # Auth actions (signup, signin)
│   │   ├── services/                       # JWT, password, email
│   │   └── utils/                          # CSRF, security logger
│   ├── billing/                            # Razorpay integration
│   │   ├── index.ts
│   │   ├── actions/                        # Billing actions
│   │   └── services/                       # Razorpay client
│   ├── contact/                            # Email service
│   │   ├── index.ts
│   │   └── services/email.ts               # Mailgun integration
│   ├── content/                            # Content generation
│   │   ├── index.ts
│   │   └── actions/                        # Content actions
│   ├── ideas/                              # Idea management
│   │   ├── index.ts
│   │   └── actions/                        # Idea CRUD actions
│   ├── reddit/                             # Reddit integration
│   │   ├── index.ts
│   │   ├── services/                       # Reddit API client
│   │   └── actions/                        # Reddit OAuth, fetch
│   ├── usage/                              # Usage tracking
│   │   ├── index.ts
│   │   ├── actions/                        # Usage tracking actions
│   │   └── hooks/                          # usePlanLimits, etc.
│   └── validation/                         # Experiment tracking
│       ├── index.ts
│       └── actions/                        # Validation actions
│
├── lib/                                    # Shared utilities
│   ├── supabase/                           # Supabase clients
│   │   ├── server.ts                       # Server client (RSC)
│   │   └── client.ts                       # Client component client
│   ├── services/                           # External services
│   │   └── redis.ts                        # Upstash Redis client
│   └── utils/                              # Helper functions
│       ├── cn.ts                           # clsx + tailwind-merge
│       ├── formatDate.ts                   # Date formatting
│       └── validateEmail.ts                # Email validation
│
├── server/                                 # Server-side utilities
│   └── queries/                            # Reusable DB queries
│       ├── users.ts                        # User queries
│       ├── ideas.ts                        # Idea queries
│       └── usage.ts                        # Usage queries
│
├── supabase/                               # Supabase configuration
│   └── migrations/                         # SQL migrations
│       ├── 20250829174112_create_initial_schema.sql
│       ├── 20250830032313_create_rate_limits_table.sql
│       └── ... (9 migrations total)
│
├── types/                                  # TypeScript types
│   └── supabase.ts                         # Auto-generated DB types
│
├── public/                                 # Static assets
│   ├── design-reference/                   # Design files
│   └── screenshots/                        # App screenshots
│
├── tests/                                  # Playwright E2E tests
│   └── e2e/                                # Test specs
│       ├── auth.spec.ts                    # Auth flow tests
│       ├── ideas.spec.ts                   # Idea generation tests
│       └── billing.spec.ts                 # Billing flow tests
│
├── .env.local                              # Environment variables (gitignored)
├── .gitignore                              # Git ignore rules
├── components.json                         # shadcn/ui config
├── eslint.config.mjs                       # ESLint config
├── middleware.ts                           # Global middleware
├── next.config.ts                          # Next.js config
├── package.json                            # Dependencies
├── playwright.config.ts                    # Playwright config
├── postcss.config.mjs                      # PostCSS config
├── tailwind.config.ts                      # Tailwind config (CSS-first)
├── tsconfig.json                           # TypeScript config
└── vercel.json                             # Vercel deployment config
```

**Critical Folders:**

- **`app/`**: Next.js App Router - all pages, layouts, API routes, and routing logic. Entry point for all user-facing features.

- **`modules/`**: Domain modules containing business logic organized by feature domain (auth, billing, ideas, etc.). Each module is self-contained with actions, services, and hooks. This is where core business logic lives separate from presentation.

- **`components/`**: Reusable React components organized by type - `ui/` for shadcn/ui primitives, `features/` for domain-specific components, `auth/` for authentication UI. Keep components small, focused, and composable.

- **`lib/`**: Shared utilities and service clients (Supabase, Redis). Cross-cutting concerns that don't fit a specific domain module.

- **`supabase/migrations/`**: Database schema evolution via SQL migration files. Version-controlled schema changes with timestamps. Always create new migrations, never edit existing ones.

- **`types/`**: TypeScript type definitions, primarily auto-generated from Supabase schema (`supabase.ts`). Regenerate after schema changes with `npm run db:types`.

---

## 15. Testing Strategy

### 15.1 Unit Tests

**Status**: Not yet implemented (future enhancement)

**Planned Approach:**
- **Framework**: Vitest (faster than Jest, native ESM support)
- **Coverage Target**: 70% for business logic (modules/)
- **Priority Areas**:
  - Authentication logic (password hashing, JWT validation)
  - Usage tracking and quota enforcement
  - AI viability scoring (mocked OpenAI calls)
  - Billing calculations and subscription logic

**Example Unit Test:**
```typescript
// modules/usage/__tests__/usage.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { trackUsage, hasQuotaRemaining } from '../actions/usage'

describe('Usage Tracking', () => {
  it('should increment ideas_generated counter', async () => {
    const userId = 'test-user-id'
    const before = await getUsageLimits(userId)

    await trackUsage(userId, 'idea')

    const after = await getUsageLimits(userId)
    expect(after.ideas_generated).toBe(before.ideas_generated + 1)
  })

  it('should prevent idea generation when quota exceeded', async () => {
    const userId = 'test-user-id'
    await setUsageLimits(userId, { ideas_generated: 5, monthly_limit_ideas: 5 })

    const hasQuota = await hasQuotaRemaining(userId, 'idea')
    expect(hasQuota).toBe(false)
  })
})
```

### 15.2 Integration Tests

**Status**: Minimal (Playwright E2E covers most integration scenarios)

**Planned Approach:**
- **Framework**: Playwright (API testing mode)
- **Coverage**: API routes, webhook handlers, database operations
- **Priority Areas**:
  - Reddit OAuth flow (callback handling, token exchange)
  - Razorpay webhook processing (subscription updates)
  - Supabase RLS policy enforcement
  - Redis caching behavior

**Example Integration Test:**
```typescript
// tests/integration/reddit-oauth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Reddit OAuth Flow', () => {
  test('should complete OAuth and store tokens', async ({ page, request }) => {
    // 1. Initiate OAuth
    const authUrl = await page.goto('/api/reddit/oauth/authorize')
    expect(authUrl).toContain('reddit.com/api/v1/authorize')

    // 2. Mock Reddit OAuth callback
    const callbackResponse = await request.get('/api/reddit/oauth/callback', {
      params: { code: 'mock-oauth-code' },
    })

    // 3. Verify tokens stored in database
    const { data: user } = await supabase.auth.getUser()
    expect(user.reddit_access_token).toBeDefined()
  })
})
```

### 15.3 E2E Tests

**Status**: Implemented with Playwright

**Current Coverage:**
- Authentication flows (signup, signin, signout, password reset)
- Idea generation (Reddit search → Generate idea)
- Content generation (Select idea → Generate blog post)
- Billing flow (Upgrade to Pro → Razorpay checkout)

**Playwright Configuration:**
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

**Example E2E Test:**
```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should sign up new user', async ({ page }) => {
    await page.goto('/auth/signup')

    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.fill('input[name="fullName"]', 'Test User')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('h1')).toContainText('Welcome, Test User')
  })

  test('should validate password strength', async ({ page }) => {
    await page.goto('/auth/signup')

    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'weak')
    await page.click('button[type="submit"]')

    await expect(page.locator('.error-message')).toContainText(
      'Password must be at least 8 characters'
    )
  })
})
```

**Test Commands:**
```bash
npm run test:e2e           # Run all E2E tests (headless)
npm run test:e2e:ui        # Run with Playwright UI mode
npm run test:e2e:report    # Show HTML report
```

### 15.4 Coverage Goals

**Current Coverage:**
- **E2E Tests**: 60% of critical user flows (auth, idea generation, billing)
- **Unit Tests**: 0% (not yet implemented)
- **Integration Tests**: 0% (not yet implemented)

**Target Coverage (by Month 6):**
- **E2E Tests**: 80% of user flows (add Pillar 2 human contact, Pillar 3 insights)
- **Unit Tests**: 70% of business logic (modules/)
- **Integration Tests**: 50% of API routes and webhooks

**Critical Paths to Test:**
1. ✅ Authentication (signup, signin, password reset)
2. ✅ Idea generation (Reddit search → GPT-4 → Save)
3. ✅ Billing (upgrade, downgrade, cancel)
4. ⏳ Human contact workflow (Pillar 2 - not yet implemented)
5. ⏳ Network intelligence (Pillar 3 - not yet implemented)
6. ⏳ Usage quota enforcement (edge cases)
7. ⏳ Email delivery (verification, password reset)
8. ⏳ Webhook handling (Razorpay, Reddit API errors)

---

## 16. DevOps and CI/CD

**Current Setup (Simple):**

**Version Control:**
- **Git Repository**: GitHub (benjaminthomas/startup-sniff)
- **Branching Strategy**: `main` (production), feature branches (`feature/*`)
- **Commit Convention**: Conventional Commits (optional, not enforced)

**Continuous Integration:**
- **Platform**: GitHub Actions (planned, not yet configured)
- **Triggers**: Push to `main`, Pull Request creation
- **Checks**: Lint (ESLint), Type Check (TypeScript), E2E Tests (Playwright)

**Continuous Deployment:**
- **Platform**: Vercel Git Integration
- **Production**: Auto-deploy on push to `main`
- **Preview**: Auto-deploy on Pull Request (unique URL per PR)
- **Rollback**: Instant rollback via Vercel dashboard (previous deployment)

**Environment Management:**
- **Local**: `.env.local` (gitignored)
- **Preview**: Vercel environment variables (scoped to preview)
- **Production**: Vercel environment variables (scoped to production)

**Database Migrations:**
- **Local**: `supabase db reset` (destructive, development only)
- **Production**: `supabase db push --linked` (manual, after verification)
- **Rollback**: Manual rollback migration (no automatic rollback)

**Monitoring:**
- **Performance**: Vercel Analytics (page load, Core Web Vitals)
- **Errors**: Console logging (planned: Sentry integration)
- **Uptime**: Vercel status page (99.99% SLA)

**Planned Enhancements:**
- **CI Pipeline**: GitHub Actions for lint, type check, E2E tests
- **Error Tracking**: Sentry for error monitoring and alerting
- **Log Aggregation**: Better Stack or Axiom for centralized logging
- **Uptime Monitoring**: Better Uptime for external health checks

---

## 17. Security

**Authentication & Authorization:**
- ✅ Supabase Auth (email/password, OAuth)
- ✅ Argon2 password hashing (more secure than bcrypt)
- ✅ HttpOnly session cookies (XSS protection)
- ✅ Row-Level Security (RLS) policies on all tables
- ✅ CSRF protection (double-submit cookie pattern)
- ✅ Server-side session validation (middleware)

**Data Protection:**
- ✅ HTTPS-only (enforced by Vercel)
- ✅ Environment variables encrypted at rest (Vercel)
- ✅ Database encryption at rest (Supabase managed)
- ✅ No sensitive data in client bundles (server-only secrets)

**API Security:**
- ✅ Rate limiting (Redis-based, 60 req/min per user)
- ✅ Input validation (Zod schemas on all mutations)
- ✅ Webhook signature verification (Razorpay)
- ✅ CORS configuration (Vercel headers)

**Third-Party Security:**
- ✅ Reddit OAuth (user tokens, distributed sending)
- ✅ OpenAI API key rotation (quarterly)
- ✅ Razorpay webhook HTTPS + signature verification
- ✅ Mailgun SPF/DKIM for email deliverability

**Security Best Practices:**
- ✅ No `eval()` or `dangerouslySetInnerHTML` (except trusted JSON-LD)
- ✅ Content Security Policy (CSP) headers (planned)
- ✅ Dependency vulnerability scanning (npm audit)
- ✅ Regular security updates (automated Dependabot PRs)

**Planned Enhancements:**
- **CSP Headers**: Restrict script sources, prevent XSS
- **Security Headers**: HSTS, X-Frame-Options, X-Content-Type-Options
- **Penetration Testing**: External security audit before scale
- **GDPR Compliance**: Data export, deletion, consent management

---

## Specialist Sections

### DevOps Specialist Notes

**For Future DevOps Specialist or Contractor:**

Current setup is intentionally simple (solo founder, bootstrapped). As scale increases, consider:

1. **CI/CD Pipeline Enhancement:**
   - GitHub Actions workflow for automated testing
   - Separate staging environment (Vercel preview branch)
   - Blue-green deployments for zero-downtime releases

2. **Infrastructure as Code:**
   - Terraform for Vercel, Supabase configuration
   - Supabase CLI for reproducible database setup
   - Secrets management via Doppler or 1Password

3. **Monitoring & Observability:**
   - Sentry for error tracking and performance monitoring
   - Better Stack for centralized logging
   - Uptime monitoring (Better Uptime, Checkly)
   - Custom dashboards (Grafana + Prometheus if self-hosting)

4. **Database Operations:**
   - Automated database backups (Supabase daily backups enabled)
   - Point-in-time recovery testing (monthly)
   - Read replicas for analytics queries (when scale justifies)
   - Connection pooling (Supabase pgBouncer already enabled)

5. **Cost Optimization:**
   - Redis cache hit rate monitoring (target: >90%)
   - OpenAI API cost tracking and alerts
   - Vercel bandwidth optimization (image CDN, aggressive caching)

### Security Specialist Notes

**For Future Security Audit or Pentesting:**

Current security posture is strong for MVP (no known vulnerabilities). Before scale:

1. **Authentication Hardening:**
   - Multi-factor authentication (MFA) for high-value accounts
   - Session timeout configuration (currently 1 hour, consider reducing)
   - Failed login rate limiting (prevent brute force)
   - Password breach detection (HaveIBeenPwned API)

2. **Authorization Improvements:**
   - Role-based access control (RBAC) for admin functions
   - Audit logging for sensitive operations (data exports, deletions)
   - Fine-grained RLS policies (currently broad `auth.uid() = user_id`)

3. **Vulnerability Scanning:**
   - Automated dependency scanning (Snyk, Dependabot already enabled)
   - SAST (Static Application Security Testing) - GitHub CodeQL
   - DAST (Dynamic Application Security Testing) - OWASP ZAP

4. **Compliance:**
   - GDPR compliance (data export, deletion, consent)
   - CCPA compliance (California Consumer Privacy Act)
   - SOC 2 Type II (if selling to enterprise)

5. **Incident Response:**
   - Security incident response plan
   - Data breach notification procedures
   - Regular security drills (quarterly)

### Testing Specialist Notes

**For Future QA Engineer or Testing Specialist:**

Current testing is Playwright E2E only (60% coverage). To reach production-grade testing:

1. **Test Coverage Expansion:**
   - Unit tests for all business logic (modules/)
   - Integration tests for API routes and webhooks
   - Visual regression testing (Percy, Chromatic)
   - Accessibility testing (axe-core, WAVE)

2. **Test Automation:**
   - CI pipeline runs all tests on PR
   - Nightly E2E test suite (full regression)
   - Performance testing (Lighthouse CI)
   - Load testing (k6, Artillery)

3. **Test Data Management:**
   - Seed data for local development
   - Test fixtures for E2E tests (no hard-coded data)
   - Database snapshots for consistent test state

4. **Mocking Strategies:**
   - Mock external APIs (Reddit, OpenAI, Razorpay) in tests
   - Use MSW (Mock Service Worker) for API mocking
   - Avoid hitting production APIs in tests

5. **Test Reporting:**
   - Test coverage badges in README
   - HTML test reports (Playwright, Vitest)
   - Flaky test detection and quarantine

---

_Generated using BMad Method Solution Architecture workflow on 2025-10-13_
_Last Updated: 2025-10-13_
_Author: Benjamin_

