'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Heart,
  TrendingUp,
  Zap,
  Target,
  ArrowRight,
  Sparkles,
  BarChart3,
  Lightbulb,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { StartupIdea } from '@/types/global';

interface RecentIdeasProps {
  ideas: StartupIdea[];
}

// Helper functions for confidence level styling
function getConfidenceLevel(score: number) {
  if (score >= 80) return 'excellent';
  if (score >= 65) return 'good';
  if (score >= 50) return 'moderate';
  return 'low';
}

function getConfidenceColors(level: string) {
  const palettes = {
    excellent: {
      chipBg: 'bg-emerald-50/80',
      chipText: 'text-emerald-600',
      chipIcon: 'text-emerald-500',
      barGradient: 'from-emerald-500 via-green-500 to-emerald-400',
      text: 'text-emerald-600',
    },
    good: {
      chipBg: 'bg-sky-50/80',
      chipText: 'text-sky-600',
      chipIcon: 'text-sky-500',
      barGradient: 'from-sky-500 via-blue-500 to-indigo-500',
      text: 'text-sky-600',
    },
    moderate: {
      chipBg: 'bg-amber-50/80',
      chipText: 'text-amber-600',
      chipIcon: 'text-amber-500',
      barGradient: 'from-amber-500 via-orange-500 to-amber-400',
      text: 'text-amber-600',
    },
    low: {
      chipBg: 'bg-rose-50/80',
      chipText: 'text-rose-600',
      chipIcon: 'text-rose-500',
      barGradient: 'from-rose-500 via-red-500 to-rose-400',
      text: 'text-rose-600',
    },
  };
  return palettes[level as keyof typeof palettes] || palettes.moderate;
}

function getConfidenceLabel(score: number) {
  if (score >= 80) return 'High Potential';
  if (score >= 65) return 'Good Idea';
  if (score >= 50) return 'Worth Exploring';
  return 'Needs Work';
}

function getConfidenceIcon(level: string) {
  const icons = {
    excellent: Sparkles,
    good: Target,
    moderate: BarChart3,
    low: Zap,
  };
  return icons[level as keyof typeof icons] || BarChart3;
}

export function RecentIdeas({ ideas }: RecentIdeasProps) {
  if (ideas.length === 0) {
    return (
      <Card className="bg-white shadow-sm border-gray-100">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Recent Ideas</CardTitle>
          <CardDescription>Your latest startup ideas will appear here</CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#2D6EF7]/10 text-[#2D6EF7]">
            <Lightbulb className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            No ideas generated yet. Get started by creating your first idea!
          </p>
          <Button asChild className="mt-6 bg-[#2D6EF7] hover:bg-[#1E5EE8]">
            <Link href="/dashboard/generate">Generate your first idea</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm border-gray-100">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-foreground">
            Recent Ideas
          </CardTitle>
          <CardDescription>Your latest startup ideas</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-xs font-medium text-[#2D6EF7] hover:bg-[#2D6EF7]/5"
          asChild
        >
          <Link href="/dashboard/ideas">View all</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {ideas.slice(0, 3).map((idea) => {
            const confidenceScore = idea.ai_confidence_score || 0;
            const confidenceLevel = getConfidenceLevel(confidenceScore);
            const colors = getConfidenceColors(confidenceLevel);
            const confidenceLabel = getConfidenceLabel(confidenceScore);
            const ConfidenceIcon = getConfidenceIcon(confidenceLevel);
            const sourceData = (idea.source_data ?? {}) as Record<string, unknown>;
            const productType =
              typeof sourceData.product_type === "string" ? (sourceData.product_type as string) : undefined;
            const painPoints = Array.isArray(sourceData.specific_pain_points)
              ? (sourceData.specific_pain_points as string[])
              : [];
            const firstPainPoints = painPoints.slice(0, 2);
            
            return (
              <Link key={idea.id} href={`/dashboard/ideas/${idea.id}`} className="block group">
                <article className="rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-[#2D6EF7]/30 hover:shadow-md">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-semibold text-foreground transition-colors group-hover:text-primary">
                            {idea.title}
                          </h3>
                          {idea.is_favorite && (
                            <Heart className="h-4 w-4 flex-shrink-0 text-rose-500" />
                          )}
                          {idea.is_validated && (
                            <Badge className="flex items-center gap-1 border border-emerald-100 bg-emerald-50/80 text-[11px] font-medium text-emerald-600">
                              <TrendingUp className="h-3 w-3" />
                              Validated
                            </Badge>
                          )}
                        </div>
                        {productType && (
                          <Badge variant="outline" className="border-transparent bg-primary/10 text-xs text-primary">
                            {productType}
                          </Badge>
                        )}
                      </div>

                      <span className="text-xs text-muted-foreground">
                        {new Date(idea.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                      <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {idea.problem_statement}
                      </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn("flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium", colors.chipBg)}>
                          <ConfidenceIcon className={cn("h-3.5 w-3.5", colors.chipIcon)} />
                          <span className={colors.chipText}>{confidenceLabel}</span>
                        </div>
                        <span className={cn("text-xs font-semibold", colors.text)}>
                          {confidenceScore}%
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-medium text-[#2D6EF7]">
                        <span>View details</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>

        {ideas.length > 3 && (
          <div className="mt-6 border-t border-gray-100 pt-4">
            <Button
              variant="outline"
              className="w-full text-[#2D6EF7] hover:bg-[#2D6EF7]/5"
              asChild
            >
              <Link href="/dashboard/ideas">
                View all {ideas.length} ideas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
