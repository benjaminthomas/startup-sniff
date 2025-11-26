'use client';

import { useState, useTransition, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, Zap } from 'lucide-react';
import { PRICING_PLANS } from '@/constants';
import { createSubscription } from '@/modules/billing';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

interface PricingCardsProps {
  currentPlanId: string;
  userId: string;
}

declare global {
  interface Window {
    Razorpay: unknown;
  }
}

export function PricingCards({ currentPlanId }: PricingCardsProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleSubscribe = (planId: string) => {
    setSelectedPlan(planId);
    startTransition(async () => {
      const publicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      if (!publicKey) {
        toast.error('Payment gateway is not configured. Add NEXT_PUBLIC_RAZORPAY_KEY_ID to your environment.');
        setSelectedPlan(null);
        return;
      }

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

      // Initialize Razorpay Checkout
      const options = {
        key: publicKey,
        subscription_id: result.subscriptionId,
        name: 'Startup Sniff',
        description: `Subscribe to ${PRICING_PLANS.find(p => p.id === planId)?.name} plan`,
        handler: function () {
          toast.success('Subscription activated successfully!');
          window.location.href = '/dashboard/billing/success';
        },
        modal: {
          ondismiss: function () {
            setSelectedPlan(null);
            toast.info('Payment cancelled');
          }
        },
        prefill: {
          email: '',
        },
        theme: {
          color: '#8B5CF6'
        }
      };

      if (window.Razorpay) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const razorpay = new (window.Razorpay as any)(options);
        razorpay.open();
      } else {
        toast.error('Payment gateway not loaded. Please refresh and try again.');
        setSelectedPlan(null);
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {PRICING_PLANS.map((plan) => {
        const isCurrentPlan = plan.id === currentPlanId;
        const isLoading = selectedPlan === plan.id && isPending;

        return (
          <Card key={plan.id} className={`relative ${plan.popular ? 'border-primary shadow-md' : ''}`}>
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

            <CardContent className="space-y-6">
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-4">
                {isCurrentPlan ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isPending || !plan.priceId}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {plan.price === 0 ? (
                          'Get Started Free'
                        ) : (
                          <>
                            <Zap className="mr-2 h-4 w-4" />
                            Upgrade to {plan.name}
                          </>
                        )}
                      </>
                    )}
                  </Button>
                )}
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
      })}
    </div>
  );
}
