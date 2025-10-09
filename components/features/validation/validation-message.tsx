'use client';

import { useServerPlanLimits } from '@/lib/hooks/use-server-plan-limits';
import { Sparkles, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationMessageProps {
  className?: string;
}

export function ValidationMessage({ className }: ValidationMessageProps) {
  const { isAtLimit } = useServerPlanLimits();

  // Pro plans have unlimited validations
  const remainingValidations = -1; // Unlimited

  return (
    <div className={cn("text-sm", className)}>
      {isAtLimit('validations') ? (
        <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400">
          <Crown className="h-4 w-4" />
          <span>
            Validation limit reached
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