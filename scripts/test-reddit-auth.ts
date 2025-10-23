/**
 * Test script for Reddit API authentication
 * Run with: npx tsx scripts/test-reddit-auth.ts
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import { RedditApiClient } from '../lib/reddit/api-client'
import { RedditRateLimiter } from '../lib/reddit/rate-limiter'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// Simple console logger
const logger = {
  info: (msg: string, ...args: unknown[]) => console.log(`[INFO] ${msg}`, ...args),
  warn: (msg: string, ...args: unknown[]) => console.warn(`[WARN] ${msg}`, ...args),
  error: (msg: string, ...args: unknown[]) => console.error(`[ERROR] ${msg}`, ...args),
  debug: (msg: string, ...args: unknown[]) => console.log(`[DEBUG] ${msg}`, ...args)
}

async function testRedditAuth() {
  console.log('🧪 Testing Reddit API Authentication\n')

  // Check environment variables
  const requiredVars = [
    'REDDIT_CLIENT_ID',
    'REDDIT_CLIENT_SECRET',
    'REDDIT_REFRESH_TOKEN',
    'REDDIT_USER_AGENT'
  ]

  const missing = requiredVars.filter(v => !process.env[v])
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing)
    process.exit(1)
  }

  console.log('✅ All required environment variables present\n')

  // Initialize client
  const config = {
    clientId: process.env.REDDIT_CLIENT_ID!,
    clientSecret: process.env.REDDIT_CLIENT_SECRET!,
    refreshToken: process.env.REDDIT_REFRESH_TOKEN!,
    userAgent: process.env.REDDIT_USER_AGENT!
  }

  // Create a mock rate limiter for testing (no Redis)
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

  // Test authentication
  console.log('🔐 Attempting OAuth2 authentication...')
  const authResult = await client.authenticate()

  if (!authResult) {
    console.error('❌ Authentication failed')
    process.exit(1)
  }

  console.log('✅ Authentication successful!\n')

  // Test fetching a single post from entrepreneur subreddit
  console.log('📡 Testing API fetch from r/entrepreneur...')
  const result = await client.fetchSubredditPosts('entrepreneur', {
    limit: 5,
    sortBy: 'hot'
  })

  if (!result.success || !result.data) {
    console.error('❌ Fetch failed:', result.error)
    process.exit(1)
  }

  console.log(`✅ Successfully fetched ${result.data.length} posts`)

  if (result.data.length > 0) {
    console.log('\n📝 Sample post:')
    const sample = result.data[0]
    console.log(`  - ID: ${sample.reddit_id}`)
    console.log(`  - Title: ${sample.title.substring(0, 80)}...`)
    console.log(`  - Author: ${sample.author}`)
    console.log(`  - Score: ${sample.score}`)
    console.log(`  - Comments: ${sample.comments}`)
  }

  if (result.rateLimit) {
    console.log('\n⏱️  Rate Limit Info:')
    console.log(`  - Remaining: ${result.rateLimit.remaining}`)
    console.log(`  - Reset Time: ${result.rateLimit.resetTime.toISOString()}`)
  }

  console.log('\n✅ All tests passed! Reddit API client is working correctly.')
}

testRedditAuth().catch(error => {
  console.error('❌ Test failed with error:', error)
  process.exit(1)
})
