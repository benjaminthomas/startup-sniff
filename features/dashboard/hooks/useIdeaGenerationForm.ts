'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { generateIdea } from '@/features/ideas';
import { useServerPlanLimits } from '@/hooks';
import { log } from '@/lib/logger/client';
import type {
  IdeaGenerationFormData,
  StartupIdea,
  StartupIdeaRow,
  mapDatabaseRowToStartupIdea
} from '@/types/startup-ideas';
import type { DynamicIdeaQuestion } from '@/features/ideas/services/question-engine';
import type { UsageData } from '@/features/usage';
import { industries, problemAreas, audiences, budgetOptions, timelineOptions, steps } from '../constants/idea-generation';

export function useIdeaGenerationForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<IdeaGenerationFormData>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedIdea, setGeneratedIdea] = useState<StartupIdea | null>(null);
  const [error, setError] = useState<string>('');
  const [showUnlockOverlay, setShowUnlockOverlay] = useState(false);
  const [dynamicQuestions, setDynamicQuestions] = useState<DynamicIdeaQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const router = useRouter();

  // Plan limits integration using server-side hook
  const {
    planType,
    usage,
    isLoading: limitsLoading,
    getRemainingLimit,
    getUsagePercentage,
    isAtLimit,
    refreshUsage,
  } = useServerPlanLimits();

  // Memoized selections
  const selectedIndustry = useMemo(
    () => industries.find((industry) => industry.id === formData.industry),
    [formData.industry]
  );
  const selectedProblem = useMemo(
    () => problemAreas.find((problem) => problem.id === formData.problemArea),
    [formData.problemArea]
  );
  const selectedAudience = useMemo(
    () => audiences.find((audience) => audience.id === formData.targetAudience),
    [formData.targetAudience]
  );
  const selectedBudget = useMemo(
    () => budgetOptions.find((budget) => budget.id === formData.budget),
    [formData.budget]
  );
  const selectedTimeline = useMemo(
    () => timelineOptions.find((timeline) => timeline.id === formData.timeframe),
    [formData.timeframe]
  );

  const hasPrimarySelections = Boolean(
    formData.industry || formData.problemArea || formData.targetAudience
  );

  // Fetch dynamic questions when primary selections change
  useEffect(() => {
    if (
      !formData.industry &&
      !formData.problemArea &&
      !formData.targetAudience
    ) {
      setDynamicQuestions([]);
      setQuestionsError(null);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setQuestionsLoading(true);
        setQuestionsError(null);

        const response = await fetch('/api/ideas/dynamic-prompts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            industry: selectedIndustry?.label ?? formData.industry,
            problemArea: selectedProblem?.label ?? formData.problemArea,
            targetAudience: selectedAudience?.label ?? formData.targetAudience
          }),
          credentials: 'include',
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error('Request failed');
        }

        const data = await response.json();
        setDynamicQuestions(data?.questions ?? []);
      } catch (err) {
        if (controller.signal.aborted) return;
        log.error('Dynamic prompt fetch failed', err);
        setQuestionsError('Unable to personalise prompts right now.');
      } finally {
        if (!controller.signal.aborted) {
          setQuestionsLoading(false);
        }
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [
    formData.industry,
    formData.problemArea,
    formData.targetAudience,
    selectedIndustry?.label,
    selectedProblem?.label,
    selectedAudience?.label
  ]);

  // Count completed steps more accurately
  const getCompletedStepsCount = () => {
    let count = 0;
    if (formData.industry) count++;
    if (formData.problemArea) count++;
    if (formData.targetAudience) count++;
    if (formData.budget || formData.timeframe) count++;
    if (formData.userPrompt) count++;
    return count;
  };

  const calculateRemainingIdeas = (usageData?: UsageData | null): number => {
    if (usageData?.limits) {
      const limit = usageData.limits.ideas_per_month;
      if (limit === -1) return -1;
      const used = usageData.usage?.ideas_used ?? 0;
      return Math.max(0, limit - Number(used));
    }

    return getRemainingLimit('ideas');
  };

  // Check if minimum required steps are completed (first 4 steps, 5th is optional)
  const getRequiredStepsCompleted = () => {
    return !!(formData.industry && formData.problemArea && formData.targetAudience && (formData.budget || formData.timeframe));
  };

  const completedSteps = getCompletedStepsCount();
  const requiredStepsCompleted = getRequiredStepsCompleted();
  const progress = (completedSteps / steps.length) * 100;

  const updateFormData = (key: keyof IdeaGenerationFormData, value: string | undefined) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const appendToUserPrompt = (snippet: string) => {
    setFormData((prev) => {
      const existing = prev.userPrompt?.trim() ?? '';
      const prefix = existing.length > 0 ? `${existing}\n• ` : '• ';
      const candidate = `${prefix}${snippet}`.trim();
      // Clamp to textarea max length
      const clamped = candidate.slice(0, 500);
      return { ...prev, userPrompt: clamped };
    });
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleGenerate();
    }
  };

  const autoAdvance = () => {
    // Small delay to show selection feedback before advancing
    setTimeout(() => {
      nextStep();
    }, 300);
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  const handleGenerate = async () => {
    // Check plan limits before generating
    if (isAtLimit('ideas')) {
      setShowUnlockOverlay(true);
      return;
    }

    setIsGenerating(true);
    setError('');
    setGeneratedIdea(null);

    // Create form data from state
    const submitFormData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value) submitFormData.append(key, value);
    });

    // Show animated loading toast
    const loadingToast = toast.loading(
      "AI is analyzing market trends and crafting your perfect startup idea...",
      { duration: Infinity }
    );

    try {
      const result = await generateIdea(submitFormData);

      if (result.success && result.idea) {
        // Convert database row to properly typed StartupIdea
        const { mapDatabaseRowToStartupIdea } = await import('@/types/startup-ideas');
        const typedIdea = result.idea ? mapDatabaseRowToStartupIdea(result.idea as unknown as StartupIdeaRow) : null;
        setGeneratedIdea(typedIdea);

        // Reset form for next idea generation
        setFormData({});
        setCurrentStep(0);

        let remainingIdeas = calculateRemainingIdeas();
        try {
          const updatedUsage = await refreshUsage();
          remainingIdeas = calculateRemainingIdeas(updatedUsage);
        } catch (refreshError) {
          log.error('Failed to refresh usage after idea generation:', refreshError);
        }

        toast.success(`Created "${result.idea.title}" - Your next big opportunity awaits!`, {
          id: loadingToast,
          duration: 5000
        });

        // Show usage progress
        if (remainingIdeas > 0 && remainingIdeas <= 2) {
          toast.info(`You have ${remainingIdeas} idea${remainingIdeas === 1 ? '' : 's'} left this month`, {
            duration: 4000,
          });
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate idea';
      setError(errorMessage);
      toast.error(`${errorMessage}`, {
        id: loadingToast,
        duration: 5000
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleViewAllIdeas = () => {
    router.push('/dashboard/ideas');
  };

  const resetGeneratedIdea = () => {
    setGeneratedIdea(null);
    setFormData({});
    setCurrentStep(0);
  };

  return {
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
    nextStep,
    autoAdvance,
    prevStep,
    goToStep,
    handleGenerate,
    handleViewAllIdeas,
    resetGeneratedIdea,
    setShowUnlockOverlay,
  };
}
