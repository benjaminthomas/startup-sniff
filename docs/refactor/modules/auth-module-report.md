## Module: auth

### Extracted Files
- modules/auth/actions/index.ts (migrated from lib/auth/actions.ts)
- modules/auth/actions/csrf-server-action.ts (migrated from lib/auth/csrf-server-action.ts)
- modules/auth/services/jwt.ts (migrated from lib/auth/jwt.ts)
- modules/auth/services/password.ts (migrated from lib/auth/password.ts)
- modules/auth/services/supabase-server.ts (migrated from lib/auth/supabase-server.ts)
- modules/auth/services/supabase-client.ts (migrated from lib/auth/supabase-client.ts)
- modules/auth/services/email-mailgun-official.ts (migrated from lib/auth/email-mailgun-official.ts)
- modules/auth/services/security-logger.ts (migrated from lib/auth/security-logger.ts)
- modules/auth/services/database.ts (migrated from lib/auth/database.ts)
- modules/auth/services/dal.ts (migrated from lib/auth/dal.ts)
- modules/auth/utils/csrf.ts (migrated from lib/auth/csrf.ts)
- modules/auth/index.ts (new barrel export)
- modules/auth/README.md (new documentation)

### Public API
- Components: _none yet_ (auth React forms remain under `components/auth`)
- Hooks: _none yet_
- Services: JWT, password hashing, Supabase clients, DAL, email delivery, security logging
- Actions: sign-in/up/out, forgot/reset password, email verification, CSRF helpers
- Types: Provided inline; shared consumer types continue via `@/types/database`

### Dependencies
- Shared Components: none (server-facing utilities only)
- Shared Utilities: relies on `@/lib/utils`, `@/constants`, Next.js runtime helpers
- External Dependencies: `jose`, `next/headers`, Supabase JS SDK, `zod`, Mailgun SDK

### Files Updated (Consumers)
- server/actions/{billing,plan-limits,content,ideas,usage}
- lib/actions/validation.ts
- middleware.ts
- components/auth/{signin,signup,forgot-password,reset-password}-form.tsx
- components/features/dashboard/header.tsx
- components/ui/trial-banner.tsx
- app/(dashboard)/layout.tsx
- app/(dashboard)/dashboard/{page,validation/page,billing/page,content/page,ideas/[id]/page}.tsx
- app/api/{reddit-trends,reddit-intelligence}
- app/api/ideas/[id]/export/route.ts
- app/auth/{signin,signup,forgot-password,reset-password,verify-email}/page.tsx
- app/auth/callback/route.ts

### Validation
- [x] No cross-module imports (auth internals use relative folders)
- [x] Barrel exports provide the public API via `@/modules/auth`
- [ ] Automated tests pending (run Vitest/Playwright)
- [x] Manual review required for auth flows after deployment
