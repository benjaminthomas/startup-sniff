import crypto from 'crypto'
import type { RedditPostRaw } from '@/types/supabase'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings?: string[]
  sanitizedPost?: RedditPostSanitized
}

export interface RedditPostSanitized {
  reddit_id: string
  subreddit: string
  title: string
  content: string | null
  url: string | null
  author: string
  score: number
  comments: number
  created_utc: number
  hash: string
  intent_flags: string[]
}

export interface ValidationConfig {
  maxTitleLength: number
  maxContentLength: number
  allowedSubreddits: string[]
  requireMinScore: boolean
  minScore?: number
  blockSuspiciousUsers?: boolean
  allowNSFW?: boolean
}

/**
 * Validates and sanitizes Reddit posts for database storage
 */
export class RedditPostValidator {
  private config: ValidationConfig

  constructor(config: ValidationConfig) {
    this.config = config
  }

  /**
   * Validate a Reddit post from API response
   */
  validatePost(post: RedditPostRaw): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Basic required field validation
    if (!post.id) {
      errors.push('Missing post ID')
    }

    if (!post.subreddit) {
      errors.push('Missing subreddit')
    }

    if (!post.title) {
      errors.push('Missing post title')
    }

    if (!post.author) {
      errors.push('Missing post author')
    }

    if (typeof post.created_utc !== 'number') {
      errors.push('Invalid created_utc timestamp')
    }

    if (typeof post.score !== 'number') {
      errors.push('Invalid score value')
    }

    if (typeof post.num_comments !== 'number') {
      errors.push('Invalid comment count')
    }

    // Early return if basic validation fails
    if (errors.length > 0) {
      return { isValid: false, errors, warnings }
    }

    // Content length validation
    if (post.title.length > this.config.maxTitleLength) {
      errors.push(`Title too long (${post.title.length} > ${this.config.maxTitleLength})`)
    }

    if (post.selftext && post.selftext.length > this.config.maxContentLength) {
      errors.push(`Content too long (${post.selftext.length} > ${this.config.maxContentLength})`)
    }

    // Subreddit allowlist validation
    if (this.config.allowedSubreddits.length > 0) {
      const normalizedSubreddit = post.subreddit.toLowerCase()
      const allowed = this.config.allowedSubreddits.some(
        allowed => allowed.toLowerCase() === normalizedSubreddit
      )

      if (!allowed) {
        errors.push(`Subreddit '${post.subreddit}' not in allowlist`)
      }
    }

    // Score validation
    if (this.config.requireMinScore && this.config.minScore !== undefined) {
      if (post.score < this.config.minScore) {
        errors.push(`Score too low (${post.score} < ${this.config.minScore})`)
      }
    }

    // NSFW content filtering
    if (!this.config.allowNSFW && post.over_18) {
      errors.push('NSFW content not allowed')
    }

    // Suspicious user detection
    if (this.config.blockSuspiciousUsers) {
      if (this.isSuspiciousUser(post.author)) {
        warnings.push(`Potentially suspicious user: ${post.author}`)
      }
    }

    // Content quality checks
    if (this.isLowQualityContent(post)) {
      warnings.push('Low quality content detected')
    }

    if (this.containsSpam(post)) {
      warnings.push('Potential spam content detected')
    }

    // Return early if validation failed
    if (errors.length > 0) {
      return { isValid: false, errors, warnings }
    }

    // Create sanitized post
    const sanitizedPost = this.sanitizePost(post)

    return {
      isValid: true,
      errors: [],
      warnings: warnings.length > 0 ? warnings : undefined,
      sanitizedPost
    }
  }

  /**
   * Sanitize post content for safe storage
   */
  private sanitizePost(post: RedditPostRaw): RedditPostSanitized {
    const sanitizedTitle = this.sanitizeText(post.title)
    const sanitizedContent = post.selftext ? this.sanitizeText(post.selftext) : null
    const sanitizedAuthor = this.sanitizeText(post.author)

    // Generate content hash for deduplication
    const hash = this.generatePostHash(post)

    // Extract intent flags
    const intentFlags = this.extractIntentFlags(post)

    return {
      reddit_id: post.id,
      subreddit: post.subreddit,
      title: sanitizedTitle,
      content: sanitizedContent,
      url: this.sanitizeUrl(post.url),
      author: sanitizedAuthor,
      score: Math.max(0, post.score), // Ensure non-negative
      comments: Math.max(0, post.num_comments), // Ensure non-negative
      created_utc: post.created_utc,
      hash,
      intent_flags: intentFlags
    }
  }

  /**
   * Sanitize text content
   */
  private sanitizeText(text: string): string {
    if (!text) return ''

    return text
      .trim()
      // Remove null bytes
      .replace(/\0/g, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      // Remove potential XSS attempts
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      // Limit length as extra safety
      .slice(0, this.config.maxContentLength)
  }

  /**
   * Sanitize URL
   */
  private sanitizeUrl(url: string | null): string | null {
    if (!url || url === 'null') return null

    try {
      const urlObj = new URL(url)

      // Only allow http/https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return null
      }

      return url
    } catch {
      return null
    }
  }

  /**
   * Generate unique hash for post content
   */
  private generatePostHash(post: RedditPostRaw): string {
    const content = [
      post.title,
      post.selftext || '',
      post.url || '',
      post.subreddit,
      post.author
    ].join('|')

    return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16)
  }

  /**
   * Extract intent flags from post content
   */
  private extractIntentFlags(post: RedditPostRaw): string[] {
    const flags: string[] = []
    const fullText = `${post.title} ${post.selftext || ''}`.toLowerCase()

    // Business intent patterns
    const businessPatterns = [
      /\b(startup|business|entrepreneur|launch|company)\b/,
      /\b(funding|investment|investor|vc|venture)\b/,
      /\b(revenue|profit|monetize|business model)\b/,
      /\b(market|customer|user|client)\b/,
      /\b(product|service|saas|platform)\b/
    ]

    const helpPatterns = [
      /\b(help|advice|suggest|recommend|tips)\b/,
      /\b(how to|question|ask|need)\b/,
      /\b(problem|issue|challenge|struggle)\b/
    ]

    const showcasePatterns = [
      /\b(built|created|made|launched|released)\b/,
      /\b(check out|feedback|thoughts|opinion)\b/,
      /\b(demo|showcase|show off|proud)\b/
    ]

    // Check patterns
    if (businessPatterns.some(pattern => pattern.test(fullText))) {
      flags.push('business')
    }

    if (helpPatterns.some(pattern => pattern.test(fullText))) {
      flags.push('help_seeking')
    }

    if (showcasePatterns.some(pattern => pattern.test(fullText))) {
      flags.push('showcase')
    }

    // Special flags
    if (post.is_self) flags.push('text_post')
    if (post.url && !post.is_self) flags.push('link_post')
    if (post.stickied) flags.push('stickied')
    if (post.over_18) flags.push('nsfw')

    return flags
  }

  /**
   * Check if user appears suspicious
   */
  private isSuspiciousUser(author: string): boolean {
    // Basic heuristics for suspicious users
    const suspiciousPatterns = [
      /^[a-zA-Z]+\d{4,}$/, // Letters followed by many numbers
      /^[a-zA-Z]+_[a-zA-Z]+\d+$/, // Common bot pattern
      /^(bot|spam|fake|test)/i, // Obvious bot names
      /^\w{1,3}$/, // Very short names
      /^\w{20,}$/ // Very long names
    ]

    return suspiciousPatterns.some(pattern => pattern.test(author))
  }

  /**
   * Check for low quality content
   */
  private isLowQualityContent(post: RedditPostRaw): boolean {
    // Title too short
    if (post.title.length < 10) return true

    // All caps title
    if (post.title === post.title.toUpperCase() && post.title.length > 20) return true

    // Too many emojis
    const emojiCount = (post.title.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length
    if (emojiCount > 3) return true

    return false
  }

  /**
   * Check for spam content
   */
  private containsSpam(post: RedditPostRaw): boolean {
    const fullText = `${post.title} ${post.selftext || ''}`.toLowerCase()

    const spamPatterns = [
      /\b(buy now|click here|limited time|act now|free money)\b/,
      /\b(make \$\d+|earn \$\d+|passive income|work from home)\b/,
      /\b(telegram|discord|dm me|contact me)\b/,
      /\b(crypto|bitcoin|nft|invest now|trading|forex)\b/
    ]

    // Check for excessive links
    const linkCount = (fullText.match(/https?:\/\/\S+/g) || []).length
    if (linkCount > 2) return true

    // Check spam patterns
    return spamPatterns.some(pattern => pattern.test(fullText))
  }
}

/**
 * Standalone validation functions for backwards compatibility
 */
export function validateRedditPost(post: RedditPostRaw, config?: Partial<ValidationConfig>): ValidationResult {
  const defaultConfig: ValidationConfig = {
    maxTitleLength: 300,
    maxContentLength: 40000,
    allowedSubreddits: [],
    requireMinScore: false,
    blockSuspiciousUsers: true,
    allowNSFW: false
  }

  const validator = new RedditPostValidator({ ...defaultConfig, ...config })
  return validator.validatePost(post)
}

export function sanitizeContent(text: string, maxLength: number = 40000): string {
  return text
    .trim()
    .replace(/\0/g, '')
    .replace(/\s+/g, ' ')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .slice(0, maxLength)
}

export function generatePostHash(post: RedditPostRaw): string {
  const content = [
    post.title,
    post.selftext || '',
    post.url || '',
    post.subreddit,
    post.author
  ].join('|')

  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16)
}