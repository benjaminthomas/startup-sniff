'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { generateIdea } from '@/modules/ideas';
import {
  Loader2,
  Sparkles,
  AlertCircle,
  Zap,
  Target,
  Users,
  DollarSign,
  Lightbulb,
  Brain,
  TrendingUp,
  Check,
  Monitor,
  Heart,
  GraduationCap,
  ShoppingCart,
  Leaf,
  Film,
  Car,
  Bolt,
  MessageSquare,
  Globe,
  CreditCard,
  Home,
  BookOpen,
  HandHeart,
  Rocket,
  Store,
  Briefcase,
  Keyboard,
  Laptop,
  Baby,
  UserX,
  Banknote,
  Building,
  Hammer
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useServerPlanLimits } from '@/modules/usage/hooks';
import { UnlockOverlay } from '@/components/ui/unlock-overlay';
import { StartupIdea, StartupIdeaRow, IdeaGenerationFormData, mapDatabaseRowToStartupIdea } from '@/types/startup-ideas';
import type { DynamicIdeaQuestion, DynamicQuestionType } from '@/modules/ideas/services/question-engine';
import type { UsageData } from '@/modules/usage';

const industries = [
  { id: 'technology', label: 'Technology', icon: Monitor, description: 'Software, AI, hardware' },
  { id: 'healthcare', label: 'Healthcare', icon: Heart, description: 'Medical, wellness, biotech' },
  { id: 'finance', label: 'Finance', icon: DollarSign, description: 'Fintech, banking, payments' },
  { id: 'education', label: 'Education', icon: GraduationCap, description: 'EdTech, learning, training' },
  { id: 'ecommerce', label: 'E-commerce', icon: ShoppingCart, description: 'Online retail, marketplaces' },
  { id: 'sustainability', label: 'Sustainability', icon: Leaf, description: 'Green tech, climate solutions' },
  { id: 'entertainment', label: 'Entertainment', icon: Film, description: 'Media, gaming, content' },
  { id: 'transportation', label: 'Transportation', icon: Car, description: 'Mobility, logistics, delivery' },
];

const problemAreas = [
  { id: 'productivity', label: 'Productivity', icon: Bolt, description: 'Getting things done better' },
  { id: 'communication', label: 'Communication', icon: MessageSquare, description: 'Better connections' },
  { id: 'health', label: 'Health & Wellness', icon: Heart, description: 'Physical and mental health' },
  { id: 'environment', label: 'Environment', icon: Globe, description: 'Sustainability and climate' },
  { id: 'finance', label: 'Personal Finance', icon: CreditCard, description: 'Money management' },
  { id: 'remote-work', label: 'Remote Work', icon: Home, description: 'Distributed teams' },
  { id: 'education', label: 'Learning', icon: BookOpen, description: 'Skill development' },
  { id: 'social-impact', label: 'Social Impact', icon: HandHeart, description: 'Making a difference' },
];

const audiences = [
  { id: 'entrepreneurs', label: 'Entrepreneurs', icon: Rocket, description: 'Business builders' },
  { id: 'small-business', label: 'Small Businesses', icon: Store, description: 'Local businesses' },
  { id: 'professionals', label: 'Professionals', icon: Briefcase, description: 'Working adults' },
  { id: 'students', label: 'Students', icon: GraduationCap, description: 'Learners of all ages' },
  { id: 'developers', label: 'Developers', icon: Keyboard, description: 'Tech professionals' },
  { id: 'remote-workers', label: 'Remote Workers', icon: Laptop, description: 'Digital nomads' },
  { id: 'parents', label: 'Parents', icon: Baby, description: 'Families with children' },
  { id: 'seniors', label: 'Seniors', icon: UserX, description: '65+ demographic' },
];

const budgetOptions = [
  { id: 'low', label: 'Bootstrap', amount: '$0 - $10K', icon: Banknote, description: 'Start lean and scrappy' },
  { id: 'medium', label: 'Funded', amount: '$10K - $100K', icon: CreditCard, description: 'Moderate investment' },
  { id: 'high', label: 'Well-funded', amount: '$100K+', icon: Building, description: 'Strong financial backing' }
];

const timelineOptions = [
  { id: 'short', label: 'Quick Launch', period: '0-6 months', icon: Bolt, description: 'Fast to market' },
  { id: 'medium', label: 'Steady Build', period: '6-18 months', icon: Rocket, description: 'Balanced approach' },
  { id: 'long', label: 'Long-term', period: '18+ months', icon: Hammer, description: 'Complex solutions' }
];

// Use the imported type
type FormData = IdeaGenerationFormData;

export function IdeaGenerationForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedIdea, setGeneratedIdea] = useState<StartupIdea | null>(null);
  const [error, setError] = useState<string>('');
  const [showUnlockOverlay, setShowUnlockOverlay] = useState(false);
  const [dynamicQuestions, setDynamicQuestions] = useState<DynamicIdeaQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const router = useRouter();

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
        console.error('Dynamic prompt fetch failed', err);
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

  const steps = [
    {
      id: 'industry',
      title: 'Choose Your Industry',
      subtitle: 'What market interests you most?',
      icon: Target,
      optional: false,
      required: true
    },
    {
      id: 'problem',
      title: 'What Problem to Solve?',
      subtitle: 'Pick an area where you can make impact',
      icon: Lightbulb,
      optional: false,
      required: true
    },
    {
      id: 'audience',
      title: 'Who Will You Serve?',
      subtitle: 'Define your target audience',
      icon: Users,
      optional: false,
      required: true
    },
    {
      id: 'resources',
      title: 'Your Resources',
      subtitle: 'Budget and timeline preferences',
      icon: DollarSign,
      optional: false,
      required: true
    },
    {
      id: 'context',
      title: 'Personal Touch (Optional)',
      subtitle: 'Tell us about your unique perspective',
      icon: Brain,
      optional: true,
      required: false
    }
  ];

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

  const updateFormData = (key: keyof FormData, value: string | undefined) => {
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

  const getDynamicQuestion = (type: DynamicQuestionType) =>
    dynamicQuestions.find((question) => question.type === type);

  const renderInlineDynamicPrompt = (
    type: DynamicQuestionType,
    title: string
  ) => {
    const question = getDynamicQuestion(type);
    if (!question) return null;

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
              type === 'insight' && 'border-blue-200 text-blue-700 dark:text-blue-300',
              type === 'constraint' && 'border-amber-200 text-amber-700 dark:text-amber-300',
              type === 'differentiator' && 'border-emerald-200 text-emerald-700 dark:text-emerald-300'
            )}
          >
            {type}
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
                onClick={() => appendToUserPrompt(suggestion)}
                className="text-xs h-7 px-3 border border-primary/20 bg-background hover:bg-primary/10"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        )}
      </div>
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
          console.error('Failed to refresh usage after idea generation:', refreshError);
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

  const handleSkipToGenerate = () => {
    handleGenerate();
  };

  if (generatedIdea) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-purple/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="default" className="mb-2">
              <Sparkles className="w-3 h-3 mr-1" />
              AI Generated
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setGeneratedIdea(null);
                setFormData({});
                setCurrentStep(0);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <AlertCircle className="h-4 w-4" />
            </Button>
          </div>
          <CardTitle className="text-xl text-primary flex items-center gap-2">
            <Zap className="w-5 h-5" />
            {generatedIdea.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">{generatedIdea.problem_statement}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-background/50 rounded-lg">
              <span className="font-semibold text-foreground flex items-center gap-1">
                <Target className="w-4 h-4" />
                Target Market:
              </span>
              <p className="text-muted-foreground mt-1">
                {generatedIdea.target_market.description || 'Not specified'}
              </p>
            </div>
            <div className="p-3 bg-background/50 rounded-lg">
              <span className="font-semibold text-foreground flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                Revenue Model:
              </span>
              <p className="text-muted-foreground mt-1">
                {generatedIdea.solution.revenue_model?.join(', ') || 'Not specified'}
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={handleViewAllIdeas} className="flex-1">
              <TrendingUp className="w-4 h-4 mr-2" />
              View Full Details
            </Button>
            <Button variant="outline" onClick={() => {
              setGeneratedIdea(null);
              setFormData({});
              setCurrentStep(0);
            }}>
              Generate Another
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const mainFormContent = (
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
        <div className="flex flex-wrap gap-2 p-1 bg-muted/30 rounded-lg mt-4">
          {steps.map((step, index) => {
            const isActive = index === currentStep;

            // Map step IDs to the correct FormData keys
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

            const isCompleted = getStepCompletion(step.id);
            const StepIcon = step.icon;
            const selectionLabel = getStepValueLabel(step.id);

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => goToStep(index)}
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
          <div className="flex flex-col gap-2">
            {!limitsLoading && (
              <div className="text-xs text-muted-foreground text-center">
                {getRemainingLimit('ideas') === -1 ? (
                  <span className="flex items-center justify-center gap-1 text-green-600">
                    <Sparkles className="h-3 w-3" />
                    Unlimited ideas
                  </span>
                ) : isAtLimit('ideas') ? (
                  <span className="text-amber-600 font-medium">
                    Monthly limit reached ({usage.ideas_used}/{getRemainingLimit('ideas') + usage.ideas_used})
                  </span>
                ) : (
                  <span>
                    {getRemainingLimit('ideas')} idea{getRemainingLimit('ideas') === 1 ? '' : 's'} left this month
                    {getUsagePercentage('ideas') >= 80 && (
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
              onClick={handleSkipToGenerate}
              disabled={isGenerating || limitsLoading || !requiredStepsCompleted}
              className={cn(
                "font-semibold shadow-lg hover:shadow-xl transition-all duration-200",
                !requiredStepsCompleted
                  ? "bg-muted text-muted-foreground cursor-not-allowed hover:bg-muted"
                  : isAtLimit('ideas') && !limitsLoading
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                  : "bg-gradient-to-r from-primary via-blue-600 to-purple-600 hover:from-primary/90 hover:via-blue-600/90 hover:to-purple-600/90 text-white"
              )}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : isAtLimit('ideas') && !limitsLoading ? (
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
  );

  function renderStepContent() {
    switch (currentStep) {
      case 0: // Industry
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
                  onClick={() => {
                    const newValue = formData.industry === industry.id ? undefined : industry.id;
                    updateFormData('industry', newValue);
                    if (newValue && currentStep < steps.length - 1) {
                      autoAdvance();
                    }
                  }}
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

      case 1: // Problem Area
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
                  onClick={() => {
                    const newValue = formData.problemArea === problem.id ? undefined : problem.id;
                    updateFormData('problemArea', newValue);
                    if (newValue && currentStep < steps.length - 1) {
                      autoAdvance();
                    }
                  }}
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
            {renderInlineDynamicPrompt(
              'insight',
              'Focus this idea'
            )}
          </div>
        );

      case 2: // Target Audience
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
                  onClick={() => {
                    const newValue = formData.targetAudience === audience.id ? undefined : audience.id;
                    updateFormData('targetAudience', newValue);
                    if (newValue && currentStep < steps.length - 1) {
                      autoAdvance();
                    }
                  }}
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
            {renderInlineDynamicPrompt(
              'differentiator',
              'Sharpen your persona'
            )}
          </div>
        );

      case 3: // Resources (Budget & Timeline)
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
                    onClick={() => {
                      const newValue = formData.budget === budget.id ? undefined : budget.id;
                      updateFormData('budget', newValue);
                      // Only auto-advance if both budget and timeframe are selected
                      if (newValue && formData.timeframe && currentStep < steps.length - 1) {
                        autoAdvance();
                      }
                    }}
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
                    onClick={() => {
                      const newValue = formData.timeframe === timeframe.id ? undefined : timeframe.id;
                      updateFormData('timeframe', newValue);
                      // Only auto-advance if both budget and timeframe are selected
                      if (newValue && formData.budget && currentStep < steps.length - 1) {
                        autoAdvance();
                      }
                    }}
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
              {renderInlineDynamicPrompt(
                'constraint',
                'Plan around constraints'
              )}
            </div>
          </div>
        );

      case 4: // Personal Context
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
                onChange={(e) => updateFormData('userPrompt', e.target.value || undefined)}
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
                              onClick={() => appendToUserPrompt(suggestion)}
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

      default:
        return null;
    }
  }

  // Render the main component with UnlockOverlay
  return (
    <>
      {mainFormContent}
      
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
