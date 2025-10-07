'use server';

import { getCurrentSession } from '@/lib/auth/jwt';
import { UserDatabase } from '@/lib/auth/database';
import { createServerAdminClient } from '@/lib/auth/supabase-server';

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
    const user = await UserDatabase.findById(session.userId);
    if (!user) {
      console.log('❌ User not found in database');
      return null;
    }

    const planType = user.plan_type || 'explorer';

    console.log('📊 Server-side usage data:', {
      userId: user.id,
      planType: planType,
      userEmail: user.email
    });

    // Plan limits configuration
    const PLAN_LIMITS = {
      explorer: {
        ideas_per_month: 3,
        validations_per_month: 1,
        content_per_month: 3, // Updated from 5 to 3
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

    return {
      planType,
      usage: usageData,
      limits: PLAN_LIMITS[planType as keyof typeof PLAN_LIMITS]
    };
  } catch (error) {
    console.error('💥 Error in getCurrentUserUsage:', error);
    return null;
  }
}