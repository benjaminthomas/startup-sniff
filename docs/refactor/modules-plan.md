# Modularization Plan (Auth First)

## Target Directories
```
modules/
  auth/
    actions/
    components/
    hooks/
    services/
    utils/
    index.ts
```

## Migration Stages
1. **Auth Module**
   - ✅ Bootstrap module and barrel export.
   - ✅ Relocate services (JWT, Supabase clients, DAL, CSRF).
   - ✅ Move server actions and update consumers.
   - ⏳ Align UI components/hooks within module.
2. **Ideas Module**
   - ✅ Bootstrap `modules/ideas` with README and barrel.
   - ✅ Move idea server actions (`generateIdea`, `toggleFavorite`, etc.) into module.
   - ✅ Update dashboard pages, forms, and components to import from `@/modules/ideas`.
   - ⏳ Extract supporting services (Reddit mapping helpers, usage checks) into `modules/ideas/services`.
   - ✅ Usage dependency now handled through `modules/usage`.
3. **Usage Module**
   - ✅ Create `modules/usage` with usage + plan-limit actions and barrel export.
   - ✅ Update hooks, dashboard pages, and content actions to reference `@/modules/usage`.
   - ⏳ Evaluate separating plan limit constants/services for reuse across UI hooks.
4. **Billing Module**
   - ✅ Move Razorpay subscription actions into `modules/billing`.
   - ✅ Update billing UI components to consume `@/modules/billing`.
   - ⏳ Consider extracting Razorpay client helpers/services for reuse/testing.
5. **Content Module**
   - ✅ Relocate content generation server actions into `modules/content`.
   - ✅ Update dashboard content page and generation form to import from the module.
   - ⏳ Break out AI prompt utilities into shared services for future reuse.
6. **Reddit Module**
   - ✅ Move `lib/actions/reddit` logic into `modules/reddit`.
   - ✅ Update ideas module and API to import from `@/modules/reddit`.
   - ✅ Consolidate Reddit services (pain-point extractor, trend integration) under `modules/reddit/services`.
7. **Contact Module**
   - ✅ Shift Mailgun email helpers into `modules/contact`.
   - ✅ Update contact API route and test harness to import from the module.
   - ⏳ Evaluate extracting shared email notification utilities for reuse.
8. **Marketing Module**
   - ✅ Move landing/policy sections into `modules/marketing`.
   - ✅ Update landing and policy pages to import from module barrel.
   - ⏳ Consider migrating marketing data/constants to align with module boundary.
9. **AI Module**
   - ✅ Relocate OpenAI helpers and AI idea generator into `modules/ai`.
   - ✅ Update ideas/content/reddit modules to consume `@/modules/ai`.
   - ⏳ Evaluate migrating additional AI utilities (validation prompts, mock generators) into this module.
10. **Supabase Module**
    - ✅ Extract shared Supabase server/admin/browser clients into `modules/supabase`.
    - ✅ Update auth, usage, ideas, content, and Reddit modules to consume the new helpers.
    - ⏳ Move remaining direct `createClient` usages (e.g., auth database service) into this module.
11. **Validation Module**
    - ✅ Move AI validation actions into `modules/validation`.
    - ✅ Update validation UI and dashboard imports to consume the module.
    - ⏳ Consider consolidating validation-specific constants and prompts here.

## Constraints
- Maintain functionality throughout; update files incrementally and run lint/tests after each stage.
- Keep JWT + CSRF logic untouched; only adjust import paths and module placement.
- Add module-level README summarizing exports and dependencies.

## Validation Checklist
- All imports reference the new modules for migrated features (`@/modules/auth`, `@/modules/ideas`, `@/modules/usage`, `@/modules/billing`, `@/modules/content`, `@/modules/reddit`, `@/modules/contact`, `@/modules/marketing`, `@/modules/ai`) (✅ for current scope).
- Middleware and server actions compile.
- Playwright/Vitest auth suites pass.
