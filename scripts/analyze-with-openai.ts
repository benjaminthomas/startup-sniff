/**
 * Deep Analysis with OpenAI
 *
 * Analyze the top 10 high-potential posts (score ≥7.0) using GPT-4
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { OpportunityDeepAnalyzer } from '../lib/services/opportunity-deep-analyzer'
import type { Database } from '../types/supabase'

async function main() {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  console.log('🤖 Deep Analysis with OpenAI GPT-4\n')
  console.log('='.repeat(80))

  // Fetch high-potential posts (score ≥7.0)
  const { data: posts, error } = await supabase
    .from('reddit_posts')
    .select('*')
    .gte('viability_score', 7.0)
    .order('viability_score', { ascending: false })
    .limit(10)

  if (error || !posts) {
    console.error('Error fetching posts:', error)
    return
  }

  console.log(`\n📊 Found ${posts.length} high-potential posts (score ≥7.0)\n`)

  // Estimate cost
  const analyzer = new OpportunityDeepAnalyzer()
  const costEstimate = analyzer.estimateCost(posts.length)

  console.log('💰 Cost Estimate:')
  console.log(`   Input tokens: ${costEstimate.inputTokens.toLocaleString()}`)
  console.log(`   Output tokens: ${costEstimate.outputTokens.toLocaleString()}`)
  console.log(`   Estimated cost: $${costEstimate.estimatedCost.toFixed(4)}`)
  console.log()

  // Confirm before proceeding
  console.log('⚠️  This will call OpenAI API and incur costs.')
  console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n')
  await new Promise(resolve => setTimeout(resolve, 5000))

  // Analyze each post
  let successCount = 0
  let failCount = 0

  for (const post of posts) {
    console.log(`\n${'='.repeat(80)}`)
    console.log(`\n🔍 Analyzing: ${post.title.substring(0, 60)}...`)
    console.log(`   Subreddit: r/${post.subreddit}`)
    console.log(`   Score: ${post.viability_score}/10`)
    console.log(`   Engagement: ${post.score} upvotes, ${post.comments} comments`)

    try {
      const analysis = await analyzer.analyzePost(post)

      console.log(`\n✅ Analysis complete:`)
      console.log(`\n📝 Viability Explanation:`)
      console.log(`   ${analysis.viability_explanation}`)

      console.log(`\n🎯 Problem Analysis:`)
      console.log(`   Clarity: ${analysis.problem_analysis.clarity}`)
      console.log(`   Depth: ${analysis.problem_analysis.depth}`)
      console.log(`   Specificity: ${analysis.problem_analysis.specificity}`)

      console.log(`\n📊 Market Analysis:`)
      console.log(`   Size: ${analysis.market_analysis.size_estimate}`)
      console.log(`   Validation: ${analysis.market_analysis.validation_level}`)
      console.log(`   Evidence: ${analysis.market_analysis.evidence}`)

      console.log(`\n🏆 Competitive Landscape:`)
      console.log(`   Competition: ${analysis.competitive_landscape.competition_level}`)
      console.log(`   Differentiation: ${analysis.competitive_landscape.differentiation_opportunity}`)

      console.log(`\n🛠️  Implementation:`)
      console.log(`   Complexity: ${analysis.implementation.complexity}`)
      console.log(`   Time to market: ${analysis.implementation.time_to_market}`)
      console.log(`   Key challenges:`)
      analysis.implementation.key_challenges.forEach((challenge, i) => {
        console.log(`     ${i + 1}. ${challenge}`)
      })

      console.log(`\n💡 Key Insights:`)
      analysis.key_insights.forEach((insight, i) => {
        console.log(`   ${i + 1}. ${insight}`)
      })

      console.log(`\n✅ Recommendation: ${analysis.recommendation}`)
      console.log(`   Confidence: ${analysis.confidence}%`)

      // Update database with viability explanation
      const { error: updateError } = await supabase
        .from('reddit_posts')
        .update({ viability_explanation: analysis.viability_explanation })
        .eq('reddit_id', post.reddit_id)

      if (updateError) {
        console.log(`\n❌ Database update failed: ${updateError.message}`)
        failCount++
      } else {
        console.log(`\n✅ Database updated successfully`)
        successCount++
      }

    } catch (error) {
      console.log(`\n❌ Analysis failed: ${error instanceof Error ? error.message : String(error)}`)
      failCount++
    }

    // Rate limiting: wait 2 seconds between requests
    if (posts.indexOf(post) < posts.length - 1) {
      console.log(`\n⏳ Waiting 2 seconds before next request...`)
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  console.log(`\n\n${'='.repeat(80)}`)
  console.log('📈 ANALYSIS SUMMARY')
  console.log('='.repeat(80))
  console.log(`Total posts analyzed: ${posts.length}`)
  console.log(`Successfully analyzed and updated: ${successCount}`)
  console.log(`Failed: ${failCount}`)
  console.log(`\n✅ Deep analysis complete!\n`)
}

main().catch(console.error)
