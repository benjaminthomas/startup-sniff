/**
 * Onboarding Drip Campaign Cron Job
 * Epic 2, Story 2.9: Email Notifications and Engagement
 *
 * Scheduled to run daily at 10 AM UTC
 * Sends Day 1, Day 3, and Day 7 onboarding emails to new users
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerAdminClient } from '@/modules/supabase/server'
import {
  sendOnboardingDay1,
  sendOnboardingDay3,
  sendOnboardingDay7,
} from '@/modules/notifications/services/email-notifications'
import { type EmailPreferences } from '@/modules/notifications/actions/email-preferences'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error('[onboarding-drip] Unauthorized cron request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerAdminClient()
    const now = new Date()

    console.log(`[onboarding-drip] Running onboarding drip campaign at ${now.toISOString()}`)

    let day1Count = 0
    let day3Count = 0
    let day7Count = 0
    let failCount = 0

    // ========================================
    // DAY 1: Users who signed up 1 day ago
    // ========================================
    const day1Start = new Date(now)
    day1Start.setDate(day1Start.getDate() - 1)
    day1Start.setHours(0, 0, 0, 0)

    const day1End = new Date(day1Start)
    day1End.setHours(23, 59, 59, 999)

    const { data: day1Users } = await supabase
      .from('users')
      .select('id, email, full_name, email_preferences')
      .eq('email_verified', true)
      .eq('email_unsubscribed', false)
      .is('onboarding_day1_sent_at', null)
      .gte('created_at', day1Start.toISOString())
      .lte('created_at', day1End.toISOString())

    if (day1Users) {
      for (const user of day1Users) {
        const prefs = user.email_preferences as EmailPreferences | null
        if (prefs?.onboarding === false) continue

        try {
          await sendOnboardingDay1(user.email, user.full_name || undefined)

          await supabase
            .from('users')
            .update({
              onboarding_day1_sent_at: now.toISOString(),
              last_onboarding_email: 'day1',
            })
            .eq('id', user.id)

          day1Count++
          console.log(`[onboarding-drip] Day 1 sent to ${user.email}`)
        } catch (error) {
          console.error(`[onboarding-drip] Day 1 failed for ${user.email}:`, error)
          failCount++
        }
      }
    }

    // ========================================
    // DAY 3: Users who signed up 3 days ago
    // ========================================
    const day3Start = new Date(now)
    day3Start.setDate(day3Start.getDate() - 3)
    day3Start.setHours(0, 0, 0, 0)

    const day3End = new Date(day3Start)
    day3End.setHours(23, 59, 59, 999)

    const { data: day3Users } = await supabase
      .from('users')
      .select('id, email, full_name, email_preferences')
      .eq('email_verified', true)
      .eq('email_unsubscribed', false)
      .is('onboarding_day3_sent_at', null)
      .not('onboarding_day1_sent_at', 'is', null) // Only send if Day 1 was sent
      .gte('created_at', day3Start.toISOString())
      .lte('created_at', day3End.toISOString())

    if (day3Users) {
      for (const user of day3Users) {
        const prefs = user.email_preferences as EmailPreferences | null
        if (prefs?.onboarding === false) continue

        try {
          await sendOnboardingDay3(user.email, user.full_name || undefined)

          await supabase
            .from('users')
            .update({
              onboarding_day3_sent_at: now.toISOString(),
              last_onboarding_email: 'day3',
            })
            .eq('id', user.id)

          day3Count++
          console.log(`[onboarding-drip] Day 3 sent to ${user.email}`)
        } catch (error) {
          console.error(`[onboarding-drip] Day 3 failed for ${user.email}:`, error)
          failCount++
        }
      }
    }

    // ========================================
    // DAY 7: Users who signed up 7 days ago
    // ========================================
    const day7Start = new Date(now)
    day7Start.setDate(day7Start.getDate() - 7)
    day7Start.setHours(0, 0, 0, 0)

    const day7End = new Date(day7Start)
    day7End.setHours(23, 59, 59, 999)

    const { data: day7Users } = await supabase
      .from('users')
      .select('id, email, full_name, email_preferences')
      .eq('email_verified', true)
      .eq('email_unsubscribed', false)
      .is('onboarding_day7_sent_at', null)
      .not('onboarding_day3_sent_at', 'is', null) // Only send if Day 3 was sent
      .gte('created_at', day7Start.toISOString())
      .lte('created_at', day7End.toISOString())

    if (day7Users) {
      for (const user of day7Users) {
        const prefs = user.email_preferences as EmailPreferences | null
        if (prefs?.onboarding === false) continue

        try {
          await sendOnboardingDay7(user.email, user.full_name || undefined)

          await supabase
            .from('users')
            .update({
              onboarding_day7_sent_at: now.toISOString(),
              last_onboarding_email: 'day7',
            })
            .eq('id', user.id)

          day7Count++
          console.log(`[onboarding-drip] Day 7 sent to ${user.email}`)
        } catch (error) {
          console.error(`[onboarding-drip] Day 7 failed for ${user.email}:`, error)
          failCount++
        }
      }
    }

    console.log(
      `[onboarding-drip] Completed: Day 1: ${day1Count}, Day 3: ${day3Count}, Day 7: ${day7Count}, Failed: ${failCount}`
    )

    return NextResponse.json({
      success: true,
      day1: day1Count,
      day3: day3Count,
      day7: day7Count,
      failed: failCount,
    })
  } catch (error) {
    console.error('[onboarding-drip] Unexpected error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
