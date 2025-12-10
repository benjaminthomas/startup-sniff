import { createServerAdminClient } from '@/modules/supabase'

interface UsageLimits {
  canValidate: boolean
  error?: string
  validationsUsed: number
  validationsLimit: number
  planType: string
}

const PLAN_LIMITS = {
  free: { validations_per_month: 1 },
  pro_monthly: { validations_per_month: -1 }, // unlimited
  pro_yearly: { validations_per_month: -1 }, // unlimited
} as const

/**
 * Checks if user can perform validation based on their plan limits
 * Returns usage information and whether validation is allowed
 */
export async function checkValidationLimits(userId: string): Promise<UsageLimits> {
  const supabase = createServerAdminClient()

  // Get validations done this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: allValidatedIdeas } = await supabase
    .from('startup_ideas')
    .select('id, validation_data')
    .eq('user_id', userId)
    .eq('is_validated', true)

  // Filter to only count validations done this month
  const validationsThisMonth = allValidatedIdeas?.filter(validatedIdea => {
    const validationData = validatedIdea.validation_data as Record<string, unknown> | null
    if (!validationData?.validated_at) return false

    const validatedAt = new Date(validationData.validated_at as string)
    return validatedAt >= startOfMonth
  }).length || 0

  // Get user's plan limits
  const { data: user } = await supabase
    .from('users')
    .select('plan_type')
    .eq('id', userId)
    .single()

  const planType = user?.plan_type || 'free'
  const limit = PLAN_LIMITS[planType as keyof typeof PLAN_LIMITS]?.validations_per_month || 1

  console.log('📊 Validation limit check:', {
    planType,
    limit,
    used: validationsThisMonth,
    remaining: limit === -1 ? 'unlimited' : Math.max(0, limit - validationsThisMonth)
  })

  // Check if limit reached
  const limitReached = limit > 0 && validationsThisMonth >= limit

  return {
    canValidate: !limitReached,
    error: limitReached ? 'Monthly validation limit reached. Please upgrade your plan.' : undefined,
    validationsUsed: validationsThisMonth,
    validationsLimit: limit,
    planType
  }
}

/**
 * Updates usage limits after a validation is completed
 * Counts actual validated ideas to ensure accuracy
 */
export async function updateValidationUsage(userId: string): Promise<void> {
  const supabase = createServerAdminClient()

  // Count actual validated ideas to ensure accuracy
  const { data: validatedIdeas, error: countError } = await supabase
    .from('startup_ideas')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('is_validated', true)

  if (countError) {
    console.error('❌ Error counting validated ideas:', countError)
    return
  }

  const actualValidatedCount = validatedIdeas.length || 0
  console.log(`📊 Updating usage limits: ${actualValidatedCount} validations completed`)

  const { error: usageUpdateError } = await supabase
    .from('usage_limits')
    .update({
      validations_completed: actualValidatedCount,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)

  if (usageUpdateError) {
    console.error('❌ Usage limits update error:', usageUpdateError)
  } else {
    console.log('✅ Usage limits updated with actual count:', actualValidatedCount)
  }
}
