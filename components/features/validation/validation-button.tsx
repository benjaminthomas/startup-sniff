'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UpgradeModal } from '@/components/ui/upgrade-modal';
import { useServerPlanLimits } from '@/lib/hooks/use-server-plan-limits';
import { validateExistingIdea } from '@/lib/actions/validation';
import { BarChart3, Crown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface ValidationButtonProps {
  ideaId: string;
  isValidated: boolean;
  className?: string;
}

export function ValidationButton({ ideaId, isValidated, className }: ValidationButtonProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { isAtLimit, planType, usage } = useServerPlanLimits();
  const router = useRouter();

  const handleValidate = async () => {
    if (isAtLimit('validations')) {
      setShowUpgradeModal(true);
      return;
    }
    
    setIsValidating(true);
    
    const loadingToast = toast.loading("🔍 AI is analyzing market feasibility, competition, and potential...");
    
    try {
      const result = await validateExistingIdea(ideaId);
      if (result.success) {
        toast.success("✅ Validation complete! Your idea has been scored and analyzed.", {
          id: loadingToast
        });
        
        setTimeout(() => {
          router.refresh();
        }, 1000);
      } else {
        toast.error(result.error || "Failed to validate idea. Please try again.", {
          id: loadingToast
        });
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to validate idea. Please try again.",
        { id: loadingToast }
      );
    } finally {
      setIsValidating(false);
    }
  };

  if (isValidated) return null;

  return (
    <>
      <Button 
        onClick={handleValidate}
        disabled={isValidating && !isAtLimit('validations')}
        variant="default"
        className={`${className} ${isAtLimit('validations') 
          ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" 
          : ""
        }`}
      >
      {isValidating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Validating...
        </>
      ) : isAtLimit('validations') ? (
        <>
          <Crown className="mr-2 h-4 w-4" />
          Upgrade to Validate
        </>
      ) : (
        <>
          <BarChart3 className="mr-2 h-4 w-4" />
          Validate This Idea
        </>
      )}
      </Button>

      <UpgradeModal
        isVisible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureType="validations"
        currentPlan={planType as any}
        usedCount={usage.validations_used || 0}
        limitCount={planType === 'explorer' ? 1 : planType === 'founder' ? 10 : -1}
      />
    </>
  );
}