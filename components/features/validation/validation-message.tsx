'use client';

import { useServerPlanLimits } from '@/lib/hooks/use-server-plan-limits';
import { Sparkles, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationMessageProps {
  className?: string;
}

export function ValidationMessage({ className }: ValidationMessageProps) {
  const { isAtLimit, planType, usage } = useServerPlanLimits();

  const remainingValidations = planType === 'explorer'
    ? Math.max(0, 1 - (usage.validations_used || 0))
    : planType === 'founder'
    ? Math.max(0, 10 - (usage.validations_used || 0))
    : -1; // Unlimited for growth plan

  return (
    <div className={cn("text-sm", className)}>
      {isAtLimit('validations') ? (
        <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400">
          <Crown className="h-4 w-4" />
          <span>
            {planType === 'explorer'
              ? 'Free plan validation limit reached'
              : 'Monthly validation limit reached'}
          </span>
        </div>
      ) : (
        <div className="text-muted-foreground flex items-center justify-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-500" />
          <span>
            {remainingValidations === -1
              ? 'Unlimited validations remaining'
              : `${remainingValidations} validation${remainingValidations !== 1 ? 's' : ''} remaining this month`
            }
          </span>
        </div>
      )}
    </div>
  );
}