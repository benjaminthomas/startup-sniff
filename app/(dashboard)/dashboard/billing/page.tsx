import { Metadata } from 'next';
import { createServerAdminClient } from '@/lib/auth/supabase-server';
import { getCurrentSession } from '@/lib/auth/jwt';
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
  const session = await getCurrentSession();

  if (!session) {
    redirect('/auth/signin');
  }

  const supabase = createServerAdminClient();

  // Get user profile (subscription table not yet implemented)
  const [userProfile] = await Promise.allSettled([
    supabase
      .from('users')
      .select('*')
      .eq('id', session.userId)
      .single(),
  ]);

  const profile = userProfile.status === 'fulfilled' ? userProfile.value.data : null;
  const currentSubscription = null; // TODO: Implement when subscriptions table is created

  // Use auth user data as fallback
  const displayUser = profile || {
    id: session.userId,
    email: session.email,
    full_name: null,
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
            currentPlanId={displayUser.plan_type || 'explorer'}
            userId={session.userId}
          />
        </div>

        {profile?.stripe_customer_id && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Billing History</h2>
            <BillingHistory userId={session.userId} />
          </div>
        )}
      </div>
    </DashboardShell>
  );
}