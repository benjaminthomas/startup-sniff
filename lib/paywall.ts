/**
 * Paywall Enforcement Utilities
 * Epic 2: Freemium Tier Management
 *
 * Controls access to premium features based on user subscription
 */

import { createServerAdminClient } from '@/modules/supabase';
import { getCurrentSession } from '@/modules/auth/services/jwt';
import { redirect } from 'next/navigation';

export interface PaywallCheckResult {
  hasAccess: boolean;
  planType: 'free' | 'pro_monthly' | 'pro_yearly';
  subscriptionStatus?: string | null;
  message?: string;
}

/**
 * Check if user has a paid plan (pro_monthly or pro_yearly)
 */
export async function checkPaidAccess(): Promise<PaywallCheckResult> {
  const session = await getCurrentSession();

  if (!session) {
    return {
      hasAccess: false,
      planType: 'free',
      message: 'Authentication required'
    };
  }

  const supabase = createServerAdminClient();

  const { data: user } = await supabase
    .from('users')
    .select('plan_type, subscription_status')
    .eq('id', session.userId)
    .single();

  if (!user) {
    return {
      hasAccess: false,
      planType: 'free',
      message: 'User not found'
    };
  }

  const planType = (user.plan_type as 'free' | 'pro_monthly' | 'pro_yearly') || 'free';
  const isPaidPlan = planType === 'pro_monthly' || planType === 'pro_yearly';
  const hasActiveSubscription = user.subscription_status === 'active';

  return {
    hasAccess: isPaidPlan && hasActiveSubscription,
    planType,
    subscriptionStatus: user.subscription_status,
    message: isPaidPlan && !hasActiveSubscription
      ? 'Subscription is inactive'
      : !isPaidPlan
        ? 'Upgrade to Pro to access this feature'
        : undefined
  };
}

/**
 * Enforce paid access on server component pages
 * Redirects to upgrade page if user doesn't have access
 */
export async function enforcePaidAccess(
  feature?: 'conversations' | 'contacts' | 'advanced_validation',
  customMessage?: string
) {
  const result = await checkPaidAccess();

  if (!result.hasAccess) {
    const featureMessages: Record<string, string> = {
      conversations: 'Conversation Tracking is a Pro feature. Track message outcomes, response rates, and customer conversions.',
      contacts: 'Contact Discovery is a Pro feature. Find and connect with people discussing pain points.',
      advanced_validation: 'Advanced Validation is a Pro feature. Get deeper market insights and validation scores.'
    };

    const message = customMessage || (feature && featureMessages[feature]) || 'This feature requires a Pro plan';
    const encodedMessage = encodeURIComponent(message);
    redirect(`/dashboard/billing?upgrade=true&reason=${encodedMessage}`);
  }

  return result;
}

/**
 * Check if feature is available for user's plan
 */
export function isFeatureAvailable(
  feature: 'conversations' | 'contacts' | 'advanced_validation' | 'export',
  planType: 'free' | 'pro_monthly' | 'pro_yearly'
): boolean {
  const featureAccess: Record<string, ('free' | 'pro_monthly' | 'pro_yearly')[]> = {
    conversations: ['pro_monthly', 'pro_yearly'],
    contacts: ['pro_monthly', 'pro_yearly'],
    advanced_validation: ['pro_monthly', 'pro_yearly'],
    export: ['pro_monthly', 'pro_yearly'],
  };

  return featureAccess[feature]?.includes(planType) || false;
}
