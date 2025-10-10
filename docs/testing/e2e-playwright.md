## Playwright E2E Suite

This document summarizes the Playwright-based coverage that now ships with the project and how to extend it safely while the monolithic-to-modular migration proceeds.

### Why Playwright

- Aligns with the [Next.js testing guidance](https://nextjs.org/docs/app/building-your-application/testing/playwright) sourced via Context7 MCP during implementation.
- Provides browser-level confidence for marketing funnels and auth entry points without replacing the existing Node smoke tests.
- Keeps feature modules (marketing, auth, contact) black-boxed by exercising public routes only.

### Test layout

```
tests/e2e/
├── api-contact.spec.ts        # Direct API validation checks for /api/contact
├── auth-pages.spec.ts         # Auth entry accessibility + validation gating
├── contact-form.spec.ts       # Contact form happy path (API mocked)
├── dashboard-access.spec.ts   # Route-guard coverage for dashboard surfaces
├── marketing-home.spec.ts     # Landing + navigation smoke flows
└── marketing-legal.spec.ts    # Legal/marketing policy pages render correctly
```

Key patterns:

- Specs run against the base URL configured in `playwright.config.ts` (default `http://127.0.0.1:4123`).
- Contact POSTs are mocked with `page.route('**/api/contact', …)` so Mailgun isn’t invoked during tests.
- Assertions rely on accessible labels (`getByLabel`, `getByRole`) to guard against brittle DOM selectors.

### Running locally

```bash
# Install browsers once
npm run test:e2e:install

# (Recommended) production-like run
npm run build
PLAYWRIGHT_WEB_COMMAND="npm run start -- --hostname 127.0.0.1 --port 4123" npm run test:e2e
```

For development convenience you can rely on the default dev server command:

```bash
npm run test:e2e -- --reporter=list --workers=1
```

The CLI sandbox blocks listening sockets, so use `npm run test:e2e -- --list` when you only need to confirm discovery while inside Codex.

### Extending coverage

1. Create additional specs under `tests/e2e/feature-name.spec.ts`.
2. Keep helpers colocated (e.g., `tests/e2e/utils/<helper>.ts`) and import from spec files to avoid cross-module leakage.
3. Mock third-party network calls with `page.route` or Playwright’s MSW integration if you need to exercise fetch-heavy flows.
4. Prefer user-facing assertions (headings, aria-labels) and avoid depending on Tailwind utility classes.
5. Update this document plus `README.md` when adding new scripts or environment switches.

### Troubleshooting

- **`listen EPERM`** — Occurs in restricted sandboxes. Pick a different `E2E_PORT` or run tests on a host that permits binding.
- **Hanging dev server** — Pass `E2E_WEB_COMMAND="npm run start -- --port 4123"` to run against a production build.
- **Flaky animations** — Add `await page.waitForTimeout(50)` after triggering motion-heavy sections or use `locator.waitFor` on stable copy.
- **Contact endpoint failures** — Verify your route mock matches `**/api/contact` and that mocked response headers include `content-type: application/json`.

### Coverage roadmap

- Add dashboard smoke coverage once auth fixtures exist.
- Exercise Supabase-backed server actions via request-context helpers.
- Integrate MSW-powered mocks for Reddit/OpenAI fetchers when migrating those modules.

### Suggested commit boundaries

When expanding the suite, keep changes focused so each commit maps cleanly to a feature module:

1. **Marketing / Legal** – specs under `marketing-*.spec.ts` that cover navigation, hero, legal policies.
2. **Contact** – form automation plus `/api/contact` validation checks.
3. **Auth** – entry flows (sign in/up) and recovery guardrails.
4. **Dashboard & Billing** – route access expectations for authenticated-only pages.

This mirrors the repository’s modular architecture and makes it easy to revert or bisect feature-specific regressions.
