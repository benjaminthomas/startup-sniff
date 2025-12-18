/**
 * Opportunity Scoring Service
 *
 * Analyzes Reddit posts to identify high-potential startup opportunities
 * Uses rule-based heuristics for fast, cost-effective scoring
 *
 * Scoring Components:
 * - Business Viability (35%): Quality of problem/solution described
 * - Market Validation (30%): Evidence of market interest
 * - Action Potential (20%): How actionable the opportunity is
 * - Discovery Timing (15%): Freshness and trend momentum
 *
 * Final Score: Weighted average (viability_score 0-10)
 */

import type { RedditPost } from '@/types/supabase'

export interface OpportunityScore {
  business_viability: number      // 0-10
  market_validation: number        // 0-10
  action_potential: number         // 0-10
  discovery_timing: number         // 0-10
  viability_score: number          // 0-10 (weighted average)
  confidence: number               // 0-100 (how confident are we in this score?)
  explanation: {
    business: string
    market: string
    action: string
    discovery: string
  }
}

export interface ScoringConfig {
  weights: {
    business: number
    market: number
    action: number
    discovery: number
  }
  thresholds: {
    minScore: number        // Minimum upvotes to consider
    minComments: number     // Minimum comments to consider
    maxPostAgeHours: number // Maximum age for "fresh" content
  }
}

// Default scoring configuration
const DEFAULT_CONFIG: ScoringConfig = {
  weights: {
    business: 0.35,  // 35% - Most important (quality of opportunity)
    market: 0.30,    // 30% - Market interest
    action: 0.20,    // 20% - Actionability
    discovery: 0.15  // 15% - Timing
  },
  thresholds: {
    minScore: 5,
    minComments: 2,
    maxPostAgeHours: 168 // 7 days
  }
}

export class OpportunityScorer {
  private config: ScoringConfig

  constructor(config?: Partial<ScoringConfig>) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      weights: { ...DEFAULT_CONFIG.weights, ...config?.weights },
      thresholds: { ...DEFAULT_CONFIG.thresholds, ...config?.thresholds }
    }
  }

  /**
   * Calculate opportunity score for a Reddit post
   */
  async scorePost(post: RedditPost): Promise<OpportunityScore> {
    const business = this.calculateBusinessViability(post)
    const market = this.calculateMarketValidation(post)
    const action = this.calculateActionPotential(post)
    const discovery = this.calculateDiscoveryTiming(post)

    // Calculate weighted average
    const viability_score =
      business * this.config.weights.business +
      market * this.config.weights.market +
      action * this.config.weights.action +
      discovery * this.config.weights.discovery

    // Calculate confidence based on data quality
    const confidence = this.calculateConfidence(post)

    return {
      business_viability: Number(business.toFixed(2)),
      market_validation: Number(market.toFixed(2)),
      action_potential: Number(action.toFixed(2)),
      discovery_timing: Number(discovery.toFixed(2)),
      viability_score: Number(viability_score.toFixed(2)),
      confidence: Math.round(confidence),
      explanation: {
        business: this.explainBusinessScore(post, business),
        market: this.explainMarketScore(post, market),
        action: this.explainActionScore(post, action),
        discovery: this.explainDiscoveryScore(post, discovery)
      }
    }
  }

  /**
   * Business Viability Score (0-10)
   * Measures: Problem clarity, solution quality, business potential
   */
  private calculateBusinessViability(post: RedditPost): number {
    let score = 0
    const title = post.title.toLowerCase()
    const content = (post.content || '').toLowerCase()
    const fullText = `${title} ${content}`

    // 1. Problem/Pain Point Indicators (0-3 points)
    const problemKeywords = [
      'problem', 'pain point', 'struggle', 'challenge', 'difficult',
      'frustrating', 'waste', 'inefficient', 'need', 'wish'
    ]
    const problemScore = this.countKeywordMatches(fullText, problemKeywords)
    score += Math.min(problemScore * 0.5, 3)

    // 2. Solution/Business Model Indicators (0-3 points)
    const solutionKeywords = [
      'solution', 'built', 'created', 'product', 'service', 'platform',
      'tool', 'app', 'saas', 'business', 'startup', 'launch'
    ]
    const solutionScore = this.countKeywordMatches(fullText, solutionKeywords)
    score += Math.min(solutionScore * 0.5, 3)

    // 3. Market/Customer Indicators (0-2 points)
    const marketKeywords = [
      'customer', 'user', 'client', 'market', 'demand', 'paying',
      'revenue', 'profit', 'mrr', 'arr', 'subscriber'
    ]
    const marketScore = this.countKeywordMatches(fullText, marketKeywords)
    score += Math.min(marketScore * 0.4, 2)

    // 4. Content Quality (0-2 points)
    const wordCount = fullText.split(/\s+/).length
    if (wordCount > 200) score += 2      // Detailed post
    else if (wordCount > 100) score += 1 // Medium detail
    else if (wordCount > 50) score += 0.5 // Some detail

    return Math.min(score, 10)
  }

  /**
   * Market Validation Score (0-10)
   * Measures: Community engagement, upvotes, comment quality
   */
  private calculateMarketValidation(post: RedditPost): number {
    let score = 0

    // 1. Upvote Score (0-4 points) - Logarithmic scale
    const upvoteScore = Math.log10(Math.max(post.score ?? 0, 1))
    score += Math.min(upvoteScore * 2, 4)

    // 2. Comment Score (0-3 points) - More comments = more interest
    const commentScore = Math.log10(Math.max(post.comments ?? 0, 1))
    score += Math.min(commentScore * 1.5, 3)

    // 3. Engagement Rate (0-3 points) - Comments per upvote ratio
    const engagementRate = (post.comments ?? 0) / Math.max(post.score ?? 0, 1)
    if (engagementRate > 0.5) score += 3       // Very high engagement
    else if (engagementRate > 0.3) score += 2  // High engagement
    else if (engagementRate > 0.1) score += 1  // Medium engagement

    return Math.min(score, 10)
  }

  /**
   * Action Potential Score (0-10)
   * Measures: Clarity, specificity, actionability
   */
  private calculateActionPotential(post: RedditPost): number {
    let score = 0
    const title = post.title.toLowerCase()
    const content = (post.content || '').toLowerCase()
    const fullText = `${title} ${content}`

    // 1. Action Keywords (0-3 points)
    const actionKeywords = [
      'how to', 'looking for', 'need', 'want', 'seeking',
      'advice', 'recommend', 'suggest', 'help', 'feedback'
    ]
    const actionScore = this.countKeywordMatches(fullText, actionKeywords)
    score += Math.min(actionScore * 0.8, 3)

    // 2. Specificity (0-3 points)
    const specificKeywords = [
      'specific', 'exactly', 'particular', 'precisely',
      '$', 'cost', 'price', 'budget', 'timeline'
    ]
    const specificScore = this.countKeywordMatches(fullText, specificKeywords)
    score += Math.min(specificScore * 0.8, 3)

    // 3. Call-to-Action Indicators (0-2 points)
    if (fullText.includes('?')) score += 1       // Question = seeking input
    if (post.url) score += 1                     // Link = actionable resource

    // 4. Author Engagement (0-2 points) - Proxy: post length
    const wordCount = fullText.split(/\s+/).length
    if (wordCount > 150) score += 2
    else if (wordCount > 75) score += 1

    return Math.min(score, 10)
  }

  /**
   * Discovery Timing Score (0-10)
   * Measures: Freshness, trend momentum
   */
  private calculateDiscoveryTiming(post: RedditPost): number {
    let score = 0

    // 1. Freshness Score (0-5 points) - How recent is the post?
    const postDate = new Date(post.created_utc)
    const ageHours = (Date.now() - postDate.getTime()) / (1000 * 60 * 60)

    if (ageHours < 24) score += 5          // Less than 1 day
    else if (ageHours < 72) score += 4     // 1-3 days
    else if (ageHours < 168) score += 3    // 3-7 days
    else if (ageHours < 336) score += 2    // 1-2 weeks
    else if (ageHours < 720) score += 1    // 2-4 weeks

    // 2. Velocity Score (0-5 points) - Engagement per hour
    const engagementVelocity = ((post.score ?? 0) + (post.comments ?? 0) * 2) / Math.max(ageHours, 1)

    if (engagementVelocity > 10) score += 5       // Very hot
    else if (engagementVelocity > 5) score += 4   // Hot
    else if (engagementVelocity > 2) score += 3   // Warm
    else if (engagementVelocity > 1) score += 2   // Moderate
    else if (engagementVelocity > 0.5) score += 1 // Slow burn

    return Math.min(score, 10)
  }

  /**
   * Calculate confidence score (0-100)
   * Based on data quality and completeness
   */
  private calculateConfidence(post: RedditPost): number {
    let confidence = 0

    // Has content (not just title) - 30 points
    if (post.content && post.content.length > 100) confidence += 30
    else if (post.content && post.content.length > 50) confidence += 20
    else if (post.content && post.content.length > 0) confidence += 10

    // Has significant engagement - 40 points
    if ((post.score ?? 0) > 50) confidence += 20
    if ((post.comments ?? 0) > 10) confidence += 20
    else if ((post.comments ?? 0) > 5) confidence += 10

    // Recent post (better data) - 15 points
    const postDate = new Date(post.created_utc)
    const ageHours = (Date.now() - postDate.getTime()) / (1000 * 60 * 60)
    if (ageHours < 168) confidence += 15 // Within a week
    else if (ageHours < 336) confidence += 10 // Within 2 weeks
    else if (ageHours < 720) confidence += 5 // Within a month

    // Has URL (additional context) - 15 points
    if (post.url) confidence += 15

    return Math.min(confidence, 100)
  }

  /**
   * Count keyword matches in text
   */
  private countKeywordMatches(text: string, keywords: string[]): number {
    return keywords.reduce((count, keyword) => {
      return count + (text.includes(keyword) ? 1 : 0)
    }, 0)
  }

  /**
   * Generate human-readable explanation for Business score
   */
  private explainBusinessScore(post: RedditPost, score: number): string {
    if (score >= 8) return 'Strong business potential with clear problem and solution'
    if (score >= 6) return 'Good business opportunity with market relevance'
    if (score >= 4) return 'Moderate business potential, needs validation'
    if (score >= 2) return 'Limited business indicators, exploratory stage'
    return 'Minimal business viability indicators'
  }

  /**
   * Generate human-readable explanation for Market score
   */
  private explainMarketScore(post: RedditPost, score: number): string {
    const upvotes = post.score ?? 0
    const comments = post.comments ?? 0
    if (score >= 8) return `High community engagement (${upvotes} upvotes, ${comments} comments)`
    if (score >= 6) return `Good market interest (${upvotes} upvotes, ${comments} comments)`
    if (score >= 4) return `Moderate engagement (${upvotes} upvotes, ${comments} comments)`
    if (score >= 2) return `Low engagement (${upvotes} upvotes, ${comments} comments)`
    return `Minimal community interest (${upvotes} upvotes, ${comments} comments)`
  }

  /**
   * Generate human-readable explanation for Action score
   */
  private explainActionScore(post: RedditPost, score: number): string {
    if (score >= 8) return 'Highly actionable with clear next steps'
    if (score >= 6) return 'Actionable opportunity with good specificity'
    if (score >= 4) return 'Somewhat actionable, needs more clarity'
    if (score >= 2) return 'Limited actionability, vague opportunity'
    return 'Low actionability, exploratory discussion'
  }

  /**
   * Generate human-readable explanation for Discovery score
   */
  private explainDiscoveryScore(post: RedditPost, score: number): string {
    const postDate = new Date(post.created_utc)
    const ageHours = (Date.now() - postDate.getTime()) / (1000 * 60 * 60)
    const ageDays = Math.floor(ageHours / 24)

    if (score >= 8) return `Very fresh and trending (${ageDays} days old)`
    if (score >= 6) return `Recent with good momentum (${ageDays} days old)`
    if (score >= 4) return `Moderately fresh (${ageDays} days old)`
    if (score >= 2) return `Older post with slower engagement (${ageDays} days old)`
    return `Stale content (${ageDays} days old)`
  }

  /**
   * Batch score multiple posts
   */
  async scorePosts(posts: RedditPost[]): Promise<Map<string, OpportunityScore>> {
    const scores = new Map<string, OpportunityScore>()

    for (const post of posts) {
      const score = await this.scorePost(post)
      scores.set(post.reddit_id, score)
    }

    return scores
  }

  /**
   * Get scoring statistics for a batch of posts
   */
  getStatistics(scores: OpportunityScore[]): {
    avgViability: number
    avgBusiness: number
    avgMarket: number
    avgAction: number
    avgDiscovery: number
    highScorers: number // Count of posts with score >= 7
    mediumScorers: number // Count of posts with score 4-7
    lowScorers: number // Count of posts with score < 4
  } {
    const total = scores.length

    const avgViability = scores.reduce((sum, s) => sum + s.viability_score, 0) / total
    const avgBusiness = scores.reduce((sum, s) => sum + s.business_viability, 0) / total
    const avgMarket = scores.reduce((sum, s) => sum + s.market_validation, 0) / total
    const avgAction = scores.reduce((sum, s) => sum + s.action_potential, 0) / total
    const avgDiscovery = scores.reduce((sum, s) => sum + s.discovery_timing, 0) / total

    const highScorers = scores.filter(s => s.viability_score >= 7).length
    const mediumScorers = scores.filter(s => s.viability_score >= 4 && s.viability_score < 7).length
    const lowScorers = scores.filter(s => s.viability_score < 4).length

    return {
      avgViability: Number(avgViability.toFixed(2)),
      avgBusiness: Number(avgBusiness.toFixed(2)),
      avgMarket: Number(avgMarket.toFixed(2)),
      avgAction: Number(avgAction.toFixed(2)),
      avgDiscovery: Number(avgDiscovery.toFixed(2)),
      highScorers,
      mediumScorers,
      lowScorers
    }
  }
}

/**
 * Standalone function for quick scoring
 */
export async function calculateOpportunityScore(post: RedditPost): Promise<OpportunityScore> {
  const scorer = new OpportunityScorer()
  return scorer.scorePost(post)
}
