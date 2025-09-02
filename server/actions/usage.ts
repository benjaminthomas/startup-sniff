'use server';

import { createServerSupabaseClient } from '@/lib/auth/supabase-server';

export interface UsageData {
  planType: 'explorer' | 'founder' | 'growth';
  usage: {
    ideas_used: number;
    validations_used: number;
    content_used: number;
    last_reset: string;
  };
  limits: {
    ideas_per_month: number;
    validations_per_month: number;
    content_per_month: number;
  };
}

export async function getCurrentUserUsage(): Promise<UsageData | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('🔒 getCurrentUserUsage called for:', {
      userId: user?.id,
      userEmail: user?.email,
      authError: authError?.message
    });

    if (authError || !user) {
      console.log('❌ No authenticated user in getCurrentUserUsage');
      return null;
    }

    // Get user plan and usage data
    const [profileResult, usageLimitsResult] = await Promise.all([
      supabase.from('users').select('plan_type').eq('id', user.id).single(),
      supabase.from('usage_limits').select('*').eq('user_id', user.id).single()
    ]);

    console.log('📊 Server-side usage data:', {
      profile: profileResult.data,
      usageLimits: usageLimitsResult.data,
      errors: {
        profile: profileResult.error?.message,
        usage: usageLimitsResult.error?.message
      }
    });

    const planType = (profileResult.data?.plan_type as any) || 'explorer';

    // Plan limits configuration
    const PLAN_LIMITS = {
      explorer: {
        ideas_per_month: 3,
        validations_per_month: 1,
        content_per_month: 5,
      },
      founder: {
        ideas_per_month: 25,
        validations_per_month: 10,
        content_per_month: 50,
      },
      growth: {
        ideas_per_month: -1, // unlimited
        validations_per_month: -1, // unlimited
        content_per_month: -1, // unlimited
      }
    } as const;

    let usageData;

    if (usageLimitsResult.data && !usageLimitsResult.error) {
      // Get actual counts from startup_ideas to validate usage_limits data
      const [ideasResult, validatedIdeasResult] = await Promise.all([
        supabase
          .from('startup_ideas')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id),
        supabase
          .from('startup_ideas')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('is_validated', true)
      ]);

      const actualIdeasCount = ideasResult.count || 0;
      const actualValidatedCount = validatedIdeasResult.count || 0;
      const recordedIdeasCount = Number(usageLimitsResult.data.ideas_generated || 0);
      const recordedValidatedCount = Number(usageLimitsResult.data.validations_completed || 0);

      console.log('🔍 Comparing actual vs recorded usage:', {
        actual: { ideas: actualIdeasCount, validated: actualValidatedCount },
        recorded: { ideas: recordedIdeasCount, validated: recordedValidatedCount }
      });

      // Use actual counts (most reliable source)
      usageData = {
        ideas_used: actualIdeasCount,
        validations_used: actualValidatedCount,
        content_used: Number(usageLimitsResult.data.content_generated || 0),
        last_reset: usageLimitsResult.data.created_at || new Date().toISOString()
      };
    } else {
      // Fallback: count directly from startup_ideas
      const [ideasResult, validatedIdeasResult] = await Promise.all([
        supabase
          .from('startup_ideas')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id),
        supabase
          .from('startup_ideas')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('is_validated', true)
      ]);

      usageData = {
        ideas_used: ideasResult.count || 0,
        validations_used: validatedIdeasResult.count || 0,
        content_used: 0,
        last_reset: new Date().toISOString()
      };
    }

    console.log('✅ Final usage data being returned:', usageData);

    return {
      planType,
      usage: usageData,
      limits: PLAN_LIMITS[planType]
    };
  } catch (error) {
    console.error('💥 Error in getCurrentUserUsage:', error);
    return null;
  }
}