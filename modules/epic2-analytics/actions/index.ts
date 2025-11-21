'use server'

/**
 * Epic 2 Analytics Actions
 * Story 2.12: Epic 2 Validation Dashboard
 *
 * Server actions for fetching Epic 2 validation metrics and analytics data
 */

import { createServerAdminClient } from '@/modules/supabase/server'
import { getCurrentSession } from '@/modules/auth/services/jwt'

export interface Epic2ValidationMetric {
  metric_name: string
  current_value: number
  green_threshold: number
  yellow_threshold: number
  red_threshold: number
  metric_unit: string
  zone: 'GREEN' | 'YELLOW' | 'RED'
  higher_is_better: boolean
}

export interface Epic2DashboardMetrics {
  freeToPaidConversion: Epic2ValidationMetric
  messageSendRate: Epic2ValidationMetric
  templateResponseRate: Epic2ValidationMetric
  monthlyRecurringRevenue: Epic2ValidationMetric
  churnRate: Epic2ValidationMetric
  totalUsers: number
  freeUsers: number
  paidUsers: number
  trialUsers: number
  messagesSentToday: number
  upgradesThisMonth: number
}

export interface Epic2DailyMetric {
  metric_date: string
  total_users: number | null
  free_users: number | null
  paid_users: number | null
  signups_today: number | null
  upgrades_today: number | null
  messages_sent_today: number | null
  message_send_rate: number | null
  template_response_rate: number | null
  mrr: number | null
  daily_revenue: number | null
  free_to_paid_conversion_rate: number | null
}

export interface Epic2ConversionFunnel {
  signups: number
  redditConnected: number
  contactsDiscovered: number
  templatesGenerated: number
  messagesSent: number
  upgraded: number
}

/**
 * Get current Epic 2 validation metrics with zone indicators
 */
export async function getEpic2ValidationMetricsAction(): Promise<{
  success: boolean
  metrics?: Epic2DashboardMetrics
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

    // Get latest daily metrics (last 30 days average for rates)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: dailyMetrics, error: metricsError } = await supabase
      .from('epic2_daily_metrics')
      .select('*')
      .gte('metric_date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('metric_date', { ascending: false })

    if (metricsError) {
      console.error('[epic2-analytics] Failed to fetch daily metrics:', metricsError)
      return {
        success: false,
        error: 'Failed to load metrics',
      }
    }

    // Get validation thresholds
    const { data: thresholds, error: thresholdsError } = await supabase
      .from('epic2_validation_thresholds')
      .select('*')

    if (thresholdsError) {
      console.error('[epic2-analytics] Failed to fetch thresholds:', thresholdsError)
      return {
        success: false,
        error: 'Failed to load thresholds',
      }
    }

    // Get latest metrics for current values
    const latestMetric = dailyMetrics && dailyMetrics.length > 0 ? dailyMetrics[0] : null

    // Calculate averages from last 30 days
    const avgFreeToPaid =
      dailyMetrics && dailyMetrics.length > 0
        ? Number(
            (
              dailyMetrics.reduce(
                (sum, m) => sum + (m.free_to_paid_conversion_rate || 0),
                0
              ) / dailyMetrics.length
            ).toFixed(2)
          )
        : 0

    const avgMessageSendRate =
      dailyMetrics && dailyMetrics.length > 0
        ? Number(
            (
              dailyMetrics.reduce((sum, m) => sum + (m.message_send_rate || 0), 0) /
              dailyMetrics.length
            ).toFixed(2)
          )
        : 0

    const avgTemplateResponseRate =
      dailyMetrics && dailyMetrics.length > 0
        ? Number(
            (
              dailyMetrics.reduce((sum, m) => sum + (m.template_response_rate || 0), 0) /
              dailyMetrics.length
            ).toFixed(2)
          )
        : 0

    const currentMRR = latestMetric?.mrr || 0

    // Calculate churn rate from last 30 days
    const totalChurns =
      dailyMetrics && dailyMetrics.length > 0
        ? dailyMetrics.reduce((sum, m) => sum + (m.churns_today || 0), 0)
        : 0
    const avgPaidUsers =
      dailyMetrics && dailyMetrics.length > 0
        ? dailyMetrics.reduce((sum, m) => sum + (m.paid_users || 0), 0) / dailyMetrics.length
        : 0
    const churnRate =
      avgPaidUsers > 0 ? Number(((totalChurns / avgPaidUsers) * 100).toFixed(2)) : 0

    // Get current user counts
    const totalUsers = latestMetric?.total_users || 0
    const freeUsers = latestMetric?.free_users || 0
    const paidUsers = latestMetric?.paid_users || 0
    const trialUsers = latestMetric?.trial_users || 0
    const messagesSentToday = latestMetric?.messages_sent_today || 0

    // Calculate upgrades this month
    const firstDayOfMonth = new Date()
    firstDayOfMonth.setDate(1)
    const { data: monthlyMetrics } = await supabase
      .from('epic2_daily_metrics')
      .select('upgrades_today')
      .gte('metric_date', firstDayOfMonth.toISOString().split('T')[0])

    const upgradesThisMonth = monthlyMetrics
      ? monthlyMetrics.reduce((sum, m) => sum + (m.upgrades_today || 0), 0)
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
    const conversionThreshold = thresholds?.find(
      (t) => t.metric_name === 'free_to_paid_conversion'
    )
    const sendRateThreshold = thresholds?.find((t) => t.metric_name === 'message_send_rate')
    const responseRateThreshold = thresholds?.find(
      (t) => t.metric_name === 'template_response_rate'
    )
    const mrrThreshold = thresholds?.find((t) => t.metric_name === 'monthly_recurring_revenue')
    const churnRateThreshold = thresholds?.find((t) => t.metric_name === 'churn_rate')

    const metrics: Epic2DashboardMetrics = {
      freeToPaidConversion: {
        metric_name: 'Free-to-Paid Conversion',
        current_value: avgFreeToPaid,
        green_threshold: Number(conversionThreshold?.green_threshold || 5),
        yellow_threshold: Number(conversionThreshold?.yellow_threshold || 3),
        red_threshold: Number(conversionThreshold?.red_threshold || 2),
        metric_unit: 'percentage',
        zone: calculateZone(
          avgFreeToPaid,
          Number(conversionThreshold?.green_threshold || 5),
          Number(conversionThreshold?.yellow_threshold || 3),
          Number(conversionThreshold?.red_threshold || 2),
          conversionThreshold?.higher_is_better !== false
        ),
        higher_is_better: conversionThreshold?.higher_is_better !== false,
      },
      messageSendRate: {
        metric_name: 'Message Send Rate',
        current_value: avgMessageSendRate,
        green_threshold: Number(sendRateThreshold?.green_threshold || 10),
        yellow_threshold: Number(sendRateThreshold?.yellow_threshold || 7),
        red_threshold: Number(sendRateThreshold?.red_threshold || 5),
        metric_unit: 'percentage',
        zone: calculateZone(
          avgMessageSendRate,
          Number(sendRateThreshold?.green_threshold || 10),
          Number(sendRateThreshold?.yellow_threshold || 7),
          Number(sendRateThreshold?.red_threshold || 5),
          sendRateThreshold?.higher_is_better !== false
        ),
        higher_is_better: sendRateThreshold?.higher_is_better !== false,
      },
      templateResponseRate: {
        metric_name: 'Template Response Rate',
        current_value: avgTemplateResponseRate,
        green_threshold: Number(responseRateThreshold?.green_threshold || 15),
        yellow_threshold: Number(responseRateThreshold?.yellow_threshold || 10),
        red_threshold: Number(responseRateThreshold?.red_threshold || 5),
        metric_unit: 'percentage',
        zone: calculateZone(
          avgTemplateResponseRate,
          Number(responseRateThreshold?.green_threshold || 15),
          Number(responseRateThreshold?.yellow_threshold || 10),
          Number(responseRateThreshold?.red_threshold || 5),
          responseRateThreshold?.higher_is_better !== false
        ),
        higher_is_better: responseRateThreshold?.higher_is_better !== false,
      },
      monthlyRecurringRevenue: {
        metric_name: 'Monthly Recurring Revenue',
        current_value: Number(currentMRR),
        green_threshold: Number(mrrThreshold?.green_threshold || 200),
        yellow_threshold: Number(mrrThreshold?.yellow_threshold || 100),
        red_threshold: Number(mrrThreshold?.red_threshold || 50),
        metric_unit: 'dollars',
        zone: calculateZone(
          Number(currentMRR),
          Number(mrrThreshold?.green_threshold || 200),
          Number(mrrThreshold?.yellow_threshold || 100),
          Number(mrrThreshold?.red_threshold || 50),
          mrrThreshold?.higher_is_better !== false
        ),
        higher_is_better: mrrThreshold?.higher_is_better !== false,
      },
      churnRate: {
        metric_name: 'Churn Rate',
        current_value: churnRate,
        green_threshold: Number(churnRateThreshold?.green_threshold || 15),
        yellow_threshold: Number(churnRateThreshold?.yellow_threshold || 20),
        red_threshold: Number(churnRateThreshold?.red_threshold || 25),
        metric_unit: 'percentage',
        zone: calculateZone(
          churnRate,
          Number(churnRateThreshold?.green_threshold || 15),
          Number(churnRateThreshold?.yellow_threshold || 20),
          Number(churnRateThreshold?.red_threshold || 25),
          churnRateThreshold?.higher_is_better === true
        ),
        higher_is_better: churnRateThreshold?.higher_is_better === true,
      },
      totalUsers,
      freeUsers,
      paidUsers,
      trialUsers,
      messagesSentToday,
      upgradesThisMonth,
    }

    return {
      success: true,
      metrics,
    }
  } catch (error) {
    console.error('[epic2-analytics] Error in getEpic2ValidationMetricsAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get Epic 2 daily metrics trend data
 */
export async function getEpic2DailyMetricsTrendAction(days: number = 30): Promise<{
  success: boolean
  data?: Epic2DailyMetric[]
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
      .from('epic2_daily_metrics')
      .select('*')
      .gte('metric_date', startDate.toISOString().split('T')[0])
      .order('metric_date', { ascending: true })

    if (error) {
      console.error('[epic2-analytics] Failed to fetch daily metrics trend:', error)
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
    console.error('[epic2-analytics] Error in getEpic2DailyMetricsTrendAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get conversion funnel data
 */
export async function getEpic2ConversionFunnelAction(): Promise<{
  success: boolean
  data?: Epic2ConversionFunnel
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

    // Get counts for each funnel step
    const { data: events } = await supabase
      .from('epic2_conversion_events')
      .select('event_type, user_id')

    // Count unique users at each step
    const signups = new Set(
      events?.filter((e) => e.event_type === 'signup').map((e) => e.user_id) || []
    ).size

    const redditConnected = new Set(
      events?.filter((e) => e.event_type === 'reddit_connected').map((e) => e.user_id) || []
    ).size

    const contactsDiscovered = new Set(
      events?.filter((e) => e.event_type === 'contact_discovered').map((e) => e.user_id) || []
    ).size

    const templatesGenerated = new Set(
      events?.filter((e) => e.event_type === 'template_generated').map((e) => e.user_id) || []
    ).size

    const messagesSent = new Set(
      events?.filter((e) => e.event_type === 'message_sent').map((e) => e.user_id) || []
    ).size

    const upgraded = new Set(
      events?.filter((e) => e.event_type === 'upgraded').map((e) => e.user_id) || []
    ).size

    return {
      success: true,
      data: {
        signups,
        redditConnected,
        contactsDiscovered,
        templatesGenerated,
        messagesSent,
        upgraded,
      },
    }
  } catch (error) {
    console.error('[epic2-analytics] Error in getEpic2ConversionFunnelAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Calculate Epic 2 daily metrics for a specific date
 * (Called by cron job or manually)
 */
export async function calculateEpic2DailyMetricsAction(targetDate?: string): Promise<{
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
    const { error } = await supabase.rpc('calculate_epic2_daily_metrics', {
      target_date: dateToCalculate,
    })

    if (error) {
      console.error('[epic2-analytics] Failed to calculate daily metrics:', error)
      return {
        success: false,
        error: 'Failed to calculate metrics',
      }
    }

    console.log(`[epic2-analytics] Daily metrics calculated for ${dateToCalculate}`)
    return {
      success: true,
    }
  } catch (error) {
    console.error('[epic2-analytics] Error in calculateEpic2DailyMetricsAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Track Epic 2 conversion event
 */
export async function trackEpic2ConversionEventAction(
  eventType: string,
  sessionId: string,
  metadata?: Record<string, unknown>
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

    const { error } = await supabase.from('epic2_conversion_events').insert({
      user_id: session.userId,
      session_id: sessionId,
      event_type: eventType,
      event_metadata: (metadata || {}) as never,
      occurred_at: new Date().toISOString(),
    })

    if (error) {
      console.error('[epic2-analytics] Failed to track conversion event:', error)
      return {
        success: false,
        error: 'Failed to track event',
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('[epic2-analytics] Error in trackEpic2ConversionEventAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
