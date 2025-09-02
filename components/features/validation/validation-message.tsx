'use client';

import { usePlanLimits } from '@/lib/hooks/use-plan-limits';

interface ValidationMessageProps {
  className?: string;
}

export function ValidationMessage({ className }: ValidationMessageProps) {
  const { isAtLimit, planType } = usePlanLimits();

  if (isAtLimit('validations')) {
    return (
      <p className={`text-xs text-amber-600 dark:text-amber-400 ${className}`}>
        🚀 {planType === 'explorer' 
          ? 'Free plan limit reached - Upgrade to Founder for 10 validations/month' 
          : 'Validation limit reached - Upgrade for unlimited validations'
        }
      </p>
    );
  }

  return (
    <p className={`text-xs text-amber-600 dark:text-amber-400 ${className}`}>
      💡 Need more validations? <span className="underline cursor-pointer hover:text-amber-700">Upgrade to Founder</span> for 10/month
    </p>
  );
}