'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentSession } from '@/modules/auth/services/jwt'
import { createServerAdminClient } from '@/modules/supabase'
import { validateWithAI } from '../services/ai-validator'
import { checkValidationLimits, updateValidationUsage } from '../services/usage-checker'

interface ValidationResult {
  success: boolean
  error?: string
  ideaId?: string
}

/**
 * Validates an existing idea that hasn't been validated yet
 * Uses AI to generate comprehensive market analysis and implementation plan
 */
export async function validateExistingIdea(ideaId: string): Promise<ValidationResult> {
  try {
    console.log('🚀 Starting existing idea validation for ID:', ideaId)

    // Get user session and validate authentication
    const session = await getCurrentSession()

    if (!session) {
      console.error('❌ Authentication required')
      return { success: false, error: 'Authentication required' }
    }

    const supabase = createServerAdminClient()

    // Get the existing idea
    const { data: idea, error: ideaError } = await supabase
      .from('startup_ideas')
      .select('*')
      .eq('id', ideaId)
      .eq('user_id', session.userId) // Ensure user owns this idea
      .single()

    if (ideaError || !idea) {
      console.error('❌ Idea not found:', ideaError)
      return { success: false, error: 'Idea not found' }
    }

    if (idea.is_validated) {
      return { success: false, error: 'Idea is already validated' }
    }

    // Check validation limits
    const limits = await checkValidationLimits(session.userId)
    if (!limits.canValidate) {
      return { success: false, error: limits.error }
    }

    // Validate with AI
    const targetMarketValue = typeof idea.target_market === 'string'
      ? idea.target_market
      : typeof idea.target_market === 'object' && idea.target_market !== null
        ? idea.target_market as Record<string, unknown>
        : 'General market'

    const validationData = await validateWithAI({
      title: idea.title,
      description: idea.problem_statement,
      targetMarket: targetMarketValue
    })

    // Update the existing idea with validation data
    // IMPORTANT: Merge solution data instead of replacing to preserve original description
    const existingSolution = typeof idea.solution === 'object' && idea.solution ? idea.solution as Record<string, unknown> : {}
    const mergedSolution = {
      // Preserve original description if it exists
      description: (existingSolution.description as string) || validationData.solution.value_proposition,
      unique_value_proposition: validationData.solution.value_proposition,
      // Preserve or update key features
      key_features: validationData.solution.key_features.length > 0
        ? validationData.solution.key_features
        : (existingSolution.key_features as string[] || []),
      // Preserve or update differentiators
      competitive_advantages: validationData.solution.differentiators.length > 0
        ? validationData.solution.differentiators
        : (existingSolution.competitive_advantages as string[] || []),
      // Update revenue model
      revenue_model: validationData.solution.revenue_streams,
      business_model: validationData.solution.business_model,
    }

    const { data: updatedIdea, error: updateError } = await supabase
      .from('startup_ideas')
      .update({
        target_market: validationData.target_market,
        solution: mergedSolution as never,
        market_analysis: validationData.market_analysis,
        implementation: validationData.implementation,
        success_metrics: validationData.success_metrics,
        ai_confidence_score: validationData.ai_confidence_score,
        is_validated: true,
        validation_data: {
          validated_at: new Date().toISOString(),
          validation_method: 'ai_analysis',
          original_data: {
            title: idea.title,
            description: idea.problem_statement,
            target_market: idea.target_market,
            solution: idea.solution
          }
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', ideaId)
      .eq('user_id', session.userId)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Database update error:', updateError)
      throw new Error('Failed to save validation data')
    }

    console.log('✅ Idea validation saved to database:', updatedIdea.id)

    // Update usage limits
    await updateValidationUsage(session.userId)

    // Revalidate relevant pages
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/ideas')
    revalidatePath('/dashboard/validation')
    revalidatePath(`/dashboard/ideas/${ideaId}`)

    return { success: true, ideaId: ideaId }

  } catch (error) {
    console.error('💥 Validation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Validation failed'
    }
  }
}
