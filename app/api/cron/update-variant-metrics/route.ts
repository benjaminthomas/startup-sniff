/**
 * Cron Job: Update Template Variant Metrics
 * Story 2.10: Template A/B Testing and Optimization
 *
 * API route for Vercel Cron to update template variant performance metrics daily
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/update-variant-metrics",
 *     "schedule": "0 0 * * *"  // Daily at midnight UTC
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { updateTemplateVariantMetrics } from '@/modules/analytics/actions/template-variants'
import { log } from '@/lib/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 1 minute max execution

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      log.error('[cron-variant-metrics] Unauthorized access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    log.info('[cron-variant-metrics] Starting variant metrics update...')

    // Update cached metrics and statistical significance
    const result = await updateTemplateVariantMetrics()

    if (!result.success) {
      log.error('[cron-variant-metrics] Failed to update metrics:', result.error)
      return NextResponse.json(
        { error: result.error || 'Failed to update metrics' },
        { status: 500 }
      )
    }

    log.info('[cron-variant-metrics] Successfully updated variant metrics')

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Template variant metrics updated successfully',
    })
  } catch (error) {
    log.error('[cron-variant-metrics] Fatal error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
