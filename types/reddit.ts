// Reddit API and data types

export interface RedditPostRaw {
  id: string
  title: string
  selftext?: string
  url?: string
  author: string
  score: number
  num_comments: number
  created_utc: number
  subreddit: string
  permalink: string
  is_self: boolean
  over_18: boolean
  spoiler: boolean
  stickied: boolean
  upvote_ratio: number
  domain?: string
  link_flair_text?: string
  post_hint?: string
}

export interface RedditComment {
  id: string
  body: string
  author: string
  score: number
  created_utc: number
  parent_id: string
  link_id: string
  subreddit: string
  permalink: string
  depth: number
  is_submitter: boolean
  stickied: boolean
  score_hidden: boolean
}

export interface RedditSubredditInfo {
  display_name: string
  title: string
  description: string
  subscribers: number
  active_user_count: number
  created_utc: number
  public_description: string
  over18: boolean
  lang: string
  subreddit_type: 'public' | 'private' | 'restricted' | 'gold_restricted' | 'archived'
}

export interface RedditAPIResponse<T> {
  kind: string
  data: {
    children: Array<{
      kind: string
      data: T
    }>
    after?: string
    before?: string
    dist?: number
    modhash?: string
  }
}

export interface RedditSearchParams {
  q: string
  subreddit?: string
  sort?: 'relevance' | 'hot' | 'top' | 'new' | 'comments'
  t?: 'all' | 'year' | 'month' | 'week' | 'day' | 'hour'
  limit?: number
  after?: string
  before?: string
}

export interface RedditTrendAnalysis {
  subreddit: string
  topic: string
  confidence_score: number
  post_count: number
  average_score: number
  total_comments: number
  timeframe: string
  key_phrases: string[]
  sentiment_score: number
  opportunity_indicators: {
    problem_mentions: number
    solution_requests: number
    market_size_indicators: string[]
    competition_level: 'low' | 'medium' | 'high'
  }
  top_posts: Array<{
    title: string
    score: number
    comments: number
    url: string
    created_utc: number
  }>
}

export interface RedditAnalysisData {
  sentiment_score?: number
  engagement_score?: number
  virality_score?: number
  problem_indicators?: string[]
  solution_mentions?: string[]
  market_signals?: string[]
  competition_level?: 'low' | 'medium' | 'high'
  trend_strength?: number
  relevance_score?: number
  extracted_keywords?: string[]
  pain_points?: string[]
  demographic_signals?: string[]
}

export interface RedditSource {
  id: string
  subreddit: string
  title: string
  url: string
  score: number
  comments: number
  created_utc: string
  relevance_score: number
  analysis_data?: RedditAnalysisData
}

export interface RedditIntentFlags {
  buying_intent: boolean
  problem_seeking: boolean
  solution_seeking: boolean
  recommendation_request: boolean
  complaint: boolean
  review: boolean
  comparison: boolean
  tutorial_request: boolean
}

// Validation types
export interface ValidationConfig {
  maxTitleLength: number
  maxContentLength: number
  requireMinScore: boolean
  allowedSubreddits?: string[]
  blockedSubreddits?: string[]
  minScoreThreshold?: number
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  sanitizedPost?: RedditPostRaw
}

// Rate limiting types
export interface RateLimitConfig {
  requestsPerMinute: number
  requestsPerHour: number
  burstLimit: number
  retryAfterMs: number
}

export interface RateLimitStatus {
  remaining: number
  resetTime: number
  totalRequests: number
  isLimited: boolean
}