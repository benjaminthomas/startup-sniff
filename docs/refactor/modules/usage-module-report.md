## Module: usage

### Extracted Files
- modules/usage/actions/usage.ts (migrated from `server/actions/usage.ts`)
- modules/usage/actions/plan-limits.ts (migrated from `server/actions/plan-limits.ts`)
- modules/usage/index.ts (barrel export)
- modules/usage/README.md (module overview)

### Public API
- `getCurrentUserUsage()`
- `getUserPlanAndUsage()`
- `incrementUsage(type)`
- `UsageData` interface and supporting helpers

### Dependencies
- Auth module for session utilities and UserDatabase access.
- Supabase client for usage/plan queries.
- Shared hooks (`lib/hooks/use-plan-limits`, `lib/hooks/use-server-plan-limits`) consume the public API.

### Files Updated (Consumers)
- modules/ideas/actions/index.ts
- lib/hooks/use-plan-limits.ts
- lib/hooks/use-server-plan-limits.ts
- app/(dashboard)/dashboard/page.tsx
- server/actions/content.ts

### Validation
- [x] All usage-related imports now point to `@/modules/usage`.
- [ ] Automated tests pending (run vitest/playwright covering usage behaviors).
- [x] TypeScript linting passes (aside from existing middleware warning).
- [ ] Manual QA recommended for usage counters after idea/content generation.
