'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ValidationButton } from './validation-button';
import { usePlanLimits } from '@/lib/hooks/use-plan-limits';
import { AlertCircle, Crown } from 'lucide-react';

interface ValidationStatusAlertProps {
  ideaId: string;
  isValidated: boolean;
}

export function ValidationStatusAlert({ ideaId, isValidated }: ValidationStatusAlertProps) {
  const { isAtLimit, planType } = usePlanLimits();

  if (isValidated) return null;

  return (
    <Alert className={`${isAtLimit('validations') 
      ? 'border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-950/10' 
      : 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/10'
    }`}>
      {isAtLimit('validations') ? (
        <Crown className="h-4 w-4 text-purple-600" />
      ) : (
        <AlertCircle className="h-4 w-4 text-amber-600" />
      )}
      <AlertDescription className={isAtLimit('validations') ? 'text-purple-800 dark:text-purple-200' : 'text-amber-800 dark:text-amber-200'}>
        {isAtLimit('validations') ? (
          <>
            <span className="font-semibold">Upgrade needed!</span> You've used your {planType === 'explorer' ? 'free validation' : 'validation limit'}. Upgrade to get detailed market analysis, competition insights, and success predictions.
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-4 h-8 border-purple-300 text-purple-700 hover:bg-purple-100"
              onClick={() => window.open('/dashboard/billing', '_blank')}
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Button>
          </>
        ) : (
          <>
            <span className="font-semibold">Ready for validation?</span> Get detailed market analysis, competition insights, and success predictions by validating this idea.
            <ValidationButton ideaId={ideaId} isValidated={isValidated} className="ml-4 h-8" />
          </>
        )}
      </AlertDescription>
    </Alert>
  );
}