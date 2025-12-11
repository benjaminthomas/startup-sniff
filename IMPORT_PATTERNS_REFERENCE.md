# Import Patterns Reference Guide

This document provides a quick reference for the new import patterns after the codebase refactoring.

## Quick Reference Table

| Old Pattern | New Pattern | Usage |
|------------|-------------|-------|
| `@/modules/*` | `@/features/*` | All feature modules |
| `@/lib/email/*` | `@/services/email/*` | Email services |
| `@/lib/reddit/*` | `@/services/reddit/*` | Reddit integration |
| `@/lib/services/analytics-tracker` | `@/services/analytics/tracker` | Analytics tracking |
| `@/lib/services/opportunity-scorer` | `@/services/opportunities/scorer` | Opportunity scoring |
| `@/lib/services/opportunity-deep-analyzer` | `@/services/opportunities/analyzer` | Deep analysis |
| `@/lib/services/trend-detector` | `@/services/trends/detector` | Trend detection |
| `@/lib/services/monitoring` | `@/services/monitoring` | System monitoring |
| `@/lib/services/redis-cache` | `@/services/cache/redis` | Redis caching |
| `@/lib/services/rate-limiter` | `@/services/rate-limiter` | Rate limiting |
| `@/lib/razorpay` | `@/services/payments/razorpay` | Payment processing |
| `@/lib/supabase.server` | `@/services/supabase/server` | Supabase server client |
| `@/lib/paywall` | `@/features/billing/utils/paywall` | Paywall utilities |
| `@/lib/proration` | `@/features/billing/utils/proration` | Proration utilities |
| `@/lib/data/landing` | `@/constants/marketing/landing` | Landing page data |
| `@/components/features/[feature]/*` | `@/features/[feature]/components/*` | Feature components |
| `@/components/auth/*` | `@/features/auth/components/*` | Auth components |
| `@/features/usage/hooks` | `@/hooks` | Usage-related hooks |

## Examples

### Before and After

#### Feature Imports
```typescript
// Before
import { getUserIdeas } from '@/modules/ideas';
import { IdeaCard } from '@/components/features/dashboard/idea-card';

// After
import { getUserIdeas } from '@/features/ideas';
import { IdeaCard } from '@/features/dashboard/components/idea-card';
```

#### Service Imports
```typescript
// Before
import { RedditApiClient } from '@/lib/reddit/api-client';
import { RedisCache } from '@/lib/services/redis-cache';
import { JobMonitor } from '@/lib/services/monitoring';

// After
import { RedditApiClient } from '@/services/reddit/api-client';
import { RedisCache } from '@/services/cache/redis';
import { JobMonitor } from '@/services/monitoring';
```

#### Billing Utilities
```typescript
// Before
import { checkPaywall } from '@/lib/paywall';
import { calculateProration } from '@/lib/proration';

// After
import { checkPaywall } from '@/features/billing/utils/paywall';
import { calculateProration } from '@/features/billing/utils/proration';
```

#### Auth Components
```typescript
// Before
import { SignInForm } from '@/components/auth/signin-form';

// After
import { SignInForm } from '@/features/auth/components/signin-form';
```

#### Hooks
```typescript
// Before
import { useServerPlanLimits } from '@/features/usage/hooks';

// After
import { useServerPlanLimits } from '@/hooks';
```

## Directory Structure

```
startup-sniff/
├── features/              # Feature modules (formerly modules/)
│   ├── auth/
│   │   └── components/   # Auth-specific components
│   ├── billing/
│   │   ├── components/
│   │   └── utils/        # Billing utilities (paywall, proration)
│   ├── ideas/
│   │   ├── actions/
│   │   ├── components/
│   │   └── index.ts
│   └── ...
├── services/             # Infrastructure services (formerly lib/)
│   ├── analytics/
│   │   └── tracker.ts
│   ├── cache/
│   │   └── redis.ts
│   ├── email/
│   ├── monitoring/
│   ├── opportunities/
│   │   ├── analyzer.ts
│   │   └── scorer.ts
│   ├── payments/
│   │   └── razorpay.ts
│   ├── reddit/
│   ├── supabase/
│   │   └── server.ts
│   ├── trends/
│   │   └── detector.ts
│   └── rate-limiter.ts
├── components/
│   ├── marketing/        # Marketing components (not in features)
│   ├── ui/              # Shared UI components
│   └── ...
├── constants/
│   └── marketing/
│       └── landing.tsx
└── hooks/               # Shared React hooks
    ├── use-plan-limits.ts
    └── use-server-plan-limits.ts
```

## Best Practices

1. **Use absolute imports**: Always prefer `@/features/...` over relative paths like `../../features/...`

2. **Feature-specific components**: Components that belong to a specific feature should be in `@/features/[feature]/components/`

3. **Shared services**: Infrastructure services (Redis, monitoring, etc.) belong in `@/services/`

4. **Feature utilities**: Feature-specific utilities should be in `@/features/[feature]/utils/`

5. **Shared hooks**: Hooks used across multiple features should be in `@/hooks/`

6. **Marketing components**: Marketing-specific components stay in `@/components/marketing/`

## Migration Checklist

When adding new code, ensure:

- [ ] Use `@/features/` instead of `@/modules/`
- [ ] Place services in `@/services/` not `@/lib/`
- [ ] Feature components go in `@/features/[feature]/components/`
- [ ] Use absolute imports with `@/` prefix
- [ ] Follow the established directory structure

## Support

For questions about import patterns or directory structure, refer to:
- IMPORT_UPDATE_SUMMARY.md - Detailed change log
- ARCHITECTURE_REVIEW.md - Architecture documentation
- This reference guide
