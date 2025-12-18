'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DynamicIdeaQuestion, DynamicQuestionType } from '@/features/ideas/services/question-engine';

interface DynamicPromptDisplayProps {
  question: DynamicIdeaQuestion;
  title: string;
  onSuggestionClick: (suggestion: string) => void;
}

export function DynamicPromptDisplay({
  question,
  title,
  onSuggestionClick
}: DynamicPromptDisplayProps) {
  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 mt-2 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">
            {title}
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn(
            'uppercase tracking-wide text-[10px]',
            question.type === 'insight' && 'border-blue-200 text-blue-700 dark:text-blue-300',
            question.type === 'constraint' && 'border-amber-200 text-amber-700 dark:text-amber-300',
            question.type === 'differentiator' && 'border-emerald-200 text-emerald-700 dark:text-emerald-300'
          )}
        >
          {question.type}
        </Badge>
      </div>
      <p className="text-sm text-foreground">{question.prompt}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {question.helper}
      </p>
      {question.suggestions && question.suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {question.suggestions.map((suggestion) => (
            <Button
              key={`${question.id}-${suggestion}`}
              variant="ghost"
              size="sm"
              onClick={() => onSuggestionClick(suggestion)}
              className="text-xs h-7 px-3 border border-primary/20 bg-background hover:bg-primary/10"
            >
              {suggestion}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
