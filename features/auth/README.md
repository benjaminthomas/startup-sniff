# Auth Module

## Purpose
Encapsulates the custom JWT-based authentication stack, including session handling, Supabase integration, CSRF helpers, security logging, and server actions.

## Directory Layout
- `actions/`: Server Actions (`index.ts`) and server-action-specific helpers (`csrf-server-action.ts`).
- `services/`: Core services such as `jwt`, `password`, Supabase adapters, DAL helpers, and email delivery utilities.
- `utils/`: CSRF helpers and other shared utilities.
- `index.ts`: Barrel file exposing the module API for downstream consumers.

## Public API Highlights
```ts
import {
  // Sessions & JWT
  createSessionToken,
  getCurrentSession,
  setSessionCookie,
  clearSessionCookie,
  // Supabase wrappers (re-exported from modules/supabase)
  createServerSupabaseClient,
  createServerAdminClient,
  createMiddlewareSupabaseClient,
  createClient,
  // Database accessors
  UserDatabase,
  SessionDatabase,
  RateLimitDatabase,
  // Server actions
  signUpAction,
  signInAction,
  signOutAction,
  forgotPasswordAction,
  resetPasswordAction,
  verifyEmailAction,
  // CSRF helpers
  getOrGenerateCSRFToken,
  generateCSRFToken,
  extractAndVerifyCSRFToken,
} from '@/modules/auth'
```

## Migration Notes
- Legacy imports from `@/lib/auth/*` should now be routed through this module.
- Auth-related React components remain in `components/auth` for now; future work may wrap or move them under `modules/auth/components`.
- Downstream modules should avoid importing from nested paths unless adding new shared primitives—prefer the barrel exports to prevent tight coupling. Supabase client helpers now live in `@/modules/supabase` and are re-exported here for compatibility.
