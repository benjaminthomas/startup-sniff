'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { validateIdea } from '@/server/actions/ideas';
import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Target, 
  CheckCircle,
  AlertTriangle,
  Loader2,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

interface IdeaCardProps {
  idea: {
    id: string;
    title: string;
    description: string;
    target_market: string;
    revenue_models: string[] | null;
    estimated_cost: string;
    time_to_market: string;
    validation_score: number | null;
    validation_data: any;
    created_at: string;
  };
}

export function IdeaCard({ idea }: IdeaCardProps) {
  const [isValidating, setIsValidating] = useState(false);

  const handleValidate = async () => {
    setIsValidating(true);
    
    // Show loading toast with detailed message
    const loadingToast = toast.loading("🔍 AI is analyzing market feasibility, competition, and potential...");
    
    try {
      await validateIdea(idea.id);
      toast.success("✅ Validation complete! Your idea has been scored and analyzed.", {
        id: loadingToast
      });
      
      // Add small delay before reload for better UX
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to validate idea. Please try again.",
        { id: loadingToast }
      );
    } finally {
      setIsValidating(false);
    }
  };

  const getValidationColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getValidationLabel = (score: number) => {
    if (score >= 8) return 'High Potential';
    if (score >= 6) return 'Moderate Potential';
    return 'Needs Work';
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-2">{idea.title}</CardTitle>
          {idea.validation_score ? (
            <Badge 
              variant="outline" 
              className={`ml-2 ${getValidationColor(idea.validation_score)}`}
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              {idea.validation_score}/10
            </Badge>
          ) : (
            <Badge variant="secondary">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Unvalidated
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-3 mt-2">
          {idea.description}
        </p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4">
        <div className="space-y-3 text-sm">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Target:</span>
            <span className="font-medium line-clamp-1">{idea.target_market}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Revenue:</span>
            <span className="font-medium line-clamp-1">
              {idea.revenue_models?.join(', ') || 'TBD'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Timeline:</span>
            <span className="font-medium">{idea.time_to_market}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Cost:</span>
            <span className="font-medium">{idea.estimated_cost}</span>
          </div>
        </div>

        {idea.validation_score && idea.validation_data && (
          <div className="space-y-3 p-3 bg-muted/30 rounded-md">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Validation Results</span>
              <span className={`font-semibold ${getValidationColor(idea.validation_score)}`}>
                {getValidationLabel(idea.validation_score)}
              </span>
            </div>
            
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Feasibility</span>
                  <span>{idea.validation_data.feasibilityScore}/10</span>
                </div>
                <Progress 
                  value={idea.validation_data.feasibilityScore * 10} 
                  className="h-2"
                />
              </div>
              
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Market Potential</span>
                  <span>{idea.validation_data.marketPotential}/10</span>
                </div>
                <Progress 
                  value={idea.validation_data.marketPotential * 10} 
                  className="h-2"
                />
              </div>
            </div>
          </div>
        )}

        <div className="mt-auto pt-4">
          {!idea.validation_score ? (
            <Button 
              onClick={handleValidate}
              disabled={isValidating}
              variant="outline"
              className="w-full"
              size="sm"
            >
              {isValidating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Validate Idea
                </>
              )}
            </Button>
          ) : (
            <Button 
              variant="ghost"
              className="w-full"
              size="sm"
              onClick={() => {
                // TODO: Open detailed view modal or navigate to detail page
                console.log('View details for idea:', idea.id);
              }}
            >
              View Details
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Created {new Date(idea.created_at).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}