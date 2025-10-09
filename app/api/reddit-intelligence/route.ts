import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/modules/auth/services/jwt'
import {
  getTrendingPainPoints,
  generateIdeasFromPainPoints,
  getStartupIntelligence
} from '@/modules/reddit'

export const dynamic = 'force-dynamic'

/**
 * Reddit Intelligence API Endpoint
 * Test endpoint for Reddit pain point extraction and idea generation
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getCurrentSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'pain-points'
    const limit = parseInt(searchParams.get('limit') || '20')

    console.log(`🧠 Reddit Intelligence API called: ${action}`)

    switch (action) {
      case 'pain-points':
        const painPoints = await getTrendingPainPoints(limit)
        return NextResponse.json({
          success: true,
          data: painPoints,
          count: painPoints.length,
          message: `Found ${painPoints.length} trending pain points`
        })

      case 'generate-ideas':
        const focusArea = searchParams.get('focus') || 'any'
        const complexity = searchParams.get('complexity') || 'medium'
        const budget = searchParams.get('budget') || 'bootstrap'

        const ideaResult = await generateIdeasFromPainPoints({
          focusArea,
          complexityLevel: complexity,
          budgetRange: budget,
          timeframe: 'day',
          minOpportunityScore: 50
        })

        return NextResponse.json({
          success: ideaResult.success,
          data: ideaResult.ideas,
          count: ideaResult.ideas.length,
          error: ideaResult.error,
          message: ideaResult.success
            ? `Generated ${ideaResult.ideas.length} startup ideas`
            : ideaResult.error
        })

      case 'full-intelligence':
        const includeIdeas = searchParams.get('includeIdeas') !== 'false'
        const includePainPoints = searchParams.get('includePainPoints') !== 'false'
        const includeTrends = searchParams.get('includeTrends') !== 'false'

        const intelligence = await getStartupIntelligence({
          includePainPoints,
          includeIdeas,
          includeTrends,
          ideaOptions: {
            focusArea: 'any',
            complexityLevel: 'medium',
            budgetRange: 'bootstrap',
            minOpportunityScore: 40
          }
        })

        return NextResponse.json({
          success: intelligence.success,
          data: intelligence.data,
          error: intelligence.error,
          summary: intelligence.data ? {
            painPointsCount: intelligence.data.painPoints.length,
            ideasCount: intelligence.data.ideas.length,
            trendsData: {
              totalTopics: intelligence.data.trends.totalTopics,
              activeCommunities: intelligence.data.trends.activeCommunities,
              topOpportunities: intelligence.data.trends.topOpportunities.length
            }
          } : null
        })

      case 'health-check':
        return NextResponse.json({
          success: true,
          message: 'Reddit Intelligence API is working',
          timestamp: new Date().toISOString(),
          endpoints: [
            '/api/reddit-intelligence?action=pain-points&limit=20',
            '/api/reddit-intelligence?action=generate-ideas&focus=saas&complexity=medium',
            '/api/reddit-intelligence?action=full-intelligence',
            '/api/reddit-intelligence?action=health-check'
          ]
        })

      default:
        return NextResponse.json(
          {
            error: 'Invalid action',
            availableActions: ['pain-points', 'generate-ideas', 'full-intelligence', 'health-check']
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Reddit Intelligence API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST endpoint for generating ideas with custom parameters
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getCurrentSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      focusArea = 'any',
      complexityLevel = 'medium',
      budgetRange = 'bootstrap',
      timeframe = 'day',
      minOpportunityScore = 40
    } = body

    console.log('🚀 Generating ideas with custom parameters:', {
      focusArea,
      complexityLevel,
      budgetRange,
      timeframe,
      minOpportunityScore
    })

    const result = await generateIdeasFromPainPoints({
      focusArea,
      complexityLevel,
      budgetRange,
      timeframe,
      minOpportunityScore
    })

    return NextResponse.json({
      success: result.success,
      ideas: result.ideas,
      count: result.ideas.length,
      error: result.error,
      parameters: {
        focusArea,
        complexityLevel,
        budgetRange,
        timeframe,
        minOpportunityScore
      },
      message: result.success
        ? `Generated ${result.ideas.length} startup ideas based on Reddit pain points`
        : result.error
    })

  } catch (error) {
    console.error('Reddit Intelligence POST API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
