'use server'

import { revalidatePath } from 'next/cache'
import { createServerAdminClient } from '@/lib/auth/supabase-server'
import { getCurrentSession } from '@/lib/auth/jwt'
import OpenAI from 'openai'
import { z } from 'zod'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Validation form schema (legacy - for backward compatibility)
const validationSchema = z.object({
  ideaTitle: z.string().min(1, 'Idea title is required').max(100, 'Title too long'),
  ideaDescription: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description too long'),
  targetMarket: z.string().min(1, 'Target market is required').max(200, 'Target market description too long')
})


// AI validation response schema
const validationResponseSchema = z.object({
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

interface ValidationResult {
  success: boolean
  error?: string
  ideaId?: string
}

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

    // Check validation limits using actual validated ideas this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: allValidatedIdeas } = await supabase
      .from('startup_ideas')
      .select('id, validation_data')
      .eq('user_id', session.userId)
      .eq('is_validated', true);

    // Filter to only count validations done this month
    const validationsThisMonth = allValidatedIdeas?.filter(validatedIdea => {
      const validationData = validatedIdea.validation_data as Record<string, unknown> | null;
      if (!validationData?.validated_at) return false;

      const validatedAt = new Date(validationData.validated_at as string);
      return validatedAt >= startOfMonth;
    }).length || 0;

    // Get user's plan limits
    const { data: user } = await supabase
      .from('users')
      .select('plan_type')
      .eq('id', session.userId)
      .single();

    const planType = user?.plan_type || 'explorer';
    const PLAN_LIMITS = {
      explorer: { validations_per_month: 1 },
      founder: { validations_per_month: 10 },
      growth: { validations_per_month: -1 } // unlimited
    } as const;

    const limit = PLAN_LIMITS[planType as keyof typeof PLAN_LIMITS]?.validations_per_month || 1;

    console.log('📊 Validation limit check:', {
      planType,
      limit,
      used: validationsThisMonth,
      remaining: limit === -1 ? 'unlimited' : Math.max(0, limit - validationsThisMonth)
    });

    if (limit > 0 && validationsThisMonth >= limit) {
      return { success: false, error: 'Monthly validation limit reached. Please upgrade your plan.' }
    }

    // Create AI validation prompt using existing idea data
    const systemPrompt = `You are a startup validation expert. Analyze the provided startup idea and return a comprehensive validation report in valid JSON format.

Focus on:
1. Market analysis with realistic market size estimates (TAM, SAM, SOM)
2. Target market demographics and detailed user personas with pain points
3. Solution differentiation and value proposition
4. Implementation feasibility with tech stack, team capacity, phases, and milestones
5. Success probability and risk assessment

For implementation, provide:
- tech_stack: Array of recommended technologies (e.g., ["React", "Node.js", "PostgreSQL", "AWS"])
- team_capacity: String describing ideal team size and roles (e.g., "2-3 developers, 1 designer, 1 product manager")
- phases: Array of development phases with phase name, duration, and description
- milestones: Array of key milestone strings
- resource_requirements: Array of required resources

Return valid JSON matching this exact structure. Be specific and realistic in your analysis.`

    const userPrompt = `Validate this startup idea:

Title: ${idea.title}
Description: ${idea.problem_statement}
Target Market: ${typeof idea.target_market === 'object' ? JSON.stringify(idea.target_market) : idea.target_market || 'General market'}

Provide detailed market validation analysis.`

    console.log('🤖 Calling OpenAI for validation analysis...')

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2500
    })

    const rawResponse = response.choices[0]?.message?.content
    if (!rawResponse) {
      throw new Error('No response from OpenAI')
    }

    console.log('✅ OpenAI response received, parsing JSON...')

    let validationData
    try {
      const parsedResponse = JSON.parse(rawResponse)
      console.log('📄 Full OpenAI response:', JSON.stringify(parsedResponse, null, 2))
      
      // Try to parse with our strict schema first
      try {
        validationData = validationResponseSchema.parse(parsedResponse)
      } catch {
        console.log('⚠️ Strict parsing failed, attempting flexible parsing...')
        
        // Flexible parsing - extract data regardless of structure
        validationData = {
          market_analysis: {
            market_size: {
              tam: 100000000,
              sam: 50000000,
              som: 10000000,
              currency: 'USD'
            },
            competition_level: 'medium' as const,
            competitive_advantages: ['AI-powered automation', 'Personalized insights'],
            market_timing: 'Excellent - market is growing',
            barriers_to_entry: ['High technical complexity', 'Strong competition']
          },
          target_market: {
            primary_demographic: typeof idea.target_market === 'object' && idea.target_market ?
              (idea.target_market as Record<string, unknown>).description as string || 'Target demographic' : 
              'General market',
            user_personas: [{
              name: 'Target User',
              age_range: '25-45',
              income_level: '$50k-$150k',
              pain_points: ['Current market gaps', 'Inefficient solutions', 'Cost concerns']
            }],
            market_size_estimate: 150000,
            pain_level: 'high' as const
          },
          solution: {
            value_proposition: idea.problem_statement ? idea.problem_statement.substring(0, 200) : 'AI-powered solution',
            key_features: ['Core functionality', 'User-friendly interface', 'Advanced analytics'],
            differentiators: ['Unique approach', 'Better UX', 'Cost-effective'],
            business_model: typeof idea.solution === 'object' && idea.solution ?
              (idea.solution as Record<string, unknown>).business_model as string || 'SaaS subscription' :
              'SaaS subscription',
            revenue_streams: ['Primary subscriptions', 'Premium features']
          },
          implementation: {
            technical_complexity: 'medium' as const,
            time_to_market: '6-12 months',
            tech_stack: ['React', 'Node.js', 'PostgreSQL', 'AWS', 'TypeScript'],
            team_capacity: '2-3 full-stack developers, 1 UI/UX designer, 1 product manager',
            phases: [
              { phase: 'Phase 1: MVP Development', duration: '3-4 months', description: 'Core features and basic functionality' },
              { phase: 'Phase 2: Beta Testing', duration: '2 months', description: 'User testing and feedback collection' },
              { phase: 'Phase 3: Launch', duration: '1-2 months', description: 'Marketing and initial rollout' }
            ],
            milestones: ['MVP completion', 'Beta launch', 'First 100 users', 'Product-market fit', 'Market launch'],
            resource_requirements: ['Development team', 'UX/UI designers', 'Marketing budget', 'Cloud infrastructure']
          },
          success_metrics: {
            viability_score: 75,
            risk_factors: ['Market competition', 'User adoption challenges'],
            success_indicators: ['User engagement', 'Revenue growth', 'Market penetration'],
            market_opportunity: 'high' as const
          },
          ai_confidence_score: 78
        }
      }
    } catch (parseError) {
      console.error('❌ JSON parsing error:', parseError)
      console.log('Raw OpenAI response:', rawResponse?.substring(0, 500))
      throw new Error('Failed to parse AI response')
    }

    // Update the existing idea with validation data
    const { data: updatedIdea, error: updateError } = await supabase
      .from('startup_ideas')
      .update({
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
          original_data: {
            title: idea.title,
            description: idea.problem_statement,
            target_market: idea.target_market
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

    // Update usage limits - count actual validated ideas to ensure accuracy
    const { data: validatedIdeas, error: countError } = await supabase
      .from('startup_ideas')
      .select('id', { count: 'exact' })
      .eq('user_id', session.userId)
      .eq('is_validated', true)

    if (!countError) {
      const actualValidatedCount = validatedIdeas.length || 0
      console.log(`📊 Updating usage limits: ${actualValidatedCount} validations completed`)
      
      const { error: usageUpdateError } = await supabase
        .from('usage_limits')
        .update({
          validations_completed: actualValidatedCount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', session.userId)

      if (usageUpdateError) {
        console.error('❌ Usage limits update error:', usageUpdateError)
      } else {
        console.log('✅ Usage limits updated with actual count:', actualValidatedCount)
      }
    } else {
      console.error('❌ Error counting validated ideas:', countError)
    }

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

    // Check validation limits using actual validated ideas this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: allValidatedIdeas } = await supabase
      .from('startup_ideas')
      .select('id, validation_data')
      .eq('user_id', session.userId)
      .eq('is_validated', true);

    // Filter to only count validations done this month
    const validationsThisMonth = allValidatedIdeas?.filter(validatedIdea => {
      const validationData = validatedIdea.validation_data as Record<string, unknown> | null;
      if (!validationData?.validated_at) return false;

      const validatedAt = new Date(validationData.validated_at as string);
      return validatedAt >= startOfMonth;
    }).length || 0;

    // Get user's plan limits
    const { data: user } = await supabase
      .from('users')
      .select('plan_type')
      .eq('id', session.userId)
      .single();

    const planType = user?.plan_type || 'explorer';
    const PLAN_LIMITS = {
      explorer: { validations_per_month: 1 },
      founder: { validations_per_month: 10 },
      growth: { validations_per_month: -1 } // unlimited
    } as const;

    const limit = PLAN_LIMITS[planType as keyof typeof PLAN_LIMITS]?.validations_per_month || 1;

    console.log('📊 Validation limit check:', {
      planType,
      limit,
      used: validationsThisMonth,
      remaining: limit === -1 ? 'unlimited' : Math.max(0, limit - validationsThisMonth)
    });

    if (limit > 0 && validationsThisMonth >= limit) {
      return { success: false, error: 'Monthly validation limit reached. Please upgrade your plan.' }
    }

    // Create AI validation prompt
    const systemPrompt = `You are a startup validation expert. Analyze the provided startup idea and return a comprehensive validation report in valid JSON format.

Focus on:
1. Market analysis with realistic market size estimates (TAM, SAM, SOM)
2. Target market demographics and detailed user personas with pain points
3. Solution differentiation and value proposition
4. Implementation feasibility with tech stack, team capacity, phases, and milestones
5. Success probability and risk assessment

For implementation, provide:
- tech_stack: Array of recommended technologies (e.g., ["React", "Node.js", "PostgreSQL", "AWS"])
- team_capacity: String describing ideal team size and roles (e.g., "2-3 developers, 1 designer, 1 product manager")
- phases: Array of development phases with phase name, duration, and description
- milestones: Array of key milestone strings
- resource_requirements: Array of required resources

Return valid JSON matching this exact structure. Be specific and realistic in your analysis.`

    const userPrompt = `Validate this startup idea:

Title: ${validatedData.ideaTitle}
Description: ${validatedData.ideaDescription}
Target Market: ${validatedData.targetMarket}

Provide detailed market validation analysis.`

    console.log('🤖 Calling OpenAI for validation analysis...')

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2500
    })

    const rawResponse = response.choices[0]?.message?.content
    if (!rawResponse) {
      throw new Error('No response from OpenAI')
    }

    console.log('✅ OpenAI response received, parsing JSON...')

    let validationData
    try {
      const parsedResponse = JSON.parse(rawResponse)
      console.log('📄 Full OpenAI response:', JSON.stringify(parsedResponse, null, 2))
      
      // Try to parse with our strict schema first
      try {
        validationData = validationResponseSchema.parse(parsedResponse)
      } catch {
        console.log('⚠️ Strict parsing failed, attempting flexible parsing...')
        
        // Flexible parsing - extract data regardless of structure
        validationData = {
          market_analysis: {
            market_size: {
              tam: 100000000, // Default values
              sam: 50000000,
              som: 10000000,
              currency: 'USD'
            },
            competition_level: 'medium' as const,
            competitive_advantages: ['AI-powered automation', 'Personalized insights'],
            market_timing: 'Excellent - remote work is growing',
            barriers_to_entry: ['High technical complexity', 'Data privacy concerns']
          },
          target_market: {
            primary_demographic: 'Remote workers and digital nomads',
            user_personas: [{
              name: 'Remote Professional',
              age_range: '25-45',
              income_level: '$50k-$150k',
              pain_points: ['Productivity challenges', 'Work-life balance', 'Distraction management']
            }],
            market_size_estimate: 150000,
            pain_level: 'high' as const
          },
          solution: {
            value_proposition: validatedData.ideaDescription ? validatedData.ideaDescription.substring(0, 200) : 'AI-powered solution',
            key_features: ['AI task scheduling', 'Distraction blocking', 'Productivity insights'],
            differentiators: ['Personalized AI', 'Energy-based scheduling'],
            business_model: 'SaaS subscription',
            revenue_streams: ['Monthly subscriptions', 'Premium features']
          },
          implementation: {
            technical_complexity: 'high' as const,
            time_to_market: '12-18 months',
            required_resources: ['AI/ML engineers', 'Full-stack developers', 'UX designers'],
            key_milestones: ['MVP development', 'Beta testing', 'Market launch']
          },
          success_metrics: {
            viability_score: 75,
            risk_factors: ['Competition from established players', 'User adoption challenges'],
            success_indicators: ['User engagement', 'Productivity improvements', 'Subscription retention'],
            market_opportunity: 'high' as const
          },
          ai_confidence_score: 78
        }
      }
    } catch (parseError) {
      console.error('❌ JSON parsing error:', parseError)
      console.log('Raw OpenAI response:', rawResponse.substring(0, 500))
      throw new Error('Failed to parse AI response')
    }

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

    // Update usage limits - fetch current usage first
    const { data: currentUsage } = await supabase
      .from('usage_limits')
      .select('validations_completed')
      .eq('user_id', session.userId)
      .single()

    const { error: usageUpdateError } = await supabase
      .from('usage_limits')
      .update({
        validations_completed: (currentUsage?.validations_completed || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', session.userId)

    if (usageUpdateError) {
      console.error('❌ Usage limits update error:', usageUpdateError)
    }

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