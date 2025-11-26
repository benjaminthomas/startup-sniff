/**
 * Epic 2 Validation Metrics - Story 2.12
 *
 * Calculates key success metrics to determine if Epic 2 is meeting goals:
 * - Free-to-paid conversion rate
 * - Message send rate
 * - Template response rate
 * - Monthly Recurring Revenue (MRR)
 * - Churn rate
 */

import { createServerAdminClient } from '@/modules/supabase/server';

export type MetricZone = 'GREEN' | 'YELLOW' | 'RED';

export interface Epic2Metrics {
  // Conversion Metrics
  freeToPaidConversion: {
    rate: number; // Percentage
    total: number; // Total conversions
    zone: MetricZone;
    target: string;
  };

  // Engagement Metrics
  messageSendRate: {
    rate: number; // Percentage of paid users who sent messages
    totalSent: number; // Total messages sent
    zone: MetricZone;
    target: string;
  };

  // Response Metrics
  responseRate: {
    rate: number; // Percentage of sent messages that got replies
    totalReplies: number;
    zone: MetricZone;
    target: string;
  };

  // Revenue Metrics
  mrr: {
    amount: number; // Monthly Recurring Revenue in currency
    subscribers: number; // Active paying subscribers
    zone: MetricZone;
    target: string;
  };

  // Retention Metrics
  churnRate: {
    rate: number; // Percentage of subscribers who cancelled
    churned: number;
    zone: MetricZone;
    target: string;
  };

  // Overall Recommendation
  recommendation: {
    status: 'PROCEED_TO_EPIC_3' | 'ITERATE' | 'PIVOT';
    message: string;
    greenCount: number;
    yellowCount: number;
    redCount: number;
  };

  // Cohort Data
  cohorts: {
    byPlanType: Array<{
      planType: string;
      users: number;
      messagesSent: number;
      avgResponseRate: number;
    }>;
  };

  // Metadata
  calculatedAt: string;
  timeRange: string;
}

/**
 * Calculate Epic 2 validation metrics
 */
export async function calculateEpic2Metrics(days: number = 30): Promise<Epic2Metrics> {
  const supabase = createServerAdminClient();
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // 1. FREE-TO-PAID CONVERSION RATE
  const { data: allUsers } = await supabase
    .from('users')
    .select('id, plan_type, created_at')
    .gte('created_at', startDate.toISOString());

  const totalUsers = allUsers?.length || 0;
  const paidUsers = allUsers?.filter(u =>
    u.plan_type === 'pro_monthly' || u.plan_type === 'pro_yearly'
  ).length || 0;

  const conversionRate = totalUsers > 0 ? (paidUsers / totalUsers) * 100 : 0;
  const conversionZone: MetricZone =
    conversionRate >= 5 ? 'GREEN' :
    conversionRate >= 3 ? 'YELLOW' : 'RED';

  // 2. MESSAGE SEND RATE (% of paid users who sent messages)
  const { data: paidUsersList } = await supabase
    .from('users')
    .select('id')
    .in('plan_type', ['pro_monthly', 'pro_yearly']);

  const totalPaidUsers = paidUsersList?.length || 0;

  const { data: messagesSent } = await supabase
    .from('messages')
    .select('user_id, send_status')
    .eq('send_status', 'sent')
    .gte('sent_at', startDate.toISOString());

  const uniqueSenders = new Set(messagesSent?.map(m => m.user_id) || []).size;
  const sendRate = totalPaidUsers > 0 ? (uniqueSenders / totalPaidUsers) * 100 : 0;
  const sendZone: MetricZone =
    sendRate >= 10 ? 'GREEN' :
    sendRate >= 5 ? 'YELLOW' : 'RED';

  // 3. TEMPLATE RESPONSE RATE
  const totalMessagesSent = messagesSent?.length || 0;
  const { data: repliedMessages } = await supabase
    .from('messages')
    .select('id')
    .eq('outcome', 'replied')
    .gte('sent_at', startDate.toISOString());

  const totalReplies = repliedMessages?.length || 0;
  const responseRate = totalMessagesSent > 0 ? (totalReplies / totalMessagesSent) * 100 : 0;
  const responseZone: MetricZone =
    responseRate >= 15 ? 'GREEN' :
    responseRate >= 10 ? 'YELLOW' : 'RED';

  // 4. MONTHLY RECURRING REVENUE (MRR)
  const { data: activeSubscriptions } = await supabase
    .from('subscriptions')
    .select('plan_type, razorpay_plan_id')
    .eq('status', 'active');

  const subscribers = activeSubscriptions?.length || 0;

  // Calculate MRR based on plan types
  // Pro Monthly: $20/month, Pro Yearly: $290/year = ~$24.17/month
  let mrr = 0;
  activeSubscriptions?.forEach(sub => {
    if (sub.plan_type === 'pro_monthly') {
      mrr += 20;
    } else if (sub.plan_type === 'pro_yearly') {
      mrr += 290 / 12; // ~$24.17
    }
  });

  const mrrZone: MetricZone =
    mrr >= 200 ? 'GREEN' :
    mrr >= 100 ? 'YELLOW' : 'RED';

  // 5. CHURN RATE (cancelled subscriptions)
  const { data: allSubscriptions } = await supabase
    .from('subscriptions')
    .select('status, created_at')
    .gte('created_at', startDate.toISOString());

  const totalSubs = allSubscriptions?.length || 0;
  const cancelledSubs = allSubscriptions?.filter(s => s.status === 'cancelled').length || 0;
  const churnRate = totalSubs > 0 ? (cancelledSubs / totalSubs) * 100 : 0;
  const churnZone: MetricZone =
    churnRate < 15 ? 'GREEN' :
    churnRate < 25 ? 'YELLOW' : 'RED';

  // 6. COHORT ANALYSIS
  const cohorts = await calculateCohorts(startDate);

  // 7. RECOMMENDATION ENGINE
  const zones = [conversionZone, sendZone, responseZone, mrrZone, churnZone];
  const greenCount = zones.filter(z => z === 'GREEN').length;
  const yellowCount = zones.filter(z => z === 'YELLOW').length;
  const redCount = zones.filter(z => z === 'RED').length;

  let recommendation: Epic2Metrics['recommendation'];

  if (greenCount >= 4) {
    // 4+ green zones = proceed
    recommendation = {
      status: 'PROCEED_TO_EPIC_3',
      message: 'Epic 2 is performing well! Ready to proceed to Epic 3 (Network Intelligence).',
      greenCount,
      yellowCount,
      redCount
    };
  } else if (redCount >= 3) {
    // 3+ red zones = pivot
    recommendation = {
      status: 'PIVOT',
      message: 'Critical metrics are underperforming. Consider pivoting strategy or adjusting pricing/features.',
      greenCount,
      yellowCount,
      redCount
    };
  } else {
    // Mixed results = iterate
    recommendation = {
      status: 'ITERATE',
      message: 'Some metrics need improvement. Focus on optimizing templates, pricing, or user onboarding.',
      greenCount,
      yellowCount,
      redCount
    };
  }

  return {
    freeToPaidConversion: {
      rate: parseFloat(conversionRate.toFixed(2)),
      total: paidUsers,
      zone: conversionZone,
      target: '≥5% GREEN, 3-5% YELLOW, <3% RED'
    },
    messageSendRate: {
      rate: parseFloat(sendRate.toFixed(2)),
      totalSent: totalMessagesSent,
      zone: sendZone,
      target: '≥10% GREEN, 5-10% YELLOW, <5% RED'
    },
    responseRate: {
      rate: parseFloat(responseRate.toFixed(2)),
      totalReplies,
      zone: responseZone,
      target: '≥15% GREEN, 10-15% YELLOW, <10% RED'
    },
    mrr: {
      amount: parseFloat(mrr.toFixed(2)),
      subscribers,
      zone: mrrZone,
      target: '≥$200 GREEN, $100-200 YELLOW, <$100 RED'
    },
    churnRate: {
      rate: parseFloat(churnRate.toFixed(2)),
      churned: cancelledSubs,
      zone: churnZone,
      target: '<15% GREEN, 15-25% YELLOW, >25% RED'
    },
    recommendation,
    cohorts,
    calculatedAt: now.toISOString(),
    timeRange: `Last ${days} days`
  };
}

/**
 * Calculate cohort analysis data
 */
async function calculateCohorts(startDate: Date) {
  const supabase = createServerAdminClient();

  // Group by plan type
  const { data: users } = await supabase
    .from('users')
    .select('id, plan_type')
    .gte('created_at', startDate.toISOString());

  const { data: messages } = await supabase
    .from('messages')
    .select('user_id, send_status, outcome')
    .gte('sent_at', startDate.toISOString());

  const cohortMap = new Map<string, {
    users: Set<string>;
    messagesSent: number;
    repliesReceived: number;
  }>();

  // Initialize cohorts
  ['free', 'pro_monthly', 'pro_yearly'].forEach(plan => {
    cohortMap.set(plan, {
      users: new Set(),
      messagesSent: 0,
      repliesReceived: 0
    });
  });

  // Count users per plan
  users?.forEach(user => {
    const plan = user.plan_type || 'free';
    cohortMap.get(plan)?.users.add(user.id);
  });

  // Count messages per plan
  messages?.forEach(msg => {
    const user = users?.find(u => u.id === msg.user_id);
    if (!user) return;

    const plan = user.plan_type || 'free';
    const cohort = cohortMap.get(plan);

    if (cohort && msg.send_status === 'sent') {
      cohort.messagesSent++;
      if (msg.outcome === 'replied') {
        cohort.repliesReceived++;
      }
    }
  });

  // Format cohorts
  const byPlanType = Array.from(cohortMap.entries()).map(([planType, data]) => ({
    planType,
    users: data.users.size,
    messagesSent: data.messagesSent,
    avgResponseRate: data.messagesSent > 0
      ? parseFloat(((data.repliesReceived / data.messagesSent) * 100).toFixed(2))
      : 0
  }));

  return { byPlanType };
}

/**
 * Get formatted metric status
 */
export function getMetricStatus(zone: MetricZone): {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
} {
  switch (zone) {
    case 'GREEN':
      return {
        label: 'On Track',
        color: 'text-green-700',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      };
    case 'YELLOW':
      return {
        label: 'Needs Attention',
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      };
    case 'RED':
      return {
        label: 'Critical',
        color: 'text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
  }
}
