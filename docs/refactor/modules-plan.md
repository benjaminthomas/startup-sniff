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
   - ⏳ Evaluate migration of `getCurrentUserUsage` to a shared usage module to remove the remaining dependency.

## Constraints
- Maintain functionality throughout; update files incrementally and run lint/tests after each stage.
- Keep JWT + CSRF logic untouched; only adjust import paths and module placement.
- Add module-level README summarizing exports and dependencies.

## Validation Checklist
- All imports reference the new modules for migrated features (`@/modules/auth`, `@/modules/ideas`) (✅ for current scope).
- Middleware and server actions compile.
- Playwright/Vitest auth suites pass.
