/**
 * Custom Authentication Server Actions
 * Replaces Supabase Auth with custom JWT-based authentication
 */

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { headers } from 'next/headers'

import { hashPassword, verifyPassword, validatePasswordStrength } from '../services/password'
import { createSessionToken, setSessionCookie, clearSessionCookie, generateSessionId, getCurrentSession } from '../services/jwt'
import { UserDatabase, SessionDatabase, RateLimitDatabase } from '../services/database'
import { sendEmailVerification, sendPasswordResetEmail, generatePasswordResetToken, generateEmailVerificationToken, verifyEmailToken } from '../services/email-mailgun-official'
import { verifyCSRFToken } from '../utils/csrf'
import { AuthResponse } from '@/types/database'
import { sendWelcomeEmail } from '@/modules/notifications/services/email-notifications'

// Validation schemas
const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address').max(255, 'Email too long').toLowerCase().trim(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password too long'),
  fullName: z.string().min(1, 'Full name is required').max(100, 'Name too long').trim(),
  csrfToken: z.string(),
})

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address').max(255, 'Email too long').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
  csrfToken: z.string(),
  rememberMe: z.boolean().optional(),
})

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address').max(255, 'Email too long').toLowerCase().trim(),
  csrfToken: z.string(),
})

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password too long'),
  csrfToken: z.string(),
})

/**
 * Rate limiting helper
 */
async function checkRateLimit(identifier: string, endpoint: string, maxAttempts: number, windowMinutes: number): Promise<boolean> {
  try {
    const rateLimit = await RateLimitDatabase.get(identifier, endpoint)
    const now = new Date()
    const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000)

    if (!rateLimit) {
      // First attempt
      await RateLimitDatabase.upsert({
        identifier,
        endpoint,
        attempts: 1,
        window_start: now.toISOString(),
      })
      return true
    }

    const rateLimitWindowStart = new Date(rateLimit.window_start)

    if (rateLimitWindowStart < windowStart) {
      // Window expired, reset
      await RateLimitDatabase.upsert({
        identifier,
        endpoint,
        attempts: 1,
        window_start: now.toISOString(),
        blocked_until: null,
      })
      return true
    }

    if (rateLimit.attempts >= maxAttempts) {
      // Rate limit exceeded
      const blockUntil = new Date(now.getTime() + windowMinutes * 60 * 1000)
      await RateLimitDatabase.upsert({
        identifier,
        endpoint,
        attempts: rateLimit.attempts + 1,
        window_start: rateLimit.window_start,
        blocked_until: blockUntil.toISOString(),
      })
      return false
    }

    // Increment attempts
    await RateLimitDatabase.upsert({
      identifier,
      endpoint,
      attempts: rateLimit.attempts + 1,
      window_start: rateLimit.window_start,
      blocked_until: rateLimit.blocked_until,
    })

    return true
  } catch (error) {
    console.error('Rate limiting error:', error)
    return true // Fail open for availability
  }
}

/**
 * Get client IP address for rate limiting
 */
async function getClientIP(): Promise<string> {
  const headersList = await headers()
  const forwarded = headersList.get('x-forwarded-for')
  const realIp = headersList.get('x-real-ip')
  return forwarded?.split(',')[0] || realIp || 'unknown'
}

/**
 * Sign up action
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

/**
 * Sign in action
 */
export async function signInAction(formData: FormData): Promise<AuthResponse> {
  try {
    // Validate input
    const validationResult = signInSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
      csrfToken: formData.get('csrf-token'),
      rememberMe: formData.get('rememberMe') === 'true',
    })

    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.errors[0].message,
      }
    }

    const { email, password, csrfToken } = validationResult.data

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
    const rateLimitOk = await checkRateLimit(clientIP, 'signin', 5, 15) // 5 attempts per 15 minutes
    if (!rateLimitOk) {
      return {
        success: false,
        error: 'Too many login attempts. Please try again later.',
      }
    }

    // Find user
    const user = await UserDatabase.findByEmail(email)
    if (!user || !user.password_hash) {
      return {
        success: false,
        error: 'Invalid email or password.',
      }
    }

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const lockTime = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60000)
      return {
        success: false,
        error: `Account temporarily locked. Try again in ${lockTime} minutes.`,
      }
    }

    // Verify password
    const passwordValid = await verifyPassword(password, user.password_hash)
    if (!passwordValid) {
      // Increment login attempts
      const newAttempts = user.login_attempts + 1
      const lockUntil = newAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : undefined // Lock for 15 minutes after 5 attempts

      await UserDatabase.updateLoginAttempts(user.id, newAttempts, lockUntil)

      return {
        success: false,
        error: 'Invalid email or password.',
      }
    }

    // Check if email is verified
    if (!user.email_verified) {
      return {
        success: false,
        error: 'Please verify your email address before signing in.',
      }
    }

    // Create session
    const sessionId = generateSessionId()
    const sessionToken = await createSessionToken({
      userId: user.id,
      email: user.email,
      sessionId,
    })

    // Store session in database
    const headersList = await headers()
    await SessionDatabase.create({
      user_id: user.id,
      session_token: sessionToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      user_agent: headersList.get('user-agent'),
      ip_address: await getClientIP(),
    })

    // Set session cookie
    await setSessionCookie(sessionToken)

    // Update user login info
    await UserDatabase.updateLastLogin(user.id)

    revalidatePath('/dashboard')

    return {
      success: true,
      message: 'Welcome back!',
      redirectTo: '/dashboard',
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
    console.error('Sign in error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}

/**
 * Sign out action
 */
export async function signOutAction(): Promise<AuthResponse> {
  try {
    const session = await getCurrentSession()

    if (session) {
      // Remove session from database
      await SessionDatabase.deleteByToken(session.sessionId)
    }

    // Clear session cookie
    await clearSessionCookie()

    revalidatePath('/')
    redirect('/auth/signin')
  } catch (error) {
    console.error('Sign out error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred during sign out.',
    }
  }
}

/**
 * Forgot password action
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

/**
 * Reset password action
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

/**
 * Verify email action
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

/**
 * Get current authenticated user
 * 
 * Uses the DAL pattern to ensure user exists in database
 */
export async function getCurrentUser() {
  try {
    const session = await getCurrentSession()
    if (!session) return null

    // Verify user still exists in database
    const user = await UserDatabase.findById(session.userId)
    if (!user || !user.email_verified) {
      // User not found or not verified, return null
      console.warn(`User ${session.userId} not found or not verified in database`)
      return null
    }

    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      email_verified: user.email_verified,
      plan_type: user.plan_type,
      subscription_status: user.subscription_status,
      trial_ends_at: user.trial_ends_at,
      last_login_at: user.last_login_at,
    }
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}
