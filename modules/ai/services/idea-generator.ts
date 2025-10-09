/**
 * AI-Powered Startup Idea Generator
 * Transforms Reddit pain points into actionable startup ideas
 */

import OpenAI from 'openai'
import { painPointExtractor, type PainPoint, type StartupIdea } from '@/lib/services/pain-point-extractor'

export interface IdeaGenerationOptions {
  focusArea?: 'saas' | 'ecommerce' | 'marketplace' | 'mobile' | 'ai' | 'any'
  complexityLevel?: 'low' | 'medium' | 'high'
  budgetRange?: 'bootstrap' | 'funded' | 'enterprise'
  timeframe?: 'day' | 'week' | 'month'
  minOpportunityScore?: number
}

export interface GeneratedIdea extends StartupIdea {
  id: string
  source_pain_point_ids: string[]
  generated_at: string
  market_analysis: {
    target_audience: string[]
    market_size_estimate: string
    competition_analysis: string
    go_to_market_strategy: string[]
  }
  technical_requirements: {
    complexity: 'low' | 'medium' | 'high'
    tech_stack_suggestions: string[]
    estimated_development_time: string
    required_skills: string[]
  }
  business_model: {
    revenue_streams: string[]
    pricing_strategy: string
    key_metrics: string[]
    funding_requirements: string
  }
}

class AIIdeaGenerator {
  private openai: OpenAI | null = null

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      })
    }
  }

  /**
   * Generate startup ideas from Reddit pain points
   */
  async generateIdeasFromPainPoints(
    options: IdeaGenerationOptions = {}
  ): Promise<GeneratedIdea[]> {
    const {
      focusArea = 'any',
      complexityLevel = 'medium',
      budgetRange = 'bootstrap',
      timeframe = 'day',
      minOpportunityScore = 40
    } = options

    try {
      // Get relevant pain points
      const painPoints = await painPointExtractor.extractPainPointsFromPosts(timeframe)
      const filteredPainPoints = painPoints.filter(point =>
        point.opportunity_score >= minOpportunityScore
      )

      if (filteredPainPoints.length === 0) {
        console.warn('No pain points found matching criteria')
        return []
      }

      // Group related pain points
      const groupedPainPoints = this.groupRelatedPainPoints(filteredPainPoints)

      const generatedIdeas: GeneratedIdea[] = []

      // Generate ideas for each group
      for (const group of groupedPainPoints.slice(0, 10)) { // Limit to top 10 groups
        try {
          const idea = await this.generateIdeaFromPainPointGroup(group, {
            focusArea,
            complexityLevel,
            budgetRange
          })

          if (idea) {
            generatedIdeas.push(idea)
          }
        } catch (error) {
          console.error('Error generating idea for group:', error)
          continue
        }
      }

      return generatedIdeas.sort((a, b) => b.confidence_score - a.confidence_score)

    } catch (error) {
      console.error('Error generating ideas from pain points:', error)
      return []
    }
  }

  /**
   * Generate a single startup idea from a group of related pain points
   */
  private async generateIdeaFromPainPointGroup(
    painPoints: PainPoint[],
    options: Pick<IdeaGenerationOptions, 'focusArea' | 'complexityLevel' | 'budgetRange'>
  ): Promise<GeneratedIdea | null> {
    if (!this.openai) {
      console.warn('OpenAI API not configured, returning fallback idea')
      return this.generateFallbackIdea(painPoints)
    }

    const { focusArea, complexityLevel, budgetRange } = options

    try {
      const prompt = this.buildIdeaGenerationPrompt(painPoints, {
        focusArea,
        complexityLevel,
        budgetRange
      })

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a startup advisor and serial entrepreneur. You excel at identifying market opportunities from user pain points and creating actionable startup ideas. Focus on practical, achievable solutions that address real problems.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 2000
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error('No response from OpenAI')
      }

      return this.parseAIResponse(response, painPoints)

    } catch (error) {
      console.error('OpenAI API error:', error)
      return this.generateFallbackIdea(painPoints)
    }
  }

  /**
   * Build the prompt for AI idea generation
   */
  private buildIdeaGenerationPrompt(
    painPoints: PainPoint[],
    options: Pick<IdeaGenerationOptions, 'focusArea' | 'complexityLevel' | 'budgetRange'>
  ): string {
    const { focusArea, complexityLevel, budgetRange } = options

    const painPointSummaries = painPoints.map(point => ({
      subreddit: point.subreddit,
      title: point.title,
      problems: point.extracted_problems,
      indicators: point.pain_indicators,
      engagement: point.engagement_score,
      opportunity: point.opportunity_score
    }))

    return `
Analyze these Reddit pain points and generate a comprehensive startup idea:

PAIN POINTS DATA:
${JSON.stringify(painPointSummaries, null, 2)}

REQUIREMENTS:
- Focus Area: ${focusArea}
- Complexity Level: ${complexityLevel}
- Budget Range: ${budgetRange}

Generate a startup idea that addresses these pain points. Return your response in this exact JSON format:

{
  "title": "Clear, compelling startup name/concept",
  "problem_statement": "2-3 sentence description of the core problem being solved",
  "solution_approach": "Detailed explanation of how the solution works",
  "target_market": ["specific audience segments"],
  "market_opportunity": "Market size and opportunity description",
  "confidence_score": 85,
  "implementation_complexity": "low|medium|high",
  "revenue_potential": "low|medium|high",
  "market_analysis": {
    "target_audience": ["detailed audience segments"],
    "market_size_estimate": "Estimated market size with reasoning",
    "competition_analysis": "Current competitive landscape analysis",
    "go_to_market_strategy": ["specific marketing channels and strategies"]
  },
  "technical_requirements": {
    "complexity": "low|medium|high",
    "tech_stack_suggestions": ["recommended technologies"],
    "estimated_development_time": "Timeline estimate",
    "required_skills": ["essential skills needed"]
  },
  "business_model": {
    "revenue_streams": ["how the business makes money"],
    "pricing_strategy": "Recommended pricing approach",
    "key_metrics": ["important KPIs to track"],
    "funding_requirements": "Estimated funding needs"
  }
}

Focus on creating a practical, actionable solution that directly addresses the pain points identified in the Reddit data. Consider the constraints provided (focus area, complexity, budget).
`
  }

  /**
   * Parse AI response and create GeneratedIdea object
   */
  private parseAIResponse(response: string, painPoints: PainPoint[]): GeneratedIdea | null {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response')
      }

      const parsedResponse = JSON.parse(jsonMatch[0])

      const generatedIdea: GeneratedIdea = {
        id: this.generateIdeaId(),
        title: parsedResponse.title,
        problem_statement: parsedResponse.problem_statement,
        solution_approach: parsedResponse.solution_approach,
        target_market: parsedResponse.target_market || [],
        market_opportunity: parsedResponse.market_opportunity,
        confidence_score: parsedResponse.confidence_score || 75,
        source_pain_points: painPoints.map(p => p.title),
        source_pain_point_ids: painPoints.map(p => p.id),
        implementation_complexity: parsedResponse.implementation_complexity || 'medium',
        revenue_potential: parsedResponse.revenue_potential || 'medium',
        generated_at: new Date().toISOString(),
        market_analysis: parsedResponse.market_analysis || {
          target_audience: [],
          market_size_estimate: 'Unknown',
          competition_analysis: 'Analysis pending',
          go_to_market_strategy: []
        },
        technical_requirements: parsedResponse.technical_requirements || {
          complexity: 'medium',
          tech_stack_suggestions: [],
          estimated_development_time: 'Unknown',
          required_skills: []
        },
        business_model: parsedResponse.business_model || {
          revenue_streams: [],
          pricing_strategy: 'To be determined',
          key_metrics: [],
          funding_requirements: 'Unknown'
        }
      }

      return generatedIdea

    } catch (error) {
      console.error('Error parsing AI response:', error)
      return null
    }
  }

  /**
   * Generate fallback idea when AI is not available
   */
  private generateFallbackIdea(painPoints: PainPoint[]): GeneratedIdea | null {
    if (painPoints.length === 0) return null

    const topPainPoint = painPoints[0]
    const commonProblems = painPoints.flatMap(p => p.extracted_problems).slice(0, 3)

    return {
      id: this.generateIdeaId(),
      title: `Solution for ${topPainPoint.subreddit} Community`,
      problem_statement: `Users in r/${topPainPoint.subreddit} are experiencing challenges with ${commonProblems.join(', ')}.`,
      solution_approach: `Create a focused solution that addresses the specific needs identified in the ${topPainPoint.subreddit} community.`,
      target_market: [`r/${topPainPoint.subreddit} users`, 'Similar communities'],
      market_opportunity: `Opportunity score: ${topPainPoint.opportunity_score}/100`,
      confidence_score: Math.round(topPainPoint.opportunity_score * 0.8),
      source_pain_points: painPoints.map(p => p.title),
      source_pain_point_ids: painPoints.map(p => p.id),
      implementation_complexity: topPainPoint.urgency_level === 'high' ? 'low' : 'medium',
      revenue_potential: topPainPoint.market_size_indicator === 'large' ? 'high' : 'medium',
      generated_at: new Date().toISOString(),
      market_analysis: {
        target_audience: [`r/${topPainPoint.subreddit} community`],
        market_size_estimate: `${topPainPoint.market_size_indicator} market opportunity`,
        competition_analysis: `Competition level: ${topPainPoint.competition_level}`,
        go_to_market_strategy: ['Reddit community engagement', 'Content marketing']
      },
      technical_requirements: {
        complexity: 'medium',
        tech_stack_suggestions: ['Web application', 'Database', 'API'],
        estimated_development_time: '2-6 months',
        required_skills: ['Full-stack development', 'UI/UX design']
      },
      business_model: {
        revenue_streams: ['Subscription', 'Freemium'],
        pricing_strategy: 'Freemium with premium features',
        key_metrics: ['User engagement', 'Conversion rate'],
        funding_requirements: 'Bootstrap or seed funding'
      }
    }
  }

  /**
   * Group related pain points together
   */
  private groupRelatedPainPoints(painPoints: PainPoint[]): PainPoint[][] {
    const groups: PainPoint[][] = []
    const usedPoints = new Set<string>()

    for (const point of painPoints) {
      if (usedPoints.has(point.id)) continue

      const relatedPoints = [point]
      usedPoints.add(point.id)

      // Find related points based on subreddit, pain indicators, or keywords
      for (const otherPoint of painPoints) {
        if (usedPoints.has(otherPoint.id)) continue

        if (this.areRelatedPainPoints(point, otherPoint)) {
          relatedPoints.push(otherPoint)
          usedPoints.add(otherPoint.id)
        }
      }

      groups.push(relatedPoints)
    }

    // Sort groups by total opportunity score
    return groups.sort((a, b) => {
      const scoreA = a.reduce((sum, point) => sum + point.opportunity_score, 0)
      const scoreB = b.reduce((sum, point) => sum + point.opportunity_score, 0)
      return scoreB - scoreA
    })
  }

  /**
   * Check if two pain points are related
   */
  private areRelatedPainPoints(point1: PainPoint, point2: PainPoint): boolean {
    // Same subreddit
    if (point1.subreddit === point2.subreddit) return true

    // Shared pain indicators
    const sharedIndicators = point1.pain_indicators.filter(indicator =>
      point2.pain_indicators.includes(indicator)
    )
    if (sharedIndicators.length >= 2) return true

    // Similar problems
    const commonKeywords = this.extractKeywords(point1.title + ' ' + point1.content)
      .filter(keyword =>
        this.extractKeywords(point2.title + ' ' + point2.content).includes(keyword)
      )
    if (commonKeywords.length >= 3) return true

    return false
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    const cleanText = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    const words = cleanText.split(' ')
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'])

    return words
      .filter(word => word.length > 3 && !stopWords.has(word))
      .slice(0, 10)
  }

  /**
   * Generate unique idea ID
   */
  private generateIdeaId(): string {
    return `idea_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Quick idea generation for UI (limited details)
   */
  async generateQuickIdea(painPointId: string): Promise<Partial<GeneratedIdea> | null> {
    const painPoints = await painPointExtractor.extractPainPointsFromPosts('day')
    const targetPainPoint = painPoints.find(p => p.id === painPointId)

    if (!targetPainPoint) return null

    if (!this.openai) {
      return this.generateFallbackIdea([targetPainPoint])
    }

    try {
      const prompt = `Based on this Reddit pain point, generate a quick startup idea:

Title: ${targetPainPoint.title}
Subreddit: ${targetPainPoint.subreddit}
Problems: ${targetPainPoint.extracted_problems.join(', ')}

Respond with a JSON object containing: title, problem_statement, solution_approach, confidence_score (0-100)`

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a startup advisor. Generate concise, actionable startup ideas.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      })

      const response = completion.choices[0]?.message?.content
      if (!response) return null

      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) return null

      const parsed = JSON.parse(jsonMatch[0])

      return {
        id: this.generateIdeaId(),
        title: parsed.title,
        problem_statement: parsed.problem_statement,
        solution_approach: parsed.solution_approach,
        confidence_score: parsed.confidence_score || 75,
        source_pain_point_ids: [painPointId],
        generated_at: new Date().toISOString()
      }

    } catch (error) {
      console.error('Error generating quick idea:', error)
      return null
    }
  }
}

// Export singleton instance
export const aiIdeaGenerator = new AIIdeaGenerator()
