'use server';

import { redditIntegrationService } from '@/modules/reddit/services/reddit-integration'
import { painPointExtractor } from '@/modules/reddit/services/pain-point-extractor'
import { aiIdeaGenerator } from '@/modules/ai'
import type { RedditTrendAnalysis, TrendsSummary } from '@/modules/reddit/services/reddit-integration'
import type { PainPoint, StartupIdea } from '@/modules/reddit/services/pain-point-extractor'

interface TrendAnalysisResult {
  success: boolean;
  data?: RedditTrendAnalysis[];
  error?: string;
}

/**
 * Production Reddit trend analysis using real Reddit data
 */

export async function analyzeRedditTrends(forceRefresh = false): Promise<TrendAnalysisResult> {
  try {
    console.log('🔍 Analyzing Reddit trends with real data...')

    const analyses = await redditIntegrationService.analyzeTrends(forceRefresh)

    return {
      success: true,
      data: analyses
    }

  } catch (error) {
    console.error('Reddit trend analysis failed:', error)
    return {
      success: false,
      error: 'Failed to analyze Reddit trends. Please try again.'
    }
  }
}

export async function getRedditTrendsSummary(forceRefresh = false): Promise<TrendsSummary> {
  try {
    console.log('📊 Getting Reddit trends summary...')

    // Use our API route that fetches fresh Reddit data
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/reddit-trends${forceRefresh ? '?refresh=true' : ''}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: forceRefresh ? { revalidate: 0 } : { revalidate: 3600 } // Cache for 1 hour unless forced refresh
    })

    if (!response.ok) {
      throw new Error(`Reddit API failed: ${response.status}`)
    }

    const summary = await response.json()
    return summary

  } catch (error) {
    console.error('Failed to get Reddit trends summary:', error)
    return {
      totalTopics: 0,
      activeCommunities: 0,
      weeklyGrowth: '+0%',
      topOpportunities: []
    }
  }
}

/**
 * Manually trigger Reddit data collection
 */
export async function collectRedditData(subreddits?: string[]): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🚀 Manually triggering Reddit data collection...')

    const result = await redditIntegrationService.collectFreshData(subreddits)
    return result

  } catch (error) {
    console.error('Manual Reddit data collection failed:', error)
    return {
      success: false,
      message: 'Failed to collect Reddit data'
    }
  }
}

/**
 * Get system health status
 */
export async function getRedditHealthStatus() {
  try {
    const health = await redditIntegrationService.getHealthStatus()
    return health

  } catch (error) {
    console.error('Failed to get Reddit health status:', error)
    return {
      database: false,
      reddit_api: false,
      redis: false,
      recent_data: false
    }
  }
}

// ===== NEW PAIN POINT & IDEA GENERATION FUNCTIONS =====

/**
 * Get trending pain points from Reddit for idea generation
 */
export async function getTrendingPainPoints(limit = 20): Promise<PainPoint[]> {
  try {
    console.log('🔍 Extracting pain points from Reddit data...')

    const painPoints = await painPointExtractor.getTrendingPainPoints(limit)
    console.log(`✅ Found ${painPoints.length} pain points`)

    return painPoints

  } catch (error) {
    console.error('Failed to get trending pain points:', error)
    return []
  }
}

/**
 * Generate startup ideas from Reddit pain points
 */
export async function generateIdeasFromPainPoints(
  options: Record<string, unknown> = {}
): Promise<{ success: boolean; ideas: StartupIdea[]; error?: string }> {
  try {
    console.log('🚀 Generating startup ideas from pain points...')

    const ideas = await aiIdeaGenerator.generateIdeasFromPainPoints(options)

    console.log(`✅ Generated ${ideas.length} startup ideas`)

    return {
      success: true,
      ideas
    }

  } catch (error) {
    console.error('Failed to generate ideas from pain points:', error)
    return {
      success: false,
      ideas: [],
      error: 'Failed to generate startup ideas. Please try again.'
    }
  }
}

/**
 * Generate a quick idea from a specific pain point
 */
export async function generateQuickIdea(
  painPointId: string
): Promise<{ success: boolean; idea?: Partial<StartupIdea>; error?: string }> {
  try {
    console.log(`🔍 Generating quick idea for pain point: ${painPointId}`)

    const idea = await aiIdeaGenerator.generateQuickIdea(painPointId)

    if (!idea) {
      return {
        success: false,
        error: 'Could not generate idea for this pain point'
      }
    }

    console.log(`✅ Generated quick idea: ${idea.title}`)

    return {
      success: true,
      idea
    }

  } catch (error) {
    console.error('Failed to generate quick idea:', error)
    return {
      success: false,
      error: 'Failed to generate idea. Please try again.'
    }
  }
}

/**
 * Get pain points by category/subreddit
 */
export async function getPainPointsByCategory(category: string): Promise<PainPoint[]> {
  try {
    console.log(`🔍 Getting pain points for category: ${category}`)

    const painPoints = await painPointExtractor.getPainPointsByCategory(category)
    console.log(`✅ Found ${painPoints.length} pain points in ${category}`)

    return painPoints

  } catch (error) {
    console.error(`Failed to get pain points for category ${category}:`, error)
    return []
  }
}

/**
 * Get comprehensive startup intelligence (pain points + ideas + trends)
 */
export async function getStartupIntelligence(
  options: {
    includePainPoints?: boolean
    includeIdeas?: boolean
    includeTrends?: boolean
    ideaOptions?: Record<string, unknown>
  } = {}
): Promise<{
  success: boolean
  data?: {
    painPoints: PainPoint[]
    ideas: StartupIdea[]
    trends: TrendsSummary
  }
  error?: string
}> {
  try {
    console.log('🧠 Gathering comprehensive startup intelligence...')

    const {
      includePainPoints = true,
      includeIdeas = true,
      includeTrends = true,
      ideaOptions = {}
    } = options

    const results = await Promise.allSettled([
      includePainPoints ? painPointExtractor.getTrendingPainPoints(50) : Promise.resolve([]),
      includeIdeas ? aiIdeaGenerator.generateIdeasFromPainPoints(ideaOptions) : Promise.resolve([]),
      includeTrends ? redditIntegrationService.getTrendsSummary(false) : Promise.resolve({
        totalTopics: 0,
        activeCommunities: 0,
        weeklyGrowth: '+0%',
        topOpportunities: []
      })
    ])

    const painPoints = results[0].status === 'fulfilled' ? results[0].value : []
    const ideas = results[1].status === 'fulfilled' ? results[1].value : []
    const trends = results[2].status === 'fulfilled' ? results[2].value : {
      totalTopics: 0,
      activeCommunities: 0,
      weeklyGrowth: '+0%',
      topOpportunities: []
    }

    console.log(`✅ Intelligence gathered: ${painPoints.length} pain points, ${ideas.length} ideas`)

    return {
      success: true,
      data: {
        painPoints,
        ideas,
        trends
      }
    }

  } catch (error) {
    console.error('Failed to gather startup intelligence:', error)
    return {
      success: false,
      error: 'Failed to gather startup intelligence. Please try again.'
    }
  }
}
