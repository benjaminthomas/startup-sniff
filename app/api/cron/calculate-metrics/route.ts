/**
 * Daily Metrics Calculation Cron Job
 * Epic 1, Story 1.12: Epic 1 Validation Dashboard
 * Epic 2, Story 2.12: Epic 2 Validation Dashboard
 *
 * Scheduled to run daily at midnight UTC
 * Calculates and aggregates daily analytics metrics for both Epic 1 and Epic 2
 */

import { NextRequest, NextResponse } from 'next/server'
import { calculateDailyMetricsAction } from '@/modules/analytics/actions'
import { calculateEpic2DailyMetricsAction } from '@/modules/epic2-analytics/actions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error('[calculate-metrics] Unauthorized cron request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[calculate-metrics] Starting daily metrics calculation')

    // Calculate metrics for yesterday (since today isn't complete yet)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const targetDate = yesterday.toISOString().split('T')[0]

    // Calculate Epic 1 metrics
    const epic1Result = await calculateDailyMetricsAction(targetDate)

    if (!epic1Result.success) {
      console.error('[calculate-metrics] Failed to calculate Epic 1 metrics:', epic1Result.error)
      return NextResponse.json(
        { error: epic1Result.error || 'Failed to calculate Epic 1 metrics' },
        { status: 500 }
      )
    }

    console.log(`[calculate-metrics] Successfully calculated Epic 1 metrics for ${targetDate}`)

    // Calculate Epic 2 metrics
    const epic2Result = await calculateEpic2DailyMetricsAction(targetDate)

    if (!epic2Result.success) {
      console.error('[calculate-metrics] Failed to calculate Epic 2 metrics:', epic2Result.error)
      return NextResponse.json(
        { error: epic2Result.error || 'Failed to calculate Epic 2 metrics' },
        { status: 500 }
      )
    }

    console.log(`[calculate-metrics] Successfully calculated Epic 2 metrics for ${targetDate}`)

    return NextResponse.json({
      success: true,
      date: targetDate,
      epic1: epic1Result.success,
      epic2: epic2Result.success,
    })
  } catch (error) {
    console.error('[calculate-metrics] Unexpected error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
