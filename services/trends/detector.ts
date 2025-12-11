/**
 * Trend Detection Service
 *
 * Analyzes Reddit posts to identify:
 * - Emerging pain points (>50% growth with <10 mentions)
 * - Trending topics (week-over-week growth)
 * - Topic frequency and momentum
 *
 * Updates reddit_posts with:
 * - weekly_frequency: Number of mentions this week
 * - trend_direction: 'up', 'down', 'stable'
 * - trend_percentage: Week-over-week percentage change
 * - is_emerging: Boolean flag for emerging trends
 */

import type { RedditPost } from '@/types/supabase'

export interface TopicTrend {
  topic: string
  currentWeekCount: number
  previousWeekCount: number
  trendDirection: 'up' | 'down' | 'stable'
  trendPercentage: number
  isEmerging: boolean
  posts: string[] // reddit_ids
}

export interface TrendAnalysis {
  topics: Map<string, TopicTrend>
  emergingTrends: TopicTrend[]
  growingTrends: TopicTrend[]
  decliningTrends: TopicTrend[]
  timestamp: string
}

export class TrendDetector {
  // Keywords to extract topics from posts
  private readonly BUSINESS_KEYWORDS = [
    // Problems
    'churn', 'retention', 'payment', 'billing', 'subscription',
    'customer acquisition', 'marketing', 'sales', 'conversion',
    'analytics', 'metrics', 'kpi', 'dashboard',
    'authentication', 'security', 'compliance', 'gdpr',
    'onboarding', 'user experience', 'ux', 'ui',
    'scaling', 'performance', 'infrastructure', 'database',
    'email', 'notification', 'messaging', 'communication',
    'integration', 'api', 'webhook', 'automation',
    'testing', 'deployment', 'ci/cd', 'devops',
    'pricing', 'monetization', 'revenue', 'mrr', 'arr',

    // Solutions/Tools
    'saas', 'platform', 'tool', 'software', 'app',
    'crm', 'erp', 'cms', 'ai', 'ml', 'chatbot',
    'stripe', 'paypal', 'payment processor',
    'aws', 'azure', 'cloud', 'hosting',
    'react', 'vue', 'angular', 'next.js',
    'postgres', 'mongodb', 'mysql', 'database',

    // Markets
    'b2b', 'b2c', 'enterprise', 'smb', 'startup',
    'ecommerce', 'fintech', 'healthtech', 'edtech',
    'marketplace', 'directory', 'aggregator'
  ]

  /**
   * Analyze trends across posts
   */
  async analyzeTrends(posts: RedditPost[]): Promise<TrendAnalysis> {
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    // Split posts by time period
    const currentWeekPosts = posts.filter(p =>
      new Date(p.created_utc) >= oneWeekAgo
    )
    const previousWeekPosts = posts.filter(p => {
      const date = new Date(p.created_utc)
      return date >= twoWeeksAgo && date < oneWeekAgo
    })

    // Extract topics from each period
    const currentTopics = this.extractTopics(currentWeekPosts)
    const previousTopics = this.extractTopics(previousWeekPosts)

    // Calculate trends
    const topics = new Map<string, TopicTrend>()

    // Process current week topics
    for (const [topic, data] of currentTopics) {
      const currentCount = data.count
      const previousCount = previousTopics.get(topic)?.count || 0

      const { direction, percentage } = this.calculateTrend(
        currentCount,
        previousCount
      )

      const isEmerging = this.isEmergingTrend(
        currentCount,
        previousCount,
        percentage
      )

      topics.set(topic, {
        topic,
        currentWeekCount: currentCount,
        previousWeekCount: previousCount,
        trendDirection: direction,
        trendPercentage: percentage,
        isEmerging,
        posts: data.postIds
      })
    }

    // Add previous week topics that disappeared
    for (const [topic, data] of previousTopics) {
      if (!topics.has(topic)) {
        topics.set(topic, {
          topic,
          currentWeekCount: 0,
          previousWeekCount: data.count,
          trendDirection: 'down',
          trendPercentage: -100,
          isEmerging: false,
          posts: []
        })
      }
    }

    // Categorize trends
    const emergingTrends: TopicTrend[] = []
    const growingTrends: TopicTrend[] = []
    const decliningTrends: TopicTrend[] = []

    for (const trend of topics.values()) {
      if (trend.isEmerging) {
        emergingTrends.push(trend)
      } else if (trend.trendDirection === 'up') {
        growingTrends.push(trend)
      } else if (trend.trendDirection === 'down') {
        decliningTrends.push(trend)
      }
    }

    // Sort by trend percentage
    emergingTrends.sort((a, b) => b.trendPercentage - a.trendPercentage)
    growingTrends.sort((a, b) => b.trendPercentage - a.trendPercentage)
    decliningTrends.sort((a, b) => a.trendPercentage - b.trendPercentage)

    return {
      topics,
      emergingTrends,
      growingTrends,
      decliningTrends,
      timestamp: now.toISOString()
    }
  }

  /**
   * Extract topics from posts
   */
  private extractTopics(posts: RedditPost[]): Map<string, { count: number; postIds: string[] }> {
    const topics = new Map<string, { count: number; postIds: string[] }>()

    for (const post of posts) {
      const text = `${post.title} ${post.content || ''}`.toLowerCase()

      // Find matching keywords
      for (const keyword of this.BUSINESS_KEYWORDS) {
        if (text.includes(keyword.toLowerCase())) {
          const existing = topics.get(keyword) || { count: 0, postIds: [] }
          topics.set(keyword, {
            count: existing.count + 1,
            postIds: [...existing.postIds, post.reddit_id]
          })
        }
      }
    }

    return topics
  }

  /**
   * Calculate trend direction and percentage
   */
  private calculateTrend(
    current: number,
    previous: number
  ): { direction: 'up' | 'down' | 'stable'; percentage: number } {
    if (previous === 0) {
      return {
        direction: current > 0 ? 'up' : 'stable',
        percentage: current > 0 ? 100 : 0
      }
    }

    const change = current - previous
    let percentage = (change / previous) * 100

    // Cap at ±999.99 to fit DECIMAL(5,2) database constraint
    percentage = Math.max(-999.99, Math.min(999.99, percentage))

    let direction: 'up' | 'down' | 'stable'
    if (Math.abs(percentage) < 10) {
      direction = 'stable'
    } else if (percentage > 0) {
      direction = 'up'
    } else {
      direction = 'down'
    }

    return { direction, percentage: Number(percentage.toFixed(2)) }
  }

  /**
   * Determine if trend is emerging
   * Criteria: >50% growth with <10 mentions (new pain point)
   */
  private isEmergingTrend(
    current: number,
    previous: number,
    percentage: number
  ): boolean {
    return percentage > 50 && current < 10 && current > 0
  }

  /**
   * Get top N trends by criteria
   */
  getTopTrends(
    analysis: TrendAnalysis,
    type: 'emerging' | 'growing' | 'declining',
    limit: number = 10
  ): TopicTrend[] {
    switch (type) {
      case 'emerging':
        return analysis.emergingTrends.slice(0, limit)
      case 'growing':
        return analysis.growingTrends.slice(0, limit)
      case 'declining':
        return analysis.decliningTrends.slice(0, limit)
    }
  }

  /**
   * Generate human-readable summary
   */
  generateSummary(analysis: TrendAnalysis): string {
    const lines: string[] = []

    lines.push(`Trend Analysis - ${new Date(analysis.timestamp).toLocaleDateString()}`)
    lines.push('')
    lines.push(`Total Topics: ${analysis.topics.size}`)
    lines.push(`Emerging Trends: ${analysis.emergingTrends.length}`)
    lines.push(`Growing Trends: ${analysis.growingTrends.length}`)
    lines.push(`Declining Trends: ${analysis.decliningTrends.length}`)
    lines.push('')

    if (analysis.emergingTrends.length > 0) {
      lines.push('🔥 TOP EMERGING TRENDS:')
      analysis.emergingTrends.slice(0, 5).forEach((trend, i) => {
        lines.push(`${i + 1}. ${trend.topic} - ${trend.currentWeekCount} mentions (${trend.trendPercentage > 0 ? '+' : ''}${trend.trendPercentage}%)`)
      })
      lines.push('')
    }

    if (analysis.growingTrends.length > 0) {
      lines.push('📈 TOP GROWING TRENDS:')
      analysis.growingTrends.slice(0, 5).forEach((trend, i) => {
        lines.push(`${i + 1}. ${trend.topic} - ${trend.currentWeekCount} mentions (${trend.trendPercentage > 0 ? '+' : ''}${trend.trendPercentage}%)`)
      })
      lines.push('')
    }

    return lines.join('\n')
  }

  /**
   * Update post records with trend data
   * Returns updates to apply to database
   */
  generatePostUpdates(analysis: TrendAnalysis): Map<string, {
    weekly_frequency: number
    trend_direction: 'up' | 'down' | 'stable'
    trend_percentage: number
    is_emerging: boolean
  }> {
    const updates = new Map()

    for (const trend of analysis.topics.values()) {
      for (const postId of trend.posts) {
        updates.set(postId, {
          weekly_frequency: trend.currentWeekCount,
          trend_direction: trend.trendDirection,
          trend_percentage: trend.trendPercentage,
          is_emerging: trend.isEmerging
        })
      }
    }

    return updates
  }
}

/**
 * Standalone function for quick trend analysis
 */
export async function detectTrends(posts: RedditPost[]): Promise<TrendAnalysis> {
  const detector = new TrendDetector()
  return detector.analyzeTrends(posts)
}
