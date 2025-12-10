/**
 * Template Variant Analytics Actions
 * Story 2.10: Template A/B Testing and Optimization
 *
 * Server actions for managing and analyzing template variant performance
 */

'use server'

import { createServerSupabaseClient } from '@/modules/supabase/server'
import type { TemplateVariant } from '@/lib/constants/template-variants'
import { log } from '@/lib/logger'

export interface VariantPerformance {
  variantName: TemplateVariant
  variantLabel: string
  totalSent: number
  totalResponded: number
  responseRate: number
  callsScheduled: number
  customersAcquired: number
  firstSentAt: string | null
  lastSentAt: string | null
  isStatisticallySignificant: boolean
  confidenceLevel: number | null
}

/**
 * Get performance metrics for all template variants
 */
export async function getTemplateVariantPerformance(): Promise<{
  success: boolean
  variants?: VariantPerformance[]
  error?: string
}> {
  try {
    const supabase = await createServerSupabaseClient()

    // Query the performance view (type assertion needed as view isn't in generated types yet)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('template_variant_performance')
      .select('*')
      .order('response_rate', { ascending: false })

    if (error) {
      log.error('[template-variants] Error fetching performance:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const variants = data?.map((row: any) => ({
      variantName: row.variant_name as TemplateVariant,
      variantLabel: row.variant_label,
      totalSent: row.total_sent,
      totalResponded: row.total_responded,
      responseRate: row.response_rate,
      callsScheduled: row.calls_scheduled,
      customersAcquired: row.customers_acquired,
      firstSentAt: row.first_sent_at,
      lastSentAt: row.last_sent_at,
      isStatisticallySignificant: row.is_statistically_significant,
      confidenceLevel: row.confidence_level,
    })) || []

    return {
      success: true,
      variants,
    }
  } catch (error) {
    log.error('[template-variants] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Update cached performance metrics for all variants
 * Should be called periodically (e.g., daily cron job)
 */
export async function updateTemplateVariantMetrics(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createServerSupabaseClient()

    // Call the database function to update metrics
    const { error } = await (supabase as any).rpc('update_template_variant_metrics')

    if (error) {
      log.error('[template-variants] Error updating metrics:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    log.info('[template-variants] Successfully updated variant metrics')

    return {
      success: true,
    }
  } catch (error) {
    log.error('[template-variants] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get the winning variant (highest response rate with statistical significance)
 */
export async function getWinningVariant(): Promise<{
  success: boolean
  winner?: VariantPerformance
  error?: string
}> {
  try {
    const result = await getTemplateVariantPerformance()

    if (!result.success || !result.variants) {
      return {
        success: false,
        error: result.error || 'Failed to fetch variants',
      }
    }

    // Find the winning variant (significant + highest response rate)
    const winner = result.variants.find(
      (v) => v.isStatisticallySignificant && v.totalSent >= 50
    )

    if (!winner) {
      return {
        success: false,
        error: 'No statistically significant winner yet. Need more data.',
      }
    }

    return {
      success: true,
      winner,
    }
  } catch (error) {
    log.error('[template-variants] Error getting winner:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get variant performance for a specific user
 * Useful for showing users which variants work best for them
 */
export async function getUserVariantPerformance(
  userId: string
): Promise<{
  success: boolean
  variants?: Record<TemplateVariant, {
    sent: number
    responded: number
    responseRate: number
  }>
  error?: string
}> {
  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await (supabase as any)
      .from('messages')
      .select('template_variant, replied_at')
      .eq('user_id', userId)
      .eq('send_status', 'sent')

    if (error) {
      log.error('[template-variants] Error fetching user performance:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    // Aggregate by variant
    const variantStats: Record<string, { sent: number; responded: number }> = {}

    data?.forEach((msg: any) => {
      const variant = msg.template_variant
      if (!variantStats[variant]) {
        variantStats[variant] = { sent: 0, responded: 0 }
      }
      variantStats[variant].sent++
      if (msg.replied_at) {
        variantStats[variant].responded++
      }
    })

    // Calculate response rates
    const variants: Record<string, any> = {}
    Object.entries(variantStats).forEach(([variant, stats]) => {
      variants[variant] = {
        sent: stats.sent,
        responded: stats.responded,
        responseRate: stats.sent > 0 ? (stats.responded / stats.sent) * 100 : 0,
      }
    })

    return {
      success: true,
      variants: variants as any,
    }
  } catch (error) {
    log.error('[template-variants] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
