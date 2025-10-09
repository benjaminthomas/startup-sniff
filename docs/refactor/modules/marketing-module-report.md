## Module: marketing

### Extracted Files
- modules/marketing/sections/*.tsx (migrated from `components/features/landing/*.tsx`)
- modules/marketing/index.ts
- modules/marketing/README.md

### Public API
- `Navigation`, `HeroSection`, `FeaturesSection`, `PricingSection`, `CTASection`, `Footer`
- `PolicyHeader`, `PolicyContent`

### Dependencies
- Shared UI primitives (`@/components/ui/*`), constants (pricing/contact), and navigation utilities.
- Landing and policy pages now import directly from `@/modules/marketing`.

### Files Updated (Consumers)
- app/(LandingPage)/(home)/page.tsx
- app/(LandingPage)/contact/page.tsx
- app/(LandingPage)/privacy_policy/page.tsx
- app/(LandingPage)/refund_policy/page.tsx
- app/(LandingPage)/T&C/page.tsx
- components/features/landing/index.ts (re-export for backward compatibility)

### Validation
- [x] All landing page imports now use `@/modules/marketing`.
- [ ] Manual QA recommended for landing/marketing pages to ensure styling intact.
