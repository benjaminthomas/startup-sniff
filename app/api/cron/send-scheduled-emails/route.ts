/**
 * Cron Job: Send Scheduled Emails
 * Story 2.9: Email Notifications and Engagement
 *
 * API route for Vercel Cron to send scheduled emails
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/send-scheduled-emails",
 *     "schedule": "0 * * * *"  // Every hour
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient as createClient } from '@/modules/supabase/server'
import {
  sendOnboardingDay3Email,
  sendOnboardingDay7Email
} from '@/modules/email/actions/send-onboarding-emails'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes max execution

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error('[cron-scheduled-emails] Unauthorized access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[cron-scheduled-emails] Starting scheduled email processing...')

    const supabase = await createClient()
    const now = new Date()

    // Get all pending scheduled emails that should be sent now
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: scheduledEmails, error } = await (supabase as any)
      .from('scheduled_emails')
      .select('*')
      .is('sent_at', null)
      .is('cancelled_at', null)
      .lte('scheduled_for', now.toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(100) // Process max 100 per run

    if (error) {
      console.error('[cron-scheduled-emails] Failed to fetch emails:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!scheduledEmails || scheduledEmails.length === 0) {
      console.log('[cron-scheduled-emails] No emails to send')
      return NextResponse.json({ success: true, sent: 0 })
    }

    console.log(`[cron-scheduled-emails] Found ${scheduledEmails.length} emails to send`)

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Process each scheduled email
    for (const email of scheduledEmails) {
      try {
        let result

        switch (email.email_type) {
          case 'onboarding_day_3':
            result = await sendOnboardingDay3Email(email.user_id)
            break
          case 'onboarding_day_7':
            result = await sendOnboardingDay7Email(email.user_id)
            break
          default:
            console.warn('[cron-scheduled-emails] Unknown email type:', email.email_type)
            continue
        }

        if (result.success) {
          // Mark as sent
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from('scheduled_emails')
            .update({ sent_at: new Date().toISOString() })
            .eq('id', email.id)

          results.sent++
          console.log(`[cron-scheduled-emails] Sent ${email.email_type} to user ${email.user_id}`)
        } else {
          results.failed++
          results.errors.push(`${email.email_type} for user ${email.user_id}: ${result.error}`)
          console.error(`[cron-scheduled-emails] Failed to send ${email.email_type}:`, result.error)
        }
      } catch (error) {
        results.failed++
        results.errors.push(`${email.email_type}: ${error}`)
        console.error('[cron-scheduled-emails] Unexpected error:', error)
      }

      // Rate limiting: 50ms delay between sends
      await new Promise(resolve => setTimeout(resolve, 50))
    }

    console.log('[cron-scheduled-emails] Processing complete:', results)

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[cron-scheduled-emails] Fatal error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
