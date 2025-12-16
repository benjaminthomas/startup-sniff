'use server';

import { getCurrentSession } from '@/features/auth/services/jwt';
import { createServerAdminClient } from '@/features/supabase';
import { PlanType } from '@/types/database';
import { log } from '@/lib/logger'

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

    const typedProfile = profileResult.data as { plan_type: string | null } | null;
    const typedUsageLimits = usageLimitsResult.data as {
      ideas_generated: number | null;
      validations_completed: number | null;
      created_at: string;
    } | null;

    log.info('📊 Database results:', {
      profile: profileResult.data,
      profileError: profileResult.error,
      usageLimits: usageLimitsResult.data,
      usageLimitsError: usageLimitsResult.error
    });

    // Set plan type, default to free if not set
    const planType = (typedProfile?.plan_type as PlanType) || 'free';

    // Set usage data with validation against actual data
    if (typedUsageLimits && !usageLimitsResult.error) {
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
      const recordedIdeasCount = Number(typedUsageLimits.ideas_generated || 0);
      const recordedValidatedCount = Number(typedUsageLimits.validations_completed || 0);
      const recordedContentCount = 0; // Content is tracked separately in generated_content table

      // Check for data inconsistency and fix it
      if (actualIdeasCount !== recordedIdeasCount || actualValidatedCount !== recordedValidatedCount || actualContentCount !== recordedContentCount) {
        log.info('🔧 Data inconsistency detected, fixing usage_limits:', {
          actual: { ideas: actualIdeasCount, validated: actualValidatedCount, content: actualContentCount },
          recorded: { ideas: recordedIdeasCount, validated: recordedValidatedCount, content: recordedContentCount }
        });

        // Update usage_limits with correct data
        const updateResult = await supabase
          .from('usage_limits' as never)
          .update({
            ideas_generated: actualIdeasCount,
            validations_completed: actualValidatedCount,
            updated_at: new Date().toISOString()
          } as never)
          .eq('user_id', session.userId);

        log.info('✅ Usage counters update result:', {
          error: updateResult.error,
          status: updateResult.status,
          statusText: updateResult.statusText,
          newValues: {
            ideas_generated: actualIdeasCount,
            validations_completed: actualValidatedCount
          }
        });
      }

      return {
        planType,
        usage: {
          ideas_used: actualIdeasCount,
          validations_used: actualValidatedCount,
          content_used: actualContentCount,
          last_reset: typedUsageLimits.created_at || new Date().toISOString()
        }
      };
    } else {
      log.info('⚠️ No usage_limits record, counting from all tables and creating record');

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

      const actualIdeasCount = ideasResult.count || 0;
      const actualValidatedCount = validatedIdeasResult.count || 0;
      const actualContentCount = contentResult.count || 0;

      // Get plan limits based on plan type
      const planLimits = planType === 'free' 
        ? { ideas: 3, validations: 1 }
        : { ideas: -1, validations: -1 }; // Unlimited for pro plans

      // Create usage_limits record with actual counts
      const insertResult = await supabase
        .from('usage_limits' as never)
        .insert({
          user_id: session.userId,
          plan_type: planType,
          monthly_limit_ideas: planLimits.ideas,
          monthly_limit_validations: planLimits.validations,
          ideas_generated: actualIdeasCount,
          validations_completed: actualValidatedCount,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as never)
        .select()
        .single();

      log.info('✅ Created usage_limits record:', {
        error: insertResult.error,
        data: insertResult.data,
        values: {
          ideas_generated: actualIdeasCount,
          validations_completed: actualValidatedCount
        }
      });

      return {
        planType,
        usage: {
          ideas_used: actualIdeasCount,
          validations_used: actualValidatedCount,
          content_used: actualContentCount,
          last_reset: new Date().toISOString()
        }
      };
    }
  } catch (error) {
    log.error('💥 Error in getUserPlanAndUsage:', error);
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
        .from('usage_limits' as never)
        .update({
          [updateField]: currentUsage + 1,
          updated_at: new Date().toISOString()
        } as never)
        .eq('user_id', session.userId);
    }

    return true;
  } catch (error) {
    log.error('Error incrementing usage:', error);
    return false;
  }
}
