// Database utility functions for Reddit Trend Engine
// Type-safe operations for posts, topics, and trend statistics

import { createClient } from '@/lib/supabase/server'
import type { 
  Database,
  RedditPost,
  RedditPostInsert,
  TrendingTopic,
  TrendingTopicInsert,
  TopicStats,
  TopicStatsInsert,
  TimeWindow,
  TrendContext
} from '@/types/supabase'

export class RedditTrendDatabase {
  private supabase

  constructor() {
    this.supabase = createClient()
  }

  // Posts operations
  async insertPost(post: RedditPostInsert): Promise<RedditPost | null> {
    try {
      const { data, error } = await this.supabase
        .from('posts')
        .insert(post)
        .select()
        .single()

      if (error) {
        console.error('Error inserting post:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Database error inserting post:', error)
      return null
    }
  }

  async getPostsBySubreddit(
    subreddit: string, 
    limit: number = 100,
    since?: Date
  ): Promise<RedditPost[]> {
    try {
      let query = this.supabase
        .from('posts')
        .select('*')
        .eq('subreddit', subreddit)
        .order('created_utc', { ascending: false })
        .limit(limit)

      if (since) {
        query = query.gte('created_utc', since.toISOString())
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching posts by subreddit:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Database error fetching posts:', error)
      return []
    }
  }

  async getPostsByIntentFlags(
    intentFlags: string[], 
    limit: number = 50
  ): Promise<RedditPost[]> {
    try {
      const { data, error } = await this.supabase
        .from('posts')
        .select('*')
        .contains('intent_flags', intentFlags)
        .order('created_utc', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching posts by intent flags:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Database error fetching posts by intent:', error)
      return []
    }
  }

  async checkPostExists(hash: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('posts')
        .select('id')
        .eq('hash', hash)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking post existence:', error)
        return false
      }

      return !!data
    } catch (error) {
      console.error('Database error checking post existence:', error)
      return false
    }
  }

  // Topics operations
  async createTopic(topic: TrendingTopicInsert): Promise<TrendingTopic | null> {
    try {
      const { data, error } = await this.supabase
        .from('topics')
        .insert(topic)
        .select()
        .single()

      if (error) {
        console.error('Error creating topic:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Database error creating topic:', error)
      return null
    }
  }

  async getTrendingTopics(
    timeWindow: TimeWindow,
    limit: number = 10
  ): Promise<Array<TrendingTopic & { stats: TopicStats }>> {
    try {
      const { data, error } = await this.supabase
        .from('topics')
        .select(`
          *,
          stats:topic_stats!inner(*)
        `)
        .eq('stats.time_window', timeWindow)
        .order('stats.final_score', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching trending topics:', error)
        return []
      }

      // Transform the data to match expected type
      return data?.map(item => ({
        ...item,
        stats: Array.isArray(item.stats) ? item.stats[0] : item.stats
      })) || []
    } catch (error) {
      console.error('Database error fetching trending topics:', error)
      return []
    }
  }

  async getTopicWithPosts(topicId: string): Promise<{
    topic: TrendingTopic
    posts: RedditPost[]
  } | null> {
    try {
      const { data: topic, error: topicError } = await this.supabase
        .from('topics')
        .select('*')
        .eq('id', topicId)
        .single()

      if (topicError) {
        console.error('Error fetching topic:', topicError)
        return null
      }

      const { data: topicPosts, error: postsError } = await this.supabase
        .from('topic_posts')
        .select(`
          posts (*)
        `)
        .eq('topic_id', topicId)
        .order('similarity', { ascending: false })

      if (postsError) {
        console.error('Error fetching topic posts:', postsError)
        return { topic, posts: [] }
      }

      const posts = topicPosts?.map(tp => tp.posts).flat().filter(Boolean) || []

      return { topic, posts }
    } catch (error) {
      console.error('Database error fetching topic with posts:', error)
      return null
    }
  }

  // Topic-Post relationships
  async linkPostToTopic(
    topicId: string, 
    postId: string, 
    similarity: number
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('topic_posts')
        .insert({
          topic_id: topicId,
          post_id: postId,
          similarity
        })

      if (error) {
        console.error('Error linking post to topic:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Database error linking post to topic:', error)
      return false
    }
  }

  // Topic Statistics operations
  async updateTopicStats(stats: TopicStatsInsert): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('topic_stats')
        .upsert(stats, {
          onConflict: 'topic_id,time_window'
        })

      if (error) {
        console.error('Error updating topic stats:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Database error updating topic stats:', error)
      return false
    }
  }

  async getTopicStats(
    topicId: string,
    timeWindow?: TimeWindow
  ): Promise<TopicStats[]> {
    try {
      let query = this.supabase
        .from('topic_stats')
        .select('*')
        .eq('topic_id', topicId)

      if (timeWindow) {
        query = query.eq('time_window', timeWindow)
      }

      const { data, error } = await query.order('updated_at', { ascending: false })

      if (error) {
        console.error('Error fetching topic stats:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Database error fetching topic stats:', error)
      return []
    }
  }

  // Trend context for AI integration
  async buildTrendContext(topicId: string, timeWindow: TimeWindow): Promise<TrendContext | null> {
    try {
      const { data: stats, error: statsError } = await this.supabase
        .from('topic_stats')
        .select('*')
        .eq('topic_id', topicId)
        .eq('time_window', timeWindow)
        .single()

      if (statsError) {
        console.error('Error fetching stats for trend context:', statsError)
        return null
      }

      const { data: topicPosts, error: postsError } = await this.supabase
        .from('topic_posts')
        .select(`
          posts (title, score, url)
        `)
        .eq('topic_id', topicId)
        .order('similarity', { ascending: false })
        .limit(5)

      if (postsError) {
        console.error('Error fetching posts for trend context:', postsError)
        return null
      }

      const { data: topic, error: topicError } = await this.supabase
        .from('topics')
        .select('keywords')
        .eq('id', topicId)
        .single()

      if (topicError) {
        console.error('Error fetching topic for trend context:', topicError)
        return null
      }

      return {
        velocity: stats.velocity,
        sentiment_avg: stats.sentiment_avg || 0,
        post_count: stats.post_count,
        sample_posts: topicPosts?.map(tp => tp.posts).filter(Boolean) || [],
        trending_keywords: topic.keywords || []
      }
    } catch (error) {
      console.error('Database error building trend context:', error)
      return null
    }
  }

  // Analytics and cleanup operations
  async getSubredditActivity(
    subreddits: string[],
    timeWindow: TimeWindow
  ): Promise<Array<{ subreddit: string; post_count: number; avg_sentiment: number }>> {
    try {
      const hoursMap = { '24h': 24, '7d': 168, '30d': 720 }
      const hours = hoursMap[timeWindow]
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

      const { data, error } = await this.supabase
        .from('posts')
        .select('subreddit, sentiment')
        .in('subreddit', subreddits)
        .gte('created_utc', since)

      if (error) {
        console.error('Error fetching subreddit activity:', error)
        return []
      }

      // Group by subreddit and calculate metrics
      const activity = data?.reduce((acc, post) => {
        if (!acc[post.subreddit]) {
          acc[post.subreddit] = { count: 0, sentiments: [] }
        }
        acc[post.subreddit].count++
        if (post.sentiment !== null) {
          acc[post.subreddit].sentiments.push(post.sentiment)
        }
        return acc
      }, {} as Record<string, { count: number; sentiments: number[] }>) || {}

      return Object.entries(activity).map(([subreddit, data]) => ({
        subreddit,
        post_count: data.count,
        avg_sentiment: data.sentiments.length > 0 
          ? data.sentiments.reduce((sum, s) => sum + s, 0) / data.sentiments.length 
          : 0
      }))
    } catch (error) {
      console.error('Database error fetching subreddit activity:', error)
      return []
    }
  }

  async cleanupOldPosts(daysOld: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString()

      const { data, error } = await this.supabase
        .from('posts')
        .delete()
        .lt('created_at', cutoffDate)
        .select('id')

      if (error) {
        console.error('Error cleaning up old posts:', error)
        return 0
      }

      return data?.length || 0
    } catch (error) {
      console.error('Database error cleaning up old posts:', error)
      return 0
    }
  }
}