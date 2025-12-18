'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { industries, type IndustryOption } from '../../constants/idea-generation';
import { IdeaGenerationFormData } from '@/types/startup-ideas';

interface IndustrySelectionStepProps {
  formData: IdeaGenerationFormData;
  onSelect: (industryId: string | undefined) => void;
  onAutoAdvance?: () => void;
}

export function IndustrySelectionStep({
  formData,
  onSelect,
  onAutoAdvance
}: IndustrySelectionStepProps) {
  const handleSelect = (industry: IndustryOption) => {
    const newValue = formData.industry === industry.id ? undefined : industry.id;
    onSelect(newValue);
    if (newValue && onAutoAdvance) {
      onAutoAdvance();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-muted-foreground text-sm">
          Choose an industry that interests you.
        </p>
        <Badge variant="destructive" className="text-xs">Required</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {industries.map((industry) => (
          <button
            key={industry.id}
            type="button"
            className={cn(
              "h-auto min-h-[72px] p-4 flex flex-col items-start text-left w-full",
              "rounded-lg border-2 transition-all duration-200",
              "cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
              formData.industry === industry.id
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-background border-input hover:bg-muted/80 hover:border-primary/30 hover:shadow-sm hover:scale-[1.02]"
            )}
            onClick={() => handleSelect(industry)}
          >
            <div className="flex items-center gap-2 mb-1.5 w-full">
              <industry.icon className={cn(
                "h-5 w-5 flex-shrink-0",
                formData.industry === industry.id ? "text-primary-foreground" : "text-foreground"
              )} />
              <span className={cn(
                "font-semibold text-base",
                formData.industry === industry.id ? "text-primary-foreground" : "text-foreground"
              )}>{industry.label}</span>
            </div>
            <span className={cn(
              "text-sm leading-snug",
              formData.industry === industry.id ? "text-primary-foreground/90" : "text-muted-foreground"
            )}>{industry.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
