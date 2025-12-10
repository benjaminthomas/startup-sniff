/**
 * Weekly Summary Email Action
 * Story 2.9: Email Notifications and Engagement
 *
 * Server action for sending weekly performance summaries
 */

/* eslint-disable @typescript-eslint/ban-ts-comment */

'use server'

import { sendEmail } from '@/lib/email/mailgun-client'
import { renderEmailToHtml } from '@/lib/email/render'
import { WeeklySummaryEmail } from '@/lib/email/templates/weekly-summary'
import { createServerSupabaseClient as createClient } from '@/modules/supabase/server'
import { createElement } from 'react'
import { log } from '@/lib/logger'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://startupsniff.com'

interface WeeklyMetrics {
  messagesSent: number
  repliesReceived: number
  callsScheduled: number
  customersAcquired: number
  opportunitiesViewed: number
  previousWeekMessagesSent: number
}

/**
 * Calculate week number since user registration
 */
function getWeekNumber(createdAt: string): number {
  const created = new Date(createdAt)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - created.getTime())
  const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7))
  return diffWeeks
}

/**
 * Send weekly summary email to a user
 */
export async function sendWeeklySummaryEmail(userId: string) {
  try {
    const supabase = await createClient()

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, full_name, created_at, email_preferences')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      log.error('[weekly-summary] User not found', userError)
      return { success: false, error: 'User not found' }
    }

    // Check if user has opted out of weekly summaries
    const emailPrefs = user.email_preferences as { weekly_summary?: boolean } | null
    if (emailPrefs && emailPrefs.weekly_summary === false) {
      log.info('[weekly-summary] User opted out', { email: user.email })
      return { success: true, skipped: true, reason: 'User opted out' }
    }

    // Calculate date range (last 7 days)
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    // Get this week's metrics
    const { data: messages } = await supabase
      .from('messages')
      .select('outcome, created_at')
      .eq('user_id', userId)
      .gte('created_at', weekAgo.toISOString())

    // Get last week's metrics for comparison
    const { data: lastWeekMessages } = await supabase
      .from('messages')
      .select('outcome')
      .eq('user_id', userId)
      .gte('created_at', twoWeeksAgo.toISOString())
      .lt('created_at', weekAgo.toISOString())

    // Get opportunities viewed (fallback if table doesn't exist yet)
    const { data: analytics } = await (supabase as any)
      .from('user_analytics')
      .select('opportunities_viewed')
      .eq('user_id', userId)
      .single()

    // Calculate metrics
    const messagesSent = messages?.filter(m => m.outcome !== 'draft').length || 0
    const repliesReceived = messages?.filter(m => m.outcome === 'replied' || m.outcome === 'call_scheduled' || m.outcome === 'customer').length || 0
    const callsScheduled = messages?.filter(m => m.outcome === 'call_scheduled' || m.outcome === 'customer').length || 0
    const customersAcquired = messages?.filter(m => m.outcome === 'customer').length || 0
    const previousWeekMessagesSent = lastWeekMessages?.filter(m => m.outcome !== 'draft').length || 0

    const metrics = {
      messagesSent,
      repliesReceived,
      callsScheduled,
      customersAcquired,
      opportunitiesViewed: analytics?.opportunities_viewed || 0
    }

    // Calculate insights
    const responseRate = messagesSent > 0 ? (repliesReceived / messagesSent) * 100 : 0
    const percentChange = previousWeekMessagesSent > 0
      ? Math.round(((messagesSent - previousWeekMessagesSent) / previousWeekMessagesSent) * 100)
      : 0
    const comparisonToLastWeek = percentChange > 0 ? 'up' : percentChange < 0 ? 'down' : 'same'

    // Find best performing subreddit (from messages with replies)
    const { data: bestSubreddit } = await (supabase as any)
      .from('messages')
      .select('reddit_contact:reddit_contacts(subreddit)')
      .eq('user_id', userId)
      .in('outcome', ['replied', 'call_scheduled', 'customer'])
      .gte('created_at', weekAgo.toISOString())
      .limit(1)

    const insights = {
      bestPerformingSubreddit: bestSubreddit?.[0]?.reddit_contact?.subreddit || 'N/A',
      responseRate,
      comparisonToLastWeek: comparisonToLastWeek as 'up' | 'down' | 'same',
      percentChange: Math.abs(percentChange)
    }

    // Get top opportunity from this week
    const { data: topOpp } = await supabase
      .from('reddit_posts')
      .select('title, viability_score, reddit_id')
      .gte('viability_score', 7.0)
      .gte('created_utc', weekAgo.toISOString())
      .order('viability_score', { ascending: false })
      .limit(1)
      .single()

    const topOpportunity = topOpp ? {
      title: topOpp.title,
      score: topOpp.viability_score || 0,
      url: `${BASE_URL}/dashboard/opportunities/${topOpp.reddit_id}`
    } : undefined

    // Calculate week number
    const weekNumber = getWeekNumber(user.created_at)

    // Render email template
    const emailComponent = createElement(WeeklySummaryEmail, {
      userName: user.full_name || user.email.split('@')[0],
      weekNumber,
      metrics,
      insights,
      topOpportunity,
      dashboardUrl: `${BASE_URL}/dashboard`
    })
    const html = await renderEmailToHtml(emailComponent)

    // Send email
    const result = await sendEmail({
      to: user.email,
      subject: `Your Week ${weekNumber} Summary: ${messagesSent} messages, ${repliesReceived} replies`,
      html,
      tags: ['weekly-summary', `week-${weekNumber}`],
      variables: {
        user_id: userId,
        week_number: String(weekNumber),
        messages_sent: String(messagesSent),
        response_rate: String(responseRate.toFixed(1))
      }
    })

    if (result.success) {
      // Track email sent
      // @ts-ignore - email_logs table will be created by migration
      await supabase.from('email_logs').insert({
        user_id: userId,
        email_type: 'weekly_summary',
        sent_at: new Date().toISOString(),
        mailgun_id: result.messageId
      })

      log.info('[weekly-summary] Email sent successfully', { email: user.email })
    }

    return result
  } catch (error) {
    log.error('[weekly-summary] Failed to send email', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Send weekly summary to all eligible users
 * This should be called by a cron job every Monday
 */
export async function sendWeeklySummaryToAllUsers() {
  try {
    const supabase = await createClient()

    // Get all users who should receive weekly summaries
    // Exclude users who haven't been active in the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, last_login_at')
      .gte('last_login_at', thirtyDaysAgo.toISOString())

    if (error || !users) {
      log.error('[weekly-summary-all] Failed to fetch users', error)
      return { success: false, error: 'Failed to fetch users' }
    }

    log.info(`[weekly-summary-all] Sending to ${users.length} users...`)

    const results = {
      sent: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[]
    }

    // Send in batches to avoid rate limits
    for (const user of users) {
      const result = await sendWeeklySummaryEmail(user.id)

      if (result.success) {
        if ('skipped' in result && result.skipped) {
          results.skipped++
        } else {
          results.sent++
        }
      } else {
        results.failed++
        const errorMessage = 'error' in result ? result.error : 'Unknown error'
        results.errors.push(`${user.email}: ${errorMessage}`)
      }

      // Rate limiting: 10ms delay between sends
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    log.info('[weekly-summary-all] Batch send complete', { results })

    return {
      success: true,
      ...results
    }
  } catch (error) {
    log.error('[weekly-summary-all] Failed to send batch', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
