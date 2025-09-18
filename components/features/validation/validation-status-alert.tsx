'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ValidationButton } from './validation-button';
import { ValidationMessage } from './validation-message';
import {
  CheckCircle,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  BarChart3
} from 'lucide-react';

interface ValidationStatusAlertProps {
  ideaId: string;
  isValidated: boolean | null;
}

export function ValidationStatusAlert({ ideaId, isValidated }: ValidationStatusAlertProps) {
  if (isValidated) {
    return (
      <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/10">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-green-800 dark:text-green-200 font-medium">
              ✨ This idea has been validated with comprehensive market research
            </span>
            <Badge className="bg-green-100 text-green-800 border-green-300 hover:bg-green-200">
              <BarChart3 className="mr-1 h-3 w-3" />
              Validated
            </Badge>
          </div>
          <div className="text-sm text-green-600 dark:text-green-400">
            Market insights and competition analysis available below
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/10">
      <Sparkles className="h-4 w-4 text-blue-600" />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-blue-800 dark:text-blue-200 font-medium">
              🚀 Unlock comprehensive insights for this idea
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Get market analysis, competition research, success probability, and implementation roadmap
            </p>
            <ValidationMessage className="text-left" />
          </div>
          <div className="ml-4">
            <ValidationButton ideaId={ideaId} isValidated={isValidated || false} />
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}