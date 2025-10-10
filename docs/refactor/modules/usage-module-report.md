## Module: usage

### Extracted Files
- modules/usage/actions/usage.ts (migrated from `server/actions/usage.ts`)
- modules/usage/actions/plan-limits.ts (migrated from `server/actions/plan-limits.ts`)
- modules/usage/hooks/{use-plan-limits,use-server-plan-limits}.ts (from `lib/hooks`)
- modules/usage/index.ts (barrel export)
- modules/usage/README.md (module overview)

### Public API
- `getCurrentUserUsage()`
- `getUserPlanAndUsage()`
- `incrementUsage(type)`
- `usePlanLimits()`, `useServerPlanLimits()`
- `UsageData` interface and supporting helpers

### Dependencies
- Auth module for session utilities and UserDatabase access.
- Supabase module for usage/plan queries.
- Hooks now distributed via `@/modules/usage`.

### Files Updated (Consumers)
- modules/ideas/actions/index.ts
- modules/usage/hooks/{use-plan-limits,use-server-plan-limits}.ts
- components relying on usage hooks and server actions
- app/(dashboard)/dashboard/page.tsx
- modules/content/actions/index.ts

### Validation
- [x] All usage-related imports now point to `@/modules/usage`.
- [ ] Automated tests pending (expand Playwright coverage for usage behaviors).
- [x] TypeScript linting passes (aside from existing middleware warning).
- [ ] Manual QA recommended for usage counters after idea/content generation.
