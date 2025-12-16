'use server'

import { getCurrentSession } from '@/features/auth/services/jwt'
import { createServerAdminClient } from '@/features/supabase/server'
import { RedditApiClient } from '@/services/reddit/api-client'
import { getRateLimiter } from '@/services/rate-limiter'
import { sendMessageConfirmation } from '@/features/notifications/services/email-notifications'
import { log } from '@/lib/logger'
import { sendRedditMessageSchema } from '@/features/reddit/schemas/reddit-schemas'

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
    // 0. Validate input parameters
    const validationResult = sendRedditMessageSchema.safeParse({ messageId, editedText })
    if (!validationResult.success) {
      log.warn('[send-message] Invalid input parameters', {
        errors: validationResult.error.errors
      })
      return {
        success: false,
        error: 'Invalid input parameters'
      }
    }

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

    const typedMessage = message as {
      send_status: string | null;
      message_text: string;
      reddit_username: string;
      pain_point_id: string | null;
    } | null;

    if (messageError || !typedMessage) {
      log.error('[send-message] Message not found:', messageId)
      return {
        success: false,
        error: 'Message not found'
      }
    }

    // 3. Check if message already sent
    if (typedMessage.send_status === 'sent') {
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

    const typedUser = user as {
      reddit_access_token: string | null;
      reddit_refresh_token: string | null;
      reddit_token_expires_at: string | null;
      reddit_username: string | null;
    } | null;

    if (userError || !typedUser || !typedUser.reddit_access_token) {
      log.error('[send-message] User Reddit not connected:', session.userId)
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
    let accessToken = typedUser.reddit_access_token
    const tokenExpiry = typedUser.reddit_token_expires_at ? new Date(typedUser.reddit_token_expires_at) : null
    const now = new Date()

    if (tokenExpiry && now >= tokenExpiry && typedUser.reddit_refresh_token) {
      log.info('[send-message] Refreshing expired Reddit token')

      const refreshResult = await RedditApiClient.refreshUserAccessToken({
        refreshToken: typedUser.reddit_refresh_token,
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
        .from('users' as never)
        .update({
          reddit_access_token: accessToken,
          reddit_token_expires_at: newExpiry.toISOString()
        } as never)
        .eq('id', session.userId)
    }

    // 7. Update message status to pending
    await supabase
      .from('messages' as never)
      .update({ send_status: 'pending' } as never)
      .eq('id', messageId)

    // 8. Send message via Reddit API
    const finalText = editedText || typedMessage.message_text
    const subject = 'Saw your post on Reddit'

    log.info(`[send-message] Sending message to u/${typedMessage.reddit_username}`)

    const sendResult = await RedditApiClient.sendDirectMessage({
      accessToken,
      to: typedMessage.reddit_username,
      subject,
      text: finalText
    })

    if (!sendResult.success) {
      // Update message as failed
      await supabase
        .from('messages' as never)
        .update({
          send_status: 'failed',
          error_message: sendResult.error || 'Unknown error'
        } as never)
        .eq('id', messageId)

      return {
        success: false,
        error: sendResult.error || 'Failed to send message'
      }
    }

    // 9. Update message as sent and increment quota
    const sentAt = new Date().toISOString()

    await supabase
      .from('messages' as never)
      .update({
        send_status: 'sent',
        sent_at: sentAt,
        message_text: finalText, // Store edited version if changed
        outcome: 'sent'
      } as never)
      .eq('id', messageId)

    // 10. Increment Redis rate limit counter
    const updatedQuota = await rateLimiter.increment(session.userId)

    log.info(`[send-message] Successfully sent message ${messageId}. Quota remaining: ${updatedQuota.remaining}`)

    // 11. Send confirmation email (non-blocking)
    try {
      // Get user email and name
      const { data: userInfo } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', session.userId)
        .single()

      const typedUserInfo = userInfo as { email: string; full_name: string | null } | null;

      // Get opportunity title from post if pain_point_id exists
      let post: { title: string } | null = null
      if (typedMessage.pain_point_id) {
        const postQuery = await supabase
          .from('reddit_posts')
          .select('title')
          .eq('reddit_id', typedMessage.pain_point_id)
          .single()
        post = postQuery.data as { title: string } | null
      }

      if (typedUserInfo?.email && post?.title && typedMessage.pain_point_id) {
        await sendMessageConfirmation({
          email: typedUserInfo.email,
          name: typedUserInfo.full_name || undefined,
          recipientCount: 1,
          opportunityTitle: post.title,
          opportunityId: typedMessage.pain_point_id
        })
      }
    } catch (emailError) {
      log.error('[send-message] Failed to send confirmation email:', emailError)
      // Don't fail the send operation if email fails
    }

    return {
      success: true,
      messageId,
      quotaRemaining: updatedQuota.remaining
    }
  } catch (error) {
    log.error('[send-message] Unexpected error:', error)
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
