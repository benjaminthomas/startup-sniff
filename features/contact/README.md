# Contact Module

Provides contact-form email utilities formerly located at `lib/services/contact-email.ts`.

## Exports
```ts
import {
  sendContactFormEmail,
  sendContactConfirmationEmail,
  verifyContactEmailConfiguration,
  type ContactFormData,
} from '@/modules/contact'
```

The module wraps Mailgun-based delivery used by `app/api/contact/route.ts` and testing helpers.
