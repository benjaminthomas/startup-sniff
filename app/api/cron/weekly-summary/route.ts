/**
 * Weekly Summary Email Cron Job
 * Epic 2, Story 2.9: Email Notifications and Engagement
 *
 * Scheduled to run every Monday at 9 AM UTC
 * Sends weekly engagement summaries to all active users
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerAdminClient } from '@/modules/supabase/server'
import { sendWeeklySummary, type WeeklySummaryData } from '@/modules/notifications/services/email-notifications'
import { type EmailPreferences } from '@/modules/notifications/actions/email-preferences'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error('[weekly-summary] Unauthorized cron request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerAdminClient()

    // Calculate date range (last 7 days)
    const endDate = new Date()
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - 7)

    console.log(`[weekly-summary] Sending weekly summaries for ${startDate.toISOString()} to ${endDate.toISOString()}`)

    // Get all users who haven't unsubscribed and have weekly_summary preference enabled
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, full_name, email_preferences, created_at')
      .eq('email_unsubscribed', false)
      .eq('email_verified', true)

    if (usersError) {
      console.error('[weekly-summary] Failed to fetch users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Filter users who want weekly summaries
    const eligibleUsers = users.filter((user) => {
      const prefs = user.email_preferences as EmailPreferences | null
      return prefs?.weekly_summary !== false
    })

    console.log(`[weekly-summary] Found ${eligibleUsers.length} eligible users`)

    let successCount = 0
    let failCount = 0

    // Process each user
    for (const user of eligibleUsers) {
      try {
        // Get user's message stats for the week
        const { data: messages } = await supabase
          .from('messages')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())

        const messagesSent = messages?.filter((m) => m.send_status === 'sent').length || 0
        const repliesReceived = messages?.filter((m) => m.outcome === 'replied').length || 0
        const callsScheduled = messages?.filter((m) => m.outcome === 'call_scheduled').length || 0

        // Get opportunities viewed (from analytics events)
        // TODO: Add analytics_events table to types after migration is applied
        // const { data: analyticsEvents } = await supabase
        //   .from('analytics_events')
        //   .select('*')
        //   .eq('user_id', user.id)
        //   .eq('event_name', 'opportunity_viewed')
        //   .gte('timestamp', startDate.toISOString())
        //   .lte('timestamp', endDate.toISOString())

        const opportunitiesViewed = 0 // analyticsEvents?.length || 0

        // Get new high-potential opportunities from this week
        const { data: newOpportunities } = await supabase
          .from('reddit_posts')
          .select('reddit_id, title, viability_score')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .gte('viability_score', 7.0)
          .order('viability_score', { ascending: false })
          .limit(5)

        const topOpportunities = newOpportunities?.map((opp) => ({
          id: opp.reddit_id,
          title: opp.title,
          score: opp.viability_score || 0,
        })) || []

        // Only send email if user had some activity OR there are new high-potential opportunities
        if (messagesSent > 0 || repliesReceived > 0 || opportunitiesViewed > 0 || topOpportunities.length > 0) {
          const summaryData: WeeklySummaryData = {
            email: user.email,
            name: user.full_name || undefined,
            weekStats: {
              messagesSent,
              repliesReceived,
              callsScheduled,
              opportunitiesViewed,
              newHighPotentialOpportunities: topOpportunities.length,
            },
            topOpportunities,
          }

          await sendWeeklySummary(summaryData)

          // Update last weekly summary sent timestamp
          await supabase
            .from('users')
            .update({ last_weekly_summary_sent_at: new Date().toISOString() })
            .eq('id', user.id)

          successCount++
          console.log(`[weekly-summary] Sent to ${user.email}`)
        } else {
          console.log(`[weekly-summary] Skipping ${user.email} (no activity or opportunities)`)
        }
      } catch (error) {
        console.error(`[weekly-summary] Failed to send to ${user.email}:`, error)
        failCount++
      }
    }

    console.log(`[weekly-summary] Completed: ${successCount} sent, ${failCount} failed`)

    return NextResponse.json({
      success: true,
      sent: successCount,
      failed: failCount,
      total: eligibleUsers.length,
    })
  } catch (error) {
    console.error('[weekly-summary] Unexpected error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
