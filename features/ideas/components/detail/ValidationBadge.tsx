/**
 * ValidationBadge Component
 *
 * Displays the validation status card in the sidebar with:
 * - Validation status indicator
 * - Call to action for non-validated ideas
 * - Confirmed status for validated ideas
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ValidationButton } from '@/features/validation/components/validation-button';

interface ValidationBadgeProps {
  ideaId: string;
  isValidated: boolean;
}

export function ValidationBadge({ ideaId, isValidated }: ValidationBadgeProps) {
  return (
    <Card
      id="validation-cta"
      className={cn(
        "border-2",
        isValidated
          ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/10"
          : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/10"
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isValidated ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-600" />
          )}
          Validation Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isValidated ? (
          <div className="text-center py-4">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h4 className="font-semibold mb-2 text-green-800 dark:text-green-200">Validated!</h4>
            <p className="text-sm text-green-600 dark:text-green-400">
              This idea has been validated with comprehensive market research.
            </p>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-500 rounded-full animate-pulse"></div>
              </div>
              <Eye className="h-12 w-12 text-amber-600 mx-auto mb-3 relative z-10" />
            </div>
            <h4 className="font-semibold mb-2 text-amber-800 dark:text-amber-200">
              Ready to Validate
            </h4>
            <p className="text-sm text-amber-600 dark:text-amber-400 mb-4">
              Unlock detailed insights about your idea&apos;s market potential.
            </p>
            <div className="space-y-3">
              <ValidationButton ideaId={ideaId} isValidated={isValidated} className="w-full" />
              <div className="text-xs text-center space-y-1">
                <p className="text-muted-foreground">✨ Unlock with validation:</p>
                <div className="text-xs space-y-0.5">
                  <p className="text-blue-600">• Market size & demographics</p>
                  <p className="text-green-600">• Competition analysis</p>
                  <p className="text-purple-600">• Success probability</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
