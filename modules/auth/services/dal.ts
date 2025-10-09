/**
 * Data Access Layer (DAL) for Authentication
 * 
 * This module provides secure data access functions that verify both
 * session validity and user existence in the database.
 * 
 * Following Next.js security best practices:
 * https://nextjs.org/docs/app/guides/authentication
 */

import { cache } from 'react'
import { cookies } from 'next/headers'
import { verifySessionToken } from './jwt'
import { UserDatabase } from './database'

export interface VerifiedSession {
  userId: string
  email: string
  sessionId: string
}

/**
 * Verify session and ensure user exists in database
 * 
 * This is the primary authentication check that should be used
 * in protected routes, API handlers, and server actions.
 * 
 * Returns null if:
 * - No session token exists
 * - Session token is invalid or expired
 * - User no longer exists in database
 * - User's email is not verified
 * 
 * Uses React cache() to deduplicate requests during a single render
 */
export const verifySession = cache(async (): Promise<VerifiedSession | null> => {
  try {
    // Get session token from cookie
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session-token')?.value

    if (!sessionToken) {
      return null
    }

    // Verify JWT token
    const sessionPayload = await verifySessionToken(sessionToken)
    if (!sessionPayload) {
      return null
    }

    // Verify user still exists and is verified
    const user = await UserDatabase.findById(sessionPayload.userId)
    if (!user || !user.email_verified) {
      return null
    }

    return {
      userId: sessionPayload.userId,
      email: sessionPayload.email,
      sessionId: sessionPayload.sessionId,
    }
  } catch (error) {
    console.error('Session verification error:', error)
    return null
  }
})

/**
 * Get the current authenticated user with full details
 * 
 * Use this when you need user information beyond just the session.
 * Returns null if user is not authenticated or doesn't exist.
 */
export const getCurrentUser = cache(async () => {
  try {
    const session = await verifySession()
    if (!session) {
      return null
    }

    const user = await UserDatabase.findById(session.userId)
    if (!user || !user.email_verified) {
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
})
