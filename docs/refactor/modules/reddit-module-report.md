## Module: reddit

### Extracted Files
- modules/reddit/actions/index.ts (from `lib/actions/reddit.ts`)
- modules/reddit/services/pain-point-extractor.ts (from `lib/services/pain-point-extractor.ts`)
- modules/reddit/services/reddit-integration.ts (from `lib/services/reddit-integration.ts`)
- modules/reddit/index.ts
- modules/reddit/README.md

### Public API
- `analyzeRedditTrends`, `getRedditTrendsSummary`, `collectRedditData`, `getRedditHealthStatus`
- `getTrendingPainPoints`, `generateIdeasFromPainPoints`, `generateQuickIdea`, `getPainPointsByCategory`, `getStartupIntelligence`

### Dependencies
- Reddit integration and pain-point extraction now reside under `modules/reddit/services`.
- AI helpers sourced from `@/modules/ai`; Supabase access via `@/modules/supabase`.

### Files Updated (Consumers)
- app/api/reddit-intelligence/route.ts
- modules/ideas/actions/index.ts
- Documentation references (ideas module report)

### Validation
- [x] All imports previously targeting `@/lib/actions/reddit` now use `@/modules/reddit`.
- [ ] Manual QA recommended for Reddit trend dashboards and idea generation.
