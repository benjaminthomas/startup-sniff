// Re-export all types for easy importing
export * from './startup-ideas'

// Common utility types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page: number
  limit: number
  total: number
  totalPages: number
}

// User types (matching database)
export interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  stripe_customer_id: string | null
  subscription_status: 'trial' | 'active' | 'inactive' | 'cancelled' | null
  plan_type: 'explorer' | 'founder' | 'growth' | null
  trial_ends_at: string | null
  created_at: string
  updated_at: string
}

// Plan limits and usage
export interface UsageLimits {
  id: string
  user_id: string
  plan_type: 'explorer' | 'founder' | 'growth'
  monthly_limit_ideas: number
  monthly_limit_validations: number
  ideas_generated: number | null
  validations_completed: number | null
  reset_date: string
  created_at: string
  updated_at: string
}

// Content generation types
export interface GeneratedContent {
  id: string
  user_id: string
  startup_idea_id: string | null
  content_type: 'blog_post' | 'tweet' | 'email' | 'landing_page'
  title: string
  content: string
  brand_voice: string | null
  seo_keywords: string[] | null
  created_at: string
  updated_at: string
}

// Reddit data types
export interface RedditPost {
  id: string
  reddit_id: string
  subreddit: string
  title: string
  content: string | null
  url: string | null
  author: string
  score: number | null
  comments: number | null
  created_utc: string
  hash: string
  sentiment: number | null
  processed_at: string | null
  analysis_data: Record<string, unknown> | null
  intent_flags: string[] | null
  created_at: string | null
  updated_at: string | null
}

// Form validation types
export interface ValidationError {
  field: string
  message: string
}

export interface FormState<T = Record<string, unknown>> {
  data: T
  errors: ValidationError[]
  isSubmitting: boolean
  isValid: boolean
}

// Common component props
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

// Loading states
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

// Generic error type
export interface AppError {
  code: string
  message: string
  details?: Record<string, unknown>
}