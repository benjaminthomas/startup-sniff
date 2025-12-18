'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { budgetOptions, timelineOptions, audiences, type BudgetOption, type TimelineOption } from '../../constants/idea-generation';
import { IdeaGenerationFormData } from '@/types/startup-ideas';

interface BudgetTimelineStepProps {
  formData: IdeaGenerationFormData;
  onBudgetSelect: (budgetId: string | undefined) => void;
  onTimelineSelect: (timelineId: string | undefined) => void;
  onAutoAdvance?: () => void;
  renderDynamicPrompt?: (type: 'insight' | 'constraint' | 'differentiator', title: string) => React.ReactNode;
}

export function BudgetTimelineStep({
  formData,
  onBudgetSelect,
  onTimelineSelect,
  onAutoAdvance,
  renderDynamicPrompt
}: BudgetTimelineStepProps) {
  const selectedAudience = audiences.find((audience) => audience.id === formData.targetAudience);

  const handleBudgetSelect = (budget: BudgetOption) => {
    const newValue = formData.budget === budget.id ? undefined : budget.id;
    onBudgetSelect(newValue);
    // Only auto-advance if both budget and timeframe are selected
    if (newValue && formData.timeframe && onAutoAdvance) {
      onAutoAdvance();
    }
  };

  const handleTimelineSelect = (timeline: TimelineOption) => {
    const newValue = formData.timeframe === timeline.id ? undefined : timeline.id;
    onTimelineSelect(newValue);
    // Only auto-advance if both budget and timeframe are selected
    if (newValue && formData.budget && onAutoAdvance) {
      onAutoAdvance();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="text-base font-semibold">Budget Range</Label>
          <Badge variant="destructive" className="text-xs">Required</Badge>
        </div>
        <p className="text-muted-foreground text-sm mb-4">
          {selectedAudience
            ? `How much can you invest to serve ${selectedAudience.label.toLowerCase()} confidently?`
            : 'How much are you planning to invest initially?'}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {budgetOptions.map((budget) => (
            <Button
              key={budget.id}
              variant={formData.budget === budget.id ? "default" : "outline"}
              className={cn(
                "h-auto p-4 flex flex-col items-center text-center transition-all duration-200 hover:scale-[1.02]",
                formData.budget === budget.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-muted/80 hover:border-primary/30 hover:shadow-sm"
              )}
              onClick={() => handleBudgetSelect(budget)}
            >
              <budget.icon className={cn(
                "h-6 w-6 mb-1",
                formData.budget === budget.id ? "text-primary-foreground" : "text-foreground"
              )} />
              <span className={cn(
                "font-semibold",
                formData.budget === budget.id ? "text-primary-foreground" : "text-foreground"
              )}>{budget.label}</span>
              <span className={cn(
                "text-sm",
                formData.budget === budget.id ? "text-primary-foreground" : "text-primary"
              )}>{budget.amount}</span>
              <span className={cn(
                "text-xs mt-1",
                formData.budget === budget.id ? "text-primary-foreground/80" : "text-muted-foreground"
              )}>{budget.description}</span>
            </Button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="text-base font-semibold">Timeline</Label>
          <Badge variant="destructive" className="text-xs">Required</Badge>
        </div>
        <p className="text-muted-foreground text-sm mb-4">
          {selectedAudience
            ? `When do you want ${selectedAudience.label.toLowerCase()} to experience your solution?`
            : 'When would you like to launch?'}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {timelineOptions.map((timeframe) => (
            <Button
              key={timeframe.id}
              variant={formData.timeframe === timeframe.id ? "default" : "outline"}
              className={cn(
                "h-auto p-4 flex flex-col items-center text-center transition-all duration-200 hover:scale-[1.02]",
                formData.timeframe === timeframe.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-muted/80 hover:border-primary/30 hover:shadow-sm"
              )}
              onClick={() => handleTimelineSelect(timeframe)}
            >
              <timeframe.icon className={cn(
                "h-6 w-6 mb-1",
                formData.timeframe === timeframe.id ? "text-primary-foreground" : "text-foreground"
              )} />
              <span className={cn(
                "font-semibold",
                formData.timeframe === timeframe.id ? "text-primary-foreground" : "text-foreground"
              )}>{timeframe.label}</span>
              <span className={cn(
                "text-sm",
                formData.timeframe === timeframe.id ? "text-primary-foreground" : "text-primary"
              )}>{timeframe.period}</span>
              <span className={cn(
                "text-xs mt-1",
                formData.timeframe === timeframe.id ? "text-primary-foreground/80" : "text-muted-foreground"
              )}>{timeframe.description}</span>
            </Button>
          ))}
        </div>
        {renderDynamicPrompt && renderDynamicPrompt('constraint', 'Plan around constraints')}
      </div>
    </div>
  );
}
