import { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/auth/supabase-server';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/features/dashboard/dashboard-shell';
import { PageHeader } from '@/components/ui/page-header';
import { PricingCards } from '@/components/features/billing/pricing-cards';
import { BillingHistory } from '@/components/features/billing/billing-history';
import { CurrentPlan } from '@/components/features/billing/current-plan';
import { PRICING_PLANS } from '@/constants';

export const metadata: Metadata = {
  title: 'Billing | StartupSniff',
  description: 'Manage your subscription and billing preferences',
};

export default async function BillingPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/signin');
  }

  // Get user profile and subscription data
  const [userProfile, subscription] = await Promise.allSettled([
    supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single(),
    supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single(),
  ]);

  const profile = userProfile.status === 'fulfilled' ? userProfile.value.data : null;
  const currentSubscription = subscription.status === 'fulfilled' ? subscription.value.data : null;

  // Use auth user data as fallback
  const displayUser = profile || {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || null,
    plan_type: 'explorer',
    subscription_status: 'trial',
  };

  const currentPlan = PRICING_PLANS.find(plan => plan.id === displayUser.plan_type) || PRICING_PLANS[0];

  return (
    <DashboardShell>
      <div className="space-y-6">
        <PageHeader
          title="Billing & Subscription"
          description="Manage your subscription and view billing history"
        />

        <CurrentPlan 
          currentPlan={currentPlan}
          subscription={currentSubscription}
          hasStripeCustomerId={!!profile?.stripe_customer_id}
        />

        <div>
          <h2 className="text-2xl font-semibold mb-6">Available Plans</h2>
          <PricingCards 
            currentPlanId={displayUser.plan_type}
            userId={user.id}
          />
        </div>

        {profile?.stripe_customer_id && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Billing History</h2>
            <BillingHistory userId={user.id} />
          </div>
        )}
      </div>
    </DashboardShell>
  );
}