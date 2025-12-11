import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ProcessedPost } from './post-processor'
import type { Logger } from './api-client'
import type { Database, RedditPostInsert } from '@/types/supabase'

export interface InsertionConfig {
  batchSize: number
  maxRetries: number
  retryDelay: number
  enableDeduplication: boolean
  conflictResolution: 'skip' | 'update' | 'error'
  performanceMonitoring: boolean
}

export interface InsertionResult {
  success: boolean
  inserted: number
  updated: number
  skipped: number
  failed: number
  duplicates: number
  errors: string[]
  duration: number
  batchResults: BatchResult[]
}

export interface BatchResult {
  batchNumber: number
  size: number
  inserted: number
  updated: number
  skipped: number
  failed: number
  duration: number
  errors: string[]
}

export interface ConflictPost {
  new: ProcessedPost
  existing: Record<string, unknown>
  resolution: 'skip' | 'update' | 'error'
}

/**
 * Handles batch insertion of Reddit posts with deduplication
 */
export class RedditDatabaseInserter {
  private supabase: SupabaseClient<Database>
  private config: InsertionConfig
  private logger: Logger

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    config: InsertionConfig,
    logger: Logger
  ) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey)
    this.config = config
    this.logger = logger
  }

  /**
   * Insert a batch of processed posts
   */
  async insertBatch(posts: ProcessedPost[]): Promise<InsertionResult> {
    const startTime = Date.now()
    this.logger.info(`Starting batch insertion of ${posts.length} posts`)

    // Pre-process: Remove duplicates within the batch
    const uniquePosts = this.removeDuplicatesFromBatch(posts)
    const duplicatesInBatch = posts.length - uniquePosts.length

    if (duplicatesInBatch > 0) {
      this.logger.info(`Removed ${duplicatesInBatch} duplicates from batch`)
    }

    // Split into smaller batches for processing
    const batches = this.chunkArray(uniquePosts, this.config.batchSize)
    const batchResults: BatchResult[] = []

    let totalInserted = 0
    let totalUpdated = 0
    let totalSkipped = 0
    let totalFailed = 0
    const totalErrors: string[] = []

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      this.logger.debug(`Processing batch ${i + 1}/${batches.length} (${batch.length} posts)`)

      const batchResult = await this.processBatch(batch, i + 1)
      batchResults.push(batchResult)

      totalInserted += batchResult.inserted
      totalUpdated += batchResult.updated
      totalSkipped += batchResult.skipped
      totalFailed += batchResult.failed
      totalErrors.push(...batchResult.errors)

      // Add delay between batches to avoid overwhelming the database
      if (i < batches.length - 1) {
        await this.sleep(100)
      }
    }

    const duration = Date.now() - startTime
    const success = totalFailed === 0

    const result: InsertionResult = {
      success,
      inserted: totalInserted,
      updated: totalUpdated,
      skipped: totalSkipped,
      failed: totalFailed,
      duplicates: duplicatesInBatch,
      errors: totalErrors,
      duration,
      batchResults
    }

    this.logger.info('Batch insertion completed:', {
      inserted: totalInserted,
      updated: totalUpdated,
      skipped: totalSkipped,
      failed: totalFailed,
      duration: `${duration}ms`
    })

    return result
  }

  /**
   * Process a single batch with retry logic
   */
  private async processBatch(posts: ProcessedPost[], batchNumber: number): Promise<BatchResult> {
    const startTime = Date.now()
    let attempt = 0
    let lastError: string | null = null

    while (attempt <= this.config.maxRetries) {
      try {
        const result = await this.insertBatchToDB(posts)
        return {
          ...result,
          batchNumber,
          duration: Date.now() - startTime
        }
      } catch (error) {
        attempt++
        lastError = error instanceof Error ? error.message : 'Unknown error'

        this.logger.warn(
          `Batch ${batchNumber} attempt ${attempt} failed: ${lastError}`
        )

        if (attempt <= this.config.maxRetries) {
          const delay = this.config.retryDelay * attempt
          this.logger.info(`Retrying batch ${batchNumber} in ${delay}ms`)
          await this.sleep(delay)
        }
      }
    }

    // All retries failed
    return {
      batchNumber,
      size: posts.length,
      inserted: 0,
      updated: 0,
      skipped: 0,
      failed: posts.length,
      duration: Date.now() - startTime,
      errors: [lastError || 'Max retries exceeded']
    }
  }

  /**
   * Insert batch to database with conflict handling
   */
  private async insertBatchToDB(
    posts: ProcessedPost[]
  ): Promise<Omit<BatchResult, 'batchNumber' | 'duration'>> {
    if (this.config.enableDeduplication) {
      return this.insertWithDeduplication(posts)
    } else {
      return this.insertWithoutDeduplication(posts)
    }
  }

  /**
   * Insert with deduplication checks
   */
  private async insertWithDeduplication(
    posts: ProcessedPost[]
  ): Promise<Omit<BatchResult, 'batchNumber' | 'duration'>> {
    const result = {
      size: posts.length,
      inserted: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Check for existing posts
    const hashes = posts.map(p => p.hash)
    const redditIds = posts.map(p => p.reddit_id)

    const { data: existingPosts, error: checkError } = await this.supabase
      .from('reddit_posts')
      .select('hash, reddit_id, created_utc, score, updated_at')
      .or(`hash.in.(${hashes.join(',')}),reddit_id.in.(${redditIds.join(',')})`)

    if (checkError) {
      throw new Error(`Failed to check for existing posts: ${checkError.message}`)
    }

    const existingMap = new Map<string, Record<string, unknown>>()
    existingPosts?.forEach(post => {
      existingMap.set(post.hash, post)
      existingMap.set(post.reddit_id, post)
    })

    // Process each post individually based on existence
    for (const post of posts) {
      try {
        const existing = existingMap.get(post.hash) || existingMap.get(post.reddit_id)

        if (existing) {
          const resolution = await this.resolveConflict({ new: post, existing, resolution: this.config.conflictResolution })

          if (resolution === 'skip') {
            result.skipped++
          } else if (resolution === 'update') {
            await this.updatePost(post, existing.reddit_id as string)
            result.updated++
          } else {
            result.failed++
            result.errors.push(`Conflict detected for post ${post.reddit_id}`)
          }
        } else {
          await this.insertSinglePost(post)
          result.inserted++
        }
      } catch (error) {
        result.failed++
        result.errors.push(`Failed to process post ${post.reddit_id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return result
  }

  /**
   * Insert without deduplication (faster, but may create duplicates)
   */
  private async insertWithoutDeduplication(
    posts: ProcessedPost[]
  ): Promise<Omit<BatchResult, 'batchNumber' | 'duration'>> {
    const dbPosts = posts.map(this.convertToDbFormat) as RedditPostInsert[]

    const { data, error } = await this.supabase
      .from('reddit_posts')
      .insert(dbPosts)
      .select('reddit_id')

    if (error) {
      throw new Error(`Batch insert failed: ${error.message}`)
    }

    return {
      size: posts.length,
      inserted: data?.length || 0,
      updated: 0,
      skipped: 0,
      failed: posts.length - (data?.length || 0),
      errors: []
    }
  }

  /**
   * Resolve conflicts between new and existing posts
   */
  private async resolveConflict(conflict: ConflictPost): Promise<'skip' | 'update' | 'error'> {
    const { new: newPost, existing, resolution } = conflict

    if (resolution === 'error') {
      return 'error'
    }

    if (resolution === 'skip') {
      return 'skip'
    }

    if (resolution === 'update') {
      // Check if update is warranted
      const shouldUpdate = this.shouldUpdateExisting(newPost, existing)
      return shouldUpdate ? 'update' : 'skip'
    }

    return 'skip'
  }

  /**
   * Determine if existing post should be updated
   */
  private shouldUpdateExisting(newPost: ProcessedPost, existing: Record<string, unknown>): boolean {
    // Update if the new post has better data
    if ((newPost.score || 0) > (existing.score as number || 0) + 5) return true
    if ((newPost.comments || 0) > (existing.comments as number || 0) + 2) return true

    // Update if we now have AI analysis but didn't before
    if (newPost.analysis && !existing.analysis) return true

    // Update if significant time has passed (re-analysis)
    const daysSinceUpdate = (Date.now() - new Date(existing.updated_at as string).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceUpdate > 7) return true

    return false
  }

  /**
   * Insert a single post
   */
  private async insertSinglePost(post: ProcessedPost): Promise<void> {
    const dbPost = this.convertToDbFormat(post) as RedditPostInsert

    const { error } = await this.supabase
      .from('reddit_posts')
      .insert(dbPost)

    if (error) {
      throw new Error(`Failed to insert post ${post.reddit_id}: ${error.message}`)
    }
  }

  /**
   * Update an existing post
   */
  private async updatePost(post: ProcessedPost, redditId: string): Promise<void> {
    const updateData = {
      score: post.score,
      comments: post.comments,
      sentiment: post.sentiment,
      updated_at: new Date().toISOString()
    }

    // Add analysis data if available
    if (post.analysis) {
      Object.assign(updateData, {
        // Store analysis results in the appropriate columns
        analysis_data: JSON.stringify(post.analysis)
      })
    }

    const { error } = await this.supabase
      .from('reddit_posts')
      .update(updateData)
      .eq('reddit_id', redditId)

    if (error) {
      throw new Error(`Failed to update post ${redditId}: ${error.message}`)
    }
  }

  /**
   * Convert processed post to database format
   */
  private convertToDbFormat(post: ProcessedPost): Record<string, unknown> {
    return {
      reddit_id: post.reddit_id,
      subreddit: post.subreddit,
      title: post.title,
      content: post.content,
      url: post.url,
      author: post.author,
      score: post.score,
      comments: post.comments,
      created_utc: post.created_utc,
      hash: post.hash,
      sentiment: post.sentiment,
      intent_flags: post.intent_flags,
      processed_at: post.processedAt,
      // Store analysis data as JSON if available
      analysis_data: post.analysis ? JSON.stringify(post.analysis) : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  /**
   * Remove duplicates within a batch based on hash
   */
  private removeDuplicatesFromBatch(posts: ProcessedPost[]): ProcessedPost[] {
    const seen = new Set<string>()
    return posts.filter(post => {
      if (seen.has(post.hash)) {
        return false
      }
      seen.add(post.hash)
      return true
    })
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
   * Sleep utility function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get insertion statistics
   */
  async getStats(): Promise<{
    totalPosts: number
    postsToday: number
    avgInsertionTime: number
    errorRate: number
  }> {
    try {
      // Get total posts count
      const { count: totalPosts } = await this.supabase
        .from('reddit_posts')
        .select('*', { count: 'exact', head: true })

      // Get posts from today
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { count: postsToday } = await this.supabase
        .from('reddit_posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString())

      return {
        totalPosts: totalPosts || 0,
        postsToday: postsToday || 0,
        avgInsertionTime: 0, // Would need to track this over time
        errorRate: 0 // Would need to track this over time
      }
    } catch (error) {
      this.logger.error('Failed to get insertion stats:', error)
      return {
        totalPosts: 0,
        postsToday: 0,
        avgInsertionTime: 0,
        errorRate: 0
      }
    }
  }

  /**
   * Clean up old posts based on retention policy
   */
  async cleanup(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

      const { data, error } = await this.supabase
        .from('reddit_posts')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .select('reddit_id')

      if (error) {
        throw new Error(`Cleanup failed: ${error.message}`)
      }

      const deletedCount = data?.length || 0
      this.logger.info(`Cleaned up ${deletedCount} old posts`)

      return deletedCount
    } catch (error) {
      this.logger.error('Cleanup error:', error)
      return 0
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<InsertionConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.logger.info('Database inserter configuration updated')
  }
}