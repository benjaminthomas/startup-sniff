## Module: content

### Extracted Files
- modules/content/actions/index.ts (from `server/actions/content.ts`)
- modules/content/index.ts
- modules/content/README.md

### Public API
- `generateContent(formData)` (primary server action)
- `generateContentWithAI(params)` (internal helper exported for testing)

### Dependencies
- Auth module for session retrieval and Supabase admin client.
- OpenAI helper (`@/modules/ai`) and VALIDATION_SCHEMAS constants.
- Usage module (`incrementUsage`) for quota tracking.

### Files Updated (Consumers)
- app/(dashboard)/dashboard/content/page.tsx
- components/features/content/content-generation-form.tsx

### Validation
- [x] All content-related imports now point to `@/modules/content`.
- [ ] Manual QA recommended for AI content workflows and quota updates.
