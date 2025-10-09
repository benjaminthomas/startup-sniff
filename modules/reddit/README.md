# Reddit Module

Collects trend analysis, pain point extraction, and idea generation helpers that previously lived in `lib/actions/reddit.ts`.

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

These wrap services from `lib/services/*` (reddit integration, pain-point extractor, AI idea generator).
