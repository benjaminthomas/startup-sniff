# Developer Guide - StartupSniff

**Last Updated:** December 2025
**Version:** 2.0
**Architecture:** Feature-Based Modular Monolith with Standalone Components

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Development Setup](#development-setup)
5. [Coding Standards](#coding-standards)
6. [Component Architecture](#component-architecture)
7. [Database & Migrations](#database--migrations)
8. [Authentication & Security](#authentication--security)
9. [API Routes & Server Actions](#api-routes--server-actions)
10. [Testing](#testing)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Design Philosophy

StartupSniff follows a **Feature-Based Modular Monolith** pattern with these principles:

1. **Feature Isolation**: Each feature is self-contained in its own directory
2. **Standalone Components**: Components use dependency injection, no cross-feature imports
3. **Type Safety First**: Strict TypeScript with generated Supabase types
4. **Security by Default**: All endpoints have auth checks and input validation
5. **Serverless-Ready**: Designed for Vercel deployment with edge compatibility

### Architecture Patterns

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js 15 App Router                   │
│                  (Server Components + RSC)                  │
└────────────┬────────────────────────────────────┬───────────┘
             │                                    │
    ┌────────▼─────────┐              ┌──────────▼──────────┐
    │  Feature Modules  │              │  Standalone UI      │
    │  (Server Actions) │              │  (Client Components)│
    └────────┬──────────┘              └──────────┬──────────┘
             │                                    │
    ┌────────▼────────────────────────────────────▼───────────┐
    │          Supabase Client (Server/Client Split)          │
    └────────┬────────────────────────────────────────────────┘
             │
    ┌────────▼─────────┐
    │  PostgreSQL + RLS │
    │    (Supabase)     │
    └───────────────────┘
```

---

## Tech Stack

### Core Framework
- **Next.js 15.5.6** - App Router, React Server Components, Server Actions
- **React 19.1.0** - Concurrent features, server components support
- **TypeScript 5.x** - Strict mode, full type safety

### Database & Auth
- **Supabase** - PostgreSQL database with Row Level Security
- **@supabase/ssr 0.7.0** - Server-side auth for Next.js
- **Argon2** - Password hashing

### UI & Styling
- **Tailwind CSS 4.1.14** - Utility-first CSS
- **shadcn/ui** - Accessible component primitives (Radix UI)
- **Lucide React** - Icon system
- **Framer Motion** - Animations

### Forms & Validation
- **React Hook Form 7.62.0** - Form state management
- **Zod 3.25.76** - Runtime validation schemas

### AI & External Services
- **OpenAI 5.16.0** - GPT-4 for idea generation & validation
- **Razorpay 2.9.6** - Payment processing
- **Mailgun** - Transactional emails
- **ioredis 5.7.0** - Redis caching (Upstash)

### Testing & Development
- **Playwright 1.55.0** - E2E testing
- **ESLint** - Code quality
- **Vercel Analytics** - Production monitoring

---

## Project Structure

```
startup-sniff/
├── app/                          # Next.js App Router
│   ├── (dashboard)/              # Protected routes
│   │   └── dashboard/
│   │       ├── billing/          # Subscription management
│   │       ├── conversations/    # Message tracking
│   │       ├── generate/         # AI idea generation
│   │       ├── ideas/            # Idea management
│   │       ├── opportunities/    # Reddit opportunities
│   │       ├── validation/       # Market validation
│   │       └── page.tsx          # Dashboard home
│   ├── auth/                     # Authentication flows
│   └── api/                      # API routes & webhooks
│
├── features/                     # Feature modules (isolated)
│   ├── ai/
│   │   ├── actions/              # Server actions
│   │   ├── services/             # Business logic
│   │   └── index.ts              # Public API
│   ├── auth/
│   │   ├── actions/
│   │   ├── services/
│   │   └── schemas/              # Zod validation
│   ├── billing/
│   ├── conversations/
│   │   ├── components/           # UI components
│   │   └── schemas/
│   ├── ideas/
│   ├── reddit/
│   ├── validation/
│   └── [feature]/
│       ├── actions/              # Server actions
│       ├── components/           # UI components
│       ├── services/             # Business logic
│       ├── schemas/              # Validation
│       └── index.ts              # Public exports
│
├── components/
│   └── ui/                       # shadcn/ui components
│
├── lib/                          # Shared utilities
│   ├── logger/                   # Logging system
│   ├── validation/               # Shared schemas
│   └── utils.ts                  # Helpers
│
├── types/
│   ├── supabase.ts               # Generated DB types
│   ├── components.ts             # Component prop types
│   └── global.ts                 # App-wide types
│
├── services/                     # External integrations
│   ├── analytics/
│   ├── reddit/
│   └── trends/
│
└── scripts/                      # Dev utilities
    ├── admin/
    └── dev/
```

### Feature Module Structure

Each feature follows this pattern:

```typescript
features/[feature]/
├── actions/              # Server Actions (use server)
│   └── index.ts          # Exports all actions
├── components/           # UI Components (use client)
│   └── [component].tsx   # Standalone components
├── services/             # Business logic
│   └── [service].ts      # Pure functions, no UI
├── schemas/              # Zod validation schemas
│   └── [feature]-schemas.ts
└── index.ts              # Public API - only export what's needed
```

**Rules:**
- ✅ Features can import from `@/lib`, `@/types`, `@/components/ui`
- ❌ Features CANNOT import from other features
- ✅ Use `types/components.ts` for shared component types
- ✅ Actions use dependency injection for cross-feature dependencies

---

## Development Setup

### Prerequisites
- Node.js 20+
- npm or pnpm
- Supabase account (or local setup)
- Redis instance (Upstash recommended)

### Initial Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd startup-sniff

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env.local

# 4. Configure environment
# Edit .env.local with your keys
```

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Auth
CSRF_SECRET=your_csrf_secret_min_32_chars

# AI Services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Reddit API
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_REDIRECT_URI=http://localhost:3000/api/auth/reddit/callback

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Payment (Razorpay)
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# Email (Mailgun)
MAILGUN_API_KEY=...
MAILGUN_DOMAIN=...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Setup

```bash
# Start local Supabase (optional)
npx supabase start

# Apply migrations
npx supabase db reset

# Generate TypeScript types
npx supabase gen types --local > types/supabase.ts
```

### Run Development Server

```bash
npm run dev
# Server runs on http://localhost:3000
```

---

## Coding Standards

### TypeScript

```typescript
// ✅ GOOD - Strict types, no 'any'
interface UserData {
  id: string;
  email: string;
  plan_type: 'free' | 'pro_monthly' | 'pro_yearly';
}

const getUser = async (id: string): Promise<UserData | null> => {
  const { data } = await supabase.from('users').select('*').eq('id', id).single();
  return (data || null) as UserData | null;
};

// ❌ BAD - Using 'any', no types
const getUser = async (id: any) => {
  const { data } = await supabase.from('users').select('*').eq('id', id).single();
  return data;
};
```

### Supabase Type Patterns

```typescript
// Pattern 1: Type assertion for queries
const { data: posts } = await supabase.from('reddit_posts').select('*');
const typedPosts = (posts || []) as RedditPost[];

// Pattern 2: Dynamic table operations
await supabase
  .from('table_name' as never)
  .update({ field: value } as never)
  .eq('id', id);

// Pattern 3: RPC calls (only acceptable 'any' usage)
const { data, error } = await supabase.rpc('function_name', params as any);
```

### Component Patterns

```typescript
// ✅ GOOD - Standalone component with dependency injection
import type { IdeaCardData, ValidateIdeaHandler } from '@/types/components';

interface IdeaCardProps {
  idea: IdeaCardData;
  onValidate: ValidateIdeaHandler;
}

export function IdeaCard({ idea, onValidate }: IdeaCardProps) {
  const handleValidate = async () => {
    const result = await onValidate(idea.id);
    // Handle result...
  };
  // ... component logic
}

// ❌ BAD - Direct feature import
import { validateIdea } from '@/features/validation';

export function IdeaCard({ idea }: { idea: IdeaCardData }) {
  const handleValidate = async () => {
    await validateIdea(idea.id); // Tight coupling!
  };
}
```

### Server Actions

```typescript
'use server';

import { getCurrentSession } from '@/features/auth/services/jwt';
import { createServerAdminClient } from '@/features/supabase/server';
import { log } from '@/lib/logger';
import { actionSchema } from './schemas';

export async function myAction(input: unknown) {
  try {
    // 1. Validate input
    const validated = actionSchema.parse(input);

    // 2. Check authentication
    const session = await getCurrentSession();
    if (!session) {
      return { success: false, error: 'Unauthorized' };
    }

    // 3. Perform action
    const supabase = createServerAdminClient();
    const { data, error } = await supabase
      .from('table')
      .insert({ ...validated, user_id: session.userId });

    if (error) throw error;

    // 4. Log success
    log.info('[my-action] Success', { userId: session.userId });

    return { success: true, data };
  } catch (error) {
    // 5. Handle errors
    log.error('[my-action] Error:', error);
    return { success: false, error: 'Action failed' };
  }
}
```

### Security Checklist

Every server action MUST have:
- ✅ Input validation (Zod schema)
- ✅ Authentication check
- ✅ Authorization check (user owns resource)
- ✅ Error handling
- ✅ Logging (with PII redaction)
- ❌ NEVER log passwords, tokens, or sensitive data

---

## Component Architecture

### Standalone Components

Components should be **pure** and **reusable**:

```typescript
// types/components.ts - Shared types
export type ActionHandler = (id: string) => Promise<ActionResult>;

export interface ComponentData {
  id: string;
  title: string;
  // ... other fields
}

// Component - Accepts dependencies as props
interface MyComponentProps {
  data: ComponentData;
  onAction: ActionHandler;
}

export function MyComponent({ data, onAction }: MyComponentProps) {
  return <button onClick={() => onAction(data.id)}>Act</button>;
}

// Parent - Provides dependencies
import { myAction } from '@/features/my-feature';

<MyComponent data={data} onAction={myAction} />
```

### Client Wrapper Pattern

For server-rendered data with client interactivity:

```typescript
// Wrapper (Client Component)
'use client';

import { ComponentX } from './component-x';
import { actionX, actionY } from '@/features/x';

export function ComponentXGrid({ items }) {
  return items.map(item => (
    <ComponentX
      key={item.id}
      data={item}
      onActionX={actionX}
      onActionY={actionY}
    />
  ));
}

// Page (Server Component)
import { ComponentXGrid } from '@/features/x/components/grid';

export default async function Page() {
  const items = await fetchItems();
  return <ComponentXGrid items={items} />;
}
```

---

## Database & Migrations

### Creating Migrations

```bash
# Create new migration
npx supabase migration new add_feature_x

# Edit the SQL file
# supabase/migrations/YYYYMMDDHHMMSS_add_feature_x.sql

# Apply locally
npx supabase db reset

# Generate types
npx supabase gen types --local > types/supabase.ts
```

### Migration Best Practices

```sql
-- Always include rollback plan
-- Add NOT NULL constraints carefully
-- Use transactions
-- Add indexes for foreign keys

BEGIN;

-- Create table
CREATE TABLE IF NOT EXISTS feature_x (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_feature_x_user_id ON feature_x(user_id);
CREATE INDEX idx_feature_x_created_at ON feature_x(created_at DESC);

-- Enable RLS
ALTER TABLE feature_x ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own data"
  ON feature_x FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own data"
  ON feature_x FOR INSERT
  WITH CHECK (auth.uid() = user_id);

COMMIT;
```

---

## Authentication & Security

### Session Management

```typescript
// Server-side only
import { getCurrentSession } from '@/features/auth/services/jwt';

const session = await getCurrentSession();
if (!session) {
  redirect('/auth/signin');
}
```

### Authorization Patterns

```typescript
// Verify user owns resource
const { data: idea } = await supabase
  .from('startup_ideas')
  .select('user_id')
  .eq('id', ideaId)
  .single();

if (idea?.user_id !== session.userId) {
  return { success: false, error: 'Forbidden' };
}
```

### Security Logging

```typescript
import { log } from '@/lib/logger';

// ✅ GOOD - PII redacted
log.info('[auth] Login attempt', { userId: '[REDACTED]' });

// ❌ BAD - Exposing PII
log.info('[auth] Login', { email: user.email, password: req.body.password });
```

---

## API Routes & Server Actions

### Server Actions (Preferred)

```typescript
'use server';

export async function actionName(input: ActionInput): Promise<ActionResult> {
  // Validation, auth, business logic
}
```

### API Routes (For Webhooks)

```typescript
// app/api/webhooks/razorpay/route.ts
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const signature = request.headers.get('X-Razorpay-Signature');
  // Verify webhook signature
  // Process payment event
  return new Response('OK', { status: 200 });
}
```

---

## Testing

### Playwright E2E Tests

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('user can sign in', async ({ page }) => {
  await page.goto('/auth/signin');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/dashboard');
});
```

### Running Tests

```bash
# Install browsers (first time)
npm run test:e2e:install

# Run tests
npm test

# UI mode (debugging)
npm run test:e2e:ui

# Generate report
npm run test:e2e:report
```

---

## Deployment

### Vercel Deployment

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**
   - Import repository in Vercel dashboard
   - Configure environment variables
   - Deploy automatically

3. **Environment Variables**
   - Add all `.env.local` vars to Vercel
   - Mark sensitive vars as "Secret"

### Database Migrations

```bash
# Production migrations (via Supabase CLI)
npx supabase link --project-ref your-project-ref
npx supabase db push
```

### Post-Deployment Checklist

- ✅ Database migrations applied
- ✅ Environment variables set
- ✅ Webhooks configured (Razorpay, etc.)
- ✅ DNS records updated
- ✅ SSL certificate active
- ✅ Analytics tracking working
- ✅ Error monitoring (Sentry) configured

---

## Troubleshooting

### Common Issues

**Build Fails - TypeScript Errors**
```bash
# Regenerate Supabase types
npx supabase gen types --local > types/supabase.ts

# Check strict mode compliance
npm run build
```

**Authentication Not Working**
```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Verify cookies are set
# Check browser DevTools → Application → Cookies
```

**Database Connection Issues**
```bash
# Check Supabase status
npx supabase status

# Restart local Supabase
npx supabase stop
npx supabase start
```

### Debug Mode

```typescript
// Enable verbose logging
import { log } from '@/lib/logger';

log.setLevel('debug'); // In development only
```

---

## Additional Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **shadcn/ui**: https://ui.shadcn.com
- **Playwright**: https://playwright.dev

---

**Questions?** Check the README.md or open a GitHub issue.
