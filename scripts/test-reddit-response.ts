/**
 * Test script to inspect actual Reddit API response structure
 * Run with: npx tsx scripts/test-reddit-response.ts
 */

import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function testRedditResponse() {
  console.log('🔍 Inspecting Reddit API response structure\n')

  const config = {
    clientId: process.env.REDDIT_CLIENT_ID!,
    clientSecret: process.env.REDDIT_CLIENT_SECRET!,
    refreshToken: process.env.REDDIT_REFRESH_TOKEN!,
    userAgent: process.env.REDDIT_USER_AGENT!
  }

  // Get access token
  console.log('🔐 Getting OAuth token...')
  const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')

  const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': config.userAgent
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: config.refreshToken
    })
  })

  const tokenData = await tokenResponse.json()
  const accessToken = tokenData.access_token

  console.log('✅ Got access token\n')

  // Fetch 1 post from r/entrepreneur
  console.log('📡 Fetching 1 post from r/entrepreneur...\n')
  const response = await fetch('https://oauth.reddit.com/r/entrepreneur/hot.json?limit=1', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': config.userAgent
    }
  })

  const data = await response.json()

  if (data.data?.children?.[0]?.data) {
    const post = data.data.children[0].data

    console.log('📝 Sample Reddit API Response Structure:')
    console.log('=====================================\n')
    console.log('ID fields:')
    console.log(`  - id: ${post.id} (${typeof post.id})`)
    console.log(`  - name: ${post.name} (${typeof post.name})`)
    console.log()
    console.log('Title/Content:')
    console.log(`  - title: "${post.title.substring(0, 50)}..." (${typeof post.title})`)
    console.log(`  - selftext: "${(post.selftext || '').substring(0, 50)}..." (${typeof post.selftext})`)
    console.log()
    console.log('Metadata:')
    console.log(`  - subreddit: ${post.subreddit} (${typeof post.subreddit})`)
    console.log(`  - author: ${post.author} (${typeof post.author})`)
    console.log(`  - url: ${post.url} (${typeof post.url})`)
    console.log()
    console.log('Scores/Counts:')
    console.log(`  - score: ${post.score} (${typeof post.score})`)
    console.log(`  - ups: ${post.ups} (${typeof post.ups})`)
    console.log(`  - downs: ${post.downs} (${typeof post.downs})`)
    console.log(`  - num_comments: ${post.num_comments} (${typeof post.num_comments})`)
    console.log()
    console.log('Timestamps:')
    console.log(`  - created: ${post.created} (${typeof post.created})`)
    console.log(`  - created_utc: ${post.created_utc} (${typeof post.created_utc})`)
    console.log()
    console.log('Flags:')
    console.log(`  - is_self: ${post.is_self} (${typeof post.is_self})`)
    console.log(`  - stickied: ${post.stickied} (${typeof post.stickied})`)
    console.log(`  - over_18: ${post.over_18} (${typeof post.over_18})`)
    console.log()
    console.log('Full field list:')
    console.log(Object.keys(post).sort().join(', '))
  } else {
    console.error('❌ No post data found')
  }
}

testRedditResponse().catch(error => {
  console.error('❌ Test failed:', error)
  process.exit(1)
})
