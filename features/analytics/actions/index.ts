'use server'

/**
 * Analytics Actions
 * Epic 1, Story 1.12: Epic 1 Validation Dashboard
 *
 * Server actions for fetching validation metrics and analytics data
 *
 * NOTE: Analytics tables not yet created. Run migration first:
 * supabase/migrations/20251024000000_create_analytics_dashboard.sql
 */

import { createServerAdminClient } from '@/features/supabase/server'
import { getCurrentSession } from '@/features/auth/services/jwt'
import { log } from '@/lib/logger'

export interface ValidationMetric {
  metric_name: string
  current_value: number
  green_threshold: number
  yellow_threshold: number
  red_threshold: number
  metric_unit: string
  zone: 'GREEN' | 'YELLOW' | 'RED'
  higher_is_better: boolean
}

export interface DashboardMetrics {
  avgSessionDuration: ValidationMetric
  sevenDayReturnRate: ValidationMetric
  opportunitiesPerSession: ValidationMetric
  bounceRate: ValidationMetric
  totalSessions: number
  totalUsers: number
  newUsers: number
  returningUsers: number
}

export interface DailyMetric {
  metric_date: string
  total_sessions: number | null
  total_users: number | null
  avg_session_duration_seconds: number | null
  avg_opportunities_per_session: number | null
  bounce_rate: number | null
  seven_day_return_rate: number | null
}

/**
 * Get current validation metrics with zone indicators
 */
export async function getValidationMetricsAction(): Promise<{
  success: boolean
  metrics?: DashboardMetrics
  error?: string
}> {
  try {
    const session = await getCurrentSession()
    if (!session) {
      return {
        success: false,
        error: 'Not authenticated',
      }
    }

    const supabase = createServerAdminClient()

    // Get latest daily metrics (last 7 days average)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: dailyMetrics, error: metricsError } = await supabase
      .from('daily_metrics')
      .select('*')
      .gte('metric_date', sevenDaysAgo.toISOString().split('T')[0])
      .order('metric_date', { ascending: false })

    const typedMetrics = (dailyMetrics || []) as Array<{
      avg_session_duration_seconds: number | null
      seven_day_return_rate: number | null
    }>

    if (metricsError) {
      log.error('[analytics] Failed to fetch daily metrics:', metricsError)
      return {
        success: false,
        error: 'Failed to load metrics',
      }
    }

    // Get validation thresholds
    const { data: thresholds, error: thresholdsError } = await supabase
      .from('validation_thresholds')
      .select('*')

    const typedThresholds = thresholds as Array<{ metric_name: string; yellow_threshold: number; green_threshold: number; red_threshold: number; higher_is_better: boolean }> | null

    if (thresholdsError) {
      log.error('[analytics] Failed to fetch thresholds:', thresholdsError)
      return {
        success: false,
        error: 'Failed to load thresholds',
      }
    }

    // Calculate averages from daily metrics
    const avgSessionDuration =
      typedMetrics && typedMetrics.length > 0
        ? Math.round(
            typedMetrics.reduce((sum, m) => sum + (m.avg_session_duration_seconds || 0), 0) /
              typedMetrics.length
          )
        : 0

    const avgSevenDayReturn =
      typedMetrics && typedMetrics.length > 0
        ? Number(
            (
              typedMetrics.reduce((sum, m) => sum + (m.seven_day_return_rate || 0), 0) /
              typedMetrics.length
            ).toFixed(2)
          )
        : 0

    const avgOpportunitiesPerSession =
      typedMetrics && typedMetrics.length > 0
        ? Number(
            (
              typedMetrics.reduce((sum, m) => sum + ((m as any).avg_opportunities_per_session || 0), 0) /
              typedMetrics.length
            ).toFixed(2)
          )
        : 0

    const avgBounceRate =
      typedMetrics && typedMetrics.length > 0
        ? Number(
            (
              typedMetrics.reduce((sum, m) => sum + ((m as any).bounce_rate || 0), 0) / typedMetrics.length
            ).toFixed(2)
          )
        : 0

    const totalSessions =
      typedMetrics && typedMetrics.length > 0
        ? typedMetrics.reduce((sum, m) => sum + ((m as any).total_sessions || 0), 0)
        : 0

    const totalUsers =
      typedMetrics && typedMetrics.length > 0
        ? typedMetrics.reduce((sum, m) => sum + ((m as any).total_users || 0), 0)
        : 0

    const newUsers =
      typedMetrics && typedMetrics.length > 0
        ? typedMetrics.reduce((sum, m) => sum + ((m as any).new_users || 0), 0)
        : 0

    const returningUsers =
      typedMetrics && typedMetrics.length > 0
        ? typedMetrics.reduce((sum, m) => sum + ((m as any).returning_users || 0), 0)
        : 0

    // Helper to calculate zone
    const calculateZone = (
      value: number,
      green: number,
      yellow: number,
      red: number,
      higherIsBetter: boolean
    ): 'GREEN' | 'YELLOW' | 'RED' => {
      if (higherIsBetter) {
        if (value >= green) return 'GREEN'
        if (value >= yellow) return 'YELLOW'
        return 'RED'
      } else {
        if (value <= green) return 'GREEN'
        if (value <= yellow) return 'YELLOW'
        return 'RED'
      }
    }

    // Build metrics with zones
    const sessionDurationThreshold = typedThresholds?.find((t) => t.metric_name === 'avg_session_duration')
    const returnRateThreshold = typedThresholds?.find((t) => t.metric_name === 'seven_day_return_rate')
    const opportunitiesThreshold = typedThresholds?.find((t) => t.metric_name === 'opportunities_per_session')
    const bounceRateThreshold = typedThresholds?.find((t) => t.metric_name === 'bounce_rate')

    const metrics: DashboardMetrics = {
      avgSessionDuration: {
        metric_name: 'Average Session Duration',
        current_value: avgSessionDuration,
        green_threshold: Number(sessionDurationThreshold?.green_threshold || 120),
        yellow_threshold: Number(sessionDurationThreshold?.yellow_threshold || 90),
        red_threshold: Number(sessionDurationThreshold?.red_threshold || 60),
        metric_unit: 'seconds',
        zone: calculateZone(
          avgSessionDuration,
          Number(sessionDurationThreshold?.green_threshold || 120),
          Number(sessionDurationThreshold?.yellow_threshold || 90),
          Number(sessionDurationThreshold?.red_threshold || 60),
          sessionDurationThreshold?.higher_is_better !== false
        ),
        higher_is_better: sessionDurationThreshold?.higher_is_better !== false,
      },
      sevenDayReturnRate: {
        metric_name: '7-Day Return Rate',
        current_value: avgSevenDayReturn,
        green_threshold: Number(returnRateThreshold?.green_threshold || 25),
        yellow_threshold: Number(returnRateThreshold?.yellow_threshold || 15),
        red_threshold: Number(returnRateThreshold?.red_threshold || 10),
        metric_unit: 'percentage',
        zone: calculateZone(
          avgSevenDayReturn,
          Number(returnRateThreshold?.green_threshold || 25),
          Number(returnRateThreshold?.yellow_threshold || 15),
          Number(returnRateThreshold?.red_threshold || 10),
          returnRateThreshold?.higher_is_better !== false
        ),
        higher_is_better: returnRateThreshold?.higher_is_better !== false,
      },
      opportunitiesPerSession: {
        metric_name: 'Opportunities Per Session',
        current_value: avgOpportunitiesPerSession,
        green_threshold: Number(opportunitiesThreshold?.green_threshold || 2),
        yellow_threshold: Number(opportunitiesThreshold?.yellow_threshold || 1.5),
        red_threshold: Number(opportunitiesThreshold?.red_threshold || 1),
        metric_unit: 'count',
        zone: calculateZone(
          avgOpportunitiesPerSession,
          Number(opportunitiesThreshold?.green_threshold || 2),
          Number(opportunitiesThreshold?.yellow_threshold || 1.5),
          Number(opportunitiesThreshold?.red_threshold || 1),
          opportunitiesThreshold?.higher_is_better !== false
        ),
        higher_is_better: opportunitiesThreshold?.higher_is_better !== false,
      },
      bounceRate: {
        metric_name: 'Bounce Rate',
        current_value: avgBounceRate,
        green_threshold: Number(bounceRateThreshold?.green_threshold || 60),
        yellow_threshold: Number(bounceRateThreshold?.yellow_threshold || 70),
        red_threshold: Number(bounceRateThreshold?.red_threshold || 80),
        metric_unit: 'percentage',
        zone: calculateZone(
          avgBounceRate,
          Number(bounceRateThreshold?.green_threshold || 60),
          Number(bounceRateThreshold?.yellow_threshold || 70),
          Number(bounceRateThreshold?.red_threshold || 80),
          bounceRateThreshold?.higher_is_better === true
        ),
        higher_is_better: bounceRateThreshold?.higher_is_better === true,
      },
      totalSessions,
      totalUsers,
      newUsers,
      returningUsers,
    }

    return {
      success: true,
      metrics,
    }
  } catch (error) {
    log.error('[analytics] Error in getValidationMetricsAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get daily metrics trend data
 */
export async function getDailyMetricsTrendAction(days: number = 30): Promise<{
  success: boolean
  data?: DailyMetric[]
  error?: string
}> {
  try {
    const session = await getCurrentSession()
    if (!session) {
      return {
        success: false,
        error: 'Not authenticated',
      }
    }

    const supabase = createServerAdminClient()

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('daily_metrics')
      .select('*')
      .gte('metric_date', startDate.toISOString().split('T')[0])
      .order('metric_date', { ascending: true })

    if (error) {
      log.error('[analytics] Failed to fetch daily metrics trend:', error)
      return {
        success: false,
        error: 'Failed to load trend data',
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    log.error('[analytics] Error in getDailyMetricsTrendAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Submit user feedback
 */
export async function submitFeedbackAction(
  feedbackType: string,
  rating: number | null,
  comment: string,
  pageUrl: string
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const session = await getCurrentSession()
    if (!session) {
      return {
        success: false,
        error: 'Not authenticated',
      }
    }

    const supabase = createServerAdminClient()

    const { error } = await supabase.from('user_feedback' as never).insert({
      user_id: session.userId,
      feedback_type: feedbackType,
      rating,
      comment,
      page_url: pageUrl,
      submitted_at: new Date().toISOString(),
    } as never)

    if (error) {
      log.error('[analytics] Failed to submit feedback:', error)
      return {
        success: false,
        error: 'Failed to submit feedback',
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    log.error('[analytics] Error in submitFeedbackAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Calculate daily metrics for a specific date
 * (Called by cron job or manually)
 */
export async function calculateDailyMetricsAction(targetDate?: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = createServerAdminClient()

    // Use provided date or yesterday (since we calculate metrics for completed days)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const dateToCalculate = targetDate || yesterday.toISOString().split('T')[0]

    // Call the database function to calculate metrics
    const { error } = await supabase.rpc('calculate_daily_metrics' as any, {
      target_date: dateToCalculate,
    } as any)

    if (error) {
      log.error('[analytics] Failed to calculate daily metrics:', error)
      return {
        success: false,
        error: 'Failed to calculate metrics',
      }
    }

    log.info(`[analytics] Daily metrics calculated for ${dateToCalculate}`)
    return {
      success: true,
    }
  } catch (error) {
    log.error('[analytics] Error in calculateDailyMetricsAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
