'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { verifyPassword } from '../services/password'
import { generateSessionId, createSessionToken, setSessionCookie } from '../services/jwt'
import { UserDatabase, SessionDatabase } from '../services/database'
import { verifyCSRFToken } from '../utils/csrf'
import { getClientIP, checkRateLimit } from '../utils/rate-limit'
import { signInSchema } from '../schemas/auth-schemas'
import type { AuthResponse } from '@/types/database'
import { log } from '@/lib/logger'

/**
 * Sign in action - Authenticates user and creates session
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
    log.error('Sign in error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}
