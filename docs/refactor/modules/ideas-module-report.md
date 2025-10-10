## Module: ideas

### Extracted Files
- modules/ideas/actions/index.ts (was `server/actions/ideas.ts`)
- modules/ideas/index.ts (new barrel export)
- modules/ideas/README.md (module overview)

### Public API
- `generateIdea(formData: FormData)`
- `toggleFavorite(ideaId: string)`
- `validateIdea(ideaId: string)`
- `getUserIdeas(limit?: number)`
- `getIdeaWithRedditSources(ideaId: string)`

### Dependencies
- Auth module for session helpers (`getCurrentSession`, CSRF utilities).
- Supabase module for server/admin clients.
- Reddit idea helpers from `@/modules/reddit` and OpenAI helpers from `@/modules/ai`.
- Usage guard leverages `getCurrentUserUsage` from `@/modules/usage`.

### Files Updated (Consumers)
- components/features/dashboard/{idea-card,idea-generation-form}.tsx
- components/features/ideas/{favorite-button,idea-action-buttons}.tsx
- components/features/validation/validation-form.tsx
- app/(dashboard)/dashboard/{ideas,page,generate,page,content/page}.tsx
- app/(dashboard)/dashboard/ideas/page.tsx

### Validation
- [x] Imports switched to `@/modules/ideas` across dashboard and feature components.
- [ ] Automated regression tests pending.
- [x] TypeScript build passes `npm run lint` (warning unrelated to module noted).
- [ ] Manual QA recommended for idea generation, validation, and favorite toggling flows.
