/**
 * IdeaHeader Component
 *
 * Displays the main header section of an idea detail page including:
 * - Title with icon
 * - Hero summary
 * - Primary pain point
 * - Target audience
 * - AI confidence score
 */

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Lightbulb, Sparkles, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IdeaHeaderProps {
  title: string;
  heroSummary: string;
  primaryPainPoint: string;
  targetAudience: string;
  confidenceScore: number;
  confidenceLabel: string;
  colors: {
    bg: string;
    text: string;
    icon: string;
    progress: string;
    border: string;
  };
}

export function IdeaHeader({
  title,
  heroSummary,
  primaryPainPoint,
  targetAudience,
  confidenceScore,
  confidenceLabel,
  colors,
}: IdeaHeaderProps) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-950/20 dark:via-background dark:to-purple-950/20 rounded-2xl border-2 border-blue-100 dark:border-blue-900/20">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
      <div className="relative p-8">
        <div className="flex items-start justify-between">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                <Lightbulb className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <Badge variant="outline" className="mb-2">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Generated Idea
                </Badge>
                <h1 className="text-3xl font-bold leading-tight">{title}</h1>
              </div>
            </div>
            <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
              {heroSummary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-muted/30 border">
                <h4 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Primary Pain Point
                </h4>
                <p className="text-sm leading-relaxed">{primaryPainPoint}</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/20 border">
                <h4 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Who We Serve
                </h4>
                <p className="text-sm leading-relaxed">{targetAudience}</p>
              </div>
            </div>
          </div>

          {/* AI Confidence Score - Large Display */}
          <div className={cn("text-center p-6 rounded-2xl border-2 min-w-[200px]", colors.bg, colors.border)}>
            <div className="space-y-3">
              <TrendingUp className={cn("h-8 w-8 mx-auto", colors.icon)} />
              <div>
                <div className="text-4xl font-bold text-primary mb-1">{confidenceScore}%</div>
                <Badge className={cn("text-xs", colors.bg, colors.text)} variant="outline">
                  {confidenceLabel}
                </Badge>
              </div>
              <Progress value={confidenceScore} className="h-2" />
              <p className="text-xs text-muted-foreground">AI Confidence Score</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
