'use client'

import { useEffect } from 'react'
import { trackOpportunityDetailOpened } from '@/lib/analytics'

interface OpportunityAnalyticsProps {
  opportunityId: string
  score: number
}

/**
 * Client component to track opportunity detail page views
 */
export function OpportunityAnalytics({ opportunityId, score }: OpportunityAnalyticsProps) {
  useEffect(() => {
    trackOpportunityDetailOpened(opportunityId, score, 'list')
  }, [opportunityId, score])

  return null
}
