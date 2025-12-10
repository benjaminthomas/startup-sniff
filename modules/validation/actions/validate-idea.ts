'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentSession } from '@/modules/auth/services/jwt'
import { createServerAdminClient } from '@/modules/supabase'
import { validateWithAI } from '../services/ai-validator'
import { checkValidationLimits, updateValidationUsage } from '../services/usage-checker'
import { validationSchema } from '../schemas/validation-schemas'

interface ValidationResult {
  success: boolean
  error?: string
  ideaId?: string
}

/**
 * Validates a new startup idea using AI analysis
 * Creates a new idea record with comprehensive validation data
 */
export async function validateIdea(formData: FormData): Promise<ValidationResult> {
  try {
    console.log('🚀 Starting idea validation...')

    // Get user session and validate authentication
    const session = await getCurrentSession()

    if (!session) {
      console.error('❌ Authentication required')
      return { success: false, error: 'Authentication required' }
    }

    const supabase = createServerAdminClient()

    // Validate form data
    const rawData = {
      ideaTitle: formData.get('ideaTitle') as string,
      ideaDescription: formData.get('ideaDescription') as string,
      targetMarket: formData.get('targetMarket') as string
    }

    console.log('📝 Form data received:', {
      ...rawData,
      ideaDescription: rawData.ideaDescription ? rawData.ideaDescription.substring(0, 50) + '...' : 'No description'
    })

    const validatedData = validationSchema.parse(rawData)

    // Check validation limits
    const limits = await checkValidationLimits(session.userId)
    if (!limits.canValidate) {
      return { success: false, error: limits.error }
    }

    // Validate with AI
    const validationData = await validateWithAI({
      title: validatedData.ideaTitle,
      description: validatedData.ideaDescription,
      targetMarket: validatedData.targetMarket
    })

    // Create new startup idea with validation data
    const { data: ideaData, error: ideaError } = await supabase
      .from('startup_ideas')
      .insert({
        user_id: session.userId,
        title: validatedData.ideaTitle,
        problem_statement: validatedData.ideaDescription,
        target_market: validationData.target_market,
        solution: validationData.solution,
        market_analysis: validationData.market_analysis,
        implementation: validationData.implementation,
        success_metrics: validationData.success_metrics,
        ai_confidence_score: validationData.ai_confidence_score,
        is_validated: true,
        validation_data: {
          validated_at: new Date().toISOString(),
          validation_method: 'ai_analysis',
          input_data: {
            title: validatedData.ideaTitle,
            description: validatedData.ideaDescription,
            target_market: validatedData.targetMarket
          }
        }
      })
      .select()
      .single()

    if (ideaError) {
      console.error('❌ Database error:', ideaError)
      throw new Error('Failed to save validated idea')
    }

    console.log('✅ Idea saved to database:', ideaData.id)

    // Update usage limits
    await updateValidationUsage(session.userId)

    console.log('✅ Usage limits updated')

    // Revalidate relevant pages
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/ideas')
    revalidatePath('/dashboard/validation')
    revalidatePath(`/dashboard/ideas/${ideaData.id}`)

    return { success: true, ideaId: ideaData.id }

  } catch (error) {
    console.error('💥 Validation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Validation failed'
    }
  }
}
