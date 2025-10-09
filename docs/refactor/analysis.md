# Current Architecture Analysis

## High-Level Overview
- **Framework**: Next.js 15 App Router with layouts under `app/` and marketing/dashboard route groups.
- **Styling**: Tailwind CSS v4 (`app/globals.css`) with design tokens; shadcn/ui components under `components/ui`.
- **State/Data**: Minimal shared React context; heavy reliance on server actions inside `server/actions/*` and API routes in `app/api/*`.
- **Auth**: Custom JWT system implemented in `modules/auth/*` (migrated from `lib/auth`), consumed by server actions, middleware, and auth pages.
- **Ideas**: Idea generation and validation server actions now reside in `modules/ideas/*`, replacing the prior `server/actions/ideas.ts`.
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
- Auth logic centralized under `modules/auth` with a new public index, and idea workflows now live in `modules/ideas`.
- Domain logic mixed between `lib/actions`, `server/actions`, and `components/features`, making reuse harder.
- Initial `modules/auth` and `modules/ideas` structures exist; remaining domains (billing, content, trends, marketing) should migrate next.
- Database helpers intermingle Supabase admin and anon clients; extracting service layers per module will ease testing.
