import { Metadata } from 'next';
import { getCurrentSession } from '@/modules/auth/services/jwt';
import { createServerAdminClient } from '@/modules/supabase';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/features/dashboard/dashboard-shell';
import { PageHeader } from '@/components/ui/page-header';
import { PricingCards } from '@/components/features/billing/pricing-cards';
import { BillingHistory } from '@/components/features/billing/billing-history';
import { CurrentPlan } from '@/components/features/billing/current-plan';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { PRICING_PLANS } from '@/constants';

export const metadata: Metadata = {
  title: 'Billing | StartupSniff',
  description: 'Manage your subscription and billing preferences',
};

interface BillingPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function getFirstParamValue(param?: string | string[]) {
  if (!param) {
    return undefined;
  }

  return Array.isArray(param) ? param[0] : param;
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const params = await searchParams;
  const session = await getCurrentSession();

  if (!session) {
    redirect('/auth/signin');
  }

  const supabase = createServerAdminClient();

  // Query both user profile and active subscription
  const [userProfileResult, subscriptionResult] = await Promise.allSettled([
    supabase
      .from('users')
      .select('*')
      .eq('id', session.userId)
      .single(),
    supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.userId)
      .in('status', ['active', 'trial'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  const profile = userProfileResult.status === 'fulfilled' ? userProfileResult.value.data : null;
  const currentSubscription = subscriptionResult.status === 'fulfilled' ? subscriptionResult.value.data : null;

  // Use auth user data as fallback
  const displayUser = profile || {
    id: session.userId,
    email: session.email,
    full_name: null,
    plan_type: 'free' as const,
    subscription_status: 'trial' as const,
  };

  const currentPlan = PRICING_PLANS.find(plan => plan.id === displayUser.plan_type) || PRICING_PLANS[0];
  const upgradeRequested = getFirstParamValue(params?.upgrade);
  const redirectReason = getFirstParamValue(params?.reason);
  const showRedirectNotice = Boolean(redirectReason || upgradeRequested !== undefined);

  return (
    <DashboardShell>
      <div className="space-y-6">
        {showRedirectNotice && (
          <Alert className="border-blue-200 bg-blue-50 text-blue-900">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle>Upgrade Required</AlertTitle>
            <AlertDescription className="mt-2">
              <div className="space-y-3">
                <p>
                  {redirectReason
                    ? redirectReason
                    : 'You were redirected here because this feature needs a paid StartupSniff plan.'}
                </p>
                <div>
                  <p className="font-medium mb-2">Review the plans below to get started:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    <li>Track all conversations and outcomes</li>
                    <li>Discover unlimited contacts from Reddit</li>
                    <li>Send personalized outreach messages</li>
                    <li>Access advanced analytics and metrics</li>
                  </ul>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <PageHeader
          title="Billing & Subscription"
          description="Manage your subscription and view billing history"
        />

        <CurrentPlan
          currentPlan={currentPlan}
          subscription={currentSubscription}
          hasRazorpayCustomerId={!!profile?.razorpay_customer_id}
        />

        <div>
          <h2 className="text-2xl font-semibold mb-6">Available Plans</h2>
          <PricingCards
            currentPlanId={displayUser.plan_type || 'free'}
            userId={session.userId}
            userEmail={session.email || displayUser.email || ''}
            hasActiveSubscription={!!currentSubscription}
          />
        </div>

        {profile?.razorpay_customer_id && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Billing History</h2>
            <BillingHistory userId={session.userId} />
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
