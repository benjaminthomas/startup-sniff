## Module: contact

### Extracted Files
- modules/contact/services/email.ts (was `lib/services/contact-email.ts`)
- modules/contact/index.ts
- modules/contact/README.md

### Public API
- `sendContactFormEmail`
- `sendContactConfirmationEmail`
- `verifyContactEmailConfiguration`
- `ContactFormData`

### Dependencies
- Mailgun configuration via environment variables.
- Contact API route (`app/api/contact/route.ts`) and test harness now import from this module.

### Files Updated (Consumers)
- app/api/contact/route.ts
- lib/services/contact-email-test.ts

### Validation
- [x] Imports retargeted to `@/modules/contact`.
- [ ] Manual QA recommended for contact form submissions and Mailgun delivery.
