'use server';

import { getCurrentSession } from '@/lib/auth/jwt';
import { createServerAdminClient } from '@/lib/auth/supabase-server';
import { PlanType } from '@/types/database';

interface PlanAndUsageData {
  planType: PlanType;
  usage: {
    ideas_used: number;
    validations_used: number;
    content_used: number;
    last_reset: string;
  };
}

export async function getUserPlanAndUsage(): Promise<PlanAndUsageData | null> {
  const session = await getCurrentSession();

  if (!session) {
    return null;
  }

  const supabase = createServerAdminClient();

  try {
    // Get user plan and usage in parallel
    const [profileResult, usageLimitsResult] = await Promise.all([
      supabase.from('users').select('plan_type').eq('id', session.userId).single(),
      supabase.from('usage_limits').select('*').eq('user_id', session.userId).single()
    ]);

    console.log('📊 Database results:', {
      profile: profileResult.data,
      profileError: profileResult.error,
      usageLimits: usageLimitsResult.data,
      usageLimitsError: usageLimitsResult.error
    });

    // Set plan type, default to pro_monthly if not set
    const planType = (profileResult.data?.plan_type as PlanType) || 'pro_monthly';

    // Set usage data with validation against actual data
    if (usageLimitsResult.data && !usageLimitsResult.error) {
      // Get actual counts from all tables to validate usage_limits data
      const [ideasResult, validatedIdeasResult, contentResult] = await Promise.all([
        supabase
          .from('startup_ideas')
          .select('id', { count: 'exact' })
          .eq('user_id', session.userId),
        supabase
          .from('startup_ideas')
          .select('id', { count: 'exact' })
          .eq('user_id', session.userId)
          .eq('is_validated', true),
        supabase
          .from('generated_content')
          .select('id', { count: 'exact' })
          .eq('user_id', session.userId)
      ]);

      const actualIdeasCount = ideasResult.count || 0;
      const actualValidatedCount = validatedIdeasResult.count || 0;
      const actualContentCount = contentResult.count || 0;
      const recordedIdeasCount = Number(usageLimitsResult.data.ideas_generated || 0);
      const recordedValidatedCount = Number(usageLimitsResult.data.validations_completed || 0);
      const recordedContentCount = 0; // Content is tracked separately in generated_content table

      // Check for data inconsistency and fix it
      if (actualIdeasCount !== recordedIdeasCount || actualValidatedCount !== recordedValidatedCount || actualContentCount !== recordedContentCount) {
        console.log('🔧 Data inconsistency detected, fixing usage_limits:', {
          actual: { ideas: actualIdeasCount, validated: actualValidatedCount, content: actualContentCount },
          recorded: { ideas: recordedIdeasCount, validated: recordedValidatedCount, content: recordedContentCount }
        });

        // Update usage_limits with correct data
        await supabase
          .from('usage_limits')
          .update({
            ideas_generated: actualIdeasCount,
            validations_completed: actualValidatedCount,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', session.userId);

        console.log('✅ Usage counters fixed in database');
      }

      return {
        planType,
        usage: {
          ideas_used: actualIdeasCount,
          validations_used: actualValidatedCount,
          content_used: actualContentCount,
          last_reset: usageLimitsResult.data.created_at || new Date().toISOString()
        }
      };
    } else {
      console.log('⚠️ No usage_limits record, counting from all tables');

      // Get actual counts from all tables
      const [ideasResult, validatedIdeasResult, contentResult] = await Promise.all([
        supabase
          .from('startup_ideas')
          .select('id', { count: 'exact' })
          .eq('user_id', session.userId),
        supabase
          .from('startup_ideas')
          .select('id', { count: 'exact' })
          .eq('user_id', session.userId)
          .eq('is_validated', true),
        supabase
          .from('generated_content')
          .select('id', { count: 'exact' })
          .eq('user_id', session.userId)
      ]);

      return {
        planType,
        usage: {
          ideas_used: ideasResult.count || 0,
          validations_used: validatedIdeasResult.count || 0,
          content_used: contentResult.count || 0,
          last_reset: new Date().toISOString()
        }
      };
    }
  } catch (error) {
    console.error('💥 Error in getUserPlanAndUsage:', error);
    return null;
  }
}

export async function incrementUsage(type: 'ideas' | 'validations' | 'content'): Promise<boolean> {
  const session = await getCurrentSession();

  if (!session) {
    return false;
  }

  try {
    const supabase = createServerAdminClient();

    // Get current usage
    const currentData = await getUserPlanAndUsage();
    if (!currentData) return false;

    // Update usage in database (content is tracked separately in generated_content table)
    if (type !== 'content') {
      const updateField = type === 'validations' ? 'validations_completed' : 'ideas_generated';
      const currentUsage = type === 'validations' ? currentData.usage.validations_used : currentData.usage.ideas_used;

      await supabase
        .from('usage_limits')
        .update({
          [updateField]: currentUsage + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', session.userId);
    }

    return true;
  } catch (error) {
    console.error('Error incrementing usage:', error);
    return false;
  }
}