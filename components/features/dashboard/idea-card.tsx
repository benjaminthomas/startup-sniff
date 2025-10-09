'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { validateExistingIdea } from '@/modules/validation';
import { toggleFavorite } from '@/modules/ideas';
import { UpgradeModal } from '@/components/ui/upgrade-modal';
import { useServerPlanLimits } from '@/lib/hooks/use-server-plan-limits';
import {
  DollarSign,
  Clock,
  Target,
  CheckCircle,
  AlertTriangle,
  Loader2,
  BarChart3,
  Crown,
  Heart
} from 'lucide-react';
import { toast } from 'sonner';

interface IdeaCardProps {
  idea: {
    id: string;
    title: string;
    problem_statement: string;
    target_market: {
      description: string;
      size: string;
    } | null;
    solution: {
      description: string;
      unique_value_proposition: string;
      revenue_model: string;
    } | null;
    implementation: {
      estimated_cost: string;
      time_to_market: string;
      next_steps: string;
    } | null;
    validation_data: Record<string, unknown> | null;
    is_validated: boolean | null;
    is_favorite: boolean | null;
    ai_confidence_score: number | null;
    created_at: string;
  };
}

export function IdeaCard({ idea }: IdeaCardProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(idea.is_favorite || false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const { isAtLimit, planType, usage, refreshUsage } = useServerPlanLimits();

  const handleValidate = async () => {
    if (isAtLimit('validations')) {
      setShowUpgradeModal(true);
      return;
    }
    
    setIsValidating(true);
    
    // Show loading toast with detailed message
    const loadingToast = toast.loading("🔍 AI is analyzing market feasibility, competition, and potential...");
    
    try {
      const result = await validateExistingIdea(idea.id);
      if (result.success) {
        toast.success("✅ Validation complete! Your idea has been scored and analyzed.", {
          id: loadingToast
        });
        
        // Refresh usage data and reload page for better UX
        await refreshUsage();
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error(result.error || "Failed to validate idea. Please try again.", {
          id: loadingToast
        });
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to validate idea. Please try again.",
        { id: loadingToast }
      );
    } finally {
      setIsValidating(false);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsTogglingFavorite(true);
    try {
      const result = await toggleFavorite(idea.id);
      setIsFavorite(result.is_favorite);
      toast.success(result.is_favorite ? 'Added to favorites!' : 'Removed from favorites');
    } catch (error) {
      console.error('Toggle favorite error:', error);
      toast.error('Failed to update favorite status');
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const getValidationColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 65) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getValidationLabel = (score: number) => {
    if (score >= 80) return 'High Potential';
    if (score >= 65) return 'Good Idea';
    if (score >= 50) return 'Worth Exploring';
    return 'Needs Work';
  };

  return (
    <>
      <Link href={`/dashboard/ideas/${idea.id}`} className="block">
        <Card className="h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer border-2 hover:border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg leading-tight pr-2">{idea.title}</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleFavorite}
                  disabled={isTogglingFavorite}
                  className="p-2 h-auto"
                >
                  <Heart 
                    className={`h-4 w-4 transition-colors ${
                      isFavorite 
                        ? 'text-red-500 fill-red-500' 
                        : 'text-muted-foreground hover:text-red-500'
                    }`} 
                  />
                </Button>
                {idea.is_validated ? (
                  <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 py-2">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    {idea.ai_confidence_score ? `${idea.ai_confidence_score}%` : 'Validated'}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-amber-300 text-amber-600 bg-amber-50 hover:bg-amber-100 py-2">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    Not Validated
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 flex flex-col h-full">
            <p className="text-muted-foreground text-sm line-clamp-3 flex-grow">
              {idea.problem_statement}
            </p>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 2xl:grid-cols-3 gap-3 text-sm">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/10 rounded-lg">
                <Target className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                <div className="font-medium">Target</div>
                <div className="text-xs text-muted-foreground">
                  {String((idea.target_market as Record<string, unknown>)?.primary_demographic || (idea.target_market as Record<string, unknown>)?.description || 'TBD')}
                </div>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-950/10 rounded-lg">
                <DollarSign className="h-4 w-4 mx-auto mb-1 text-green-600" />
                <div className="font-medium">Revenue</div>
                <div className="text-xs text-muted-foreground">
                  {String((idea.solution as Record<string, unknown>)?.business_model || (idea.solution as Record<string, unknown>)?.revenue_model || 'TBD')}
                </div>
              </div>
              <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/10 rounded-lg">
                <Clock className="h-4 w-4 mx-auto mb-1 text-purple-600" />
                <div className="font-medium">Cost</div>
                <div className="text-xs text-muted-foreground">
                  {String((idea.implementation as Record<string, unknown>)?.estimated_cost || 'TBD')}
                </div>
              </div>
            </div>

            {/* Validation Progress */}
            {idea.is_validated && idea.ai_confidence_score && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/10 dark:to-emerald-950/10 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Market Validation</span>
                  <span className={`text-sm font-bold ${getValidationColor(idea.ai_confidence_score)}`}>
                    {idea.ai_confidence_score}%
                  </span>
                </div>
                <Progress value={idea.ai_confidence_score} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {getValidationLabel(idea.ai_confidence_score)}
                </p>
              </div>
            )}

          {/* Validation/Action Section */}
          <div className="mt-auto pt-4 space-y-2">
            {!idea.is_validated ? (
              <>
                <Button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleValidate();
                  }}
                  disabled={isValidating}
                  variant={isAtLimit('validations') ? "default" : "outline"}
                  className={isAtLimit('validations') 
                    ? "w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" 
                    : "w-full"
                  }
                  size="sm"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Validating...
                    </>
                  ) : isAtLimit('validations') ? (
                    <>
                      <Crown className="mr-2 h-4 w-4" />
                      Upgrade to Validate
                    </>
                  ) : (
                    <>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Validate Idea
                    </>
                  )}
                </Button>
                <div className="text-xs text-center text-muted-foreground">
                  {isAtLimit('validations') ? (
                    <span className="text-amber-600 dark:text-amber-400">
                      🚀 Validation limit reached
                    </span>
                  ) : (
                    '📊 Get market analysis, competition insights & success metrics'
                  )}
                </div>
              </>
            ) : (
              <Badge variant="secondary" className="w-full justify-center py-2 bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
                <CheckCircle className="mr-2 h-4 w-4" />
                Validated ✨
              </Badge>
            )}
          </div>

          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Created {new Date(idea.created_at).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            })}
          </div>
        </CardContent>
        </Card>
      </Link>

      <UpgradeModal
        isVisible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureType="validations"
        currentPlan={planType}
        usedCount={usage.validations_used || 0}
        limitCount={-1} // Pro plans have unlimited
      />
    </>
  );
}