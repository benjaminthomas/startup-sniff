/**
 * Analytics Tracker Service
 * Epic 1, Story 1.12: Epic 1 Validation Dashboard
 *
 * Tracks user events and session analytics for validation metrics
 */

import { createServerAdminClient } from '@/modules/supabase/server'
import type { Json } from '@/types/supabase'
import { log } from '@/lib/logger'

// Temporary: Analytics types until migration is applied
// TODO: Run migration and regenerate Supabase types
// These types are defined in supabase/migrations/20251024000000_create_analytics_dashboard.sql

export interface TrackEventParams {
  userId?: string
  sessionId: string
  eventName: string
  eventProperties?: Record<string, unknown>
  pageUrl?: string
  referrer?: string
  userAgent?: string
  ipAddress?: string
}

export interface SessionMetadata {
  landingPage?: string
  deviceType?: 'mobile' | 'tablet' | 'desktop'
  browser?: string
}

/**
 * Track an analytics event
 */
export async function trackEvent(params: TrackEventParams): Promise<void> {
  try {
    const supabase = createServerAdminClient()

    const eventProperties: Json | null = params.eventProperties
      ? (params.eventProperties as Json)
      : null

    await supabase.from('analytics_events').insert({
      user_id: params.userId || null,
      session_id: params.sessionId,
      event_name: params.eventName,
      event_properties: eventProperties,
      timestamp: new Date().toISOString(),
      page_url: params.pageUrl,
      referrer: params.referrer,
      user_agent: params.userAgent,
      ip_address: params.ipAddress,
    })
  } catch (error) {
    // Don't throw errors from analytics tracking
    log.error('[analytics] Failed to track event:', error)
  }
}

/**
 * Start a new session or update existing session metadata
 */
export async function startSession(
  sessionId: string,
  userId: string | null,
  metadata: SessionMetadata
): Promise<void> {
  try {
    const supabase = createServerAdminClient()

    await supabase.from('user_sessions_analytics').upsert({
      session_id: sessionId,
      user_id: userId,
      started_at: new Date().toISOString(),
      landing_page: metadata.landingPage,
      device_type: metadata.deviceType,
      browser: metadata.browser,
      page_views: 0,
      opportunities_viewed: 0,
      opportunities_clicked: 0,
      searches_performed: 0,
      filters_applied: 0,
    })
  } catch (error) {
    log.error('[analytics] Failed to start session:', error)
  }
}

/**
 * End a session and calculate duration
 */
export async function endSession(sessionId: string): Promise<void> {
  try {
    const supabase = createServerAdminClient()

    const { data: session } = await supabase
      .from('user_sessions_analytics')
      .select('started_at')
      .eq('session_id', sessionId)
      .single()

    if (session && session.started_at) {
      const endTime = new Date()
      const startTime = new Date(session.started_at)
      const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)

      await supabase
        .from('user_sessions_analytics')
        .update({
          ended_at: endTime.toISOString(),
          duration_seconds: durationSeconds,
          updated_at: new Date().toISOString(),
        })
        .eq('session_id', sessionId)
    }
  } catch (error) {
    log.error('[analytics] Failed to end session:', error)
  }
}

/**
 * Common event tracking helpers
 */
export const analyticsEvents = {
  /**
   * Track page view
   */
  pageView: async (sessionId: string, userId: string | null, pageUrl: string) => {
    await trackEvent({
      sessionId,
      userId: userId || undefined,
      eventName: 'page_view',
      pageUrl,
    })
  },

  /**
   * Track opportunity viewed
   */
  opportunityViewed: async (
    sessionId: string,
    userId: string | null,
    opportunityId: string,
    opportunityTitle: string
  ) => {
    await trackEvent({
      sessionId,
      userId: userId || undefined,
      eventName: 'opportunity_viewed',
      eventProperties: {
        opportunity_id: opportunityId,
        opportunity_title: opportunityTitle,
      },
    })
  },

  /**
   * Track opportunity clicked
   */
  opportunityClicked: async (
    sessionId: string,
    userId: string | null,
    opportunityId: string
  ) => {
    await trackEvent({
      sessionId,
      userId: userId || undefined,
      eventName: 'opportunity_clicked',
      eventProperties: {
        opportunity_id: opportunityId,
      },
    })
  },

  /**
   * Track search performed
   */
  searchPerformed: async (
    sessionId: string,
    userId: string | null,
    searchQuery: string,
    resultsCount: number
  ) => {
    await trackEvent({
      sessionId,
      userId: userId || undefined,
      eventName: 'search_performed',
      eventProperties: {
        search_query: searchQuery,
        results_count: resultsCount,
      },
    })
  },

  /**
   * Track filter applied
   */
  filterApplied: async (
    sessionId: string,
    userId: string | null,
    filterType: string,
    filterValue: string
  ) => {
    await trackEvent({
      sessionId,
      userId: userId || undefined,
      eventName: 'filter_applied',
      eventProperties: {
        filter_type: filterType,
        filter_value: filterValue,
      },
    })
  },

  /**
   * Track signup started
   */
  signupStarted: async (sessionId: string) => {
    await trackEvent({
      sessionId,
      eventName: 'signup_started',
    })
  },

  /**
   * Track signup completed
   */
  signupCompleted: async (sessionId: string, userId: string) => {
    await trackEvent({
      sessionId,
      userId,
      eventName: 'signup_completed',
    })
  },

  /**
   * Track login
   */
  login: async (sessionId: string, userId: string) => {
    await trackEvent({
      sessionId,
      userId,
      eventName: 'login',
    })
  },

  /**
   * Track upgrade to paid
   */
  upgradeToPaid: async (sessionId: string, userId: string, planType: string) => {
    await trackEvent({
      sessionId,
      userId,
      eventName: 'upgrade_to_paid',
      eventProperties: {
        plan_type: planType,
      },
    })
  },
}

/**
 * Get device type from user agent
 */
export function getDeviceType(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
  const ua = userAgent.toLowerCase()

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet'
  }

  if (
    /mobile|iphone|ipod|blackberry|android.*mobile|windows phone|opera mini|iemobile/i.test(
      ua
    )
  ) {
    return 'mobile'
  }

  return 'desktop'
}

/**
 * Get browser from user agent
 */
export function getBrowser(userAgent: string): string {
  const ua = userAgent.toLowerCase()

  if (ua.includes('firefox')) return 'Firefox'
  if (ua.includes('edg/')) return 'Edge'
  if (ua.includes('chrome')) return 'Chrome'
  if (ua.includes('safari')) return 'Safari'
  if (ua.includes('opera') || ua.includes('opr')) return 'Opera'

  return 'Unknown'
}
