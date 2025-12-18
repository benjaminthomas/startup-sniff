'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, Zap, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { formatRupees, type ProrationCalculation } from '@/features/billing/utils/proration';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  billingCycle?: 'monthly' | 'yearly';
  features: string[];
  popular?: boolean;
  badge?: string;
  priceId?: string;
  limits: {
    ideas: number;
    validations: number;
  };
}

interface PricingCardProps {
  plan: PricingPlan;
  currentPlanId: string;
  isLoading: boolean;
  hasActiveSubscription?: boolean;
  proration?: ProrationCalculation | null;
  isUpgrading?: boolean;
  onSubscribe: (planId: string) => void;
  onUpgrade?: (planId: string) => void;
}

function ProrationDetails({ proration }: { proration: ProrationCalculation }) {
  return (
    <div className="rounded-lg border p-3 bg-muted/50 space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Days remaining:</span>
        <span className="font-medium">{proration.daysRemaining} days</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Credit from unused time:</span>
        <span className="font-medium text-green-600">{formatRupees(proration.creditAmount)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Yearly subscription:</span>
        <span className="font-medium">{formatRupees(proration.newPlanAmount)}</span>
      </div>
      <div className="border-t pt-2 mt-2">
        <div className="flex justify-between font-semibold">
          <span>Amount due today:</span>
          <span className="text-primary">{formatRupees(proration.amountDue)}</span>
        </div>
      </div>
      <div className="text-xs text-center text-muted-foreground pt-1">
        Save {formatRupees(proration.savings)} compared to monthly billing!
      </div>
    </div>
  );
}

function PricingCardHeader({ plan, isCurrentPlan }: { plan: PricingPlan; isCurrentPlan: boolean }) {
  return (
    <CardHeader className="text-center">
      <CardTitle className="flex items-center justify-center gap-2">
        {plan.name}
        {plan.billingCycle && (
          <Badge variant="outline" className="font-normal">
            {plan.billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}
          </Badge>
        )}
        {isCurrentPlan && <Badge variant="secondary">Current</Badge>}
      </CardTitle>
      <CardDescription>
        {plan.billingCycle
          ? `${plan.name} plan - Billed ${plan.billingCycle}`
          : `${plan.name} plan features`}
      </CardDescription>
      <div className="mt-4">
        <span className="text-4xl font-bold">
          {formatCurrency(plan.price)}
        </span>
        {plan.price > 0 && (
          <span className="text-muted-foreground">
            {plan.billingCycle === 'yearly' ? '/year' : '/month'}
          </span>
        )}
        {plan.billingCycle === 'yearly' && (
          <div className="text-sm text-muted-foreground mt-1">
            ${Math.round(plan.price / 12)}/month when paid annually
          </div>
        )}
      </div>
    </CardHeader>
  );
}

function FeaturesList({ features }: { features: string[] }) {
  return (
    <ul className="space-y-3">
      {features.map((feature, index) => (
        <li key={index} className="flex items-start gap-3">
          <Check className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
          <span className="text-sm">{feature}</span>
        </li>
      ))}
    </ul>
  );
}

function ActionButton({
  plan,
  isCurrentPlan,
  isLoading,
  isUpgrading,
  hasActiveSubscription,
  currentPlanId,
  onSubscribe,
  onUpgrade,
}: {
  plan: PricingPlan;
  isCurrentPlan: boolean;
  isLoading: boolean;
  isUpgrading?: boolean;
  hasActiveSubscription?: boolean;
  currentPlanId: string;
  onSubscribe: (planId: string) => void;
  onUpgrade?: (planId: string) => void;
}) {
  if (isCurrentPlan) {
    return (
      <Button variant="outline" className="w-full" disabled>
        Current Plan
      </Button>
    );
  }

  // Upgrade button for monthly to yearly upgrade
  if (currentPlanId === 'pro_monthly' && plan.id === 'pro_yearly' && onUpgrade) {
    return (
      <Button
        className="w-full"
        onClick={() => onUpgrade(plan.id)}
        disabled={isUpgrading || !plan.priceId}
      >
        {isUpgrading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Upgrade...
          </>
        ) : (
          <>
            <TrendingUp className="mr-2 h-4 w-4" />
            Upgrade & Save 17%
          </>
        )}
      </Button>
    );
  }

  // Regular subscribe button
  return (
    <Button
      className="w-full"
      onClick={() => onSubscribe(plan.id)}
      disabled={isLoading || !plan.priceId || (hasActiveSubscription && plan.id !== 'free')}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : hasActiveSubscription && plan.id !== 'free' ? (
        'Already Subscribed'
      ) : plan.price === 0 ? (
        'Get Started Free'
      ) : (
        <>
          <Zap className="mr-2 h-4 w-4" />
          Upgrade to {plan.name}
        </>
      )}
    </Button>
  );
}

export function PricingCard({
  plan,
  currentPlanId,
  isLoading,
  hasActiveSubscription,
  proration,
  isUpgrading,
  onSubscribe,
  onUpgrade,
}: PricingCardProps) {
  const isCurrentPlan = plan.id === currentPlanId;
  const showProration = currentPlanId === 'pro_monthly' && plan.id === 'pro_yearly' && proration;

  return (
    <Card className={`relative ${plan.popular ? 'border-primary shadow-md' : ''}`}>
      {plan.popular && (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
          Most Popular
        </Badge>
      )}
      {plan.badge && !plan.popular && (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-600">
          {plan.badge}
        </Badge>
      )}

      <PricingCardHeader plan={plan} isCurrentPlan={isCurrentPlan} />

      <CardContent className="space-y-6">
        <FeaturesList features={plan.features} />

        <div className="pt-4 space-y-3">
          {showProration && <ProrationDetails proration={proration} />}

          <ActionButton
            plan={plan}
            isCurrentPlan={isCurrentPlan}
            isLoading={isLoading}
            isUpgrading={isUpgrading}
            hasActiveSubscription={hasActiveSubscription}
            currentPlanId={currentPlanId}
            onSubscribe={onSubscribe}
            onUpgrade={onUpgrade}
          />
        </div>

        {plan.id !== 'free' && (
          <div className="text-xs text-muted-foreground text-center">
            {plan.limits.ideas === -1 ? 'Unlimited' : plan.limits.ideas} ideas per month •{' '}
            {plan.limits.validations === -1 ? 'Unlimited' : plan.limits.validations} validations per month
          </div>
        )}
      </CardContent>
    </Card>
  );
}
