import { test, expect } from '@playwright/test'

const contactApiMatcher = '**/api/contact'

test.describe('Contact form submission', () => {
  test('submits contact form with mocked API response', async ({ page }) => {
    let receivedPayload: unknown

    await page.route(contactApiMatcher, async (route) => {
      const request = route.request()
      receivedPayload = request.method() === 'POST' ? request.postDataJSON() : null

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: "Thanks for contacting StartupSniff! We'll reply soon.",
        }),
      })
    })

    await page.goto('/contact')

    await page.getByLabel('Full Name').fill('Playwright Tester')
    await page.getByLabel('Email Address').fill('playwright@example.com')

    const subjectTrigger = page.getByRole('combobox', { name: /Subject/i })
    await subjectTrigger.click()
    await page.getByRole('option', { name: /General Question/i }).click()

    await page.getByLabel('Company/Organization (Optional)').fill('QA Guild')
    await page
      .getByLabel('Message')
      .fill('Running automated contact coverage from Playwright.')

    await page.getByRole('button', { name: /Send Message/i }).click()

    await expect(
      page.getByText(/Message sent successfully!/i)
    ).toBeVisible()

    await expect(
      page.getByRole('heading', { name: /Frequently Asked Questions/i })
    ).toBeVisible()

    expect(receivedPayload).toMatchObject({
      name: 'Playwright Tester',
      email: 'playwright@example.com',
      subject: 'general',
      message: 'Running automated contact coverage from Playwright.',
      company: 'QA Guild',
    })
  })
})
