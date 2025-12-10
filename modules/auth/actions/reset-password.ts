'use server'

import { hashPassword, validatePasswordStrength } from '../services/password'
import { UserDatabase, SessionDatabase } from '../services/database'
import { verifyEmailToken } from '../services/email-mailgun-official'
import { verifyCSRFToken } from '../utils/csrf'
import { resetPasswordSchema } from '../schemas/auth-schemas'
import type { AuthResponse } from '@/types/database'

/**
 * Reset password action - Resets password with valid token
 */
export async function resetPasswordAction(formData: FormData): Promise<AuthResponse> {
  try {
    // Validate input
    const validationResult = resetPasswordSchema.safeParse({
      token: formData.get('token'),
      password: formData.get('password'),
      csrfToken: formData.get('csrf-token'),
    })

    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.errors[0].message,
      }
    }

    const { token, password, csrfToken } = validationResult.data

    // Verify CSRF token
    const csrfValid = await verifyCSRFToken(csrfToken)
    if (!csrfValid) {
      return {
        success: false,
        error: 'Invalid request. Please try again.',
      }
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.isValid) {
      return {
        success: false,
        error: passwordValidation.errors[0],
      }
    }

    // Verify reset token
    const tokenPayload = await verifyEmailToken(token, 'password_reset')
    if (!tokenPayload) {
      return {
        success: false,
        error: 'Invalid or expired reset token.',
      }
    }

    // Find user and verify token matches
    const user = await UserDatabase.findById(tokenPayload.userId)
    if (!user || user.password_reset_token !== token) {
      return {
        success: false,
        error: 'Invalid or expired reset token.',
      }
    }

    // Check token expiration
    if (user.password_reset_expires_at && new Date(user.password_reset_expires_at) < new Date()) {
      return {
        success: false,
        error: 'Reset token has expired. Please request a new one.',
      }
    }

    // Hash new password
    const passwordHash = await hashPassword(password)

    // Update user password and clear reset token
    await UserDatabase.update(user.id, {
      password_hash: passwordHash,
      password_reset_token: null,
      password_reset_expires_at: null,
      login_attempts: 0,
      locked_until: null,
    })

    // Clear all sessions for this user
    await SessionDatabase.deleteAllForUser(user.id)

    return {
      success: true,
      message: 'Password reset successfully. Please sign in with your new password.',
      redirectTo: '/auth/signin',
    }
  } catch (error) {
    console.error('Reset password error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}
