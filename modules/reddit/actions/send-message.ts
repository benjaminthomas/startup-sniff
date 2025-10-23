'use server'

import { getCurrentSession } from '@/modules/auth/services/jwt'
import { createServerAdminClient } from '@/modules/supabase/server'
import { RedditApiClient } from '@/lib/reddit/api-client'
import { getRateLimiter } from '@/lib/services/rate-limiter'

/**
 * Epic 2, Story 2.4 & 2.5: Rate Limiting + Message Sending
 *
 * Server action to send Reddit messages with Redis-based rate limiting (5/day)
 */

const DAILY_MESSAGE_LIMIT = 5

interface SendMessageResult {
  success: boolean
  messageId?: string
  quotaRemaining?: number
  error?: string
}

export async function sendRedditMessageAction(
  messageId: string,
  editedText?: string // Optional: user may have edited the template
): Promise<SendMessageResult> {
  try {
    // 1. Check authentication
    const session = await getCurrentSession()
    if (!session) {
      return {
        success: false,
        error: 'Not authenticated'
      }
    }

    const supabase = createServerAdminClient()

    // 2. Get message details
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .eq('user_id', session.userId)
      .single()

    if (messageError || !message) {
      console.error('[send-message] Message not found:', messageId)
      return {
        success: false,
        error: 'Message not found'
      }
    }

    // 3. Check if message already sent
    if (message.send_status === 'sent') {
      return {
        success: false,
        error: 'Message already sent'
      }
    }

    // 4. Get user's Reddit OAuth tokens
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('reddit_access_token, reddit_refresh_token, reddit_token_expires_at, reddit_username')
      .eq('id', session.userId)
      .single()

    if (userError || !user || !user.reddit_access_token) {
      console.error('[send-message] User Reddit not connected:', session.userId)
      return {
        success: false,
        error: 'Reddit account not connected'
      }
    }

    // 5. Check message quota (Redis-based rate limiting)
    const rateLimiter = getRateLimiter()
    const rateLimit = await rateLimiter.checkLimit({
      userId: session.userId,
      dailyLimit: DAILY_MESSAGE_LIMIT
    })

    if (!rateLimit.allowed) {
      const hours = Math.floor(rateLimit.resetInSeconds / 3600)
      const minutes = Math.floor((rateLimit.resetInSeconds % 3600) / 60)
      return {
        success: false,
        quotaRemaining: 0,
        error: `Daily limit reached (${DAILY_MESSAGE_LIMIT} messages/day). Resets in ${hours}h ${minutes}m`
      }
    }

    // 6. Check if access token expired and refresh if needed
    let accessToken = user.reddit_access_token
    const tokenExpiry = user.reddit_token_expires_at ? new Date(user.reddit_token_expires_at) : null
    const now = new Date()

    if (tokenExpiry && now >= tokenExpiry && user.reddit_refresh_token) {
      console.log('[send-message] Refreshing expired Reddit token')

      const refreshResult = await RedditApiClient.refreshUserAccessToken({
        refreshToken: user.reddit_refresh_token,
        clientId: process.env.REDDIT_CLIENT_ID!,
        clientSecret: process.env.REDDIT_CLIENT_SECRET!
      })

      if (!refreshResult.success || !refreshResult.data) {
        return {
          success: false,
          error: 'Reddit authentication expired. Please reconnect your account.'
        }
      }

      accessToken = refreshResult.data.access_token
      const newExpiry = new Date(now.getTime() + (refreshResult.data.expires_in * 1000))

      // Update tokens in database
      await supabase
        .from('users')
        .update({
          reddit_access_token: accessToken,
          reddit_token_expires_at: newExpiry.toISOString()
        })
        .eq('id', session.userId)
    }

    // 7. Update message status to pending
    await supabase
      .from('messages')
      .update({ send_status: 'pending' })
      .eq('id', messageId)

    // 8. Send message via Reddit API
    const finalText = editedText || message.message_text
    const subject = 'Saw your post on Reddit'

    console.log(`[send-message] Sending message to u/${message.reddit_username}`)

    const sendResult = await RedditApiClient.sendDirectMessage({
      accessToken,
      to: message.reddit_username,
      subject,
      text: finalText
    })

    if (!sendResult.success) {
      // Update message as failed
      await supabase
        .from('messages')
        .update({
          send_status: 'failed',
          error_message: sendResult.error || 'Unknown error'
        })
        .eq('id', messageId)

      return {
        success: false,
        error: sendResult.error || 'Failed to send message'
      }
    }

    // 9. Update message as sent and increment quota
    const sentAt = new Date().toISOString()

    await supabase
      .from('messages')
      .update({
        send_status: 'sent',
        sent_at: sentAt,
        message_text: finalText, // Store edited version if changed
        outcome: 'sent'
      })
      .eq('id', messageId)

    // 10. Increment Redis rate limit counter
    const updatedQuota = await rateLimiter.increment(session.userId)

    console.log(`[send-message] Successfully sent message ${messageId}. Quota remaining: ${updatedQuota.remaining}`)

    return {
      success: true,
      messageId,
      quotaRemaining: updatedQuota.remaining
    }
  } catch (error) {
    console.error('[send-message] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get user's current message quota (Redis-based)
 */
export async function getMessageQuotaAction(): Promise<{
  success: boolean
  sent: number
  remaining: number
  limit: number
  resetDate?: string
  resetInSeconds?: number
  error?: string
}> {
  try {
    const session = await getCurrentSession()
    if (!session) {
      return {
        success: false,
        sent: 0,
        remaining: 0,
        limit: DAILY_MESSAGE_LIMIT,
        error: 'Not authenticated'
      }
    }

    const rateLimiter = getRateLimiter()
    const quota = await rateLimiter.getQuota(session.userId)

    return {
      success: true,
      sent: quota.limit - quota.remaining,
      remaining: quota.remaining,
      limit: quota.limit,
      resetDate: quota.resetAt.toISOString(),
      resetInSeconds: quota.resetInSeconds
    }
  } catch (error) {
    return {
      success: false,
      sent: 0,
      remaining: 0,
      limit: DAILY_MESSAGE_LIMIT,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
