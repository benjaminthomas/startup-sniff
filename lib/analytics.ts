/**
 * Analytics Tracking Utilities
 *
 * Tracks user events for Epic 1 validation metrics:
 * - Session duration
 * - Opportunities viewed
 * - Filter usage
 * - Return visits
 * - Bounce tracking
 */

import { track } from '@vercel/analytics'
import { log } from '@/lib/logger'

// Event types for Epic 1 validation
export type AnalyticsEvent =
  | 'page_view'
  | 'opportunity_viewed'
  | 'opportunity_detail_opened'
  | 'filter_applied'
  | 'search_performed'
  | 'session_started'
  | 'session_ended'
  | 'user_signup'
  | 'user_return'

interface EventProperties {
  [key: string]: string | number | boolean
}

/**
 * Track a custom event
 */
export function trackEvent(event: AnalyticsEvent, properties?: EventProperties) {
  if (typeof window === 'undefined') return

  try {
    track(event, properties)
  } catch (error) {
    log.error('Analytics tracking error:', error)
  }
}

/**
 * Track page view
 */
export function trackPageView(page: string, properties?: EventProperties) {
  trackEvent('page_view', {
    page,
    ...properties
  })
}

/**
 * Track opportunity viewed (card impression)
 */
export function trackOpportunityViewed(opportunityId: string, score: number) {
  trackEvent('opportunity_viewed', {
    opportunity_id: opportunityId,
    viability_score: score
  })
}

/**
 * Track opportunity detail page opened
 */
export function trackOpportunityDetailOpened(opportunityId: string, score: number, source: string = 'list') {
  trackEvent('opportunity_detail_opened', {
    opportunity_id: opportunityId,
    viability_score: score,
    source
  })
}

/**
 * Track filter applied
 */
export function trackFilterApplied(filterType: string, filterValue: string | number) {
  trackEvent('filter_applied', {
    filter_type: filterType,
    filter_value: String(filterValue)
  })
}

/**
 * Track search performed
 */
export function trackSearchPerformed(query: string, resultsCount: number) {
  trackEvent('search_performed', {
    query,
    results_count: resultsCount
  })
}

/**
 * Session Management
 * Tracks session start/end for calculating average session time
 */

const SESSION_KEY = 'startup_sniff_session'
const LAST_VISIT_KEY = 'startup_sniff_last_visit'

interface Session {
  id: string
  startTime: number
  pageViews: number
  opportunitiesViewed: number
  filtersApplied: number
}

/**
 * Start a new session or continue existing one
 */
export function initializeSession() {
  if (typeof window === 'undefined') return

  const now = Date.now()
  const lastVisit = localStorage.getItem(LAST_VISIT_KEY)
  const existingSession = getSession()

  // Check if this is a return visit (>24 hours since last visit)
  if (lastVisit) {
    const lastVisitTime = parseInt(lastVisit, 10)
    const hoursSinceLastVisit = (now - lastVisitTime) / (1000 * 60 * 60)

    if (hoursSinceLastVisit >= 24 && hoursSinceLastVisit <= 168) { // 24 hours to 7 days
      trackEvent('user_return', {
        hours_since_last_visit: Math.round(hoursSinceLastVisit)
      })
    }
  }

  // Create new session if none exists or if session is stale (>30 min)
  if (!existingSession || (now - existingSession.startTime) > 30 * 60 * 1000) {
    const session: Session = {
      id: `session_${now}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: now,
      pageViews: 0,
      opportunitiesViewed: 0,
      filtersApplied: 0
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    trackEvent('session_started', {
      session_id: session.id
    })
  }

  // Update last visit time
  localStorage.setItem(LAST_VISIT_KEY, now.toString())
}

/**
 * Get current session
 */
export function getSession(): Session | null {
  if (typeof window === 'undefined') return null

  try {
    const sessionStr = localStorage.getItem(SESSION_KEY)
    return sessionStr ? JSON.parse(sessionStr) : null
  } catch {
    return null
  }
}

/**
 * Update session metrics
 */
export function updateSession(updates: Partial<Omit<Session, 'id' | 'startTime'>>) {
  if (typeof window === 'undefined') return

  const session = getSession()
  if (!session) return

  const updatedSession = {
    ...session,
    ...updates
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession))
}

/**
 * Increment page views in session
 */
export function incrementPageViews() {
  const session = getSession()
  if (session) {
    updateSession({ pageViews: session.pageViews + 1 })
  }
}

/**
 * Increment opportunities viewed in session
 */
export function incrementOpportunitiesViewed() {
  const session = getSession()
  if (session) {
    updateSession({ opportunitiesViewed: session.opportunitiesViewed + 1 })
  }
}

/**
 * Increment filters applied in session
 */
export function incrementFiltersApplied() {
  const session = getSession()
  if (session) {
    updateSession({ filtersApplied: session.filtersApplied + 1 })
  }
}

/**
 * End session and track duration
 */
export function endSession() {
  if (typeof window === 'undefined') return

  const session = getSession()
  if (!session) return

  const duration = Math.round((Date.now() - session.startTime) / 1000) // seconds

  trackEvent('session_ended', {
    session_id: session.id,
    duration_seconds: duration,
    page_views: session.pageViews,
    opportunities_viewed: session.opportunitiesViewed,
    filters_applied: session.filtersApplied
  })

  localStorage.removeItem(SESSION_KEY)
}

/**
 * Track session duration on page unload
 */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', endSession)
}

/**
 * Calculate bounce (user left within 60 seconds with <2 page views)
 */
export function checkBounce() {
  const session = getSession()
  if (!session) return

  const duration = (Date.now() - session.startTime) / 1000

  if (duration < 60 && session.pageViews < 2) {
    trackEvent('session_ended', {
      session_id: session.id,
      duration_seconds: Math.round(duration),
      is_bounce: true,
      page_views: session.pageViews
    })
  }
}
