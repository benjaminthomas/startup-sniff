'use client';

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UnlockOverlay } from '@/components/ui/unlock-overlay';
import { useIdeaGenerationForm } from '../hooks/useIdeaGenerationForm';
import { steps } from '../constants/idea-generation';
import {
  IndustrySelectionStep,
  ProblemAreaStep,
  TargetAudienceStep,
  BudgetTimelineStep,
  DescriptionStep,
  DynamicPromptDisplay,
  GeneratedIdeaCard,
  StepNavigation,
  GenerateButton
} from './idea-generation';
import type { DynamicQuestionType } from '@/features/ideas/services/question-engine';

export function IdeaGenerationForm() {
  const {
    // State
    currentStep,
    formData,
    isGenerating,
    generatedIdea,
    error,
    showUnlockOverlay,
    dynamicQuestions,
    questionsLoading,
    questionsError,

    // Computed values
    selectedIndustry,
    selectedProblem,
    selectedAudience,
    selectedBudget,
    selectedTimeline,
    hasPrimarySelections,
    completedSteps,
    requiredStepsCompleted,
    progress,

    // Plan limits
    planType,
    usage,
    limitsLoading,
    getRemainingLimit,
    getUsagePercentage,
    isAtLimit,

    // Actions
    updateFormData,
    appendToUserPrompt,
    autoAdvance,
    prevStep,
    goToStep,
    handleGenerate,
    handleViewAllIdeas,
    resetGeneratedIdea,
    setShowUnlockOverlay,
  } = useIdeaGenerationForm();

  const getDynamicQuestion = (type: DynamicQuestionType) =>
    dynamicQuestions.find((question) => question.type === type);

  const renderInlineDynamicPrompt = (
    type: DynamicQuestionType,
    title: string
  ) => {
    const question = getDynamicQuestion(type);
    if (!question) return null;

    return (
      <DynamicPromptDisplay
        question={question}
        title={title}
        onSuggestionClick={appendToUserPrompt}
      />
    );
  };

  const getStepValueLabel = (stepId: string) => {
    switch (stepId) {
      case 'industry':
        return selectedIndustry?.label ?? null;
      case 'problem':
        return selectedProblem?.label ?? null;
      case 'audience':
        return selectedAudience?.label ?? null;
      case 'resources':
        if (selectedBudget && selectedTimeline) {
          return `${selectedBudget.label} • ${selectedTimeline.period}`;
        }
        if (selectedBudget) {
          return `${selectedBudget.label} • ${selectedBudget.amount}`;
        }
        if (selectedTimeline) {
          return `${selectedTimeline.label} • ${selectedTimeline.period}`;
        }
        return null;
      case 'context':
        return formData.userPrompt
          ? formData.userPrompt.length > 40
            ? `${formData.userPrompt.slice(0, 37)}...`
            : formData.userPrompt
          : null;
      default:
        return null;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Industry
        return (
          <IndustrySelectionStep
            formData={formData}
            onSelect={(value) => updateFormData('industry', value)}
            onAutoAdvance={autoAdvance}
          />
        );

      case 1: // Problem Area
        return (
          <ProblemAreaStep
            formData={formData}
            onSelect={(value) => updateFormData('problemArea', value)}
            onAutoAdvance={autoAdvance}
            renderDynamicPrompt={renderInlineDynamicPrompt}
          />
        );

      case 2: // Target Audience
        return (
          <TargetAudienceStep
            formData={formData}
            onSelect={(value) => updateFormData('targetAudience', value)}
            onAutoAdvance={autoAdvance}
            renderDynamicPrompt={renderInlineDynamicPrompt}
          />
        );

      case 3: // Resources (Budget & Timeline)
        return (
          <BudgetTimelineStep
            formData={formData}
            onBudgetSelect={(value) => updateFormData('budget', value)}
            onTimelineSelect={(value) => updateFormData('timeframe', value)}
            onAutoAdvance={autoAdvance}
            renderDynamicPrompt={renderInlineDynamicPrompt}
          />
        );

      case 4: // Personal Context
        return (
          <DescriptionStep
            formData={formData}
            onUserPromptChange={(value) => updateFormData('userPrompt', value)}
            dynamicQuestions={dynamicQuestions}
            questionsLoading={questionsLoading}
            questionsError={questionsError}
            onAppendToPrompt={appendToUserPrompt}
            hasPrimarySelections={hasPrimarySelections}
          />
        );

      default:
        return null;
    }
  };

  // Show generated idea card if we have one
  if (generatedIdea) {
    return (
      <GeneratedIdeaCard
        idea={generatedIdea}
        onViewAllIdeas={handleViewAllIdeas}
        onGenerateAnother={resetGeneratedIdea}
      />
    );
  }

  // Main form
  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Create Your Startup Idea</CardTitle>
              <CardDescription>
                Tell us your preferences and let AI generate personalized startup ideas for you
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">{completedSteps} / {steps.length} completed</div>
              <div className="text-xs text-muted-foreground">
                {requiredStepsCompleted ? (
                  <span className="text-green-600 font-medium">✓ Ready to generate</span>
                ) : (
                  <span className="text-amber-600">Complete first 4 steps to unlock</span>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 mt-4">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Getting started</span>
              <span>Ready to generate</span>
            </div>
          </div>

          {/* Step Navigation */}
          <StepNavigation
            currentStep={currentStep}
            formData={formData}
            onStepClick={goToStep}
            getStepValueLabel={getStepValueLabel}
          />
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Current Step Content */}
          <div className="min-h-[400px]">
            <div className="space-y-6">
              {renderStepContent()}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              Previous
            </Button>

            {/* Generate Now button - with plan limits display */}
            <GenerateButton
              isGenerating={isGenerating}
              limitsLoading={limitsLoading}
              requiredStepsCompleted={requiredStepsCompleted}
              isAtLimit={isAtLimit('ideas')}
              remainingIdeas={getRemainingLimit('ideas')}
              usagePercentage={getUsagePercentage('ideas')}
              ideasUsed={usage.ideas_used}
              totalIdeasLimit={getRemainingLimit('ideas') + usage.ideas_used}
              onGenerate={handleGenerate}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="border-destructive/20 bg-destructive/5 border rounded-lg p-4 mt-6">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                <span className="text-sm text-destructive">{error}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <UnlockOverlay
        isVisible={showUnlockOverlay}
        onClose={() => setShowUnlockOverlay(false)}
        featureType="ideas"
        currentPlan={planType}
        usedCount={usage.ideas_used}
        limitCount={getRemainingLimit('ideas') + usage.ideas_used}
      />
    </>
  );
}
