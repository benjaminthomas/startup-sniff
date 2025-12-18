'use client';

import { useState, useTransition } from 'react';
import { PRICING_PLANS } from '@/constants';
import { createSubscription } from '@/features/billing';
import { toast } from 'sonner';
import { usePaymentGateway } from '@/hooks/usePaymentGateway';
import { useSubscriptionUpgrade } from '@/hooks/useSubscriptionUpgrade';
import { PricingCard } from './PricingCard';

interface PricingCardsProps {
  currentPlanId: string;
  userId: string;
  userEmail?: string;
  hasActiveSubscription?: boolean;
}

export function PricingCards({
  currentPlanId,
  userEmail,
  hasActiveSubscription
}: PricingCardsProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const { scriptLoaded, scriptError, openPaymentGateway } = usePaymentGateway();

  const {
    proration,
    isUpgrading,
    handleUpgrade
  } = useSubscriptionUpgrade({
    currentPlanId,
    userEmail,
  });

  const handleSubscribe = (planId: string) => {
    if (scriptError) {
      toast.error('Payment gateway is unavailable. Please try again later.');
      return;
    }

    if (!scriptLoaded) {
      toast.info('Loading payment gateway...');
      return;
    }

    setSelectedPlan(planId);
    startTransition(async () => {
      const result = await createSubscription(planId);

      if (result?.error) {
        toast.error(result.error);
        setSelectedPlan(null);
        return;
      }

      if (!result?.success || !result.subscriptionId) {
        toast.error('Failed to create subscription');
        setSelectedPlan(null);
        return;
      }

      const planName = PRICING_PLANS.find(p => p.id === planId)?.name;

      await openPaymentGateway({
        subscriptionId: result.subscriptionId,
        name: 'Startup Sniff',
        description: `Subscribe to ${planName} plan`,
        email: userEmail || '',
        onSuccess: () => {
          toast.success('Subscription activated successfully!');
          window.location.href = '/dashboard/billing/success';
        },
        onError: () => {
          setSelectedPlan(null);
        },
      });
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {PRICING_PLANS.map((plan) => {
        const isLoading = selectedPlan === plan.id && isPending;

        return (
          <PricingCard
            key={plan.id}
            plan={plan}
            currentPlanId={currentPlanId}
            isLoading={isLoading}
            hasActiveSubscription={hasActiveSubscription}
            proration={proration}
            isUpgrading={isUpgrading}
            onSubscribe={handleSubscribe}
            onUpgrade={handleUpgrade}
          />
        );
      })}
    </div>
  );
}
