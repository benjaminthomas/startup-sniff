# Supabase Module

Shared Supabase client helpers for server, middleware, and browser contexts.

## Exports
Server helpers:
```ts
import {
  createServerSupabaseClient,
  createServerAdminClient,
  createMiddlewareSupabaseClient,
  checkRateLimit,
} from '@/modules/supabase'
```

Client helper:
```ts
import { createClient } from '@/modules/supabase/client'
```

Use these helpers instead of duplicating Supabase client setup across modules.
