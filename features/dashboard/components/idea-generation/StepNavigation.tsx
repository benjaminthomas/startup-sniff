'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { steps } from '../../constants/idea-generation';
import type { IdeaGenerationFormData } from '@/types/startup-ideas';

interface StepNavigationProps {
  currentStep: number;
  formData: IdeaGenerationFormData;
  onStepClick: (step: number) => void;
  getStepValueLabel: (stepId: string) => string | null;
}

export function StepNavigation({
  currentStep,
  formData,
  onStepClick,
  getStepValueLabel
}: StepNavigationProps) {
  const getStepCompletion = (stepId: string) => {
    switch (stepId) {
      case 'industry':
        return !!formData.industry;
      case 'problem':
        return !!formData.problemArea;
      case 'audience':
        return !!formData.targetAudience;
      case 'resources':
        return !!(formData.budget || formData.timeframe);
      case 'context':
        return !!formData.userPrompt;
      default:
        return false;
    }
  };

  return (
    <div className="flex flex-wrap gap-2 p-1 bg-muted/30 rounded-lg mt-4">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = getStepCompletion(step.id);
        const StepIcon = step.icon;
        const selectionLabel = getStepValueLabel(step.id);

        return (
          <button
            key={step.id}
            type="button"
            onClick={() => onStepClick(index)}
            className={cn(
              // Base styles
              "flex-1 min-w-[140px] sm:min-w-[160px] h-auto min-h-[40px] py-2.5 px-3",
              "rounded-md border font-medium text-sm",
              "cursor-pointer transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-offset-2",
              // Active state (default variant style)
              isActive && [
                "bg-primary text-primary-foreground border-primary",
                "shadow-sm hover:bg-primary/90",
                "focus:ring-primary",
              ],
              // Completed state (secondary variant style)
              isCompleted && !isActive && [
                "bg-green-100 hover:bg-green-200 text-green-700 border-green-200",
                "dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 dark:border-green-800",
              ],
              // Inactive/ghost state
              !isActive && !isCompleted && [
                "bg-transparent border-transparent text-foreground/60",
                "hover:bg-accent hover:text-accent-foreground",
              ]
            )}
          >
            <div className="flex w-full items-center gap-2 text-left">
              {isCompleted && !isActive ? (
                <Check className="w-4 h-4 flex-shrink-0" />
              ) : (
                <StepIcon className="w-4 h-4 flex-shrink-0" />
              )}
              <span className="leading-tight break-words">
                {selectionLabel ?? step.title}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
