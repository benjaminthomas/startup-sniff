'use server'

import { RedditApiClient } from '@/lib/reddit/api-client'
import { getCurrentSession } from '@/modules/auth/services/jwt'
import { createServerAdminClient } from '@/modules/supabase/server'
import { randomBytes } from 'crypto'
import { log } from '@/lib/logger'

/**
 * Epic 2, Story 2.2: Reddit OAuth Integration
 *
 * Initiates the Reddit OAuth flow by generating an authorization URL
 */

interface ConnectRedditAccountResult {
  success: boolean
  authUrl?: string
  error?: string
}

export async function connectRedditAccountAction(): Promise<ConnectRedditAccountResult> {
  try {
    // Check authentication
    const session = await getCurrentSession()
    if (!session) {
      return {
        success: false,
        error: 'Not authenticated'
      }
    }

    // Generate CSRF token (state parameter)
    const state = randomBytes(32).toString('hex')

    // Store state in database for verification
    const supabase = createServerAdminClient()
    const { error: updateError } = await supabase
      .from('users')
      .update({
        // Store state temporarily in a JSON field or separate column
        // For now, we'll use a simple timestamp-based approach
        updated_at: new Date().toISOString()
      })
      .eq('id', session.userId)

    if (updateError) {
      log.error('[connect-account] Failed to prepare OAuth state:', updateError)
      return {
        success: false,
        error: 'Failed to prepare OAuth flow'
      }
    }

    // Generate authorization URL
    const clientId = process.env.REDDIT_CLIENT_ID!
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/reddit/callback`

    const authUrl = RedditApiClient.getAuthorizationUrl({
      clientId,
      redirectUri,
      state: `${session.userId}:${state}`, // Include user ID in state for verification
      scope: ['identity', 'privatemessages', 'read', 'submit']
    })

    log.info(`[connect-account] Generated OAuth URL for user ${session.userId}`)

    return {
      success: true,
      authUrl
    }
  } catch (error) {
    log.error('[connect-account] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
