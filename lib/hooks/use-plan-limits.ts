'use client';

import { useState, useEffect } from 'react';
import { getUserPlanAndUsage, incrementUsage as incrementUsageAction } from '@/server/actions/plan-limits';

// Plan limits configuration
export const PLAN_LIMITS = {
  explorer: {
    ideas_per_month: 3,
    validations_per_month: 1,
    content_per_month: 3,
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
  const [usage, setUsage] = useState<UsageStats>({
    ideas_used: 0,
    validations_used: 0,
    content_used: 0,
    last_reset: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(false);  // Changed to false

  // Add a dependency array and force re-fetch when needed
  const [refreshTrigger] = useState(0);
  
  console.log('📊 HOOK STATE: Current usage state:', usage);

  useEffect(() => {
    console.log('⚡ USEEFFECT RUNNING: usePlanLimits useEffect triggered');
    let mounted = true;

    async function fetchPlanAndUsage() {
      console.log('🚀 usePlanLimits: fetchPlanAndUsage called, refreshTrigger:', refreshTrigger);

      if (!mounted) return;

      try {
        setIsLoading(true);

        const data = await getUserPlanAndUsage();

        if (!mounted || !data) {
          console.log('❌ Early exit: no data from server action');
          setIsLoading(false);
          return;
        }

        console.log('📊 Server action result:', data);

        // Set plan type and usage
        setPlanType(data.planType);
        setUsage(data.usage);

        console.log('✅ Plan and usage updated from server action');
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
    return (PLAN_LIMITS[planType].features as unknown as string[]).includes(feature);
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
      const success = await incrementUsageAction(type);

      if (success) {
        // Update local state
        const currentUsage = usage[`${type}_used` as keyof UsageStats] as number;
        setUsage(prev => ({
          ...prev,
          [`${type}_used`]: currentUsage + 1
        }));
      }

      return success;
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