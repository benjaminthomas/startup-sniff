/**
 * Test BMAD Scorer on Real Posts
 *
 * This script fetches posts from the database and scores them
 * to validate the scoring algorithm
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { OpportunityScorer } from '../lib/services/opportunity-scorer'
import type { Database } from '../types/supabase'

async function main() {
  // Initialize Supabase
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  console.log('🎯 Testing BMAD Scorer\n')
  console.log('=' .repeat(80))

  // Fetch sample posts
  const { data: posts, error } = await supabase
    .from('reddit_posts')
    .select('*')
    .in('subreddit', ['entrepreneur', 'startups', 'SaaS', 'indiehackers', 'microsaas', 'smallbusiness'])
    .order('score', { ascending: false })
    .limit(10)

  if (error || !posts) {
    console.error('Error fetching posts:', error)
    return
  }

  console.log(`\n📊 Scoring ${posts.length} posts...\n`)

  // Initialize scorer
  const scorer = new OpportunityScorer()

  // Score each post
  const results = []
  for (const post of posts) {
    const score = await scorer.scorePost(post)
    results.push({ post, score })
  }

  // Sort by viability score
  results.sort((a, b) => b.score.viability_score - a.score.viability_score)

  // Display results
  console.log('\n🏆 TOP SCORED POSTS\n')
  console.log('=' .repeat(80))

  results.forEach((result, index) => {
    const { post, score } = result

    console.log(`\n${index + 1}. ${post.title.substring(0, 70)}...`)
    console.log(`   Subreddit: r/${post.subreddit}`)
    console.log(`   Score: ${post.score} upvotes | ${post.comments} comments`)
    console.log(`   `)
    console.log(`   🎯 BMAD Score: ${score.viability_score}/10 (${score.confidence}% confidence)`)
    console.log(`   ├─ Business Viability: ${score.business_viability}/10 - ${score.explanation.business}`)
    console.log(`   ├─ Market Validation: ${score.market_validation}/10 - ${score.explanation.market}`)
    console.log(`   ├─ Action Potential: ${score.action_potential}/10 - ${score.explanation.action}`)
    console.log(`   └─ Discovery Timing: ${score.discovery_timing}/10 - ${score.explanation.discovery}`)
  })

  // Statistics
  const scores = results.map(r => r.score)
  const stats = scorer.getStatistics(scores)

  console.log('\n\n📈 SCORING STATISTICS')
  console.log('=' .repeat(80))
  console.log(`Average Viability Score: ${stats.avgViability}/10`)
  console.log(`Average Business: ${stats.avgBusiness}/10`)
  console.log(`Average Market: ${stats.avgMarket}/10`)
  console.log(`Average Action: ${stats.avgAction}/10`)
  console.log(`Average Discovery: ${stats.avgDiscovery}/10`)
  console.log(`\nDistribution:`)
  console.log(`  High Scorers (7-10): ${stats.highScorers} posts (${Math.round(stats.highScorers / posts.length * 100)}%)`)
  console.log(`  Medium Scorers (4-7): ${stats.mediumScorers} posts (${Math.round(stats.mediumScorers / posts.length * 100)}%)`)
  console.log(`  Low Scorers (0-4): ${stats.lowScorers} posts (${Math.round(stats.lowScorers / posts.length * 100)}%)`)

  console.log('\n✅ Test complete!\n')
}

main().catch(console.error)
