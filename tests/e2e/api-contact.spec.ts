import { test, expect } from '@playwright/test'

test.describe('Contact API validation', () => {
  test('rejects incomplete request payloads', async ({ request }) => {
    const response = await request.post('/api/contact', {
      data: {
        email: 'invalid-email',
        subject: 'general',
        message: 'short',
      },
      headers: {
        'Content-Type': 'application/json',
      },
    })

    expect(response.status()).toBe(400)
    const body = await response.json()

    expect(body.success).toBeFalsy()
    expect(body.errors).toEqual(
      expect.arrayContaining([
        'Name is required',
        'Please enter a valid email address',
        'Message must be at least 10 characters',
      ])
    )
  })
})
