# Supabase Module

Shared Supabase client helpers for server, middleware, and browser contexts.

## Exports
```ts
import {
  createServerSupabaseClient,
  createServerAdminClient,
  createMiddlewareSupabaseClient,
  checkRateLimit,
  createClient,
} from '@/modules/supabase'
```

Use these helpers instead of duplicating Supabase client setup across modules.
