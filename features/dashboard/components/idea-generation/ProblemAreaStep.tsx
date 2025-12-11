'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { problemAreas, industries, type ProblemAreaOption } from '../../constants/idea-generation';
import { IdeaGenerationFormData } from '@/types/startup-ideas';

interface ProblemAreaStepProps {
  formData: IdeaGenerationFormData;
  onSelect: (problemAreaId: string | undefined) => void;
  onAutoAdvance?: () => void;
  renderDynamicPrompt?: (type: 'insight' | 'constraint' | 'differentiator', title: string) => React.ReactNode;
}

export function ProblemAreaStep({
  formData,
  onSelect,
  onAutoAdvance,
  renderDynamicPrompt
}: ProblemAreaStepProps) {
  const selectedIndustry = industries.find((industry) => industry.id === formData.industry);

  const handleSelect = (problem: ProblemAreaOption) => {
    const newValue = formData.problemArea === problem.id ? undefined : problem.id;
    onSelect(newValue);
    if (newValue && onAutoAdvance) {
      onAutoAdvance();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-muted-foreground text-sm">
          {selectedIndustry
            ? `Within ${selectedIndustry.label}, which challenge do you want to tackle first?`
            : 'What kind of problems do you want to solve?'}
        </p>
        <Badge variant="destructive" className="text-xs">Required</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {problemAreas.map((problem) => (
          <button
            key={problem.id}
            type="button"
            className={cn(
              "h-auto min-h-[72px] p-4 flex flex-col items-start text-left w-full",
              "rounded-lg border-2 transition-all duration-200",
              "cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
              formData.problemArea === problem.id
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-background border-input hover:bg-muted/80 hover:border-primary/30 hover:shadow-sm hover:scale-[1.02]"
            )}
            onClick={() => handleSelect(problem)}
          >
            <div className="flex items-center gap-2 mb-1.5 w-full">
              <problem.icon className={cn(
                "h-5 w-5 flex-shrink-0",
                formData.problemArea === problem.id ? "text-primary-foreground" : "text-foreground"
              )} />
              <span className={cn(
                "font-semibold text-base",
                formData.problemArea === problem.id ? "text-primary-foreground" : "text-foreground"
              )}>{problem.label}</span>
            </div>
            <span className={cn(
              "text-sm leading-snug",
              formData.problemArea === problem.id ? "text-primary-foreground/90" : "text-muted-foreground"
            )}>{problem.description}</span>
          </button>
        ))}
      </div>
      {renderDynamicPrompt && renderDynamicPrompt('insight', 'Focus this idea')}
    </div>
  );
}
