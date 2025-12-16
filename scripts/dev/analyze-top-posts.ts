/**
 * Analyze Top Scored Posts
 *
 * Review the top 10 scored posts to validate scoring algorithm
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../types/supabase'

async function main() {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  console.log('🔍 Analyzing Top 10 Scored Posts\n')
  console.log('='.repeat(80))

  // Fetch top 10 posts
  const { data: topPosts, error } = await supabase
    .from('reddit_posts')
    .select('*')
    .not('viability_score', 'is', null)
    .order('viability_score', { ascending: false })
    .limit(10)

  const typedTopPosts = (topPosts || []) as Array<{
    created_utc: string;
    viability_score: number;
    title: string;
    subreddit: string;
    score: number | null;
    comments: number | null;
    url: string | null;
    content: string | null;
  }>;

  if (error || typedTopPosts.length === 0) {
    console.error('Error fetching posts:', error)
    return
  }

  console.log(`\n📊 Found ${typedTopPosts.length} top posts\n`)

  typedTopPosts.forEach((post, index) => {
    const ageHours = (Date.now() - new Date(post.created_utc).getTime()) / (1000 * 60 * 60)
    const ageDays = Math.floor(ageHours / 24)

    console.log(`\n${'='.repeat(80)}`)
    console.log(`#${index + 1} - Score: ${post.viability_score}/10`)
    console.log('='.repeat(80))
    console.log(`Title: ${post.title}`)
    console.log(`Subreddit: r/${post.subreddit}`)
    console.log(`Engagement: ${post.score ?? 0} upvotes | ${post.comments ?? 0} comments`)
    console.log(`Age: ${ageDays} days old`)
    console.log(`URL: ${post.url || 'N/A'}`)

    if (post.content) {
      console.log(`\nContent Preview:`)
      console.log(post.content.substring(0, 300).replace(/\n/g, ' '))
      if (post.content.length > 300) console.log('...')
    } else {
      console.log('\nContent: None (link post)')
    }
  })

  console.log('\n\n' + '='.repeat(80))
  console.log('📈 ANALYSIS SUMMARY')
  console.log('='.repeat(80))

  // Engagement analysis
  const avgUpvotes = typedTopPosts.reduce((sum, p) => sum + (p.score ?? 0), 0) / typedTopPosts.length
  const avgComments = typedTopPosts.reduce((sum, p) => sum + (p.comments ?? 0), 0) / typedTopPosts.length
  const avgScore = typedTopPosts.reduce((sum, p) => sum + (p.viability_score || 0), 0) / typedTopPosts.length

  console.log(`\nAverage Viability Score: ${avgScore.toFixed(2)}/10`)
  console.log(`Average Upvotes: ${Math.round(avgUpvotes)}`)
  console.log(`Average Comments: ${Math.round(avgComments)}`)

  // Content analysis
  const withContent = typedTopPosts.filter(p => p.content && p.content.length > 0).length
  const linkPosts = typedTopPosts.filter(p => !p.content || p.content.length === 0).length

  console.log(`\nContent Distribution:`)
  console.log(`  Text posts: ${withContent}`)
  console.log(`  Link posts: ${linkPosts}`)

  // Subreddit distribution
  const subreddits = typedTopPosts.reduce((acc, p) => {
    acc[p.subreddit] = (acc[p.subreddit] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  console.log(`\nSubreddit Distribution:`)
  Object.entries(subreddits)
    .sort((a, b) => b[1] - a[1])
    .forEach(([subreddit, count]) => {
      console.log(`  r/${subreddit}: ${count} posts`)
    })

  console.log('\n✅ Analysis complete!\n')
}

main().catch(console.error)
