# AI Module

Centralizes OpenAI clients and AI-powered helpers previously located under `lib/openai.ts` and `lib/services/ai-idea-generator.ts`.

## Exports
```ts
import {
  openai,
  generateStartupIdea,
  validateMarketIdea,
  generateStartupIdeas,
  IDEA_GENERATION_PROMPT,
  MARKET_VALIDATION_PROMPT,
  aiIdeaGenerator,
} from '@/modules/ai'
```

The idea generator reuses the pain point extractor from Supabase; additional AI services can be added here.
