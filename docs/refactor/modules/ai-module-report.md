## Module: ai

### Extracted Files
- modules/ai/openai.ts (from `lib/openai.ts`)
- modules/ai/services/idea-generator.ts (from `lib/services/ai-idea-generator.ts`)
- modules/ai/index.ts
- modules/ai/README.md

### Public API
- `openai` client and prompts (`IDEA_GENERATION_PROMPT`, `MARKET_VALIDATION_PROMPT`)
- `generateStartupIdeas`, `validateMarketIdea`, `generateStartupIdea`
- `aiIdeaGenerator` singleton and related option types

### Dependencies
- OpenAI SDK via environment variables.
- Pain point extractor service (`@/lib/services/pain-point-extractor`) and Reddit ingestion for input data.

### Files Updated (Consumers)
- modules/ideas/actions/index.ts
- modules/content/actions/index.ts
- modules/reddit/actions/index.ts
- docs referencing the AI helpers

### Validation
- [x] All imports now reference `@/modules/ai`.
- [ ] Manual QA recommended for idea/content generation after refactor.
