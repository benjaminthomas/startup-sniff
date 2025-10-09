## Module: validation

### Extracted Files
- modules/validation/actions.ts (from `lib/actions/validation.ts`)
- modules/validation/index.ts
- modules/validation/README.md

### Public API
- `validateExistingIdea(ideaId)`
- `validateIdea(formData)`

### Dependencies
- Auth module for session helpers.
- Supabase module for admin client access.
- AI module for shared OpenAI client.

### Files Updated (Consumers)
- components/features/validation/{validation-form, validation-button}.tsx
- modules/ideas/actions/index.ts (indirect validation helpers)

### Validation
- [x] Imports switched to `@/modules/validation`.
- [ ] Manual QA recommended for validation workflows.
