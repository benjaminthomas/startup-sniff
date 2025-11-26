/**
 * Opportunity Deep Analyzer - OpenAI Integration
 *
 * Uses GPT-4 to generate detailed viability explanations for high-potential posts
 * Only runs on posts with score ≥7.0 to minimize API costs
 *
 * Analysis includes:
 * - Problem clarity and depth
 * - Market size and validation
 * - Competitive landscape
 * - Implementation challenges
 * - Key insights and recommendations
 */

import OpenAI from 'openai'
import type { RedditPost } from '@/types/supabase'

export interface DeepAnalysis {
  viability_explanation: string
  problem_analysis: {
    clarity: 'high' | 'medium' | 'low'
    depth: string
    specificity: string
  }
  market_analysis: {
    size_estimate: 'large' | 'medium' | 'small' | 'niche'
    validation_level: 'strong' | 'moderate' | 'weak'
    evidence: string
  }
  competitive_landscape: {
    competition_level: 'high' | 'medium' | 'low' | 'unknown'
    differentiation_opportunity: string
  }
  implementation: {
    complexity: 'high' | 'medium' | 'low'
    key_challenges: string[]
    time_to_market: string
  }
  key_insights: string[]
  recommendation: 'highly_recommended' | 'recommended' | 'investigate_further' | 'pass'
  confidence: number // 0-100
}

export class OpportunityDeepAnalyzer {
  private openai: OpenAI

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required for deep analysis')
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  /**
   * Analyze a high-potential Reddit post using GPT-4
   */
  async analyzePost(post: RedditPost): Promise<DeepAnalysis> {
    const prompt = this.buildAnalysisPrompt(post)

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o', // Using GPT-4o for cost efficiency
      messages: [
        {
          role: 'system',
          content: `You are a business opportunity analyzer specializing in identifying viable startup ideas from Reddit discussions.

You analyze posts from entrepreneurial subreddits to assess:
1. Problem clarity and market need
2. Market size and validation evidence
3. Competitive landscape
4. Implementation feasibility
5. Overall business potential

Provide concise, actionable analysis focused on commercial viability.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // Lower temperature for consistent, analytical responses
      max_tokens: 1500,
      response_format: { type: 'json_object' }
    })

    const response = completion.choices[0].message.content
    if (!response) {
      throw new Error('No response from OpenAI')
    }

    const analysis = JSON.parse(response) as DeepAnalysis
    return analysis
  }

  /**
   * Build analysis prompt for GPT-4
   */
  private buildAnalysisPrompt(post: RedditPost): string {
    return `Analyze this Reddit post for business opportunity viability:

**Title**: ${post.title}

**Subreddit**: r/${post.subreddit}

**Content**:
${post.content || '(No content - link post)'}

**Engagement**:
- ${post.score} upvotes
- ${post.comments} comments
- Posted ${this.getPostAge(post)} ago

**URL**: ${post.url || 'N/A'}

Provide a comprehensive business opportunity analysis in JSON format with the following structure:

{
  "viability_explanation": "2-3 sentence summary of the opportunity's viability",
  "problem_analysis": {
    "clarity": "high|medium|low",
    "depth": "Description of how well the problem is articulated",
    "specificity": "What specific pain points or use cases are mentioned"
  },
  "market_analysis": {
    "size_estimate": "large|medium|small|niche",
    "validation_level": "strong|moderate|weak",
    "evidence": "What evidence suggests market interest (engagement, comments, similar problems)"
  },
  "competitive_landscape": {
    "competition_level": "high|medium|low|unknown",
    "differentiation_opportunity": "How could a solution differentiate itself"
  },
  "implementation": {
    "complexity": "high|medium|low",
    "key_challenges": ["challenge1", "challenge2", "challenge3"],
    "time_to_market": "Estimated time (e.g., '3-6 months')"
  },
  "key_insights": ["insight1", "insight2", "insight3"],
  "recommendation": "highly_recommended|recommended|investigate_further|pass",
  "confidence": 85
}

Focus on actionable insights that help evaluate if this is a viable business opportunity.`
  }

  /**
   * Get human-readable post age
   */
  private getPostAge(post: RedditPost): string {
    const ageHours = (Date.now() - new Date(post.created_utc).getTime()) / (1000 * 60 * 60)
    const ageDays = Math.floor(ageHours / 24)

    if (ageDays === 0) return `${Math.floor(ageHours)} hours`
    if (ageDays === 1) return '1 day'
    return `${ageDays} days`
  }

  /**
   * Batch analyze multiple posts
   */
  async analyzePosts(posts: RedditPost[]): Promise<Map<string, DeepAnalysis>> {
    const results = new Map<string, DeepAnalysis>()

    for (const post of posts) {
      try {
        const analysis = await this.analyzePost(post)
        results.set(post.reddit_id, analysis)

        // Rate limiting: wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`Failed to analyze post ${post.reddit_id}:`, error)
        // Continue with other posts even if one fails
      }
    }

    return results
  }

  /**
   * Generate viability explanation text from deep analysis
   * This is the 2-3 sentence summary stored in the database
   */
  generateExplanation(analysis: DeepAnalysis): string {
    return analysis.viability_explanation
  }

  /**
   * Calculate cost estimate for analyzing N posts
   */
  estimateCost(numPosts: number): { inputTokens: number; outputTokens: number; estimatedCost: number } {
    // Rough estimates based on GPT-4o pricing
    // Input: ~1500 tokens per post (prompt + content)
    // Output: ~800 tokens per post (detailed analysis)
    const inputTokensPerPost = 1500
    const outputTokensPerPost = 800

    const totalInput = numPosts * inputTokensPerPost
    const totalOutput = numPosts * outputTokensPerPost

    // GPT-4o pricing (as of Oct 2024):
    // $2.50 per 1M input tokens
    // $10.00 per 1M output tokens
    const costPerInputToken = 2.50 / 1_000_000
    const costPerOutputToken = 10.00 / 1_000_000

    const inputCost = totalInput * costPerInputToken
    const outputCost = totalOutput * costPerOutputToken
    const totalCost = inputCost + outputCost

    return {
      inputTokens: totalInput,
      outputTokens: totalOutput,
      estimatedCost: Number(totalCost.toFixed(4))
    }
  }
}

/**
 * Standalone function for quick analysis
 */
export async function analyzeHighPotentialPost(post: RedditPost): Promise<DeepAnalysis> {
  const analyzer = new OpportunityDeepAnalyzer()
  return analyzer.analyzePost(post)
}
