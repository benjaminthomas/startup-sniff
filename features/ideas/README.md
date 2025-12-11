# Ideas Module

Provides server actions and helpers for startup idea generation, favoriting, validation, and data retrieval. Actions rely on the auth module for session handling and Supabase access.

## Structure
- `actions/index.ts` – Server actions (`generateIdea`, `toggleFavorite`, `validateIdea`, `getUserIdeas`, `getIdeaWithRedditSources`).
- (Reserved) `services/` – Future idea-specific service helpers (idea scoring, mapping, etc.).

## Public API
```ts
import {
  generateIdea,
  getUserIdeas,
  getIdeaWithRedditSources,
  toggleFavorite,
  validateIdea,
} from '@/modules/ideas'
```

Use these exports instead of importing from `server/actions/ideas`.
