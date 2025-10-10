import { test, expect } from '@playwright/test'

test.describe('Marketing landing page', () => {
  test('renders hero content and navigation links', async ({ page }) => {
    await page.goto('/')

    await expect(
      page.getByRole('link', { name: /StartupSniff/i })
    ).toBeVisible()
    await expect(
      page.getByText('Discover Your Next Million-Dollar Startup Idea')
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: /Start Free Today/i })
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: /Sign In/i })
    ).toBeVisible()
  })

  test('navigates to the contact page from the marketing nav', async ({
    page,
  }) => {
    await page.goto('/')

    await page.getByRole('link', { name: /Contact/i }).click()
    await expect(page).toHaveURL(/\/contact$/)
    await expect(page.getByText(/Contact Us/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Send Message/i })).toBeVisible()
  })

  test('redirects to signup when selecting the free pricing plan', async ({
    page,
  }) => {
    await page.goto('/')

    const freePlanButton = page.getByRole('button', {
      name: /Get Started \(Free\)/i,
    })
    await expect(freePlanButton).toBeVisible()
    await freePlanButton.click()

    await expect(page).toHaveURL(/\/auth\/signup/i)
    await expect(
      page.getByText(/Create your account/i)
    ).toBeVisible()
  })
})
