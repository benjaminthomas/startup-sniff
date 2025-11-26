'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { initializeSession, incrementPageViews, trackPageView } from '@/lib/analytics'

/**
 * Session Tracker Component
 *
 * Tracks user sessions and page views for Epic 1 validation metrics.
 * Should be placed in the root layout or dashboard layout.
 */
export function SessionTracker() {
  const pathname = usePathname()

  useEffect(() => {
    // Initialize session on mount
    initializeSession()
  }, [])

  useEffect(() => {
    // Track page view and increment counter on route change
    trackPageView(pathname)
    incrementPageViews()
  }, [pathname])

  return null // This component doesn't render anything
}
