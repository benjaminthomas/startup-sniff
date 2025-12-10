import { NextRequest, NextResponse } from 'next/server'
import { RedditApiClient } from '@/lib/reddit/api-client'
import { createServerAdminClient } from '@/modules/supabase/server'
import { log } from '@/lib/logger'

/**
 * Epic 2, Story 2.2: Reddit OAuth Integration
 *
 * Handles the OAuth callback from Reddit after user authorizes the application
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Check for Reddit authorization errors
    if (error) {
      log.error('[reddit-oauth] Authorization error:', error)
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=reddit_auth_denied', request.url)
      )
    }

    // Validate required parameters
    if (!code || !state) {
      log.error('[reddit-oauth] Missing code or state parameter')
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=reddit_auth_invalid', request.url)
      )
    }

    // Extract user ID from state (format: userId:token)
    const [userId, stateToken] = state.split(':')
    if (!userId || !stateToken) {
      log.error('[reddit-oauth] Invalid state format')
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=reddit_auth_invalid', request.url)
      )
    }

    // Exchange authorization code for tokens
    const clientId = process.env.REDDIT_CLIENT_ID!
    const clientSecret = process.env.REDDIT_CLIENT_SECRET!
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/reddit/callback`

    const tokenResult = await RedditApiClient.exchangeCodeForTokens({
      code,
      clientId,
      clientSecret,
      redirectUri
    })

    if (!tokenResult.success || !tokenResult.data) {
      log.error('[reddit-oauth] Token exchange failed:', tokenResult.error)
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=reddit_auth_failed', request.url)
      )
    }

    const tokens = tokenResult.data

    // Get user's Reddit identity
    const identityResult = await RedditApiClient.getUserIdentity(tokens.access_token)
    if (!identityResult.success || !identityResult.data) {
      log.error('[reddit-oauth] Failed to get user identity:', identityResult.error)
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=reddit_auth_failed', request.url)
      )
    }

    const redditUsername = identityResult.data.name

    // Store tokens in database
    const supabase = createServerAdminClient()
    const tokenExpiry = new Date(Date.now() + (tokens.expires_in * 1000))

    const { error: updateError } = await supabase
      .from('users')
      .update({
        reddit_access_token: tokens.access_token,
        reddit_refresh_token: tokens.refresh_token || null,
        reddit_token_expires_at: tokenExpiry.toISOString(),
        reddit_connected_at: new Date().toISOString(),
        reddit_username: redditUsername,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      log.error('[reddit-oauth] Failed to store tokens:', updateError)
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=reddit_auth_failed', request.url)
      )
    }

    log.info(`[reddit-oauth] Successfully connected Reddit account for user ${userId} (u/${redditUsername})`)

    // Redirect back to the page they came from (or settings as fallback)
    const redirectUrl = new URL(request.url)
    redirectUrl.pathname = '/dashboard/settings'
    redirectUrl.search = '?success=reddit_connected'

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    log.error('[reddit-oauth] Unexpected error during callback:', error)
    return NextResponse.redirect(
      new URL('/dashboard/settings?error=reddit_auth_failed', request.url)
    )
  }
}
