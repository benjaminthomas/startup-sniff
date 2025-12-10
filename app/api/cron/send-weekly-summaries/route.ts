/**
 * Cron Job: Send Weekly Summaries
 * Story 2.9: Email Notifications and Engagement
 *
 * API route for Vercel Cron to send weekly summary emails
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/send-weekly-summaries",
 *     "schedule": "0 10 * * 1"  // Every Monday at 10 AM UTC
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendWeeklySummaryToAllUsers } from '@/modules/email/actions/send-weekly-summary'
import { log } from '@/lib/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes max execution

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      log.error('[cron-weekly-summaries] Unauthorized access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    log.info('[cron-weekly-summaries] Starting weekly summary batch send...')

    const result = await sendWeeklySummaryToAllUsers()

    if (!result.success || !('sent' in result)) {
      log.error('[cron-weekly-summaries] Batch send failed:', 'error' in result ? result.error : 'Unknown error')
      return NextResponse.json(
        {
          success: false,
          error: 'error' in result ? result.error : 'Unknown error'
        },
        { status: 500 }
      )
    }

    log.info('[cron-weekly-summaries] Batch send complete:', {
      sent: result.sent,
      failed: result.failed,
      skipped: result.skipped
    })

    return NextResponse.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
      skipped: result.skipped,
      errors: result.errors,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    log.error('[cron-weekly-summaries] Fatal error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
