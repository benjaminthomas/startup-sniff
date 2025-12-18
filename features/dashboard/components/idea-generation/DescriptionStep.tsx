'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Lightbulb, Sparkles, Loader2 } from 'lucide-react';
import { IdeaGenerationFormData } from '@/types/startup-ideas';
import type { DynamicIdeaQuestion } from '@/features/ideas/services/question-engine';

interface DescriptionStepProps {
  formData: IdeaGenerationFormData;
  onUserPromptChange: (value: string | undefined) => void;
  dynamicQuestions: DynamicIdeaQuestion[];
  questionsLoading: boolean;
  questionsError: string | null;
  onAppendToPrompt: (snippet: string) => void;
  hasPrimarySelections: boolean;
}

export function DescriptionStep({
  formData,
  onUserPromptChange,
  dynamicQuestions,
  questionsLoading,
  questionsError,
  onAppendToPrompt,
  hasPrimarySelections
}: DescriptionStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="userPrompt" className="text-base font-semibold">
          Tell us about yourself
        </Label>
        <p className="text-muted-foreground text-sm mt-1 mb-4">
          Share your background, interests, or specific requirements. This helps us create more personalized ideas.
        </p>
        <Textarea
          id="userPrompt"
          value={formData.userPrompt || ''}
          onChange={(e) => onUserPromptChange(e.target.value || undefined)}
          placeholder="e.g., 'I'm a software engineer interested in healthcare solutions for elderly people. I have experience with React and want to build a SaaS product...'"
          className="min-h-32 resize-none"
          maxLength={500}
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-muted-foreground">
            Optional but recommended for better results
          </span>
          <span className="text-xs text-muted-foreground">
            {formData.userPrompt?.length || 0}/500
          </span>
        </div>
      </div>

      {hasPrimarySelections && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                AI follow-up prompts
              </p>
              <p className="text-xs text-muted-foreground">
                Refine your brief with context-aware questions.
              </p>
            </div>
            {questionsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <Sparkles className="h-4 w-4 text-primary" />
            )}
          </div>

          {questionsError && (
            <p className="text-xs text-amber-600">
              {questionsError} We&apos;ll fall back to our playbook meanwhile.
            </p>
          )}

          <div className="space-y-3">
            {dynamicQuestions.map((question) => (
              <div
                key={question.id}
                className="rounded-lg bg-background/80 border border-primary/10 p-3 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      'uppercase tracking-wide text-xs',
                      question.type === 'insight' && 'border-blue-200 text-blue-700 dark:text-blue-300',
                      question.type === 'constraint' && 'border-amber-200 text-amber-700 dark:text-amber-300',
                      question.type === 'differentiator' && 'border-emerald-200 text-emerald-700 dark:text-emerald-300'
                    )}
                  >
                    {question.type}
                  </Badge>
                  <p className="text-sm font-medium text-foreground flex-1">
                    {question.prompt}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {question.helper}
                </p>
                {question.suggestions && question.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {question.suggestions.map((suggestion) => (
                      <Button
                        key={suggestion}
                        variant="secondary"
                        size="sm"
                        onClick={() => onAppendToPrompt(suggestion)}
                        className="text-xs px-3 py-1"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {!questionsLoading && dynamicQuestions.length === 0 && !questionsError && (
              <p className="text-xs text-muted-foreground">
                Lock in your selections to see tailored prompts.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="bg-muted/50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Pro Tips</span>
        </div>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Mention your skills and experience</li>
          <li>• Share what problems you&apos;ve personally experienced</li>
          <li>• Include any market insights you have</li>
          <li>• Tell us about your ideal work style</li>
        </ul>
      </div>
    </div>
  );
}
