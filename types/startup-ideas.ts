import { Database } from '@/lib/database.types'

// Extract the startup_ideas table type from the database
export type StartupIdeaRow = Database['public']['Tables']['startup_ideas']['Row']
export type StartupIdeaInsert = Database['public']['Tables']['startup_ideas']['Insert']
export type StartupIdeaUpdate = Database['public']['Tables']['startup_ideas']['Update']

// Extended interfaces for frontend use
export interface TargetMarket {
  description: string
  demographics?: string
  psychographics?: string
  size?: string
  growth_rate?: string
}

export interface Solution {
  description: string
  key_features?: string[]
  revenue_model?: string[]
  competitive_advantages?: string[]
  technology_stack?: string[]
}

export interface MarketAnalysis {
  market_size?: string
  competitors?: Array<{
    name: string
    strengths: string[]
    weaknesses: string[]
  }>
  trends?: string[]
  opportunities?: string[]
  threats?: string[]
}

export interface Implementation {
  mvp_features?: string[]
  development_timeline?: string
  required_resources?: string[]
  key_milestones?: Array<{
    milestone: string
    timeline: string
    deliverables: string[]
  }>
  estimated_budget?: string
}

export interface SuccessMetrics {
  key_metrics?: string[]
  targets?: Array<{
    metric: string
    target: string
    timeframe: string
  }>
  validation_criteria?: string[]
}

export interface ValidationData {
  validation_score?: number
  market_demand?: number
  competition_analysis?: number
  feasibility_score?: number
  revenue_potential?: number
  overall_score?: number
  feedback?: string | string[]
  recommendations?: string[]
  strengths?: string[]
  weaknesses?: string[]
}

export interface SourceData {
  reddit_sources?: Array<{
    subreddit: string
    post_id: string
    title: string
    url: string
    relevance_score: number
  }>
  pain_points?: string[]
  market_signals?: string[]
  trend_data?: Record<string, unknown>
}

// Complete typed startup idea interface
export interface StartupIdea {
  id: string
  user_id: string
  title: string
  problem_statement: string
  target_market: TargetMarket
  solution: Solution
  market_analysis: MarketAnalysis
  implementation: Implementation
  success_metrics: SuccessMetrics
  ai_confidence_score: number | null
  source_data: SourceData | null
  validation_data: ValidationData | null
  is_validated: boolean | null
  is_favorite: boolean | null
  created_at: string
  updated_at: string
}

// Form data types for idea generation
export interface IdeaGenerationFormData {
  industry?: string
  problemArea?: string
  targetAudience?: string
  budget?: string
  timeframe?: string
  userPrompt?: string
}

// API response types
export interface IdeaGenerationResponse {
  success: boolean
  idea?: StartupIdea
  error?: string
}

export interface IdeaValidationResponse {
  success: boolean
  validation_data?: ValidationData
  error?: string
}

// Utility type for safe JSON parsing
export type SafeJson<T> = T | null

// Helper function to safely parse JSON fields
export function parseJsonField<T>(field: unknown): SafeJson<T> {
  if (!field) return null
  if (typeof field === 'object') return field as T
  if (typeof field === 'string') {
    try {
      return JSON.parse(field) as T
    } catch {
      return null
    }
  }
  return null
}

// Helper function to convert database row to typed startup idea
export function mapDatabaseRowToStartupIdea(row: StartupIdeaRow): StartupIdea {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    problem_statement: row.problem_statement,
    target_market: parseJsonField<TargetMarket>(row.target_market) || { description: '' },
    solution: parseJsonField<Solution>(row.solution) || { description: '' },
    market_analysis: parseJsonField<MarketAnalysis>(row.market_analysis) || {},
    implementation: parseJsonField<Implementation>(row.implementation) || {},
    success_metrics: parseJsonField<SuccessMetrics>(row.success_metrics) || {},
    ai_confidence_score: row.ai_confidence_score,
    source_data: parseJsonField<SourceData>(row.source_data),
    validation_data: parseJsonField<ValidationData>(row.validation_data),
    is_validated: row.is_validated,
    is_favorite: row.is_favorite,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}