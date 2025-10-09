# Usage Module

Centralizes plan limit and usage accounting helpers previously located in `server/actions`.

## Contents
- `actions/plan-limits.ts` – plan lookup, usage reconciliation, and `incrementUsage` helper.
- `actions/usage.ts` – monthly usage aggregation for dashboard metrics.
- `index.ts` – barrel file exporting module actions.

## Export Surface
```ts
import {
  getUserPlanAndUsage,
  incrementUsage,
  getCurrentUserUsage,
} from '@/modules/usage'
```

Consumers should reference these exports instead of `@/server/actions/plan-limits` or `@/server/actions/usage`.
