/**
 * Test script for multi-subreddit fetching with deduplication
 * Run with: npx tsx scripts/test-multi-subreddit.ts
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import { RedditApiClient } from '../lib/reddit/api-client'
import { RedditRateLimiter } from '../lib/reddit/rate-limiter'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// Simple console logger
const logger = {
  info: (msg: string, ...args: unknown[]) => console.log(`[INFO] ${msg}`, ...args),
  warn: (msg: string, ...args: unknown[]) => console.warn(`[WARN] ${msg}`, ...args),
  error: (msg: string, ...args: unknown[]) => console.error(`[ERROR] ${msg}`, ...args),
  debug: (msg: string, ...args: unknown[]) => {} // Suppress debug logs for cleaner output
}

async function testMultiSubreddit() {
  console.log('🧪 Testing Multi-Subreddit Fetching with Deduplication\n')

  const config = {
    clientId: process.env.REDDIT_CLIENT_ID!,
    clientSecret: process.env.REDDIT_CLIENT_SECRET!,
    refreshToken: process.env.REDDIT_REFRESH_TOKEN!,
    userAgent: process.env.REDDIT_USER_AGENT!
  }

  // Create a mock rate limiter
  const rateLimiter = {
    checkLimit: async () => ({
      allowed: true,
      remaining: 60,
      resetTime: new Date(Date.now() + 60000),
      priority: 'medium' as const
    }),
    getBackoffDelay: (retryCount: number) => Math.min(1000 * Math.pow(2, retryCount), 30000)
  } as any

  const client = new RedditApiClient(config, rateLimiter, logger)

  // Authenticate
  console.log('🔐 Authenticating...')
  const authResult = await client.authenticate()
  if (!authResult) {
    console.error('❌ Authentication failed')
    process.exit(1)
  }
  console.log('✅ Authenticated\n')

  // Test multi-subreddit fetching
  const subreddits = ['entrepreneur', 'SaaS', 'startups']
  console.log(`📡 Fetching from ${subreddits.length} subreddits: ${subreddits.join(', ')}`)
  console.log('⏳ This will take ~3 seconds (1s delay between requests)...\n')

  const startTime = Date.now()
  const result = await client.fetchMultipleSubreddits(subreddits, {
    limit: 10,
    sortBy: 'hot'
  })
  const duration = ((Date.now() - startTime) / 1000).toFixed(2)

  if (!result.success || !result.data) {
    console.error('❌ Fetch failed:', result.error)
    process.exit(1)
  }

  console.log(`✅ Fetch completed in ${duration}s`)
  console.log(`📊 Total posts collected: ${result.data.length}`)

  // Analyze posts by subreddit
  const bySubreddit = result.data.reduce((acc, post) => {
    acc[post.subreddit] = (acc[post.subreddit] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  console.log('\n📈 Posts by subreddit:')
  Object.entries(bySubreddit).forEach(([sub, count]) => {
    console.log(`  - r/${sub}: ${count} posts`)
  })

  // Check for duplicates (there shouldn't be any)
  const hashes = new Set()
  const duplicates = result.data.filter(post => {
    if (hashes.has(post.hash)) return true
    hashes.add(post.hash)
    return false
  })

  if (duplicates.length > 0) {
    console.log(`\n⚠️  Found ${duplicates.length} duplicates (deduplication failed!)`)
  } else {
    console.log('\n✅ No duplicates found (deduplication working correctly)')
  }

  // Show sample posts
  console.log('\n📝 Sample posts:')
  result.data.slice(0, 3).forEach((post, i) => {
    console.log(`  ${i + 1}. [r/${post.subreddit}] ${post.title.substring(0, 60)}...`)
    console.log(`     Score: ${post.score}, Comments: ${post.comments}, Author: ${post.author}`)
  })

  if (result.rateLimit) {
    console.log('\n⏱️  Rate Limit Info:')
    console.log(`  - Remaining: ${result.rateLimit.remaining}`)
    console.log(`  - Reset Time: ${result.rateLimit.resetTime.toISOString()}`)
  }

  console.log('\n✅ Multi-subreddit test passed!')
}

testMultiSubreddit().catch(error => {
  console.error('❌ Test failed with error:', error)
  process.exit(1)
})
