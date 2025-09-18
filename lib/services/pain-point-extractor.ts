/**
 * Reddit Pain Point Extraction Service
 * Analyzes Reddit posts to identify startup opportunities
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export interface PainPoint {
  id: string
  title: string
  content: string
  subreddit: string
  reddit_url: string
  pain_indicators: string[]
  opportunity_score: number
  engagement_score: number
  sentiment_score: number
  extracted_problems: string[]
  market_size_indicator: 'small' | 'medium' | 'large'
  competition_level: 'low' | 'medium' | 'high'
  urgency_level: 'low' | 'medium' | 'high'
  created_at: string
}

export interface StartupIdea {
  title: string
  problem_statement: string
  solution_approach: string
  target_market: string[]
  market_opportunity: string
  confidence_score: number
  source_pain_points: string[]
  implementation_complexity: 'low' | 'medium' | 'high'
  revenue_potential: 'low' | 'medium' | 'high'
}

class PainPointExtractor {
  private supabase: any

  constructor() {
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  /**
   * Extract pain points from Reddit posts using pattern matching and sentiment analysis
   */
  async extractPainPointsFromPosts(timeframe: 'day' | 'week' | 'month' = 'day'): Promise<PainPoint[]> {
    const timeFilter = this.getTimeFilter(timeframe)

    try {
      // Get recent Reddit posts with high engagement that indicate pain points
      const { data: posts, error } = await this.supabase
        .from('reddit_posts')
        .select('*')
        .gte('created_utc', timeFilter)
        .or('score.gte.10,comments.gte.5') // High engagement threshold
        .order('score', { ascending: false })
        .limit(200)

      if (error) {
        console.error('Error fetching Reddit posts:', error)
        return []
      }

      const painPoints: PainPoint[] = []

      for (const post of posts || []) {
        const painPoint = this.analyzePainPoint(post)
        if (painPoint && painPoint.opportunity_score > 30) { // Filter for meaningful opportunities
          painPoints.push(painPoint)
        }
      }

      // Sort by opportunity score and return top opportunities
      return painPoints
        .sort((a, b) => b.opportunity_score - a.opportunity_score)
        .slice(0, 50)

    } catch (error) {
      console.error('Error extracting pain points:', error)
      return []
    }
  }

  /**
   * Analyze a single Reddit post for pain point indicators
   */
  private analyzePainPoint(post: any): PainPoint | null {
    const title = post.title?.toLowerCase() || ''
    const content = post.content?.toLowerCase() || ''
    const fullText = `${title} ${content}`

    // Pain point indicator patterns
    const painIndicators = this.identifyPainIndicators(fullText)

    if (painIndicators.length === 0) {
      return null // No pain indicators found
    }

    // Extract specific problems mentioned
    const extractedProblems = this.extractSpecificProblems(fullText)

    // Calculate various scores
    const engagementScore = this.calculateEngagementScore(post)
    const sentimentScore = post.sentiment || 0
    const opportunityScore = this.calculateOpportunityScore(post, painIndicators, engagementScore)

    return {
      id: post.reddit_id,
      title: post.title,
      content: post.content || '',
      subreddit: post.subreddit,
      reddit_url: post.url || `https://reddit.com/r/${post.subreddit}/comments/${post.reddit_id}`,
      pain_indicators: painIndicators,
      opportunity_score: opportunityScore,
      engagement_score: engagementScore,
      sentiment_score: sentimentScore,
      extracted_problems: extractedProblems,
      market_size_indicator: this.estimateMarketSize(post.subreddit, post.score),
      competition_level: this.estimateCompetitionLevel(fullText),
      urgency_level: this.estimateUrgencyLevel(painIndicators, fullText),
      created_at: post.created_utc
    }
  }

  /**
   * Identify pain point indicators in text
   */
  private identifyPainIndicators(text: string): string[] {
    const indicators: { pattern: RegExp; type: string }[] = [
      // Frustration patterns
      { pattern: /\b(frustrated|annoyed|irritated|hate|can't stand)\b/g, type: 'frustration' },

      // Problem statements
      { pattern: /\b(problem|issue|challenge|struggle|difficulty)\b/g, type: 'problem' },

      // Seeking solutions
      { pattern: /\b(need|want|looking for|searching for|help|solution)\b/g, type: 'help_seeking' },

      // Pain expressions
      { pattern: /\b(pain|headache|nightmare|terrible|awful|sucks)\b/g, type: 'pain_expression' },

      // Time wasters
      { pattern: /\b(waste.*time|time.{0,20}wasting|takes forever|slow|inefficient)\b/g, type: 'time_waste' },

      // Money problems
      { pattern: /\b(expensive|costly|can't afford|budget|cheap alternative)\b/g, type: 'cost_concern' },

      // Missing features
      { pattern: /\b(wish.*had|missing|lacks|doesn't have|would be nice)\b/g, type: 'missing_feature' },

      // Workflow issues
      { pattern: /\b(workflow|process.*broken|manual|repetitive|tedious)\b/g, type: 'workflow_issue' },

      // Integration problems
      { pattern: /\b(integrate|connect|sync|doesn't work with|compatibility)\b/g, type: 'integration_issue' },

      // User experience issues
      { pattern: /\b(confusing|complicated|hard to use|user.{0,10}unfriendly|clunky)\b/g, type: 'ux_issue' }
    ]

    const foundIndicators: string[] = []

    indicators.forEach(({ pattern, type }) => {
      if (pattern.test(text)) {
        foundIndicators.push(type)
      }
    })

    return [...new Set(foundIndicators)] // Remove duplicates
  }

  /**
   * Extract specific problems mentioned in the text
   */
  private extractSpecificProblems(text: string): string[] {
    const problemPatterns = [
      // Specific problem statements
      /the problem is (.{10,100})/g,
      /issue with (.{10,100})/g,
      /struggling with (.{10,100})/g,
      /can't find (.{10,100})/g,
      /need a way to (.{10,100})/g,
      /wish there was (.{10,100})/g,
      /looking for (.{10,100})/g,
    ]

    const problems: string[] = []

    problemPatterns.forEach(pattern => {
      const matches = text.match(pattern)
      if (matches) {
        matches.forEach(match => {
          const problem = match.replace(/^(the problem is|issue with|struggling with|can't find|need a way to|wish there was|looking for)\s*/i, '')
          if (problem.length > 10) {
            problems.push(problem.trim())
          }
        })
      }
    })

    return problems.slice(0, 5) // Limit to top 5 problems
  }

  /**
   * Calculate engagement score based on Reddit metrics
   */
  private calculateEngagementScore(post: any): number {
    const score = post.score || 0
    const comments = post.comments || 0

    // Weighted engagement score
    const engagementScore = (score * 0.7) + (comments * 0.3)

    // Normalize to 0-100 scale
    return Math.min(Math.round((engagementScore / 10) * 10), 100)
  }

  /**
   * Calculate overall opportunity score
   */
  private calculateOpportunityScore(post: any, painIndicators: string[], engagementScore: number): number {
    let score = 0

    // Base score from engagement
    score += engagementScore * 0.3

    // Pain indicator diversity bonus
    score += painIndicators.length * 5

    // High-value subreddit bonus
    const highValueSubreddits = ['entrepreneur', 'startups', 'saas', 'indiehackers', 'business']
    if (highValueSubreddits.includes(post.subreddit?.toLowerCase())) {
      score += 20
    }

    // Recent post bonus (fresher trends are more valuable)
    const postAge = Date.now() - new Date(post.created_utc).getTime()
    const daysSincePost = postAge / (1000 * 60 * 60 * 24)
    if (daysSincePost <= 1) score += 15
    else if (daysSincePost <= 3) score += 10
    else if (daysSincePost <= 7) score += 5

    // Specific high-value indicators
    const highValueIndicators = ['help_seeking', 'missing_feature', 'workflow_issue', 'cost_concern']
    const highValueCount = painIndicators.filter(indicator => highValueIndicators.includes(indicator)).length
    score += highValueCount * 8

    return Math.min(Math.round(score), 100)
  }

  /**
   * Estimate market size based on subreddit and engagement
   */
  private estimateMarketSize(subreddit: string, score: number): 'small' | 'medium' | 'large' {
    const largeMarketSubreddits = ['entrepreneur', 'business', 'technology', 'startups']
    const mediumMarketSubreddits = ['saas', 'webdev', 'digitalnomad']

    if (largeMarketSubreddits.includes(subreddit?.toLowerCase()) && score > 50) {
      return 'large'
    } else if (mediumMarketSubreddits.includes(subreddit?.toLowerCase()) || score > 20) {
      return 'medium'
    } else {
      return 'small'
    }
  }

  /**
   * Estimate competition level based on text content
   */
  private estimateCompetitionLevel(text: string): 'low' | 'medium' | 'high' {
    const highCompetitionKeywords = ['market leader', 'saturated', 'many options', 'competitors', 'established players']
    const lowCompetitionKeywords = ['no solution', 'gap in market', 'no one is doing', 'untapped', 'niche']

    const hasHighCompetition = highCompetitionKeywords.some(keyword => text.includes(keyword))
    const hasLowCompetition = lowCompetitionKeywords.some(keyword => text.includes(keyword))

    if (hasLowCompetition && !hasHighCompetition) return 'low'
    if (hasHighCompetition) return 'high'
    return 'medium'
  }

  /**
   * Estimate urgency level based on pain indicators and text
   */
  private estimateUrgencyLevel(painIndicators: string[], text: string): 'low' | 'medium' | 'high' {
    const urgentKeywords = ['urgent', 'asap', 'immediately', 'critical', 'emergency', 'deadline']
    const highUrgencyIndicators = ['pain_expression', 'frustration', 'time_waste']

    const hasUrgentKeywords = urgentKeywords.some(keyword => text.includes(keyword))
    const hasHighUrgencyIndicators = painIndicators.some(indicator => highUrgencyIndicators.includes(indicator))

    if (hasUrgentKeywords || hasHighUrgencyIndicators) return 'high'
    if (painIndicators.includes('problem') || painIndicators.includes('help_seeking')) return 'medium'
    return 'low'
  }

  /**
   * Get time filter for different timeframes
   */
  private getTimeFilter(timeframe: 'day' | 'week' | 'month'): string {
    const now = new Date()
    let filterDate: Date

    switch (timeframe) {
      case 'day':
        filterDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case 'week':
        filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        filterDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        filterDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }

    return filterDate.toISOString()
  }

  /**
   * Get trending pain points for the dashboard
   */
  async getTrendingPainPoints(limit = 20): Promise<PainPoint[]> {
    const painPoints = await this.extractPainPointsFromPosts('day')
    return painPoints.slice(0, limit)
  }

  /**
   * Get pain points by category
   */
  async getPainPointsByCategory(category: string): Promise<PainPoint[]> {
    const allPainPoints = await this.extractPainPointsFromPosts('week')
    return allPainPoints.filter(point =>
      point.pain_indicators.includes(category) ||
      point.subreddit.toLowerCase() === category.toLowerCase()
    )
  }
}

// Export singleton instance
export const painPointExtractor = new PainPointExtractor()

// Export types
export type { PainPoint, StartupIdea }