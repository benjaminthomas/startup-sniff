'use server';

import { getCurrentSession } from '@/modules/auth/services/jwt';
import { createServerSupabaseClient } from '@/modules/supabase/server';

export type TrialStatus = {
  planType: string | null;
  trialEndsAt: string | null;
  createdAt: string;
  isTrialActive: boolean;
  daysRemaining: number | null;
} | null;

/**
 * Get trial status for the current authenticated user
 * Returns null if user is not authenticated
 */
export async function getTrialStatus(): Promise<TrialStatus> {
  const session = await getCurrentSession();
  if (!session) return null;

  const supabase = await createServerSupabaseClient();

  const { data: profile, error } = await supabase
    .from('users')
    .select('plan_type, trial_ends_at, created_at')
    .eq('id', session.userId)
    .single();

  if (error || !profile) {
    console.error('Failed to fetch trial status:', error);
    return null;
  }

  // Calculate trial status
  const trialEndsAt = profile.trial_ends_at;
  let isTrialActive = false;
  let daysRemaining: number | null = null;

  // Trial users are on 'free' plan with trial_ends_at set
  if (trialEndsAt && profile.plan_type === 'free') {
    const trialEndDate = new Date(trialEndsAt);
    const now = new Date();
    isTrialActive = trialEndDate > now;

    if (isTrialActive) {
      const diffTime = trialEndDate.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
  }

  return {
    planType: profile.plan_type,
    trialEndsAt: trialEndsAt,
    createdAt: profile.created_at,
    isTrialActive,
    daysRemaining
  };
}
