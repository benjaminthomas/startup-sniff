import { test, expect } from '@playwright/test'

test.describe('Marketing legal pages', () => {
  const pages = [
    {
      path: '/T&C',
      heading: /Terms & Conditions/i,
      subtitle: /The terms governing your use of StartupSniff/i,
    },
    {
      path: '/privacy_policy',
      heading: /Privacy Policy/i,
      subtitle: /How we collect, use, and protect your information/i,
    },
    {
      path: '/refund_policy',
      heading: /Refund & Cancellation Policy/i,
      subtitle: /Our commitment to fair billing and cancellation terms/i,
    },
  ] as const

  for (const pageConfig of pages) {
    test(`renders ${pageConfig.path} with expected content`, async ({ page }) => {
      await page.goto(pageConfig.path)

      await expect(
        page.getByRole('heading', { level: 1, name: pageConfig.heading })
      ).toBeVisible()

      await expect(page.getByText(pageConfig.subtitle)).toBeVisible()
      await expect(page.getByRole('navigation')).toBeVisible()
      await expect(page.getByRole('contentinfo')).toBeVisible()
    })
  }
})
