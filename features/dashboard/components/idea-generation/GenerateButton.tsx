'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GenerateButtonProps {
  isGenerating: boolean;
  limitsLoading: boolean;
  requiredStepsCompleted: boolean;
  isAtLimit: boolean;
  remainingIdeas: number;
  usagePercentage: number;
  ideasUsed: number;
  totalIdeasLimit: number;
  onGenerate: () => void;
}

export function GenerateButton({
  isGenerating,
  limitsLoading,
  requiredStepsCompleted,
  isAtLimit,
  remainingIdeas,
  usagePercentage,
  ideasUsed,
  totalIdeasLimit,
  onGenerate
}: GenerateButtonProps) {
  return (
    <div className="flex flex-col gap-2">
      {!limitsLoading && (
        <div className="text-xs text-muted-foreground text-center">
          {remainingIdeas === -1 ? (
            <span className="flex items-center justify-center gap-1 text-green-600">
              <Sparkles className="h-3 w-3" />
              Unlimited ideas
            </span>
          ) : isAtLimit ? (
            <span className="text-amber-600 font-medium">
              Monthly limit reached ({ideasUsed}/{totalIdeasLimit})
            </span>
          ) : (
            <span>
              {remainingIdeas} idea{remainingIdeas === 1 ? '' : 's'} left this month
              {usagePercentage >= 80 && (
                <Zap className="h-3 w-3 ml-1 text-amber-600" />
              )}
            </span>
          )}
        </div>
      )}

      {!requiredStepsCompleted && (
        <p className="text-xs text-amber-600 text-center font-medium">
          Complete all required steps to generate your idea
        </p>
      )}

      <Button
        onClick={onGenerate}
        disabled={isGenerating || limitsLoading || !requiredStepsCompleted}
        className={cn(
          "font-semibold shadow-lg hover:shadow-xl transition-all duration-200",
          !requiredStepsCompleted
            ? "bg-muted text-muted-foreground cursor-not-allowed hover:bg-muted"
            : isAtLimit && !limitsLoading
            ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            : "bg-gradient-to-r from-primary via-blue-600 to-purple-600 hover:from-primary/90 hover:via-blue-600/90 hover:to-purple-600/90 text-white"
        )}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : isAtLimit && !limitsLoading ? (
          <>
            <Zap className="w-4 h-4 mr-2" />
            Unlock More Ideas
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Now
          </>
        )}
      </Button>
    </div>
  );
}
