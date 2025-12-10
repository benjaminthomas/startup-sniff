'use server'

import { UserDatabase } from '../services/database'
import { verifyEmailToken } from '../services/email-mailgun-official'
import { sendWelcomeEmail } from '@/modules/notifications/services/email-notifications'
import type { AuthResponse } from '@/types/database'

/**
 * Verify email action - Confirms email address with token
 */
export async function verifyEmailAction(token: string): Promise<AuthResponse> {
  try {
    // Verify token
    const tokenPayload = await verifyEmailToken(token, 'email_verification')
    if (!tokenPayload) {
      return {
        success: false,
        error: 'Invalid or expired verification token.',
      }
    }

    // Find user and verify token matches
    const user = await UserDatabase.findById(tokenPayload.userId)
    if (!user || user.email_verification_token !== token) {
      return {
        success: false,
        error: 'Invalid or expired verification token.',
      }
    }

    // Check if already verified
    if (user.email_verified) {
      return {
        success: true,
        message: 'Email already verified. You can now sign in.',
        redirectTo: '/auth/signin',
      }
    }

    // Check token expiration
    if (user.email_verification_expires_at && new Date(user.email_verification_expires_at) < new Date()) {
      return {
        success: false,
        error: 'Verification token has expired. Please request a new one.',
      }
    }

    // Update user as verified
    await UserDatabase.update(user.id, {
      email_verified: true,
      email_verification_token: null,
      email_verification_expires_at: null,
    })

    // Send welcome email
    try {
      await sendWelcomeEmail({
        email: user.email,
        name: user.full_name || undefined,
      })
    } catch (error) {
      console.error('Failed to send welcome email:', error)
      // Don't fail verification if email fails
    }

    return {
      success: true,
      message: 'Email verified successfully! You can now sign in to your account.',
      redirectTo: '/auth/signin',
    }
  } catch (error) {
    console.error('Email verification error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}
