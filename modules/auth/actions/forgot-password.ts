'use server'

import { UserDatabase } from '../services/database'
import { sendPasswordResetEmail, generatePasswordResetToken } from '../services/email-mailgun-official'
import { verifyCSRFToken } from '../utils/csrf'
import { getClientIP, checkRateLimit } from '../utils/rate-limit'
import { forgotPasswordSchema } from '../schemas/auth-schemas'
import type { AuthResponse } from '@/types/database'

/**
 * Forgot password action - Sends password reset email
 */
export async function forgotPasswordAction(formData: FormData): Promise<AuthResponse> {
  try {
    // Validate input
    const validationResult = forgotPasswordSchema.safeParse({
      email: formData.get('email'),
      csrfToken: formData.get('csrf-token'),
    })

    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.errors[0].message,
      }
    }

    const { email, csrfToken } = validationResult.data

    // Verify CSRF token
    const csrfValid = await verifyCSRFToken(csrfToken)
    if (!csrfValid) {
      return {
        success: false,
        error: 'Invalid request. Please try again.',
      }
    }

    // Rate limiting
    const clientIP = await getClientIP()
    const rateLimitOk = await checkRateLimit(clientIP, 'forgot-password', 3, 60) // 3 attempts per hour
    if (!rateLimitOk) {
      return {
        success: false,
        error: 'Too many password reset attempts. Please try again later.',
      }
    }

    // Find user
    const user = await UserDatabase.findByEmail(email)
    if (!user) {
      // Don't reveal whether email exists
      return {
        success: true,
        message: 'If an account with that email exists, you will receive a password reset link.',
      }
    }

    // Generate reset token
    const resetToken = await generatePasswordResetToken(user.id, user.email)

    // Update user with reset token
    await UserDatabase.update(user.id, {
      password_reset_token: resetToken,
      password_reset_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
    })

    // Send reset email
    await sendPasswordResetEmail(user.email, resetToken)

    return {
      success: true,
      message: 'If an account with that email exists, you will receive a password reset link.',
    }
  } catch (error) {
    console.error('Forgot password error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}
