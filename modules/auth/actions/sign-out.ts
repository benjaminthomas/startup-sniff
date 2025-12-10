'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCurrentSession } from '../services/jwt'
import { SessionDatabase } from '../services/database'
import { clearSessionCookie } from '../services/jwt'
import type { AuthResponse } from '@/types/database'

/**
 * Sign out action - Clears session and redirects to sign in
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
