## Module: reddit

### Extracted Files
- modules/reddit/actions/index.ts (from `lib/actions/reddit.ts`)
- modules/reddit/index.ts
- modules/reddit/README.md

### Public API
- `analyzeRedditTrends`, `getRedditTrendsSummary`, `collectRedditData`, `getRedditHealthStatus`
- `getTrendingPainPoints`, `generateIdeasFromPainPoints`, `generateQuickIdea`, `getPainPointsByCategory`, `getStartupIntelligence`

### Dependencies
- Reddit integration, pain-point extractor, and AI idea generator services in `lib/services/*`.
- Auth module (indirectly through downstream consumers) and Supabase DB via services.

### Files Updated (Consumers)
- app/api/reddit-intelligence/route.ts
- modules/ideas/actions/index.ts
- Documentation references (ideas module report)

### Validation
- [x] All imports previously targeting `@/lib/actions/reddit` now use `@/modules/reddit`.
- [ ] Manual QA recommended for Reddit trend dashboards and idea generation.
