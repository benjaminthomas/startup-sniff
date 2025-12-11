# Reddit Module

Collects trend analysis, pain point extraction, and idea generation helpers that previously lived in `lib/actions/reddit.ts` and `lib/services/*`.

## API
```ts
import {
  analyzeRedditTrends,
  getRedditTrendsSummary,
  collectRedditData,
  getRedditHealthStatus,
  getTrendingPainPoints,
  generateIdeasFromPainPoints,
  generateQuickIdea,
  getPainPointsByCategory,
  getStartupIntelligence,
} from '@/modules/reddit'
```

These wrap co-located services under `modules/reddit/services` plus AI helpers from `@/modules/ai`.
