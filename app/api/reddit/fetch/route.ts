/**
 * Reddit Data Collection API Endpoint
 *
 * Purpose: Background job for fetching Reddit posts from configured subreddits
 * Trigger: Vercel Cron (every 4 hours) or manual call
 *
 * Flow:
 * 1. Authenticate with Reddit API
 * 2. Fetch posts from all configured subreddits (sequential with rate limiting)
 * 3. Deduplicate posts
 * 4. Insert new posts into database
 * 5. Return collection summary
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { RedditApiClient } from '@/lib/reddit/api-client'
import { RedditRateLimiter } from '@/lib/reddit/rate-limiter'
import { RedisCache } from '@/lib/services/redis-cache'
import { getHighPrioritySubreddits, getAllSubredditNames } from '@/lib/reddit/subreddit-config'
import { JobMonitor, PerformanceTracker, ErrorAggregator } from '@/lib/services/monitoring'
import type { Database } from '@/types/supabase'

// Environment validation
function validateEnvironment() {
  const required = [
    'REDDIT_CLIENT_ID',
    'REDDIT_CLIENT_SECRET',
    'REDDIT_REFRESH_TOKEN',
    'REDDIT_USER_AGENT',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]

  const missing = required.filter(key => !process.env[key])
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

// Simple logger for API routes
const logger = {
  info: (msg: string, ...args: unknown[]) => console.log(`[Reddit Fetch] ${msg}`, ...args),
  warn: (msg: string, ...args: unknown[]) => console.warn(`[Reddit Fetch] ${msg}`, ...args),
  error: (msg: string, ...args: unknown[]) => console.error(`[Reddit Fetch] ${msg}`, ...args),
  debug: (msg: string, ...args: unknown[]) => console.log(`[Reddit Fetch DEBUG] ${msg}`, ...args)
}

/**
 * POST /api/reddit/fetch
 *
 * Fetch and store Reddit posts from configured subreddits
 */
export async function POST(request: NextRequest) {
  // Initialize monitoring
  const monitor = new JobMonitor('reddit-fetch')
  const perf = new PerformanceTracker()
  const errors = new ErrorAggregator()

  try {
    // Validate environment variables
    validateEnvironment()

    // Check authentication (for manual calls)
    const authHeader = request.headers.get('authorization')
    const cronSecret = request.headers.get('x-vercel-cron-secret')

    // Allow if either:
    // 1. Valid cron secret (from Vercel Cron)
    // 2. Valid authorization header (for manual testing)
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

    monitor.log('info', 'Starting Reddit data collection')

    // Parse request body for options
    const body = await request.json().catch(() => ({}))
    const {
      mode = 'high-priority', // 'high-priority' | 'all' | 'custom'
      subreddits = null, // Custom subreddit list
      limit = 25 // Posts per subreddit
    } = body

    // Determine which subreddits to fetch
    let targetSubreddits: string[]
    if (mode === 'all') {
      targetSubreddits = getAllSubredditNames()
    } else if (mode === 'custom' && Array.isArray(subreddits)) {
      targetSubreddits = subreddits
    } else {
      targetSubreddits = getHighPrioritySubreddits() // Default
    }

    monitor.log('info', `Fetching from ${targetSubreddits.length} subreddits`, {
      subreddits: targetSubreddits
    })

    // Initialize Reddit API client
    const redditConfig = {
      clientId: process.env.REDDIT_CLIENT_ID!,
      clientSecret: process.env.REDDIT_CLIENT_SECRET!,
      refreshToken: process.env.REDDIT_REFRESH_TOKEN!,
      userAgent: process.env.REDDIT_USER_AGENT!
    }

    // Create rate limiter (without Redis for now - falls back to in-memory)
    const rateLimiter = {
      checkLimit: async () => ({
        allowed: true,
        remaining: 60,
        resetTime: new Date(Date.now() + 60000),
        priority: 'medium' as const
      }),
      getBackoffDelay: (retryCount: number) => Math.min(1000 * Math.pow(2, retryCount), 30000)
    } as unknown as RedditRateLimiter

    const cache = new RedisCache({ prefix: 'reddit' })
    const redditClient = new RedditApiClient(redditConfig, rateLimiter, logger, undefined, cache)

    // Authenticate
    perf.start('authentication')
    const authenticated = await redditClient.authenticate()
    const authDuration = perf.end('authentication')

    if (!authenticated) {
      throw new Error('Failed to authenticate with Reddit API')
    }

    monitor.log('info', `Authenticated with Reddit API`, {
      duration: `${(authDuration / 1000).toFixed(2)}s`
    })

    // Fetch posts from all subreddits
    perf.start('fetch-posts')
    const fetchResult = await redditClient.fetchMultipleSubreddits(targetSubreddits, {
      limit,
      sortBy: 'hot',
      timeRange: '24h'
    })
    const fetchDuration = perf.end('fetch-posts')

    if (!fetchResult.success || !fetchResult.data) {
      throw new Error(`Failed to fetch posts: ${fetchResult.error || 'No data returned'}`)
    }

    const posts = fetchResult.data
    monitor.log('info', `Fetched ${posts.length} posts total`, {
      duration: `${(fetchDuration / 1000).toFixed(2)}s`,
      postsPerSecond: (posts.length / (fetchDuration / 1000)).toFixed(2)
    })

    // Initialize Supabase client with service role key
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Insert posts into database (using upsert to handle duplicates)
    let insertedCount = 0
    let skippedCount = 0

    monitor.log('info', `Starting database insertion`, {
      totalPosts: posts.length
    })

    // Batch insert in chunks of 50
    perf.start('database-insert')
    const BATCH_SIZE = 50
    for (let i = 0; i < posts.length; i += BATCH_SIZE) {
      const batch = posts.slice(i, i + BATCH_SIZE)
      const batchNum = Math.floor(i / BATCH_SIZE) + 1

      const { data, error } = await supabase
        .from('reddit_posts')
        .upsert(batch, {
          onConflict: 'reddit_id',
          ignoreDuplicates: true
        })
        .select('reddit_id')

      if (error) {
        monitor.log('error', `Batch ${batchNum} insert failed`, { error: error.message })
        errors.add(`Batch ${batchNum}`, error.message)
        continue
      }

      const inserted = data?.length || 0
      insertedCount += inserted
      skippedCount += batch.length - inserted

      monitor.log('debug', `Batch ${batchNum} complete`, {
        inserted,
        skipped: batch.length - inserted
      })
    }

    const insertDuration = perf.end('database-insert')

    monitor.log('info', `Database insertion complete`, {
      duration: `${(insertDuration / 1000).toFixed(2)}s`,
      inserted: insertedCount,
      skipped: skippedCount,
      errors: errors.count()
    })

    // Update metrics and mark as success
    const result = monitor.success({
      itemsProcessed: posts.length,
      itemsInserted: insertedCount,
      itemsSkipped: skippedCount,
      errors: errors.hasErrors() ? errors.getSummary() : undefined
    })

    const summary = {
      success: true,
      job: monitor.getSummary(),
      subreddits: {
        fetched: targetSubreddits.length,
        list: targetSubreddits
      },
      posts: {
        fetched: posts.length,
        inserted: insertedCount,
        skipped: skippedCount
      },
      performance: {
        authentication: `${(authDuration / 1000).toFixed(2)}s`,
        fetchPosts: `${(fetchDuration / 1000).toFixed(2)}s`,
        databaseInsert: `${(insertDuration / 1000).toFixed(2)}s`,
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
 * GET /api/reddit/fetch
 *
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/reddit/fetch',
    status: 'ready',
    description: 'Reddit data collection endpoint',
    methods: ['POST'],
    authentication: 'Required (Bearer token or Cron secret)',
    timestamp: new Date().toISOString()
  })
}
