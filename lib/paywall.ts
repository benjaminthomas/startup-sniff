/**
 * Paywall Enforcement Utilities
 * Epic 2: Freemium Tier Management
 *
 * Controls access to premium features based on user subscription
 */

import { createServerAdminClient } from '@/modules/supabase';
import { getCurrentSession } from '@/modules/auth/services/jwt';
import { redirect } from 'next/navigation';
import { hasFullAccess, hasReadOnlyAccess } from '@/modules/billing/utils/subscription-status';

export interface PaywallCheckResult {
  hasAccess: boolean;
  accessLevel: 'full' | 'readonly' | 'none';
  planType: 'free' | 'pro_monthly' | 'pro_yearly';
  subscriptionStatus?: string | null;
  message?: string;
}

/**
 * Check if user has a paid plan (pro_monthly or pro_yearly)
 * Now also checks for expired subscriptions to determine access level
 */
export async function checkPaidAccess(): Promise<PaywallCheckResult> {
  const session = await getCurrentSession();

  if (!session) {
    return {
      hasAccess: false,
      accessLevel: 'none',
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
      accessLevel: 'none',
      planType: 'free',
      message: 'User not found'
    };
  }

  // Get the user's active or most recent subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', session.userId)
    .in('status', ['active', 'cancelled'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const planType = (user.plan_type as 'free' | 'pro_monthly' | 'pro_yearly') || 'free';
  const isPaidPlan = planType === 'pro_monthly' || planType === 'pro_yearly';

  // Check access level based on subscription status and expiration
  let accessLevel: 'full' | 'readonly' | 'none' = 'none';
  let hasAccess = false;
  let message: string | undefined;

  if (subscription) {
    // Check if user has full access (active subscription not expired)
    if (hasFullAccess(subscription)) {
      accessLevel = 'full';
      hasAccess = true;
    }
    // Check if user has read-only access (cancelled and expired)
    else if (hasReadOnlyAccess(subscription)) {
      accessLevel = 'readonly';
      hasAccess = false; // No access to new features, but can view old content
      message = 'Your subscription has expired. You can view previously generated ideas but cannot create new ones. Upgrade to continue.';
    }
    // Subscription exists but is inactive/cancelled without expiry check
    else {
      accessLevel = 'none';
      hasAccess = false;
      message = 'Subscription is inactive';
    }
  } else if (isPaidPlan) {
    // Has plan type but no subscription record (edge case)
    accessLevel = 'none';
    hasAccess = false;
    message = 'Subscription is inactive';
  } else {
    // Free user
    accessLevel = 'none';
    hasAccess = false;
    message = 'Upgrade to Pro to access this feature';
  }

  return {
    hasAccess,
    accessLevel,
    planType,
    subscriptionStatus: user.subscription_status,
    message
  };
}

/**
 * Enforce paid access on server component pages
 * Redirects to upgrade page if user doesn't have access
 *
 * @param feature - The feature being accessed
 * @param customMessage - Custom message to show on redirect
 * @param allowReadOnly - If true, allows users with expired subscriptions to view (but not create)
 */
export async function enforcePaidAccess(
  feature?: 'conversations' | 'contacts' | 'advanced_validation' | 'ideas',
  customMessage?: string,
  allowReadOnly: boolean = false
) {
  const result = await checkPaidAccess();

  // If user has full access, allow
  if (result.hasAccess) {
    return result;
  }

  // If read-only access is allowed and user has it, allow with warning
  if (allowReadOnly && result.accessLevel === 'readonly') {
    return result; // Let the page handle the read-only state
  }

  // Otherwise, redirect to billing page
  const featureMessages: Record<string, string> = {
    conversations: 'Conversation Tracking is a Pro feature. Track message outcomes, response rates, and customer conversions.',
    contacts: 'Contact Discovery is a Pro feature. Find and connect with people discussing pain points.',
    advanced_validation: 'Advanced Validation is a Pro feature. Get deeper market insights and validation scores.',
    ideas: 'Idea generation is a Pro feature. Generate unlimited startup ideas and validate them.'
  };

  const message = result.message || customMessage || (feature && featureMessages[feature]) || 'This feature requires a Pro plan';
  const encodedMessage = encodeURIComponent(message);
  redirect(`/dashboard/billing?upgrade=true&reason=${encodedMessage}`);
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
