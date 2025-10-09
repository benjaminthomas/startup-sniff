'use client';

import { useState, useEffect } from 'react';
import { getCurrentUserUsage, type UsageData } from '@/modules/usage';

export function useServerPlanLimits() {
  const [data, setData] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsageData() {
      try {
        setIsLoading(true);
        setError(null);
        
        const usageData = await getCurrentUserUsage();
        console.log('🔄 Server-side usage data received:', usageData);
        
        setData(usageData);
      } catch (err) {
        console.error('❌ Error fetching usage data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch usage data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchUsageData();
  }, []);

  const canUseFeature = (feature: string): boolean => {
    if (!data) return false;
    // Both pro plans have all features
    const proFeatures = ['unlimited_ai_generation', 'premium_templates', 'advanced_market_analysis', 'api_access', 'priority_support'];
    return proFeatures.includes(feature);
  };

  const getRemainingLimit = (type: 'ideas' | 'validations' | 'content'): number => {
    if (!data || !data.limits) return 0;
    
    const limitKey = `${type}_per_month` as keyof typeof data.limits;
    const usageKey = `${type}_used` as keyof typeof data.usage;
    
    const limit = data.limits[limitKey];
    if (limit === -1) return -1; // unlimited
    
    const used = data.usage?.[usageKey] ?? 0;
    const remaining = Math.max(0, limit - Number(used));
    
    console.log(`getRemainingLimit(${type}):`, {
      planType: data.planType,
      limit,
      used,
      remaining,
      usage: data.usage,
      hasLimits: !!data.limits
    });
    
    return remaining;
  };

  const getUsagePercentage = (type: 'ideas' | 'validations' | 'content'): number => {
    if (!data || !data.limits) return 0;
    
    const limitKey = `${type}_per_month` as keyof typeof data.limits;
    const usageKey = `${type}_used` as keyof typeof data.usage;
    
    const limit = data.limits[limitKey];
    if (limit === -1) return 0; // unlimited
    
    const used = data.usage?.[usageKey] ?? 0;
    return Math.min(100, (Number(used) / limit) * 100);
  };

  const isAtLimit = (type: 'ideas' | 'validations' | 'content'): boolean => {
    return getRemainingLimit(type) === 0;
  };

  // For now, just refresh the data - the server actions handle the actual incrementing
  const refreshUsage = async () => {
    try {
      const usageData = await getCurrentUserUsage();
      setData(usageData);
    } catch (err) {
      console.error('Error refreshing usage:', err);
    }
  };

  return {
    planType: data?.planType || 'free', // Default to free plan to be safe
    usage: data?.usage || {
      ideas_used: 0,
      validations_used: 0,
      content_used: 0,
      last_reset: new Date().toISOString()
    },
    isLoading,
    error,
    canUseFeature,
    getRemainingLimit,
    getUsagePercentage,
    isAtLimit,
    refreshUsage,
  };
}
