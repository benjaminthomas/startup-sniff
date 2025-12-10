// Custom Authentication Database Types
// Updated to support custom auth system without Supabase Auth

export type PlanType = 'free' | 'pro_monthly' | 'pro_yearly';

export interface User {
  id: string
  email: string
  password_hash: string | null
  full_name: string | null
  avatar_url: string | null
  email_verified: boolean
  email_verification_token: string | null
  email_verification_expires_at: string | null
  password_reset_token: string | null
  password_reset_expires_at: string | null
  last_login_at: string | null
  login_attempts: number
  locked_until: string | null
  plan_type: PlanType | null
  razorpay_customer_id: string | null
  subscription_status: 'active' | 'inactive' | 'canceled' | 'past_due' | null
  trial_ends_at: string | null
  email_preferences: Record<string, boolean> | null
  email_unsubscribed: boolean
  last_onboarding_email: string | null
  onboarding_day1_sent_at: string | null
  onboarding_day3_sent_at: string | null
  onboarding_day7_sent_at: string | null
  last_weekly_summary_sent_at: string | null
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
}

export interface UserInsert {
  id?: string
  email: string
  password_hash?: string | null
  full_name?: string | null
  avatar_url?: string | null
  email_verified?: boolean
  email_verification_token?: string | null
  email_verification_expires_at?: string | null
  password_reset_token?: string | null
  password_reset_expires_at?: string | null
  last_login_at?: string | null
  login_attempts?: number
  locked_until?: string | null
  plan_type?: PlanType | null
  razorpay_customer_id?: string | null
  subscription_status?: 'active' | 'inactive' | 'canceled' | 'past_due' | null
  trial_ends_at?: string | null
  email_preferences?: Record<string, boolean> | null
  email_unsubscribed?: boolean
  last_onboarding_email?: string | null
  onboarding_day1_sent_at?: string | null
  onboarding_day3_sent_at?: string | null
  onboarding_day7_sent_at?: string | null
  last_weekly_summary_sent_at?: string | null
  role?: 'user' | 'admin'
  created_at?: string
  updated_at?: string
}

export interface UserUpdate {
  email?: string
  password_hash?: string | null
  full_name?: string | null
  avatar_url?: string | null
  email_verified?: boolean
  email_verification_token?: string | null
  email_verification_expires_at?: string | null
  password_reset_token?: string | null
  password_reset_expires_at?: string | null
  last_login_at?: string | null
  login_attempts?: number
  locked_until?: string | null
  plan_type?: PlanType | null
  razorpay_customer_id?: string | null
  subscription_status?: 'active' | 'inactive' | 'canceled' | 'past_due' | null
  trial_ends_at?: string | null
  email_preferences?: Record<string, boolean> | null
  email_unsubscribed?: boolean
  last_onboarding_email?: string | null
  onboarding_day1_sent_at?: string | null
  onboarding_day3_sent_at?: string | null
  onboarding_day7_sent_at?: string | null
  last_weekly_summary_sent_at?: string | null
  role?: 'user' | 'admin'
  updated_at?: string
}

export interface UserSession {
  id: string
  user_id: string
  session_token: string
  expires_at: string
  created_at: string
  updated_at: string
  user_agent: string | null
  ip_address: string | null
}

export interface UserSessionInsert {
  id?: string
  user_id: string
  session_token: string
  expires_at: string
  created_at?: string
  updated_at?: string
  user_agent?: string | null
  ip_address?: string | null
}

export interface AuthRateLimit {
  id: string
  identifier: string
  endpoint: string
  attempts: number
  window_start: string
  blocked_until: string | null
  created_at: string
  updated_at: string
}

export interface AuthRateLimitInsert {
  id?: string
  identifier: string
  endpoint: string
  attempts?: number
  window_start?: string
  blocked_until?: string | null
  created_at?: string
  updated_at?: string
}

// Authentication related types
export interface AuthUser {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  email_verified: boolean
  plan_type: PlanType | null
  subscription_status: 'active' | 'inactive' | 'canceled' | 'past_due' | null
  trial_ends_at: string | null
  last_login_at: string | null
}

export interface SessionPayload {
  userId: string
  email: string
  sessionId: string
  iat: number
  exp: number
}

export interface AuthResponse {
  success: boolean
  message?: string
  error?: string
  user?: AuthUser
  redirectTo?: string
}

// Plan and subscription types
export type SubscriptionStatus = 'active' | 'inactive' | 'canceled' | 'past_due'

// Helper types for existing tables (keeping compatibility)
export interface UsageLimits {
  id: string
  user_id: string
  ideas_generated: number | null
  monthly_limit_ideas: number
  validation_requests: number | null
  monthly_limit_validations: number
  content_generated: number | null
  monthly_limit_content: number
  reset_date: string
  created_at: string
  updated_at: string
}

export interface StartupIdea {
  id: string
  user_id: string
  title: string
  description: string
  target_market: string | null
  pain_points: string[] | null
  solution_approach: string | null
  revenue_model: string | null
  competition_analysis: string | null
  market_size: string | null
  validation_status: 'pending' | 'validated' | 'rejected' | null
  validation_score: number | null
  validation_feedback: string | null
  reddit_sources: { url: string; title: string; subreddit: string }[] | null
  created_at: string
  updated_at: string
}

export interface GeneratedContent {
  id: string
  user_id: string
  startup_idea_id: string | null
  title: string
  content: string
  content_type: string
  brand_voice: string | null
  seo_keywords: string[] | null
  created_at: string
  updated_at: string
}