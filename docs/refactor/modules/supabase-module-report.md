## Module: supabase

### Contents
- `modules/supabase/admin.ts` – admin Supabase client via service role key.
- `modules/supabase/client.ts` – browser and middleware-safe clients.
- `modules/supabase/index.ts` – barrel exports.

### Consumers Updated
- `modules/usage/actions/*`
- `modules/content/actions/index.ts`
- `modules/ideas/actions/index.ts`
- `modules/reddit/actions/index.ts`
- Auth module services (`supabase-server`, `supabase-client`)

### Validation
- [x] Lint/build pass (middleware warning pre-existing).
- [ ] Manual QA recommended for Supabase interactions.
