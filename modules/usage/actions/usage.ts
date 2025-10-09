'use server';

import { getCurrentSession, UserDatabase } from '@/modules/auth';
import { createServerAdminClient } from '@/modules/supabase';
import { PlanType } from '@/types/database';

export interface UsageData {
  planType: PlanType;
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
    const session = await getCurrentSession();

    console.log('🔒 getCurrentUserUsage called for:', {
      userId: session?.userId,
      userEmail: session?.email,
      authError: session ? null : 'Auth session missing!'
    });

    if (!session) {
      console.log('❌ No authenticated user in getCurrentUserUsage');
      return null;
    }

    // Get user data from database instead of Supabase
    console.log('🔍 Looking up user in database:', session.userId);
    const user = await UserDatabase.findById(session.userId);
    
    if (!user) {
      console.error('❌ User not found in database:', {
        userId: session.userId,
        email: session.email,
        sessionId: session.sessionId
      });
      return null;
    }
    
    console.log('✅ User found in database:', {
      userId: user.id,
      email: user.email,
      planType: user.plan_type
    });

    // Ensure user has a valid plan type, default to free if not set
    const planType = (user.plan_type || 'free') as PlanType;

    console.log('📊 Server-side usage data:', {
      userId: user.id,
      planType: planType,
      userEmail: user.email
    });

    // Plan limits configuration
    const PLAN_LIMITS = {
      free: {
        ideas_per_month: 3, // 3 AI-generated ideas per month
        validations_per_month: 1, // 1 validation per month
        content_per_month: 2, // 2 content generations per month
      },
      pro_monthly: {
        ideas_per_month: -1, // unlimited
        validations_per_month: -1, // unlimited
        content_per_month: -1, // unlimited
      },
      pro_yearly: {
        ideas_per_month: -1, // unlimited
        validations_per_month: -1, // unlimited
        content_per_month: -1, // unlimited
      }
    } as const;

    // Get actual usage counts from the database
    const supabase = createServerAdminClient();

    // Count actual startup ideas generated this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: ideasCount } = await supabase
      .from('startup_ideas')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth.toISOString());

    const ideasUsed = ideasCount?.length || 0;

    // Count actual validations this month (by checking validation_data.validated_at)
    const { data: allValidatedIdeas } = await supabase
      .from('startup_ideas')
      .select('id, validation_data')
      .eq('user_id', user.id)
      .eq('is_validated', true);

    // Filter to only count validations done this month
    const validationsUsed = allValidatedIdeas?.filter(idea => {
      const validationData = idea.validation_data as Record<string, unknown> | null;
      if (!validationData?.validated_at) return false;

      const validatedAt = new Date(validationData.validated_at as string);
      return validatedAt >= startOfMonth;
    }).length || 0;

    // Count actual content pieces generated this month
    const { data: contentCount } = await supabase
      .from('generated_content')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth.toISOString());

    const contentUsed = contentCount?.length || 0;

    const usageData = {
      ideas_used: ideasUsed,
      validations_used: validationsUsed,
      content_used: contentUsed,
      last_reset: startOfMonth.toISOString()
    };

    console.log('✅ Final usage data being returned:', usageData);
    console.log('📅 Start of month:', startOfMonth.toISOString());
    console.log('📊 Validation count details:', {
      totalValidated: allValidatedIdeas?.length || 0,
      thisMonth: validationsUsed
    });

    const limits = PLAN_LIMITS[planType];
    
    // Ensure we always return a complete data structure
    const result: UsageData = {
      planType,
      usage: usageData,
      limits: limits || PLAN_LIMITS.free // Fallback to free plan limits
    };

    console.log('📦 Returning complete usage data with limits:', result);

    return result;
  } catch (error) {
    console.error('💥 Error in getCurrentUserUsage:', error);
    return null;
  }
}
