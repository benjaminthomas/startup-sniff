import { RedditRateLimiter } from './rate-limiter'
import { RedditPostValidator } from './data-validator'
import type { RedditPost, RedditPostInsert } from '@/types/supabase'

// Reddit API configuration interface
export interface RedditApiConfig {
  userAgent: string
  clientId: string
  clientSecret: string
  refreshToken: string
  baseUrl?: string
}

// Reddit API response types
export interface RedditApiResponse<T> {
  success: boolean
  data: T
  error?: string
  rateLimit?: {
    remaining: number
    resetTime: Date
    used: number
  }
}

export interface RedditListingResponse {
  kind: string
  data: {
    children: Array<{
      kind: string
      data: RedditPost
    }>
    after?: string
    before?: string
    modhash?: string
  }
}

export interface RedditOAuthToken {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
  refresh_token?: string
}

// Fetch options for subreddit posts
export interface FetchOptions {
  limit?: number
  timeRange?: '24h' | '7d' | '30d'
  sortBy?: 'hot' | 'new' | 'top' | 'rising'
  after?: string
  before?: string
}

export interface Logger {
  info(message: string, ...args: unknown[]): void
  warn(message: string, ...args: unknown[]): void
  error(message: string, ...args: unknown[]): void
  debug(message: string, ...args: unknown[]): void
}

export class RedditApiClient {
  private config: RedditApiConfig
  private rateLimiter: RedditRateLimiter
  private logger: Logger
  private validator: RedditPostValidator
  private accessToken: string | null = null
  private tokenExpiry: Date | null = null
  private baseUrl: string

  constructor(
    config: RedditApiConfig, 
    rateLimiter: RedditRateLimiter,
    logger: Logger,
    validator?: RedditPostValidator
  ) {
    this.config = config
    this.rateLimiter = rateLimiter
    this.logger = logger
    this.validator = validator || new RedditPostValidator({
      maxTitleLength: 300,
      maxContentLength: 40000,
      allowedSubreddits: [
        'startups', 'entrepreneur', 'SaaS', 'digitalnomad', 
        'sidehustle', 'freelance', 'webdev', 'marketing', 'indiehackers'
      ],
      requireMinScore: false
    })
    this.baseUrl = config.baseUrl || 'https://oauth.reddit.com'
  }

  /**
   * Authenticate with Reddit OAuth2 API
   */
  async authenticate(): Promise<boolean> {
    try {
      this.logger.info('Authenticating with Reddit OAuth2 API')

      const auth = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')
      
      const response = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': this.config.userAgent
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.config.refreshToken
        })
      })

      if (!response.ok) {
        this.logger.error(`Reddit OAuth authentication failed: ${response.status} ${response.statusText}`)
        return false
      }

      const tokenData: RedditOAuthToken = await response.json()
      
      this.accessToken = tokenData.access_token
      this.tokenExpiry = new Date(Date.now() + (tokenData.expires_in * 1000))
      
      this.logger.info('Reddit OAuth authentication successful')
      return true
    } catch (error) {
      this.logger.error('Reddit authentication error:', error)
      return false
    }
  }

  /**
   * Check if current access token is valid
   */
  private isTokenValid(): boolean {
    return !!(this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date())
  }

  /**
   * Ensure we have a valid access token
   */
  private async ensureAuthenticated(): Promise<boolean> {
    if (this.isTokenValid()) {
      return true
    }

    return await this.authenticate()
  }

  /**
   * Make authenticated request to Reddit API
   */
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<RedditApiResponse<T>> {
    try {
      // Ensure we're authenticated
      if (!(await this.ensureAuthenticated())) {
        return {
          success: false,
          data: null as T,
          error: 'Authentication failed'
        }
      }

      // Check rate limits
      const rateLimitResult = await this.rateLimiter.checkLimit('reddit-api', 60, 'medium')
      
      if (!rateLimitResult.allowed) {
        this.logger.warn(`Reddit API rate limit exceeded. Next reset: ${new Date(rateLimitResult.resetTime || Date.now() + 60000)}`)
        return {
          success: false,
          data: null as T,
          error: `Rate limit exceeded. Try again in ${Math.ceil((rateLimitResult.resetTime?.getTime() || Date.now() + 60000 - Date.now()) / 1000)} seconds`
        }
      }

      // Make the request
      const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`
      
      const response = await this.makeRequestWithRetry(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'User-Agent': this.config.userAgent,
          ...options.headers
        }
      })

      if (!response.ok) {
        if (response.status === 429) {
          // Handle rate limiting with backoff
          const retryAfter = parseInt(response.headers.get('retry-after') || '60')
          this.logger.warn(`Reddit API rate limited, retrying in ${retryAfter} seconds`)
          
          await this.sleep(retryAfter * 1000)
          return this.makeRequest<T>(endpoint, options) // Retry once
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Parse rate limit headers
      const rateLimit = this.parseRateLimitHeaders(response.headers)
      if (rateLimit.remaining !== undefined) {
        this.logger.debug('Reddit API rate limit status:', rateLimit)
      }

      const data = await response.json()
      
      return {
        success: true,
        data,
        rateLimit: {
          remaining: rateLimit.remaining || 0,
          resetTime: rateLimit.resetTime || new Date(),
          used: rateLimit.used || 0
        }
      }
    } catch (error) {
      this.logger.error('Reddit API request failed:', error)
      return {
        success: false,
        data: null as T,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Make request with exponential backoff retry
   */
  private async makeRequestWithRetry(
    url: string, 
    options: RequestInit, 
    retryCount = 0
  ): Promise<Response> {
    const maxRetries = 2
    
    try {
      const response = await fetch(url, options)
      
      if (response.status >= 500 && retryCount < maxRetries) {
        // Server error, retry with backoff
        const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000 // Add jitter
        this.logger.warn(`Reddit API request failed, retrying in ${delay}ms:`, response.statusText)
        
        await this.sleep(delay)
        return this.makeRequestWithRetry(url, options, retryCount + 1)
      }
      
      return response
    } catch (error) {
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000
        this.logger.warn(`Reddit API request failed, retrying in ${delay}ms:`, error)
        
        await this.sleep(delay)
        return this.makeRequestWithRetry(url, options, retryCount + 1)
      }
      
      throw error
    }
  }

  /**
   * Parse Reddit API rate limit headers
   */
  parseRateLimitHeaders(headers: Headers): { remaining?: number; resetTime?: Date; used?: number } {
    const remaining = headers.get('x-ratelimit-remaining')
    const reset = headers.get('x-ratelimit-reset')
    const used = headers.get('x-ratelimit-used')

    return {
      remaining: remaining ? parseInt(remaining) : undefined,
      resetTime: reset ? new Date(parseInt(reset) * 1000) : undefined,
      used: used ? parseInt(used) : undefined
    }
  }

  /**
   * Validate subreddit name
   */
  private validateSubredditName(subreddit: string): boolean {
    // Reddit subreddit naming rules
    const subredditRegex = /^[a-zA-Z0-9_]{2,21}$/
    return subredditRegex.test(subreddit)
  }

  /**
   * Convert time range to Reddit API format
   */
  private convertTimeRange(timeRange: string): string {
    const timeMap = {
      '24h': 'day',
      '7d': 'week',
      '30d': 'month'
    }
    return timeMap[timeRange as keyof typeof timeMap] || 'day'
  }

  /**
   * Fetch posts from a subreddit
   */
  async fetchSubredditPosts(
    subreddit: string, 
    options: FetchOptions = {}
  ): Promise<RedditApiResponse<RedditPostInsert[]>> {
    // Validate subreddit name
    if (!this.validateSubredditName(subreddit)) {
      return {
        success: false,
        data: [],
        error: `Invalid subreddit name: ${subreddit}`
      }
    }

    const {
      limit = 25,
      timeRange = '24h',
      sortBy = 'hot',
      after,
      before
    } = options

    // Build API endpoint
    let endpoint = `/r/${subreddit}/${sortBy}.json`
    const params = new URLSearchParams({
      limit: String(Math.min(limit, 100)), // Reddit API max limit is 100
    })

    if (sortBy === 'top' && timeRange) {
      params.set('t', this.convertTimeRange(timeRange))
    }

    if (after) params.set('after', after)
    if (before) params.set('before', before)

    endpoint += `?${params.toString()}`

    try {
      this.logger.debug(`Fetching posts from r/${subreddit} with options:`, options)
      
      const response = await this.makeRequest<RedditListingResponse>(endpoint)
      
      if (!response.success) {
        return {
          success: false,
          data: [],
          error: response.error
        }
      }

      // Process and validate posts
      const rawPosts = response.data.data.children || []
      const processedPosts: RedditPostInsert[] = []
      let filteredCount = 0

      for (const child of rawPosts) {
        if (!child?.data) {
          filteredCount++
          continue
        }

        // Validate and sanitize post
        const validationResult = this.validator.validatePost(child.data)
        
        if (!validationResult.isValid) {
          this.logger.warn(`Filtered out invalid post: ${child.data.id}`, validationResult.errors)
          filteredCount++
          continue
        }

        if (validationResult.warnings?.length) {
          this.logger.debug(`Post validation warnings for ${child.data.id}:`, validationResult.warnings)
        }

        const sanitizedPost = validationResult.sanitizedPost!
        
        // Convert to database format
        const postInsert: RedditPostInsert = {
          reddit_id: sanitizedPost.reddit_id,
          subreddit: sanitizedPost.subreddit,
          title: sanitizedPost.title,
          content: sanitizedPost.content || null,
          url: sanitizedPost.url || null,
          author: sanitizedPost.author,
          score: sanitizedPost.score,
          comments: sanitizedPost.comments,
          created_utc: new Date(sanitizedPost.created_utc * 1000).toISOString(),
          hash: sanitizedPost.hash,
          // These will be populated by AI analysis later
          sentiment: null,
          intent_flags: sanitizedPost.intent_flags || []
        }

        processedPosts.push(postInsert)
      }

      if (filteredCount > 0) {
        this.logger.warn(`Filtered out invalid post entries: ${filteredCount}`)
      }

      this.logger.info(`Successfully fetched and processed ${processedPosts.length} posts from r/${subreddit}`)

      return {
        success: true,
        data: processedPosts,
        rateLimit: response.rateLimit
      }
    } catch (error) {
      this.logger.error(`Failed to fetch posts from r/${subreddit}:`, error)
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Failed to parse Reddit API response'
      }
    }
  }

  /**
   * Fetch posts from multiple subreddits
   */
  async fetchMultipleSubreddits(
    subreddits: string[],
    options: FetchOptions = {}
  ): Promise<RedditApiResponse<RedditPostInsert[]>> {
    this.logger.info(`Fetching posts from ${subreddits.length} subreddits:`, subreddits)

    const allPosts: RedditPostInsert[] = []
    const errors: string[] = []

    // Process subreddits sequentially to respect rate limits
    for (const subreddit of subreddits) {
      try {
        const result = await this.fetchSubredditPosts(subreddit, options)
        
        if (result.success) {
          allPosts.push(...result.data)
        } else {
          errors.push(`${subreddit}: ${result.error}`)
        }

        // Small delay between requests to be respectful
        await this.sleep(1000)
      } catch (error) {
        this.logger.error(`Failed to fetch from r/${subreddit}:`, error)
        errors.push(`${subreddit}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Remove duplicates based on hash
    const uniquePosts = this.deduplicatePosts(allPosts)
    const duplicatesRemoved = allPosts.length - uniquePosts.length

    if (duplicatesRemoved > 0) {
      this.logger.info(`Removed ${duplicatesRemoved} duplicate posts`)
    }

    this.logger.info(`Total posts collected from all subreddits: ${uniquePosts.length}`)

    return {
      success: errors.length < subreddits.length, // Success if at least one subreddit worked
      data: uniquePosts,
      error: errors.length > 0 ? `Errors from ${errors.length} subreddits: ${errors.join('; ')}` : undefined
    }
  }

  /**
   * Remove duplicate posts based on hash
   */
  private deduplicatePosts(posts: RedditPostInsert[]): RedditPostInsert[] {
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
   * Get exponential backoff delay
   */
  getBackoffDelay(retryCount: number): number {
    const baseDelay = 1000 // 1 second
    const maxDelay = 30000 // 30 seconds
    const jitter = Math.random() * 1000 // Add up to 1 second of jitter
    
    const delay = Math.min(baseDelay * Math.pow(2, retryCount) + jitter, maxDelay)
    return Math.floor(delay)
  }

  /**
   * Sleep utility function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get client health status
   */
  async getHealthStatus(): Promise<{
    authenticated: boolean
    tokenExpiry: Date | null
    rateLimitRemaining: number
    lastError: string | null
  }> {
    const rateLimitStatus = await this.rateLimiter.checkLimit('reddit-api', 60, 'medium')
    
    return {
      authenticated: this.isTokenValid(),
      tokenExpiry: this.tokenExpiry,
      rateLimitRemaining: rateLimitStatus.remaining || 0,
      lastError: null // Could track last error here
    }
  }
}