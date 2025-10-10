# Billing Module

Holds Razorpay-backed subscription helpers and billing actions extracted from `server/actions/billing.ts`.

## Contents
- `actions/index.ts` – subscription helpers (`createSubscription`, `cancelSubscription`, `updateSubscription`, `manageBilling`).
- `index.ts` – barrel export.

## Usage
```ts
import {
  createSubscription,
  cancelSubscription,
  updateSubscription,
  manageBilling,
} from '@/modules/billing'
```

All UI components and routes should rely on this module rather than `@/modules/billing`.
