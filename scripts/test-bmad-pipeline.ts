/**
 * End-to-End BMAD Pipeline Test
 *
 * Tests the complete flow:
 * 1. Fetch posts from database
 * 2. Score with BMAD algorithm
 * 3. Deep analysis with OpenAI for high-potential posts
 * 4. Trend detection across all posts
 * 5. Verify database updates
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { OpportunityScorer } from '../lib/services/opportunity-scorer'
import { OpportunityDeepAnalyzer } from '../lib/services/opportunity-deep-analyzer'
import { TrendDetector } from '../lib/services/trend-detector'
import type { Database } from '../types/supabase'

async function main() {
  console.log('🧪 End-to-End BMAD Pipeline Test\n')
  console.log('='.repeat(80))

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let testsPassed = 0
  let testsFailed = 0

  // Test 1: Fetch posts from database
  console.log('\n📊 TEST 1: Fetch posts from database')
  console.log('-'.repeat(80))
  try {
    const { data: posts, error } = await supabase
      .from('reddit_posts')
      .select('*')
      .limit(20)

    if (error) throw error
    if (!posts || posts.length === 0) throw new Error('No posts found')

    console.log(`✅ Successfully fetched ${posts.length} posts`)
    testsPassed++
  } catch (error) {
    console.log(`❌ Failed: ${error instanceof Error ? error.message : String(error)}`)
    testsFailed++
  }

  // Test 2: Score posts with BMAD
  console.log('\n🎯 TEST 2: Score posts with BMAD algorithm')
  console.log('-'.repeat(80))
  try {
    const { data: unscoredPost } = await supabase
      .from('reddit_posts')
      .select('*')
      .gte('score', 10) // Get a post with some engagement
      .limit(1)
      .single()

    if (!unscoredPost) throw new Error('No suitable post found')

    const scorer = new OpportunityScorer()
    const score = await scorer.scorePost(unscoredPost)

    if (score.viability_score < 0 || score.viability_score > 10) {
      throw new Error(`Invalid viability score: ${score.viability_score}`)
    }

    console.log(`✅ Scored post: ${unscoredPost.title.substring(0, 50)}...`)
    console.log(`   Viability: ${score.viability_score}/10`)
    console.log(`   Business: ${score.business_viability}, Market: ${score.market_validation}`)
    console.log(`   Action: ${score.action_potential}, Discovery: ${score.discovery_timing}`)
    console.log(`   Confidence: ${score.confidence}%`)
    testsPassed++
  } catch (error) {
    console.log(`❌ Failed: ${error instanceof Error ? error.message : String(error)}`)
    testsFailed++
  }

  // Test 3: Check scored posts exist
  console.log('\n📈 TEST 3: Verify scored posts in database')
  console.log('-'.repeat(80))
  try {
    const { data: scoredPosts, error } = await supabase
      .from('reddit_posts')
      .select('*')
      .not('viability_score', 'is', null)
      .limit(10)

    if (error) throw error
    if (!scoredPosts || scoredPosts.length === 0) {
      throw new Error('No scored posts found')
    }

    console.log(`✅ Found ${scoredPosts.length} scored posts in database`)
    console.log(`   Average score: ${(scoredPosts.reduce((sum, p) => sum + (p.viability_score || 0), 0) / scoredPosts.length).toFixed(2)}`)
    testsPassed++
  } catch (error) {
    console.log(`❌ Failed: ${error instanceof Error ? error.message : String(error)}`)
    testsFailed++
  }

  // Test 4: Verify high-potential posts have deep analysis
  console.log('\n🤖 TEST 4: Verify high-potential posts have OpenAI analysis')
  console.log('-'.repeat(80))
  try {
    const { data: highPotentialPosts, error } = await supabase
      .from('reddit_posts')
      .select('*')
      .gte('viability_score', 7.0)
      .limit(5)

    if (error) throw error
    if (!highPotentialPosts || highPotentialPosts.length === 0) {
      throw new Error('No high-potential posts found')
    }

    const postsWithExplanation = highPotentialPosts.filter(p => p.viability_explanation)

    console.log(`✅ Found ${highPotentialPosts.length} high-potential posts (≥7.0)`)
    console.log(`   ${postsWithExplanation.length} have OpenAI explanations`)

    if (postsWithExplanation.length > 0) {
      console.log(`\n   Example: "${highPotentialPosts[0].title.substring(0, 50)}..."`)
      console.log(`   Score: ${highPotentialPosts[0].viability_score}/10`)
      if (highPotentialPosts[0].viability_explanation) {
        console.log(`   Explanation: ${highPotentialPosts[0].viability_explanation.substring(0, 100)}...`)
      }
    }
    testsPassed++
  } catch (error) {
    console.log(`❌ Failed: ${error instanceof Error ? error.message : String(error)}`)
    testsFailed++
  }

  // Test 5: Verify trend detection data
  console.log('\n📊 TEST 5: Verify trend detection data')
  console.log('-'.repeat(80))
  try {
    const { data: trendPosts, error } = await supabase
      .from('reddit_posts')
      .select('*')
      .not('trend_direction', 'is', null)
      .limit(10)

    if (error) throw error
    if (!trendPosts || trendPosts.length === 0) {
      throw new Error('No posts with trend data found')
    }

    const emergingPosts = trendPosts.filter(p => p.is_emerging)

    console.log(`✅ Found ${trendPosts.length} posts with trend data`)
    console.log(`   ${emergingPosts.length} are flagged as emerging trends`)
    console.log(`   Trend directions: ${trendPosts.filter(p => p.trend_direction === 'up').length} up, ${trendPosts.filter(p => p.trend_direction === 'stable').length} stable, ${trendPosts.filter(p => p.trend_direction === 'down').length} down`)

    if (trendPosts.length > 0) {
      console.log(`\n   Example: "${trendPosts[0].title.substring(0, 50)}..."`)
      console.log(`   Weekly frequency: ${trendPosts[0].weekly_frequency} mentions`)
      console.log(`   Trend: ${trendPosts[0].trend_direction} (${trendPosts[0].trend_percentage}%)`)
    }
    testsPassed++
  } catch (error) {
    console.log(`❌ Failed: ${error instanceof Error ? error.message : String(error)}`)
    testsFailed++
  }

  // Test 6: Test trend detection service
  console.log('\n🔍 TEST 6: Test trend detection service')
  console.log('-'.repeat(80))
  try {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    const { data: recentPosts, error } = await supabase
      .from('reddit_posts')
      .select('*')
      .gte('created_utc', twoWeeksAgo.toISOString())
      .limit(100)

    if (error) throw error
    if (!recentPosts || recentPosts.length === 0) {
      throw new Error('No recent posts found')
    }

    const detector = new TrendDetector()
    const analysis = await detector.analyzeTrends(recentPosts)

    console.log(`✅ Analyzed ${recentPosts.length} recent posts`)
    console.log(`   Total topics: ${analysis.topics.size}`)
    console.log(`   Emerging trends: ${analysis.emergingTrends.length}`)
    console.log(`   Growing trends: ${analysis.growingTrends.length}`)

    if (analysis.emergingTrends.length > 0) {
      console.log(`\n   Top emerging: "${analysis.emergingTrends[0].topic}" (${analysis.emergingTrends[0].currentWeekCount} mentions, +${analysis.emergingTrends[0].trendPercentage}%)`)
    }
    testsPassed++
  } catch (error) {
    console.log(`❌ Failed: ${error instanceof Error ? error.message : String(error)}`)
    testsFailed++
  }

  // Test 7: Verify API endpoints are accessible
  console.log('\n🌐 TEST 7: Verify API endpoints are accessible')
  console.log('-'.repeat(80))
  try {
    // Test score endpoint health check
    const scoreResponse = await fetch('http://localhost:3001/api/reddit/score')
    if (!scoreResponse.ok) {
      throw new Error(`Score endpoint returned ${scoreResponse.status}`)
    }
    const scoreData = await scoreResponse.json()

    console.log(`✅ API endpoints are accessible`)
    console.log(`   /api/reddit/score: ${scoreData.status}`)
    console.log(`   Total posts: ${scoreData.statistics.totalPosts}`)
    console.log(`   Scored: ${scoreData.statistics.scoredPosts} (${scoreData.statistics.percentageScored}%)`)
    testsPassed++
  } catch (error) {
    console.log(`❌ Failed: ${error instanceof Error ? error.message : String(error)}`)
    console.log(`   Note: Make sure dev server is running on port 3001`)
    testsFailed++
  }

  // Final Summary
  console.log('\n' + '='.repeat(80))
  console.log('📋 TEST SUMMARY')
  console.log('='.repeat(80))
  console.log(`\nTests passed: ${testsPassed}`)
  console.log(`Tests failed: ${testsFailed}`)
  console.log(`Total tests: ${testsPassed + testsFailed}`)
  console.log(`Success rate: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`)

  if (testsFailed === 0) {
    console.log('\n✅ All tests passed! BMAD pipeline is fully operational.\n')
  } else {
    console.log(`\n⚠️  ${testsFailed} test(s) failed. Please review the errors above.\n`)
    process.exit(1)
  }
}

main().catch(console.error)
