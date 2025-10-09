# Current Architecture Analysis

## High-Level Overview
- **Framework**: Next.js 15 App Router with layouts under `app/` and marketing/dashboard route groups.
- **Styling**: Tailwind CSS v4 (`app/globals.css`) with design tokens; shadcn/ui components under `components/ui`.
- **State/Data**: Minimal shared React context; heavy reliance on server actions inside `server/actions/*` and API routes in `app/api/*`.
- **Auth**: Custom JWT system implemented in `modules/auth/*` (migrated from `lib/auth`), consumed by server actions, middleware, and auth pages.
- **Ideas**: Idea generation and validation server actions reside in `modules/ideas/*`, replacing the prior `server/actions/ideas.ts`.
- **Usage**: Usage and plan-limit helpers consolidated under `modules/usage/*`, migrating both `usage.ts` and `plan-limits.ts` actions.
- **Billing/Content**: Subscription management and AI content generation now live under `modules/billing/*` and `modules/content/*`.
- **Reddit**: Trend analysis, pain-point extraction, and idea helpers reside under `modules/reddit/*`, replacing the previous `lib/actions/reddit.ts`.
- **Contact**: Mailgun-backed contact utilities exposed under `modules/contact/*`, replacing `lib/services/contact-email.ts`.
- **Marketing**: Landing/policy section components migrated to `modules/marketing/*` for reuse across marketing pages.
- **AI**: OpenAI client plus idea-generation helpers centralized under `modules/ai/*`, replacing `lib/openai.ts` and `lib/services/ai-idea-generator.ts`.
- **Database Access**: Supabase client utilities in `lib/supabase` and domain-specific data helpers in `server/actions`, `lib/actions`, and `lib/services`.

## Route & Feature Groupings
- `app/(LandingPage)`: Marketing home, pricing, policy, and contact pages.
- `app/auth`: Sign-in/up, verify email, password reset flows with CSRF integration.
- `app/(dashboard)/dashboard`: Authenticated dashboard with nested routes for ideas, content, trends, billing, validation, etc.
- `app/api`: REST-like endpoints for contact, Reddit processing, exports, and webhooks.

## Component Landscape
- **UI primitives**: `components/ui` contains shared shadcn-based elements (forms, sidebar, chart, etc.).
- **Feature slices**: `components/features/*` house dashboard widgets (ideas, billing, content, validation, trends) and marketing sections.
- **Auth forms**: `components/auth/*` renders sign-in/up/reset forms coupled with server actions.

## Server & Domain Logic
- `server/actions`: Server actions for billing, ideas, usage, plan limits, content.
- `lib/actions`: Additional server-like helpers (validation, reddit ingestion).
- `lib/services`: AI/reddit/contact helpers; `lib/reddit/*` handles ingestion pipeline.
- `lib/hooks`: Client-facing hooks for plan limits and responsive behavior.

## Auth Stack Details
- JWT utilities (`modules/auth/services/jwt.ts`) manage session cookie creation and verification.
- Supabase wrappers for user/session tables (`modules/auth/services/supabase-server.ts`, `modules/auth/services/database.ts`).
- CSRF protection via `modules/auth/utils/csrf.ts` used in middleware and forms.
- Mail delivery and verification tokens managed in `modules/auth/services/email-mailgun-official.ts`.

## Database Touchpoints
- `server/actions/*` and `lib/auth/database.ts` read/write Supabase tables (`users`, `usage_limits`, `subscriptions`, etc.).
- `lib/reddit` persists posts and insights.

## Observations & Pain Points
- Auth logic centralized under `modules/auth`, idea workflows live in `modules/ideas`, quota tracking resides in `modules/usage`, billing/content modules wrap Razorpay + content automation flows, Reddit ingestion utilities live in `modules/reddit`, contact email helpers sit in `modules/contact`, and landing components live in `modules/marketing`.
- Domain logic mixed between `lib/actions`, `server/actions`, and `components/features`, making reuse harder.
- Initial `modules/auth`, `modules/ideas`, `modules/usage`, `modules/billing`, `modules/content`, `modules/reddit`, `modules/contact`, and `modules/marketing` structures exist; remaining domains (AI services, dashboards) can follow.
- Database helpers intermingle Supabase admin and anon clients; extracting service layers per module will ease testing.
