import { OpenAI } from 'openai'
import type { RedditPostInsert } from '@/types/supabase'
import type { Logger } from './api-client'

export interface ProcessingConfig {
  enableAiAnalysis: boolean
  aiModel: string
  maxConcurrentAnalysis: number
  analysisTimeout: number
  contentFiltering: {
    removePersonalInfo: boolean
    removeUrls: boolean
    removeMarkdown: boolean
    maxContentLength: number
  }
  sentiment: {
    enabled: boolean
    confidenceThreshold: number
  }
  intentDetection: {
    enabled: boolean
    categories: string[]
  }
  qualityScoring: {
    enabled: boolean
    minQualityScore: number
  }
}

export interface AnalysisResult {
  sentiment: {
    score: number // -1 to 1
    label: 'negative' | 'neutral' | 'positive'
    confidence: number
  }
  intent: {
    primary: string
    confidence: number
    flags: string[]
  }
  qualityScore: number // 0-100
  topics: string[]
  businessRelevance: number // 0-100
  processingTime: number
}

export interface ProcessedPost extends RedditPostInsert {
  analysis?: AnalysisResult
  processedAt: string
  processingErrors?: string[]
}

export interface ProcessingResult {
  success: boolean
  processed: ProcessedPost[]
  failed: Array<{ post: RedditPostInsert; error: string }>
  metrics: {
    totalPosts: number
    successfullyProcessed: number
    failed: number
    avgProcessingTime: number
    aiAnalysisUsed: number
  }
}

/**
 * Post processing pipeline for Reddit posts
 */
export class RedditPostProcessor {
  private config: ProcessingConfig
  private logger: Logger
  private openai?: OpenAI

  constructor(config: ProcessingConfig, logger: Logger, openaiKey?: string) {
    this.config = config
    this.logger = logger

    if (this.config.enableAiAnalysis && openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey })
    } else if (this.config.enableAiAnalysis) {
      this.logger.warn('AI analysis enabled but no OpenAI API key provided')
    }
  }

  /**
   * Process a batch of posts
   */
  async processBatch(posts: RedditPostInsert[]): Promise<ProcessingResult> {
    const startTime = Date.now()
    this.logger.info(`Processing batch of ${posts.length} posts`)

    const processed: ProcessedPost[] = []
    const failed: Array<{ post: RedditPostInsert; error: string }> = []
    let totalProcessingTime = 0
    let aiAnalysisUsed = 0

    // Process posts in chunks to control concurrency
    const chunks = this.chunkArray(posts, this.config.maxConcurrentAnalysis)

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async post => {
        try {
          const result = await this.processPost(post)
          processed.push(result)
          totalProcessingTime += result.analysis?.processingTime || 0
          if (result.analysis) aiAnalysisUsed++
        } catch (error) {
          this.logger.error(`Failed to process post ${post.reddit_id}:`, error)
          failed.push({
            post,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      })

      await Promise.allSettled(chunkPromises)
    }

    const duration = Date.now() - startTime

    const result: ProcessingResult = {
      success: failed.length === 0,
      processed,
      failed,
      metrics: {
        totalPosts: posts.length,
        successfullyProcessed: processed.length,
        failed: failed.length,
        avgProcessingTime: processed.length > 0 ? totalProcessingTime / processed.length : 0,
        aiAnalysisUsed
      }
    }

    this.logger.info('Batch processing completed:', result.metrics)
    return result
  }

  /**
   * Process a single post
   */
  async processPost(post: RedditPostInsert): Promise<ProcessedPost> {
    const startTime = Date.now()

    // Step 1: Sanitize content
    const sanitizedPost = this.sanitizePost(post)

    // Step 2: AI Analysis (if enabled and available)
    let analysis: AnalysisResult | undefined
    if (this.config.enableAiAnalysis && this.openai) {
      try {
        analysis = await this.performAiAnalysis(sanitizedPost)
      } catch (error) {
        this.logger.warn(`AI analysis failed for post ${post.reddit_id}:`, error)
        // Continue without AI analysis
      }
    }

    // Step 3: Quality filtering
    const shouldFilter = this.shouldFilterPost(sanitizedPost, analysis)
    if (shouldFilter.filter) {
      throw new Error(`Post filtered: ${shouldFilter.reason}`)
    }

    const processingTime = Date.now() - startTime

    const processedPost: ProcessedPost = {
      ...sanitizedPost,
      analysis,
      processedAt: new Date().toISOString()
    }

    // Update sentiment in the post data
    if (analysis?.sentiment) {
      processedPost.sentiment = analysis.sentiment.score
    }

    return processedPost
  }

  /**
   * Sanitize post content
   */
  private sanitizePost(post: RedditPostInsert): RedditPostInsert {
    const sanitized = { ...post }

    if (sanitized.title) {
      sanitized.title = this.sanitizeText(sanitized.title)
    }

    if (sanitized.content) {
      sanitized.content = this.sanitizeText(sanitized.content, true)
    }

    return sanitized
  }

  /**
   * Sanitize text content based on configuration
   */
  private sanitizeText(text: string, isContent = false): string {
    let sanitized = text

    // Remove personal information patterns
    if (this.config.contentFiltering.removePersonalInfo) {
      sanitized = this.removePersonalInfo(sanitized)
    }

    // Remove URLs if configured
    if (this.config.contentFiltering.removeUrls) {
      sanitized = sanitized.replace(/https?:\/\/[^\s]+/g, '[URL_REMOVED]')
    }

    // Remove markdown if configured
    if (this.config.contentFiltering.removeMarkdown) {
      sanitized = this.removeMarkdown(sanitized)
    }

    // Apply length limits
    const maxLength = isContent
      ? this.config.contentFiltering.maxContentLength
      : 300

    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength).trim() + '...'
    }

    return sanitized.trim()
  }

  /**
   * Remove personal information from text
   */
  private removePersonalInfo(text: string): string {
    return text
      // Remove email addresses
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REMOVED]')
      // Remove phone numbers (basic patterns)
      .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE_REMOVED]')
      // Remove potential SSN patterns
      .replace(/\b\d{3}[-]?\d{2}[-]?\d{4}\b/g, '[SSN_REMOVED]')
      // Remove credit card patterns
      .replace(/\b(?:\d{4}[-\s]?){3}\d{4}\b/g, '[CARD_REMOVED]')
  }

  /**
   * Remove markdown formatting
   */
  private removeMarkdown(text: string): string {
    return text
      // Remove headers
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold/italic
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      // Remove links
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '[CODE_BLOCK]')
      .replace(/`([^`]+)`/g, '$1')
      // Remove quotes
      .replace(/^>\s+/gm, '')
  }

  /**
   * Perform AI analysis on post
   */
  private async performAiAnalysis(post: RedditPostInsert): Promise<AnalysisResult> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized')
    }

    const startTime = Date.now()

    const prompt = this.buildAnalysisPrompt(post)

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.config.aiModel,
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that analyzes Reddit posts for business intelligence. Return only valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error('No response from OpenAI')
      }

      const analysis = JSON.parse(response)
      const processingTime = Date.now() - startTime

      return {
        ...analysis,
        processingTime
      }
    } catch (error) {
      const processingTime = Date.now() - startTime
      this.logger.error('AI analysis error:', error)

      // Return fallback analysis
      return this.getFallbackAnalysis(post, processingTime)
    }
  }

  /**
   * Build analysis prompt for AI
   */
  private buildAnalysisPrompt(post: RedditPostInsert): string {
    const content = `${post.title}\n\n${post.content || ''}`

    return `
Analyze this Reddit post from r/${post.subreddit} and return a JSON response with the following structure:

{
  "sentiment": {
    "score": -1 to 1,
    "label": "negative" | "neutral" | "positive",
    "confidence": 0 to 1
  },
  "intent": {
    "primary": "help_seeking" | "showcase" | "discussion" | "question" | "promotion",
    "confidence": 0 to 1,
    "flags": ["business", "startup", "technical", "personal", etc.]
  },
  "qualityScore": 0 to 100,
  "topics": ["topic1", "topic2", ...],
  "businessRelevance": 0 to 100
}

Post content:
${content.substring(0, 2000)}
`.trim()
  }

  /**
   * Get fallback analysis when AI fails
   */
  private getFallbackAnalysis(post: RedditPostInsert, processingTime: number): AnalysisResult {
    const text = `${post.title} ${post.content || ''}`.toLowerCase()

    // Simple rule-based sentiment
    const positiveWords = ['good', 'great', 'awesome', 'amazing', 'love', 'excellent']
    const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'horrible', 'worst']

    const positiveCount = positiveWords.reduce((count, word) =>
      count + (text.includes(word) ? 1 : 0), 0)
    const negativeCount = negativeWords.reduce((count, word) =>
      count + (text.includes(word) ? 1 : 0), 0)

    let sentimentScore = 0
    let sentimentLabel: 'negative' | 'neutral' | 'positive' = 'neutral'

    if (positiveCount > negativeCount) {
      sentimentScore = 0.5
      sentimentLabel = 'positive'
    } else if (negativeCount > positiveCount) {
      sentimentScore = -0.5
      sentimentLabel = 'negative'
    }

    // Extract topics from existing intent flags
    const topics = post.intent_flags || []

    return {
      sentiment: {
        score: sentimentScore,
        label: sentimentLabel,
        confidence: 0.3 // Low confidence for fallback
      },
      intent: {
        primary: topics.includes('help_seeking') ? 'help_seeking' : 'discussion',
        confidence: 0.3,
        flags: topics
      },
      qualityScore: Math.max(20, Math.min(80, post.score + post.comments)), // Simple score based on engagement
      topics,
      businessRelevance: topics.includes('business') || topics.includes('startup') ? 70 : 30,
      processingTime
    }
  }

  /**
   * Determine if post should be filtered out
   */
  private shouldFilterPost(
    post: RedditPostInsert,
    analysis?: AnalysisResult
  ): { filter: boolean; reason?: string } {
    // Quality score filtering
    if (this.config.qualityScoring.enabled && analysis?.qualityScore) {
      if (analysis.qualityScore < this.config.qualityScoring.minQualityScore) {
        return {
          filter: true,
          reason: `Quality score too low: ${analysis.qualityScore}`
        }
      }
    }

    // Content length filtering
    const contentLength = (post.title?.length || 0) + (post.content?.length || 0)
    if (contentLength < 20) {
      return {
        filter: true,
        reason: 'Content too short'
      }
    }

    // Score filtering (very low engagement)
    if (post.score < -10) {
      return {
        filter: true,
        reason: 'Score too low'
      }
    }

    return { filter: false }
  }

  /**
   * Chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  /**
   * Update processing configuration
   */
  updateConfig(newConfig: Partial<ProcessingConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.logger.info('Post processor configuration updated')
  }

  /**
   * Get processing statistics
   */
  getStats(): {
    config: ProcessingConfig
    hasOpenAI: boolean
  } {
    return {
      config: this.config,
      hasOpenAI: !!this.openai
    }
  }
}