import { test, expect } from '@playwright/test'

test.describe('Auth entry pages', () => {
  test('sign in page exposes accessible controls without submitting', async ({
    page,
  }) => {
    await page.goto('/auth/signin')

    await expect(
      page.getByText(/Sign in to your StartupSniff account securely/i)
    ).toBeVisible()
    await expect(page.getByLabel('Email')).toHaveAttribute('type', 'email')
    await expect(page.getByLabel('Password')).toHaveAttribute('type', 'password')

    const rememberMe = page.getByRole('checkbox', {
      name: /Remember me for 30 days/i,
    })
    await expect(rememberMe).toBeVisible()
    await rememberMe.check()
    await expect(rememberMe).toBeChecked()
  })

  test('sign up page requires valid data before enabling submit', async ({
    page,
  }) => {
    await page.goto('/auth/signup')

    await expect(page.getByText(/Create your account/i)).toBeVisible()
    const submitButton = page.getByRole('button', { name: /Create Account/i })
    await expect(submitButton).toBeDisabled()

    await page.getByLabel('Full Name').fill('Playwright Prospect')
    await page.getByLabel('Email').fill('prospect@example.com')
    await page.getByLabel('Password').fill('Password1!')
    await page.getByLabel('Confirm Password').fill('Password1!')

    await expect(submitButton).toBeEnabled()
  })

  test('forgot password page enforces email validation', async ({ page }) => {
    await page.goto('/auth/forgot-password')

    const emailField = page.getByLabel('Email Address')
    await expect(emailField).toBeVisible()

    await emailField.fill('invalid-email')
    await page.getByRole('button', { name: /Send reset link/i }).click()

    await expect(
      page.getByText(/Please enter a valid email address/i)
    ).toBeVisible()
  })

  test('reset password without recovery context redirects back to request flow', async ({
    page,
  }) => {
    const response = await page.goto('/auth/reset-password')
    expect(response?.status()).toBeGreaterThanOrEqual(300)
    expect(response?.status()).toBeLessThan(400)

    await expect(page).toHaveURL(
      /\/auth\/forgot-password\?error=Invalid%20or%20expired%20reset%20link/i
    )
    await expect(page.getByText(/Reset your password/i)).toBeVisible()
  })
})
