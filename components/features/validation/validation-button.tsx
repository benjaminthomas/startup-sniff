'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UpgradeModal } from '@/components/ui/upgrade-modal';
import { useServerPlanLimits } from '@/modules/usage/hooks';
import { validateExistingIdea } from '@/modules/validation';
import {
  BarChart3,
  Crown,
  Loader2,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ValidationButtonProps {
  ideaId: string;
  isValidated: boolean;
  className?: string;
}

export function ValidationButton({ ideaId, isValidated, className }: ValidationButtonProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { isAtLimit, planType, usage } = useServerPlanLimits();

  const handleValidate = async () => {
    if (isAtLimit('validations')) {
      setShowUpgradeModal(true);
      return;
    }

    setIsValidating(true);

    // Show detailed loading toast
    const loadingToast = toast.loading(
      "🔍 AI is analyzing market feasibility, competition landscape, and success probability...",
      {
        duration: 60000, // Long duration for AI processing
        description: "This may take 30-60 seconds for comprehensive analysis"
      }
    );

    try {
      const result = await validateExistingIdea(ideaId);

      if (result.success) {
        toast.success("✅ Validation complete! Your idea has been comprehensively analyzed.", {
          id: loadingToast,
          description: "Market insights, competition analysis, and success metrics are now available.",
          duration: 5000
        });

        // Refresh the page to show updated content
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error(result.error || "Validation failed. Please try again.", {
          id: loadingToast,
          description: "Our AI validation service encountered an issue. Please contact support if this persists."
        });
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Validation failed. Please try again.",
        {
          id: loadingToast,
          description: "Network or server error occurred during validation."
        }
      );
    } finally {
      setIsValidating(false);
    }
  };

  if (isValidated) {
    return (
      <Button variant="outline" className={cn("cursor-default", className)} disabled>
        <BarChart3 className="mr-2 h-4 w-4 text-green-600" />
        <span className="text-green-700">Validated ✨</span>
      </Button>
    );
  }

  return (
    <>
      <Button
        onClick={handleValidate}
        disabled={isValidating}
        variant={isAtLimit('validations') ? "default" : "outline"}
        className={cn(
          "relative overflow-hidden transition-all duration-200",
          isAtLimit('validations')
            ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
            : "hover:bg-primary hover:text-primary-foreground",
          className
        )}
        size="default"
      >
        {isValidating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Validating...</span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-10 animate-pulse" />
          </>
        ) : isAtLimit('validations') ? (
          <>
            <Crown className="mr-2 h-4 w-4" />
            <span>Upgrade to Validate</span>
            <Sparkles className="ml-2 h-4 w-4" />
          </>
        ) : (
          <>
            <TrendingUp className="mr-2 h-4 w-4" />
            <span>Validate Idea</span>
          </>
        )}
      </Button>

      <UpgradeModal
        isVisible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureType="validations"
        currentPlan={planType}
        usedCount={usage.validations_used || 0}
        limitCount={-1} // Pro plans have unlimited
      />
    </>
  );
}
