'use client';

import { useState, useTransition, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, Zap, TrendingUp } from 'lucide-react';
import { PRICING_PLANS } from '@/constants';
import { createSubscription } from '@/modules/billing';
import { upgradeMonthlyToYearly, getUpgradeProration } from '@/modules/billing/actions/upgrade-subscription';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { formatRupees, type ProrationCalculation } from '@/lib/proration';
import { useRouter } from 'next/navigation';
import { log } from '@/lib/logger/client'

interface PricingCardsProps {
  currentPlanId: string;
  userId: string;
  userEmail?: string;
  hasActiveSubscription?: boolean;
}

declare global {
  interface Window {
    Razorpay: unknown;
  }
}

export function PricingCards({ currentPlanId, userEmail, hasActiveSubscription }: PricingCardsProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const [proration, setProration] = useState<ProrationCalculation | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const router = useRouter();

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;

    script.onload = () => {
      setScriptLoaded(true);
    };

    script.onerror = () => {
      setScriptError(true);
      toast.error('Payment gateway failed to load. Please refresh the page.');
    };

    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Fetch proration details when component mounts if user is on monthly plan
  useEffect(() => {
    async function fetchProration() {
      if (currentPlanId === 'pro_monthly') {
        const result = await getUpgradeProration();
        if (result.success && result.proration) {
          setProration(result.proration);
        }
      }
    }
    fetchProration();
  }, [currentPlanId]);

  const handleUpgrade = async (planId: string) => {
    if (planId !== 'pro_yearly' || currentPlanId !== 'pro_monthly') {
      toast.error('Invalid upgrade path');
      return;
    }

    // Check script status
    if (scriptError) {
      toast.error('Payment gateway is unavailable. Please try again later.');
      return;
    }

    if (!scriptLoaded || !window.Razorpay) {
      toast.info('Loading payment gateway...');
      return;
    }

    setIsUpgrading(true);
    try {
      const publicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      if (!publicKey) {
        toast.error('Payment gateway is not configured.');
        setIsUpgrading(false);
        return;
      }

      // Call upgrade server action
      const result = await upgradeMonthlyToYearly();

      if (!result.success || !result.subscriptionId) {
        toast.error(result.error || 'Failed to upgrade subscription');
        setIsUpgrading(false);
        return;
      }

      // Initialize Razorpay Checkout with prorated amount
      const options = {
        key: publicKey,
        subscription_id: result.subscriptionId,
        name: 'Startup Sniff',
        description: `Upgrade to Pro Yearly - Save ${formatRupees(result.proration?.savings || 0)}`,
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_subscription_id: string;
          razorpay_signature: string;
        }) {
          try {
            // Verify payment signature on backend
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.verified) {
              toast.success('Successfully upgraded to yearly plan!');
              router.push('/dashboard/billing/success');
            } else {
              toast.error('Payment verification failed. Please contact support.');
              setIsUpgrading(false);
            }
          } catch (error) {
            log.error('Payment verification error:', error);
            toast.error('Payment verification failed. Please contact support.');
            setIsUpgrading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsUpgrading(false);
            toast.info('Upgrade cancelled');
          }
        },
        prefill: {
          email: userEmail || '',
        },
        theme: {
          color: '#8B5CF6'
        },
        notes: {
          proration_credit: result.proration?.creditAmount.toString() || '0',
          proration_amount_due: result.proration?.amountDue.toString() || '0',
        }
      };

      if (window.Razorpay) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const razorpay = new (window.Razorpay as any)(options);
        razorpay.open();
      } else {
        toast.error('Payment gateway not loaded. Please refresh and try again.');
        setIsUpgrading(false);
      }
    } catch (error) {
      log.error('Upgrade error:', error);
      toast.error('Failed to process upgrade. Please try again.');
      setIsUpgrading(false);
    }
  };

  const handleSubscribe = (planId: string) => {
    // Check script status
    if (scriptError) {
      toast.error('Payment gateway is unavailable. Please try again later.');
      return;
    }

    if (!scriptLoaded || !window.Razorpay) {
      toast.info('Loading payment gateway...');
      return;
    }

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
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_subscription_id: string;
          razorpay_signature: string;
        }) {
          try {
            // Verify payment signature on backend
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.verified) {
              toast.success('Subscription activated successfully!');
              window.location.href = '/dashboard/billing/success';
            } else {
              toast.error('Payment verification failed. Please contact support.');
              setSelectedPlan(null);
            }
          } catch (error) {
            log.error('Payment verification error:', error);
            toast.error('Payment verification failed. Please contact support.');
            setSelectedPlan(null);
          }
        },
        modal: {
          ondismiss: function () {
            setSelectedPlan(null);
            toast.info('Payment cancelled');
          }
        },
        prefill: {
          email: userEmail || '',
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

              <div className="pt-4 space-y-3">
                {isCurrentPlan ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : currentPlanId === 'pro_monthly' && plan.id === 'pro_yearly' ? (
                  <>
                    {proration && (
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
                    )}
                    <Button
                      className="w-full"
                      onClick={() => handleUpgrade(plan.id)}
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
                  </>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isPending || !plan.priceId || (hasActiveSubscription && plan.id !== 'free')}
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
