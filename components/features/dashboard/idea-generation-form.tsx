'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { generateIdea } from '@/server/actions/ideas';
import { 
  Loader2, 
  Sparkles, 
  AlertCircle, 
  ChevronRight, 
  Zap, 
  Target, 
  Users, 
  DollarSign,
  Clock,
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
import { useServerPlanLimits } from '@/lib/hooks/use-server-plan-limits';
import { UnlockOverlay } from '@/components/ui/unlock-overlay';

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

type FormData = {
  industry?: string;
  problemArea?: string;
  targetAudience?: string;
  budget?: string;
  timeframe?: string;
  userPrompt?: string;
}

export function IdeaGenerationForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedIdea, setGeneratedIdea] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [isPending, startTransition] = useTransition();
  const [showUnlockOverlay, setShowUnlockOverlay] = useState(false);
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

  const steps = [
    { 
      id: 'industry', 
      title: 'Choose Your Industry', 
      subtitle: 'What market interests you most?',
      icon: Target,
      optional: true
    },
    { 
      id: 'problem', 
      title: 'What Problem to Solve?', 
      subtitle: 'Pick an area where you can make impact',
      icon: Lightbulb,
      optional: true
    },
    { 
      id: 'audience', 
      title: 'Who Will You Serve?', 
      subtitle: 'Define your target audience',
      icon: Users,
      optional: true
    },
    { 
      id: 'resources', 
      title: 'Your Resources', 
      subtitle: 'Budget and timeline preferences',
      icon: DollarSign,
      optional: true
    },
    { 
      id: 'context', 
      title: 'Personal Touch', 
      subtitle: 'Tell us about your unique perspective',
      icon: Brain,
      optional: true
    }
  ];

  const completedSteps = Object.keys(formData).filter(key => formData[key as keyof FormData]).length;
  const progress = (completedSteps / steps.length) * 100;

  const updateFormData = (key: keyof FormData, value: string | undefined) => {
    setFormData(prev => ({ ...prev, [key]: value }));
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
        // Refresh usage data after successful generation
        await refreshUsage();
        
        setGeneratedIdea(result.idea);
        toast.success(`Created "${result.idea.title}" - Your next big opportunity awaits!`, { 
          id: loadingToast 
        });

        // Show usage progress
        const remaining = getRemainingLimit('ideas');
        if (remaining > 0 && remaining <= 2) {
          toast.info(`You have ${remaining} idea${remaining === 1 ? '' : 's'} left this month`, {
            duration: 4000,
          });
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate idea';
      setError(errorMessage);
      toast.error(`${errorMessage}`, { 
        id: loadingToast 
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
              onClick={() => setGeneratedIdea(null)}
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
          <p className="text-muted-foreground leading-relaxed">{generatedIdea.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-background/50 rounded-lg">
              <span className="font-semibold text-foreground flex items-center gap-1">
                <Target className="w-4 h-4" />
                Target Market:
              </span>
              <p className="text-muted-foreground mt-1">
                {typeof generatedIdea.target_market === 'object' 
                  ? generatedIdea.target_market?.description || 'Not specified'
                  : generatedIdea.target_market || 'Not specified'
                }
              </p>
            </div>
            <div className="p-3 bg-background/50 rounded-lg">
              <span className="font-semibold text-foreground flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                Revenue Model:
              </span>
              <p className="text-muted-foreground mt-1">
                {Array.isArray(generatedIdea.solution?.revenue_model) 
                  ? generatedIdea.solution.revenue_model.join(', ')
                  : generatedIdea.revenue_models?.join?.(', ') || 'Not specified'
                }
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={handleViewAllIdeas} className="flex-1">
              <TrendingUp className="w-4 h-4 mr-2" />
              View Full Details
            </Button>
            <Button variant="outline" onClick={() => setGeneratedIdea(null)}>
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
            <div className="text-xs text-muted-foreground">All steps optional</div>
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
            
            return (
              <Button
                key={step.id}
                variant={isActive ? "default" : isCompleted ? "secondary" : "ghost"}
                size="sm"
                onClick={() => goToStep(index)}
                className={cn(
                  "flex-1 min-w-0 transition-all duration-200",
                  isActive && "shadow-sm",
                  isCompleted && !isActive && "bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400"
                )}
              >
                {isCompleted && !isActive ? (
                  <Check className="w-4 h-4 mr-1 flex-shrink-0" />
                ) : (
                  <StepIcon className="w-4 h-4 mr-1 flex-shrink-0" />
                )}
                <span className="truncate">{step.title}</span>
              </Button>
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
            
            <Button
              onClick={handleSkipToGenerate}
              disabled={isGenerating || limitsLoading}
              className={cn(
                "font-semibold shadow-lg hover:shadow-xl transition-all duration-200",
                isAtLimit('ideas') && !limitsLoading
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
            <p className="text-muted-foreground text-sm">
              Choose an industry that interests you or skip this step for general ideas.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {industries.map((industry) => (
                <Button
                  key={industry.id}
                  variant={formData.industry === industry.id ? "default" : "outline"}
                  className={cn(
                    "h-auto p-4 flex flex-col items-start text-left transition-all duration-200 hover:scale-[1.02]",
                    formData.industry === industry.id 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "hover:bg-muted/80 hover:border-primary/30 hover:shadow-sm"
                  )}
                  onClick={() => {
                    const newValue = formData.industry === industry.id ? undefined : industry.id;
                    updateFormData('industry', newValue);
                    if (newValue && currentStep < steps.length - 1) {
                      autoAdvance();
                    }
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <industry.icon className={cn(
                      "h-5 w-5", 
                      formData.industry === industry.id ? "text-primary-foreground" : "text-foreground"
                    )} />
                    <span className={cn(
                      "font-semibold",
                      formData.industry === industry.id ? "text-primary-foreground" : "text-foreground"
                    )}>{industry.label}</span>
                  </div>
                  <span className={cn(
                    "text-xs",
                    formData.industry === industry.id ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}>{industry.description}</span>
                </Button>
              ))}
            </div>
          </div>
        );

      case 1: // Problem Area
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              What kind of problems do you want to solve? Pick what resonates with you.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {problemAreas.map((problem) => (
                <Button
                  key={problem.id}
                  variant={formData.problemArea === problem.id ? "default" : "outline"}
                  className={cn(
                    "h-auto p-4 flex flex-col items-start text-left transition-all duration-200 hover:scale-[1.02]",
                    formData.problemArea === problem.id 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "hover:bg-muted/80 hover:border-primary/30 hover:shadow-sm"
                  )}
                  onClick={() => {
                    const newValue = formData.problemArea === problem.id ? undefined : problem.id;
                    updateFormData('problemArea', newValue);
                    if (newValue && currentStep < steps.length - 1) {
                      autoAdvance();
                    }
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <problem.icon className={cn(
                      "h-5 w-5", 
                      formData.problemArea === problem.id ? "text-primary-foreground" : "text-foreground"
                    )} />
                    <span className={cn(
                      "font-semibold",
                      formData.problemArea === problem.id ? "text-primary-foreground" : "text-foreground"
                    )}>{problem.label}</span>
                  </div>
                  <span className={cn(
                    "text-xs",
                    formData.problemArea === problem.id ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}>{problem.description}</span>
                </Button>
              ))}
            </div>
          </div>
        );

      case 2: // Target Audience
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Who would you like to build products for? Think about your ideal customers.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {audiences.map((audience) => (
                <Button
                  key={audience.id}
                  variant={formData.targetAudience === audience.id ? "default" : "outline"}
                  className={cn(
                    "h-auto p-4 flex flex-col items-start text-left transition-all duration-200 hover:scale-[1.02]",
                    formData.targetAudience === audience.id 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "hover:bg-muted/80 hover:border-primary/30 hover:shadow-sm"
                  )}
                  onClick={() => {
                    const newValue = formData.targetAudience === audience.id ? undefined : audience.id;
                    updateFormData('targetAudience', newValue);
                    if (newValue && currentStep < steps.length - 1) {
                      autoAdvance();
                    }
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <audience.icon className={cn(
                      "h-5 w-5", 
                      formData.targetAudience === audience.id ? "text-primary-foreground" : "text-foreground"
                    )} />
                    <span className={cn(
                      "font-semibold",
                      formData.targetAudience === audience.id ? "text-primary-foreground" : "text-foreground"
                    )}>{audience.label}</span>
                  </div>
                  <span className={cn(
                    "text-xs",
                    formData.targetAudience === audience.id ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}>{audience.description}</span>
                </Button>
              ))}
            </div>
          </div>
        );

      case 3: // Resources (Budget & Timeline)
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-semibold mb-3 block">Budget Range</Label>
              <p className="text-muted-foreground text-sm mb-4">
                How much are you planning to invest initially?
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { id: 'low', label: 'Bootstrap', amount: '$0 - $10K', icon: Banknote, description: 'Start lean and scrappy' },
                  { id: 'medium', label: 'Funded', amount: '$10K - $100K', icon: CreditCard, description: 'Moderate investment' },
                  { id: 'high', label: 'Well-funded', amount: '$100K+', icon: Building, description: 'Strong financial backing' }
                ].map((budget) => (
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
              <Label className="text-base font-semibold mb-3 block">Timeline</Label>
              <p className="text-muted-foreground text-sm mb-4">
                When would you like to launch?
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { id: 'short', label: 'Quick Launch', period: '0-6 months', icon: Bolt, description: 'Fast to market' },
                  { id: 'medium', label: 'Steady Build', period: '6-18 months', icon: Rocket, description: 'Balanced approach' },
                  { id: 'long', label: 'Long-term', period: '18+ months', icon: Hammer, description: 'Complex solutions' }
                ].map((timeframe) => (
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
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Pro Tips</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Mention your skills and experience</li>
                <li>• Share what problems you've personally experienced</li>
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