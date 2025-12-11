'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { log } from '@/lib/logger/client';
import { upgradeMonthlyToYearly, getUpgradeProration } from '@/features/billing/actions/upgrade-subscription';
import { formatRupees, type ProrationCalculation } from '@/features/billing/utils/proration';
import { usePaymentGateway } from './usePaymentGateway';

interface UseSubscriptionUpgradeOptions {
  currentPlanId: string;
  userEmail?: string;
  onUpgradeSuccess?: () => void;
  onUpgradeError?: (error: Error) => void;
}

export function useSubscriptionUpgrade({
  currentPlanId,
  userEmail,
  onUpgradeSuccess,
  onUpgradeError,
}: UseSubscriptionUpgradeOptions) {
  const [proration, setProration] = useState<ProrationCalculation | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const { scriptLoaded, scriptError, openPaymentGateway } = usePaymentGateway();

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

  const canUpgrade = (planId: string): boolean => {
    return planId === 'pro_yearly' && currentPlanId === 'pro_monthly';
  };

  const handleUpgrade = async (planId: string): Promise<void> => {
    if (!canUpgrade(planId)) {
      toast.error('Invalid upgrade path');
      return;
    }

    if (scriptError) {
      toast.error('Payment gateway is unavailable. Please try again later.');
      return;
    }

    if (!scriptLoaded) {
      toast.info('Loading payment gateway...');
      return;
    }

    setIsUpgrading(true);

    try {
      // Call upgrade server action
      const result = await upgradeMonthlyToYearly();

      if (!result.success || !result.subscriptionId) {
        toast.error(result.error || 'Failed to upgrade subscription');
        setIsUpgrading(false);
        if (onUpgradeError) {
          onUpgradeError(new Error(result.error || 'Failed to upgrade subscription'));
        }
        return;
      }

      // Open payment gateway with upgrade details
      await openPaymentGateway({
        subscriptionId: result.subscriptionId,
        name: 'Startup Sniff',
        description: `Upgrade to Pro Yearly - Save ${formatRupees(result.proration?.savings || 0)}`,
        email: userEmail || '',
        notes: {
          proration_credit: result.proration?.creditAmount.toString() || '0',
          proration_amount_due: result.proration?.amountDue.toString() || '0',
        },
        onSuccess: () => {
          toast.success('Successfully upgraded to yearly plan!');
          setIsUpgrading(false);
          if (onUpgradeSuccess) {
            onUpgradeSuccess();
          }
        },
        onError: (error) => {
          setIsUpgrading(false);
          if (onUpgradeError) {
            onUpgradeError(error);
          }
        },
      });
    } catch (error) {
      log.error('Upgrade error:', error);
      toast.error('Failed to process upgrade. Please try again.');
      setIsUpgrading(false);
      if (onUpgradeError) {
        onUpgradeError(error instanceof Error ? error : new Error('Failed to process upgrade'));
      }
    }
  };

  return {
    proration,
    isUpgrading,
    canUpgrade,
    handleUpgrade,
  };
}
