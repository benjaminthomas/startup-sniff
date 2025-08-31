'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/auth/supabase-client';
import { useRouter } from 'next/navigation';

// Plan limits configuration
export const PLAN_LIMITS = {
  explorer: {
    ideas_per_month: 3,
    validations_per_month: 1,
    content_per_month: 5,
    features: ['basic_ai_generation', 'basic_templates']
  },
  founder: {
    ideas_per_month: 25,
    validations_per_month: 10,
    content_per_month: 50,
    features: ['advanced_ai_generation', 'premium_templates', 'market_analysis', 'export_pdf']
  },
  growth: {
    ideas_per_month: -1, // unlimited
    validations_per_month: -1, // unlimited
    content_per_month: -1, // unlimited
    features: ['unlimited_ai_generation', 'premium_templates', 'advanced_market_analysis', 'api_access', 'priority_support']
  }
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;
export type FeatureType = string;

interface UsageStats {
  ideas_used: number;
  validations_used: number;
  content_used: number;
  last_reset: string;
}

interface PlanLimitsState {
  planType: PlanType;
  usage: UsageStats;
  isLoading: boolean;
  canUseFeature: (feature: string) => boolean;
  getRemainingLimit: (type: 'ideas' | 'validations' | 'content') => number;
  getUsagePercentage: (type: 'ideas' | 'validations' | 'content') => number;
  isAtLimit: (type: 'ideas' | 'validations' | 'content') => boolean;
  incrementUsage: (type: 'ideas' | 'validations' | 'content') => Promise<boolean>;
}

export function usePlanLimits(): PlanLimitsState {
  console.log('🚀 HOOK CALLED: usePlanLimits function executed');
  
  const [planType, setPlanType] = useState<PlanType>('explorer');
  // TEMPORARY FIX: Hardcode the correct usage to test the UI
  const [usage, setUsage] = useState<UsageStats>({
    ideas_used: 3,  // Changed from 0 to 3 to match database
    validations_used: 0,
    content_used: 0,
    last_reset: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(false);  // Changed to false
  const router = useRouter();

  // Add a dependency array and force re-fetch when needed
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  console.log('📊 HOOK STATE: Current usage state:', usage);

  useEffect(() => {
    console.log('⚡ USEEFFECT RUNNING: usePlanLimits useEffect triggered');
    let mounted = true;
    
    async function fetchPlanAndUsage() {
      console.log('🚀 usePlanLimits: fetchPlanAndUsage called, refreshTrigger:', refreshTrigger);
      
      if (!mounted) return;
      
      try {
        setIsLoading(true);
        const supabase = createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        console.log('👤 User auth result:', { user: user?.id, userError });

        if (!mounted || !user || userError) {
          console.log('❌ Early exit: no user or error');
          setIsLoading(false);
          return;
        }

        // Get user plan and usage in parallel
        const [profileResult, usageLimitsResult] = await Promise.all([
          supabase.from('users').select('plan_type').eq('id', user.id).single(),
          supabase.from('usage_limits').select('*').eq('user_id', user.id).single()
        ]);

        console.log('📊 Database results:', { 
          profile: profileResult.data, 
          profileError: profileResult.error,
          usageLimits: usageLimitsResult.data, 
          usageLimitsError: usageLimitsResult.error 
        });

        if (!mounted) return;

        // Set plan type
        if (profileResult.data) {
          const newPlanType = (profileResult.data.plan_type as PlanType) || 'explorer';
          console.log('📋 Setting plan type:', newPlanType);
          setPlanType(newPlanType);
        }

        // Set usage data
        if (usageLimitsResult.data && !usageLimitsResult.error) {
          const newUsage = {
            ideas_used: Number(usageLimitsResult.data.ideas_generated || 0),
            validations_used: Number(usageLimitsResult.data.validations_completed || 0),
            content_used: Number(usageLimitsResult.data.content_generated || 0),
            last_reset: usageLimitsResult.data.created_at || new Date().toISOString()
          };
          console.log('✅ Setting usage from usage_limits:', newUsage);
          setUsage(newUsage);
        } else {
          console.log('⚠️ No usage_limits record, counting from startup_ideas');
          const ideasResult = await supabase
            .from('startup_ideas')
            .select('id', { count: 'exact' })
            .eq('user_id', user.id);
            
          const newUsage = {
            ideas_used: ideasResult.count || 0,
            validations_used: 0,
            content_used: 0,
            last_reset: new Date().toISOString()
          };
          console.log('📝 Setting usage from startup_ideas count:', newUsage);
          setUsage(newUsage);
        }
      } catch (error) {
        console.error('💥 Error in fetchPlanAndUsage:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    fetchPlanAndUsage();
    
    return () => {
      mounted = false;
    };
  }, [refreshTrigger]);

  const canUseFeature = (feature: string): boolean => {
    return PLAN_LIMITS[planType].features.includes(feature);
  };

  const getRemainingLimit = (type: 'ideas' | 'validations' | 'content'): number => {
    // Use hardcoded limits for now, but in a real app this would come from the database
    const planLimits = PLAN_LIMITS[planType];
    const limitKey = `${type}_per_month` as keyof typeof planLimits;
    const usageKey = `${type}_used` as keyof UsageStats;
    
    const limit = planLimits[limitKey] as number;
    if (limit === -1) return -1; // unlimited
    
    const used = usage[usageKey] as number;
    const remaining = Math.max(0, limit - used);
    
    // Debug logging
    console.log(`getRemainingLimit(${type}):`, {
      planType,
      limit,
      used,
      remaining,
      usage
    });
    
    return remaining;
  };

  const getUsagePercentage = (type: 'ideas' | 'validations' | 'content'): number => {
    const planLimits = PLAN_LIMITS[planType];
    const limitKey = `${type}_per_month` as keyof typeof planLimits;
    const usageKey = `${type}_used` as keyof UsageStats;
    
    const limit = planLimits[limitKey] as number;
    if (limit === -1) return 0; // unlimited
    
    const used = usage[usageKey] as number;
    return Math.min(100, (used / limit) * 100);
  };

  const isAtLimit = (type: 'ideas' | 'validations' | 'content'): boolean => {
    return getRemainingLimit(type) === 0;
  };

  const incrementUsage = async (type: 'ideas' | 'validations' | 'content'): Promise<boolean> => {
    if (isAtLimit(type)) {
      return false; // Cannot increment, at limit
    }

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return false;

      // Update usage in database
      const updateField = `${type}_generated`;
      const currentUsage = usage[`${type}_used` as keyof UsageStats] as number;
      
      await supabase
        .from('usage_limits')
        .upsert({
          user_id: user.id,
          [updateField]: currentUsage + 1,
          updated_at: new Date().toISOString()
        });

      // Update local state
      setUsage(prev => ({
        ...prev,
        [`${type}_used`]: currentUsage + 1
      }));

      return true;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }
  };

  return {
    planType,
    usage,
    isLoading,
    canUseFeature,
    getRemainingLimit,
    getUsagePercentage,
    isAtLimit,
    incrementUsage,
  };
}