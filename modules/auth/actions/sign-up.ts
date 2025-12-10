'use server'

import { hashPassword, validatePasswordStrength } from '../services/password'
import { generateSessionId, createSessionToken, setSessionCookie } from '../services/jwt'
import { UserDatabase, SessionDatabase } from '../services/database'
import { sendEmailVerification, generateEmailVerificationToken } from '../services/email-mailgun-official'
import { verifyCSRFToken } from '../utils/csrf'
import { getClientIP, checkRateLimit } from '../utils/rate-limit'
import { signUpSchema } from '../schemas/auth-schemas'
import { sendWelcomeEmail } from '@/modules/notifications/services/email-notifications'
import type { AuthResponse } from '@/types/database'

/**
 * Sign up action - Creates new user account
 */
export async function signUpAction(formData: FormData): Promise<AuthResponse> {
  try {
    // Validate input
    const validationResult = signUpSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
      fullName: formData.get('fullName'),
      csrfToken: formData.get('csrf-token'),
    })

    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.errors[0].message,
      }
    }

    const { email, password, fullName, csrfToken } = validationResult.data

    // Verify CSRF token
    const csrfValid = await verifyCSRFToken(csrfToken)
    if (!csrfValid) {
      return {
        success: false,
        error: 'Invalid request. Please try again.',
      }
    }

    // Rate limiting (disabled in development for testing)
    if (process.env.NODE_ENV === 'production') {
      const clientIP = await getClientIP()
      const rateLimitOk = await checkRateLimit(clientIP, 'signup', 3, 60) // 3 attempts per hour
      if (!rateLimitOk) {
        return {
          success: false,
          error: 'Too many signup attempts. Please try again later.',
        }
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

    // Check if user already exists
    const existingUser = await UserDatabase.findByEmail(email)
    if (existingUser) {
      return {
        success: false,
        error: 'An account with this email already exists.',
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Generate email verification token
    const userId = crypto.randomUUID()
    const verificationToken = await generateEmailVerificationToken(userId, email)

    // Create user
    const user = await UserDatabase.create({
      id: userId,
      email,
      password_hash: passwordHash,
      full_name: fullName,
      email_verified: false,
      email_verification_token: verificationToken,
      email_verification_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      plan_type: 'free', // Default to free plan
      subscription_status: 'inactive',
    })

    // Send verification email (auto-verify in development if email service not configured)
    if (process.env.SMTP_USER || process.env.MAILGUN_API_KEY) {
      try {
        await sendEmailVerification(email, verificationToken)
      } catch (error) {
        console.warn('📧 Email sending failed, auto-verifying user in development:', error)
        if (process.env.NODE_ENV === 'development') {
          await UserDatabase.update(userId, {
            email_verified: true,
            email_verification_token: null,
            email_verification_expires_at: null,
          })
          console.log('🧪 Development Mode: Auto-verified user due to email failure')
        } else {
          throw error // Re-throw in production
        }
      }
    } else {
      console.log('🧪 Development Mode: Auto-verifying user (Email service not configured)')
      // Auto-verify in development when email service is not configured
      await UserDatabase.update(userId, {
        email_verified: true,
        email_verification_token: null,
        email_verification_expires_at: null,
      })

      // Send welcome email in development after auto-verification
      try {
        await sendWelcomeEmail({
          email: user.email,
          name: fullName,
        })
      } catch (error) {
        console.error('Failed to send welcome email:', error)
        // Don't fail signup if email fails
      }
    }

    return {
      success: true,
      message: process.env.SMTP_USER
        ? 'Account created! Please verify your email address to continue.'
        : 'Account created and verified! You can now sign in.',
      redirectTo: process.env.SMTP_USER ? '/auth/verify-email' : '/auth/signin',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        email_verified: user.email_verified,
        plan_type: user.plan_type,
        subscription_status: user.subscription_status,
        trial_ends_at: user.trial_ends_at,
        last_login_at: user.last_login_at,
      },
    }
  } catch (error) {
    console.error('Sign up error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}
