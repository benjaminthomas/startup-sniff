'use server';

import { getCurrentSession } from '@/modules/auth/services/jwt';
import { createServerAdminClient } from '@/modules/supabase';
import { log } from '@/lib/logger'

export async function getBillingHistory() {
  const session = await getCurrentSession();

  if (!session) {
    return { error: 'User not authenticated', transactions: [] };
  }

  const supabase = createServerAdminClient();

  try {
    const { data: transactions, error } = await supabase
      // @ts-ignore payment_transactions table exists but not in generated types yet
      .from('payment_transactions')
      .select('*')
      .eq('user_id', session.userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      log.error('Failed to fetch billing history:', error);
      return { error: 'Failed to load billing history', transactions: [] };
    }

    return { transactions: transactions || [] };
  } catch (error) {
    log.error('Billing history error:', error);
    return { error: 'Failed to load billing history', transactions: [] };
  }
}
