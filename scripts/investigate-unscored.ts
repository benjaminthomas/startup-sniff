/**
 * Investigate Unscored Posts
 *
 * Find out why 16 posts failed to score
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { OpportunityScorer } from '../lib/services/opportunity-scorer'
import type { Database } from '../types/supabase'

async function main() {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  console.log('🔍 Investigating Unscored Posts\n')
  console.log('='.repeat(80))

  // Fetch unscored posts
  const { data: unscoredPosts, error } = await supabase
    .from('reddit_posts')
    .select('*')
    .is('viability_score', null)
    .order('score', { ascending: false })
    .limit(20)

  if (error || !unscoredPosts) {
    console.error('Error fetching posts:', error)
    return
  }

  console.log(`\n📊 Found ${unscoredPosts.length} unscored posts\n`)

  if (unscoredPosts.length === 0) {
    console.log('✅ All posts are scored!')
    return
  }

  // Try to score them
  const scorer = new OpportunityScorer()
  let successCount = 0
  let failCount = 0

  for (const post of unscoredPosts) {
    console.log(`\n${'='.repeat(80)}`)
    console.log(`Title: ${post.title.substring(0, 60)}...`)
    console.log(`Subreddit: r/${post.subreddit}`)
    console.log(`Engagement: ${post.score} upvotes | ${post.comments} comments`)

    try {
      const score = await scorer.scorePost(post)
      console.log(`✅ Successfully scored: ${score.viability_score}/10`)
      console.log(`   Business: ${score.business_viability}, Market: ${score.market_validation}, Action: ${score.action_potential}, Discovery: ${score.discovery_timing}`)

      // Try to update database
      const { error: updateError } = await supabase
        .from('reddit_posts')
        .update({ viability_score: score.viability_score })
        .eq('reddit_id', post.reddit_id)

      if (updateError) {
        console.log(`❌ Database update failed: ${updateError.message}`)
        failCount++
      } else {
        console.log(`✅ Database updated successfully`)
        successCount++
      }
    } catch (error) {
      console.log(`❌ Scoring failed: ${error instanceof Error ? error.message : String(error)}`)
      failCount++
    }
  }

  console.log(`\n\n${'='.repeat(80)}`)
  console.log('📈 INVESTIGATION SUMMARY')
  console.log('='.repeat(80))
  console.log(`Total unscored: ${unscoredPosts.length}`)
  console.log(`Successfully scored and updated: ${successCount}`)
  console.log(`Failed: ${failCount}`)
  console.log('\n✅ Investigation complete!\n')
}

main().catch(console.error)
