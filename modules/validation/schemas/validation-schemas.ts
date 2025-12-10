import { z } from 'zod'

/**
 * Validation form schema (legacy - for backward compatibility)
 */
export const validationSchema = z.object({
  ideaTitle: z.string().min(1, 'Idea title is required').max(100, 'Title too long'),
  ideaDescription: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description too long'),
  targetMarket: z.string().min(1, 'Target market is required').max(200, 'Target market description too long')
})

/**
 * AI validation response schema
 */
export const validationResponseSchema = z.object({
  market_analysis: z.object({
    market_size: z.object({
      tam: z.number(),
      sam: z.number(),
      som: z.number(),
      currency: z.string().default('USD')
    }),
    competition_level: z.enum(['low', 'medium', 'high']),
    competitive_advantages: z.array(z.string()),
    market_timing: z.string(),
    barriers_to_entry: z.array(z.string())
  }),
  target_market: z.object({
    primary_demographic: z.string(),
    user_personas: z.array(z.object({
      name: z.string(),
      age_range: z.string(),
      income_level: z.string(),
      pain_points: z.array(z.string())
    })),
    market_size_estimate: z.number(),
    pain_level: z.enum(['low', 'medium', 'high'])
  }),
  solution: z.object({
    value_proposition: z.string(),
    key_features: z.array(z.string()),
    differentiators: z.array(z.string()),
    business_model: z.string(),
    revenue_streams: z.array(z.string())
  }),
  implementation: z.object({
    technical_complexity: z.enum(['low', 'medium', 'high']),
    time_to_market: z.string(),
    tech_stack: z.array(z.string()),
    team_capacity: z.string(),
    phases: z.array(z.object({
      phase: z.string(),
      duration: z.string(),
      description: z.string()
    })),
    milestones: z.array(z.string()),
    resource_requirements: z.array(z.string())
  }),
  success_metrics: z.object({
    viability_score: z.number().min(0).max(100),
    risk_factors: z.array(z.string()),
    success_indicators: z.array(z.string()),
    market_opportunity: z.enum(['low', 'medium', 'high'])
  }),
  ai_confidence_score: z.number().min(0).max(100)
})

export type ValidationData = z.infer<typeof validationResponseSchema>
