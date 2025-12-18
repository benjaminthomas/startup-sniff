'use server'

import { getCurrentSession } from '../services/jwt'
import { UserDatabase } from '../services/database'
import { log } from '@/lib/logger'

/**
 * Get current authenticated user
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
      log.warn('User not found or not verified', {
        userId: session.userId,
        userExists: !!user,
        emailVerified: user?.email_verified || false
      })
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
    log.error('Failed to get current user', error)
    return null
  }
}
