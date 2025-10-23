/**
 * Detect Trends in Reddit Posts
 *
 * Analyze all posts to identify emerging pain points and trending topics
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { TrendDetector } from '../lib/services/trend-detector'
import type { Database } from '../types/supabase'

async function main() {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  console.log('📈 Trend Detection Analysis\n')
  console.log('='.repeat(80))

  // Fetch all posts from last 2 weeks
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

  const { data: posts, error } = await supabase
    .from('reddit_posts')
    .select('*')
    .gte('created_utc', twoWeeksAgo.toISOString())
    .order('created_utc', { ascending: false })

  if (error || !posts) {
    console.error('Error fetching posts:', error)
    return
  }

  console.log(`\n📊 Analyzing ${posts.length} posts from last 2 weeks...\n`)

  // Analyze trends
  const detector = new TrendDetector()
  const analysis = await detector.analyzeTrends(posts)

  // Display summary
  console.log(detector.generateSummary(analysis))

  // Display detailed emerging trends
  if (analysis.emergingTrends.length > 0) {
    console.log('\n' + '='.repeat(80))
    console.log('🔥 DETAILED EMERGING TRENDS')
    console.log('='.repeat(80))

    analysis.emergingTrends.forEach((trend, index) => {
      console.log(`\n${index + 1}. "${trend.topic.toUpperCase()}"`)
      console.log(`   Current week: ${trend.currentWeekCount} mentions`)
      console.log(`   Previous week: ${trend.previousWeekCount} mentions`)
      console.log(`   Growth: ${trend.trendPercentage > 0 ? '+' : ''}${trend.trendPercentage}%`)
      console.log(`   Posts: ${trend.posts.length}`)
    })
  }

  // Display top growing trends
  if (analysis.growingTrends.length > 0) {
    console.log('\n' + '='.repeat(80))
    console.log('📈 TOP 10 GROWING TRENDS')
    console.log('='.repeat(80))

    const topGrowing = detector.getTopTrends(analysis, 'growing', 10)
    topGrowing.forEach((trend, index) => {
      console.log(`\n${index + 1}. "${trend.topic}"`)
      console.log(`   Current: ${trend.currentWeekCount} | Previous: ${trend.previousWeekCount}`)
      console.log(`   Growth: ${trend.trendPercentage > 0 ? '+' : ''}${trend.trendPercentage}%`)
    })
  }

  // Update database with trend data
  console.log('\n' + '='.repeat(80))
  console.log('💾 Updating database with trend data...')
  console.log('='.repeat(80))

  const updates = detector.generatePostUpdates(analysis)
  let updateCount = 0
  let errorCount = 0

  for (const [postId, data] of updates) {
    const { error: updateError } = await supabase
      .from('reddit_posts')
      .update({
        weekly_frequency: data.weekly_frequency,
        trend_direction: data.trend_direction,
        trend_percentage: data.trend_percentage,
        is_emerging: data.is_emerging
      })
      .eq('reddit_id', postId)

    if (updateError) {
      console.error(`Failed to update ${postId}:`, updateError.message)
      errorCount++
    } else {
      updateCount++
    }
  }

  console.log(`\n✅ Updated ${updateCount} posts`)
  if (errorCount > 0) {
    console.log(`❌ Failed to update ${errorCount} posts`)
  }

  // Display statistics
  console.log('\n' + '='.repeat(80))
  console.log('📊 TREND STATISTICS')
  console.log('='.repeat(80))
  console.log(`\nTotal topics identified: ${analysis.topics.size}`)
  console.log(`Emerging trends: ${analysis.emergingTrends.length}`)
  console.log(`Growing trends: ${analysis.growingTrends.length}`)
  console.log(`Stable trends: ${Array.from(analysis.topics.values()).filter(t => t.trendDirection === 'stable').length}`)
  console.log(`Declining trends: ${analysis.decliningTrends.length}`)

  console.log(`\n✅ Trend detection complete!\n`)
}

main().catch(console.error)
