import { test, expect } from '@playwright/test'

const protectedRoutes = [
  '/dashboard',
  '/dashboard/ideas',
  '/dashboard/content',
  '/dashboard/validation',
  '/dashboard/trends',
  '/dashboard/generate',
  '/dashboard/billing',
] as const

test.describe('Protected dashboard routes', () => {
  for (const route of protectedRoutes) {
    test(`redirects unauthenticated visitors from ${route} to sign in`, async ({
      page,
    }) => {
      await page.goto(route)

      await expect(page).toHaveURL(/\/auth\/signin\?redirectTo=/i)
      const currentUrl = new URL(page.url())
      expect(currentUrl.searchParams.get('redirectTo')).toBe(route)
      await expect(page.getByText(/Sign in to your StartupSniff account/i)).toBeVisible()
    })
  }
})
