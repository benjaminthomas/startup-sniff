/**
 * Production Reddit Integration Service
 * Replaces mock data with real Reddit Trend Engine
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import Redis from 'ioredis'

import type { Database } from '@/types/supabase'
import { createRedditEngine, RedditEngineConfig, RedditTrendEngine } from '@/lib/reddit'
import { log } from '@/lib/logger'

export interface RedditPost {
  id: string
  title: string
  content: string
  subreddit: string
  score: number
  num_comments: number
  created_at: string
  url: string
}

export interface RedditTrendAnalysis {
  subreddit: string
  trending_topics: string[]
  sentiment_score: number
  engagement_metrics: {
    avg_score: number
    avg_comments: number
    total_posts: number
  }
  opportunity_score: number
  top_posts: RedditPost[]
}

export interface TrendsSummary {
  totalTopics: number
  activeCommunities: number
  weeklyGrowth: string
  topOpportunities: Array<{
    subreddit: string
    opportunityScore: number
    trendingTopics: string[]
    topPost: Record<string, unknown> | null
  }>
  fullAnalysis?: RedditTrendAnalysis[]
}

class RedditIntegrationService {
  private engine?: RedditTrendEngine
  private supabase: SupabaseClient<Database>
  private redis?: Redis
  private initialized = false

  constructor() {
    // Initialize Supabase client
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  private async initialize() {
    if (this.initialized) return

    try {
      // Initialize Redis connection
      if (process.env.REDIS_URL) {
        this.redis = new Redis(process.env.REDIS_URL)
        log.info('✅ Redis connected for Reddit integration')
      } else {
        throw new Error('Redis URL is required for production. Please configure REDIS_URL environment variable.')
      }

      // Configure Reddit Trend Engine
      const config: Partial<RedditEngineConfig> = {
        reddit: {
          userAgent: process.env.REDDIT_USER_AGENT || 'StartupSniff/1.0',
          clientId: process.env.REDDIT_CLIENT_ID || '',
          clientSecret: process.env.REDDIT_CLIENT_SECRET || '',
          refreshToken: process.env.REDDIT_REFRESH_TOKEN || ''
        },
        supabase: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
          key: process.env.SUPABASE_SERVICE_ROLE_KEY!
        },
        openai: {
          apiKey: process.env.OPENAI_API_KEY || ''
        }
      }

      // Only initialize if we have Reddit credentials
      if (config.reddit?.clientId && config.reddit?.clientSecret) {
        this.engine = createRedditEngine(config as RedditEngineConfig, {
          redis: this.redis!,
          enableScheduling: false, // Disable for now
          enableMonitoring: false, // Disable monitoring to avoid Redis rate limit checks
          enableFallbacks: true
        })
        log.info('✅ Reddit Trend Engine initialized (development mode)')
      } else {
        log.warn('⚠️  Reddit API credentials not configured, using fallback mode')
      }

      this.initialized = true
    } catch (error) {
      log.error('❌ Failed to initialize Reddit integration:', error)
      this.initialized = true // Prevent infinite retries
    }
  }


  /**
   * Collect fresh Reddit data from configured subreddits
   */
  async collectFreshData(subreddits?: string[]): Promise<{ success: boolean; message: string }> {
    await this.initialize()

    if (!this.engine) {
      return {
        success: false,
        message: 'Reddit API not configured. Please check your environment variables.'
      }
    }

    try {
      const targetSubreddits = subreddits || [
        'entrepreneur', 'startups', 'SaaS', 'technology',
        'business', 'digitalnomad', 'indiehackers', 'webdev'
      ]

      log.info(`🔄 Collecting Reddit data from ${targetSubreddits.length} subreddits...`)

      const result = await this.engine!.collectPosts(targetSubreddits, {
        limit: 25,
        processWithAI: !!process.env.OPENAI_API_KEY,
        priority: 'medium'
      })

      if ((result as Record<string, unknown>).success) {
        log.info(`✅ Successfully collected ${(result as Record<string, unknown>).inserted} Reddit posts`)
        return {
          success: true,
          message: `Collected ${(result as Record<string, unknown>).inserted} posts from ${targetSubreddits.length} subreddits`
        }
      } else {
        log.error('❌ Reddit collection failed:', (result as Record<string, unknown>).errors)
        return {
          success: false,
          message: 'Failed to collect Reddit data. Check logs for details.'
        }
      }
    } catch (error) {
      log.error('❌ Reddit data collection error:', error)
      return {
        success: false,
        message: 'Reddit data collection encountered an error'
      }
    }
  }

  /**
   * Get stored Reddit posts from database
   */
  async getStoredPosts(subreddit?: string, limit = 100): Promise<RedditPost[]> {
    try {
      let query = this.supabase
        .from('reddit_posts')
        .select('*')
        .order('created_utc', { ascending: false })
        .limit(limit)

      if (subreddit) {
        query = query.eq('subreddit', subreddit)
      }

      const { data, error } = await query

      if (error) {
        log.error('Error fetching Reddit posts:', error)
        return []
      }

      return data?.map(post => ({
        id: post.reddit_id,
        title: post.title,
        content: post.content || '',
        subreddit: post.subreddit,
        score: post.score || 0,
        num_comments: post.comments || 0,
        created_at: post.created_utc,
        url: post.url || `https://reddit.com/r/${post.subreddit}/comments/${post.reddit_id}`
      })) || []
    } catch (error) {
      log.error('Error accessing Reddit posts:', error)
      return []
    }
  }

  /**
   * Analyze trends from stored Reddit data
   */
  async analyzeTrends(forceRefresh = false): Promise<RedditTrendAnalysis[]> {
    await this.initialize()

    // If we have fresh data in database, use it
    const recentPosts = await this.getRecentPostsFromDB()

    if (recentPosts.length === 0 || forceRefresh) {
      // Try to collect fresh data first
      await this.collectFreshData()

      // Get updated posts after collection
      const updatedPosts = await this.getRecentPostsFromDB()
      if (updatedPosts.length > 0) {
        return this.generateTrendAnalysis(updatedPosts)
      } else {
        // No fallback data in production - return empty analysis
        log.warn('⚠️  No Reddit data available')
        return []
      }
    }

    return this.generateTrendAnalysis(recentPosts)
  }

  private async getRecentPostsFromDB() {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

      const { data, error } = await this.supabase
        .from('reddit_posts')
        .select('*')
        .gte('created_utc', oneDayAgo.toISOString())
        .order('score', { ascending: false })
        .limit(200) // Get top 200 posts from last 24 hours

      if (error) {
        log.error('Error fetching recent posts:', error)
        return []
      }

      return data || []
    } catch (error) {
      log.error('Database query error:', error)
      return []
    }
  }

  private generateTrendAnalysis(posts: Record<string, unknown>[]): RedditTrendAnalysis[] {
    // Group posts by subreddit
    const postsBySubreddit = posts.reduce((acc, post) => {
      const subreddit = post.subreddit as string
      if (!acc[subreddit]) {
        acc[subreddit] = []
      }
      (acc[subreddit] as Record<string, unknown>[]).push(post)
      return acc
    }, {} as Record<string, Record<string, unknown>[]>)

    const analyses: RedditTrendAnalysis[] = []

    for (const [subreddit, subredditPosts] of Object.entries(postsBySubreddit)) {
      const analysis = this.analyzeSubreddit(subreddit, subredditPosts as Record<string, unknown>[])
      analyses.push(analysis)
    }

    // Sort by opportunity score
    return analyses.sort((a, b) => b.opportunity_score - a.opportunity_score)
  }

  private analyzeSubreddit(subreddit: string, posts: Record<string, unknown>[]): RedditTrendAnalysis {
    // Extract trending topics from intent flags and titles
    const topicCounts = new Map<string, number>()

    posts.forEach(post => {
      // Count intent flags
      const intentFlags = post.intent_flags as string[] | null
      if (intentFlags) {
        intentFlags.forEach((flag: string) => {
          topicCounts.set(flag, (topicCounts.get(flag) || 0) + 1)
        })
      }

      // Extract keywords from title
      const keywords = this.extractKeywords(post.title as string)
      keywords.forEach(keyword => {
        topicCounts.set(keyword, (topicCounts.get(keyword) || 0) + 1)
      })
    })

    const trending_topics = Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic)

    // Calculate metrics
    const totalScore = posts.reduce((sum, post) => sum + ((post.score as number) || 0), 0)
    const totalComments = posts.reduce((sum, post) => sum + ((post.comments as number) || 0), 0)

    const engagement_metrics = {
      avg_score: Math.round(totalScore / posts.length),
      avg_comments: Math.round(totalComments / posts.length),
      total_posts: posts.length
    }

    // Calculate sentiment from stored data or estimate
    const avgSentiment = posts
      .filter(post => post.sentiment !== null)
      .reduce((sum, post) => sum + ((post.sentiment as number) || 0), 0) / posts.length || 0

    const sentiment_score = Math.round(((avgSentiment + 1) / 2) * 100) // Convert -1,1 to 0-100

    // Calculate opportunity score
    const opportunity_score = this.calculateOpportunityScore(posts, trending_topics)

    // Get top posts
    const top_posts = posts
      .sort((a, b) => ((b.score as number) || 0) - ((a.score as number) || 0))
      .slice(0, 3)
      .map(post => ({
        id: post.reddit_id as string,
        title: post.title as string,
        content: (post.content as string) || '',
        subreddit: post.subreddit as string,
        score: (post.score as number) || 0,
        num_comments: (post.comments as number) || 0,
        created_at: post.created_utc as string,
        url: (post.url as string) || `https://reddit.com/r/${post.subreddit}/comments/${post.reddit_id}`
      }))

    return {
      subreddit,
      trending_topics,
      sentiment_score,
      engagement_metrics,
      opportunity_score,
      top_posts
    }
  }

  private extractKeywords(text: string): string[] {
    const commonKeywords = [
      'AI', 'SaaS', 'MVP', 'funding', 'growth', 'startup', 'business',
      'revenue', 'customers', 'marketing', 'sales', 'automation',
      'productivity', 'remote', 'freelance', 'entrepreneur'
    ]

    return commonKeywords.filter(keyword =>
      text.toLowerCase().includes(keyword.toLowerCase())
    )
  }

  private calculateOpportunityScore(posts: Record<string, unknown>[], topics: string[]): number {
    const avgEngagement = posts.reduce((sum, post) =>
      sum + ((post.score as number) || 0) + ((post.comments as number) || 0), 0) / posts.length

    const recentPostsCount = posts.filter(post => {
      const postDate = new Date(post.created_utc as string)
      const hoursDiff = (Date.now() - postDate.getTime()) / (1000 * 60 * 60)
      return hoursDiff <= 24 // Posts from last 24 hours
    }).length

    const engagementScore = Math.min(avgEngagement / 10, 40)
    const topicScore = Math.min(topics.length * 10, 30)
    const freshnessScore = Math.min(recentPostsCount * 2, 30)

    return Math.round(engagementScore + topicScore + freshnessScore)
  }


  /**
   * Get trends summary for the dashboard
   */
  async getTrendsSummary(forceRefresh = false): Promise<TrendsSummary> {
    const analyses = await this.analyzeTrends(forceRefresh)

    const totalTopics = analyses.reduce((sum, analysis) =>
      sum + analysis.trending_topics.length, 0)

    const activeCommunities = analyses.length

    const avgOpportunityScore = analyses.length > 0
      ? analyses.reduce((sum, analysis) => sum + analysis.opportunity_score, 0) / analyses.length
      : 0

    const weeklyGrowth = `+${Math.round(avgOpportunityScore)}%`

    const topOpportunities = analyses
      .slice(0, 3)
      .map(analysis => ({
        subreddit: analysis.subreddit,
        opportunityScore: analysis.opportunity_score,
        trendingTopics: analysis.trending_topics,
        topPost: (analysis.top_posts[0] as unknown as Record<string, unknown>) || null
      }))

    return {
      totalTopics,
      activeCommunities,
      weeklyGrowth,
      topOpportunities,
      fullAnalysis: analyses
    }
  }

  /**
   * Get system health status
   */
  async getHealthStatus() {
    await this.initialize()

    const health = {
      database: false,
      reddit_api: false,
      redis: false,
      recent_data: false
    }

    try {
      // Test database connection
      const { error } = await this.supabase.from('reddit_posts').select('id').limit(1)
      health.database = !error

      // Test Reddit API if configured
      if (this.engine) {
        const engineHealth = await ((this.engine as unknown as Record<string, unknown>).getHealthStatus as () => Promise<Record<string, unknown>>)()
        health.reddit_api = (engineHealth as Record<string, unknown>).status !== 'unhealthy'
      }

      // Test Redis if available
      if (this.redis) {
        await this.redis.ping()
        health.redis = true
      }

      // Check for recent data
      const recentPosts = await this.getRecentPostsFromDB()
      health.recent_data = recentPosts.length > 0

    } catch (error) {
      log.error('Health check error:', error)
    }

    return health
  }
}

// Export singleton instance
export const redditIntegrationService = new RedditIntegrationService()

