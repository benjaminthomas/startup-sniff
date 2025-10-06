'use server';

import { getCurrentSession } from '@/lib/auth/jwt';
import { UserDatabase } from '@/lib/auth/database';

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

    // For now, return default usage data since tables may not exist yet
    // This prevents the dashboard from breaking due to missing tables
    const usageData = {
      ideas_used: 0,
      validations_used: 0,
      content_used: 0,
      last_reset: new Date().toISOString()
    };

    console.log('✅ Final usage data being returned:', usageData);

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