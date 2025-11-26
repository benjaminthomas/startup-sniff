/**
 * Reddit Post Scoring API Endpoint
 *
 * Purpose: Batch process Reddit posts and calculate BMAD scores
 * Trigger: Manual call or Cron job (after data collection)
 *
 * Flow:
 * 1. Fetch unscored posts from database
 * 2. Calculate BMAD scores in batches
 * 3. Update database with scores
 * 4. Return processing summary
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { OpportunityScorer } from '@/lib/services/opportunity-scorer'
import { JobMonitor, PerformanceTracker, ErrorAggregator } from '@/lib/services/monitoring'
import type { Database } from '@/types/supabase'

/**
 * POST /api/reddit/score
 *
 * Score unscored Reddit posts
 */
export async function POST(request: NextRequest) {
  // Initialize monitoring
  const monitor = new JobMonitor('reddit-score')
  const perf = new PerformanceTracker()
  const errors = new ErrorAggregator()

  try {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    const cronSecret = request.headers.get('x-vercel-cron-secret')

    const isAuthorized =
      cronSecret === process.env.CRON_SECRET ||
      authHeader === `Bearer ${process.env.API_SECRET}`

    if (!isAuthorized) {
      monitor.log('warn', 'Unauthorized access attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    monitor.log('info', 'Starting Reddit post scoring')

    // Parse request body for options
    const body = await request.json().catch(() => ({}))
    const {
      limit = 100,           // Max posts to score per run
      forceRescore = false,  // Re-score already scored posts
      minScore = 0           // Only score posts with at least this many upvotes
    } = body

    monitor.log('info', `Scoring options: limit=${limit}, forceRescore=${forceRescore}, minScore=${minScore}`)

    // Initialize Supabase client with service role key
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch posts to score
    perf.start('fetch-posts')
    let query = supabase
      .from('reddit_posts')
      .select('*')
      .gte('score', minScore)

    // Only fetch unscored posts unless forceRescore is true
    if (!forceRescore) {
      query = query.is('viability_score', null)
    }

    const { data: posts, error: fetchError } = await query
      .order('score', { ascending: false })
      .limit(limit)

    const fetchDuration = perf.end('fetch-posts')

    if (fetchError) {
      throw new Error(`Failed to fetch posts: ${fetchError.message}`)
    }

    if (!posts || posts.length === 0) {
      monitor.log('info', 'No posts to score')
      return NextResponse.json({
        success: true,
        job: monitor.getSummary(),
        posts: {
          fetched: 0,
          scored: 0,
          updated: 0
        },
        message: 'No posts found to score'
      })
    }

    monitor.log('info', `Fetched ${posts.length} posts to score`, {
      duration: `${(fetchDuration / 1000).toFixed(2)}s`
    })

    // Initialize Opportunity scorer
    const scorer = new OpportunityScorer()

    // Score posts in batches
    perf.start('scoring')
    const BATCH_SIZE = 50
    let scoredCount = 0
    let updatedCount = 0

    for (let i = 0; i < posts.length; i += BATCH_SIZE) {
      const batch = posts.slice(i, i + BATCH_SIZE)
      const batchNum = Math.floor(i / BATCH_SIZE) + 1

      monitor.log('debug', `Processing batch ${batchNum}`, {
        size: batch.length
      })

      // Score each post in the batch
      const updates = []
      for (const post of batch) {
        try {
          const score = await scorer.scorePost(post)
          scoredCount++

          updates.push({
            reddit_id: post.reddit_id,
            viability_score: score.viability_score,
            // Store component scores in a JSON column if needed
            // For now, just store the final score
          })
        } catch (error) {
          errors.add(`Post ${post.reddit_id}`, error instanceof Error ? error : String(error))
          monitor.log('warn', `Failed to score post ${post.reddit_id}`, {
            error: error instanceof Error ? error.message : String(error)
          })
        }
      }

      // Update database with scores
      if (updates.length > 0) {
        for (const update of updates) {
          const { error: updateError } = await supabase
            .from('reddit_posts')
            .update({ viability_score: update.viability_score })
            .eq('reddit_id', update.reddit_id)

          if (updateError) {
            errors.add(`Update ${update.reddit_id}`, updateError.message)
            monitor.log('error', `Failed to update post ${update.reddit_id}`, {
              error: updateError.message
            })
          } else {
            updatedCount++
          }
        }
      }

      monitor.log('debug', `Batch ${batchNum} complete`, {
        scored: updates.length,
        updated: updatedCount
      })
    }

    const scoringDuration = perf.end('scoring')

    monitor.log('info', `Scoring complete`, {
      duration: `${(scoringDuration / 1000).toFixed(2)}s`,
      scored: scoredCount,
      updated: updatedCount,
      errors: errors.count()
    })

    // Get score distribution statistics
    const { data: statsData } = await supabase
      .from('reddit_posts')
      .select('viability_score')
      .not('viability_score', 'is', null)

    const avgScore = statsData && statsData.length > 0
      ? statsData.reduce((sum, p) => sum + (p.viability_score || 0), 0) / statsData.length
      : 0

    const highScorers = statsData ? statsData.filter(p => (p.viability_score || 0) >= 7).length : 0
    const mediumScorers = statsData ? statsData.filter(p => (p.viability_score || 0) >= 4 && (p.viability_score || 0) < 7).length : 0
    const lowScorers = statsData ? statsData.filter(p => (p.viability_score || 0) < 4).length : 0

    // Mark job as success
    const result = monitor.success({
      itemsProcessed: posts.length,
      itemsInserted: updatedCount,
      itemsSkipped: posts.length - scoredCount,
      errors: errors.hasErrors() ? errors.getSummary() : undefined
    })

    const summary = {
      success: true,
      job: monitor.getSummary(),
      posts: {
        fetched: posts.length,
        scored: scoredCount,
        updated: updatedCount,
        failed: posts.length - scoredCount
      },
      statistics: {
        totalScored: statsData?.length || 0,
        averageScore: Number(avgScore.toFixed(2)),
        distribution: {
          high: highScorers,
          medium: mediumScorers,
          low: lowScorers
        }
      },
      performance: {
        fetchPosts: `${(fetchDuration / 1000).toFixed(2)}s`,
        scoring: `${(scoringDuration / 1000).toFixed(2)}s`,
        total: result.duration ? `${(result.duration / 1000).toFixed(2)}s` : 'N/A'
      },
      errors: errors.hasErrors() ? errors.getSummary() : undefined,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(summary, { status: 200 })
  } catch (error) {
    // Mark job as failed
    monitor.failure(error instanceof Error ? error : String(error))

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        job: monitor.getSummary(),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/reddit/score
 *
 * Health check and stats endpoint
 */
export async function GET() {
  try {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get scoring statistics
    const { data: allPosts, error: allError } = await supabase
      .from('reddit_posts')
      .select('viability_score, created_at')

    if (allError) throw allError

    const totalPosts = allPosts?.length || 0
    const scoredPosts = allPosts?.filter(p => p.viability_score !== null).length || 0
    const unscoredPosts = totalPosts - scoredPosts

    const scoredData = allPosts?.filter(p => p.viability_score !== null) || []
    const avgScore = scoredData.length > 0
      ? scoredData.reduce((sum, p) => sum + (p.viability_score || 0), 0) / scoredData.length
      : 0

    return NextResponse.json({
      endpoint: '/api/reddit/score',
      status: 'ready',
      description: 'Reddit post scoring endpoint',
      methods: ['GET', 'POST'],
      authentication: 'Required (Bearer token or Cron secret)',
      statistics: {
        totalPosts,
        scoredPosts,
        unscoredPosts,
        percentageScored: totalPosts > 0 ? Math.round((scoredPosts / totalPosts) * 100) : 0,
        averageScore: Number(avgScore.toFixed(2))
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      {
        endpoint: '/api/reddit/score',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
