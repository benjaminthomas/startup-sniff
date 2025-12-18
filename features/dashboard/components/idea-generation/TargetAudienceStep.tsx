'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { audiences, industries, problemAreas, type AudienceOption } from '../../constants/idea-generation';
import { IdeaGenerationFormData } from '@/types/startup-ideas';

interface TargetAudienceStepProps {
  formData: IdeaGenerationFormData;
  onSelect: (audienceId: string | undefined) => void;
  onAutoAdvance?: () => void;
  renderDynamicPrompt?: (type: 'insight' | 'constraint' | 'differentiator', title: string) => React.ReactNode;
}

export function TargetAudienceStep({
  formData,
  onSelect,
  onAutoAdvance,
  renderDynamicPrompt
}: TargetAudienceStepProps) {
  const selectedIndustry = industries.find((industry) => industry.id === formData.industry);
  const selectedProblem = problemAreas.find((problem) => problem.id === formData.problemArea);

  const handleSelect = (audience: AudienceOption) => {
    const newValue = formData.targetAudience === audience.id ? undefined : audience.id;
    onSelect(newValue);
    if (newValue && onAutoAdvance) {
      onAutoAdvance();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-muted-foreground text-sm">
          {selectedProblem && selectedIndustry
            ? `Who feels the ${selectedProblem.label.toLowerCase()} pain most within ${selectedIndustry.label}?`
            : 'Who would you like to build products for?'}
        </p>
        <Badge variant="destructive" className="text-xs">Required</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {audiences.map((audience) => (
          <button
            key={audience.id}
            type="button"
            className={cn(
              "h-auto min-h-[72px] p-4 flex flex-col items-start text-left w-full",
              "rounded-lg border-2 transition-all duration-200",
              "cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
              formData.targetAudience === audience.id
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-background border-input hover:bg-muted/80 hover:border-primary/30 hover:shadow-sm hover:scale-[1.02]"
            )}
            onClick={() => handleSelect(audience)}
          >
            <div className="flex items-center gap-2 mb-1.5 w-full">
              <audience.icon className={cn(
                "h-5 w-5 flex-shrink-0",
                formData.targetAudience === audience.id ? "text-primary-foreground" : "text-foreground"
              )} />
              <span className={cn(
                "font-semibold text-base",
                formData.targetAudience === audience.id ? "text-primary-foreground" : "text-foreground"
              )}>{audience.label}</span>
            </div>
            <span className={cn(
              "text-sm leading-snug",
              formData.targetAudience === audience.id ? "text-primary-foreground/90" : "text-muted-foreground"
            )}>{audience.description}</span>
          </button>
        ))}
      </div>
      {renderDynamicPrompt && renderDynamicPrompt('differentiator', 'Sharpen your persona')}
    </div>
  );
}
