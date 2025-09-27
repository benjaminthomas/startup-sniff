'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, Zap } from 'lucide-react';
import { PRICING_PLANS } from '@/constants';
import { createSubscription } from '@/server/actions/billing';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

interface PricingCardsProps {
  currentPlanId: string;
  userId: string;
}

export function PricingCards({ currentPlanId }: PricingCardsProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleSubscribe = (priceId: string, planId: string) => {
    setSelectedPlan(planId);
    startTransition(async () => {
      const result = await createSubscription(priceId);
      
      if (result?.error) {
        toast.error(result.error);
        setSelectedPlan(null);
      }
      // Success case will redirect to Stripe Checkout
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
            
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                {plan.name}
                {isCurrentPlan && <Badge variant="secondary">Current</Badge>}
              </CardTitle>
              <CardDescription>{plan.name} plan features</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">
                  {formatCurrency(plan.price)}
                </span>
                {plan.price > 0 && (
                  <span className="text-muted-foreground">/month</span>
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
                    onClick={() => handleSubscribe(plan.priceId, plan.id)}
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

              {plan.id !== 'explorer' && (
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