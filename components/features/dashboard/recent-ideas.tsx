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
      <Card className="border border-white/80 bg-white/95 shadow-sm shadow-primary/10 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-foreground">Recent Ideas</CardTitle>
            <CardDescription>Your latest startup ideas will appear here</CardDescription>
          </div>
          <div className="hidden h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-sm shadow-violet-500/30 sm:flex">
            <Sparkles className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 via-indigo-100 to-sky-100 text-primary shadow-inner shadow-primary/10">
            <Lightbulb className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            No ideas generated yet. Get started by creating your first idea!
          </p>
          <Button asChild className="mt-6">
            <Link href="/dashboard/generate">Generate your first idea</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-white/80 bg-white/95 shadow-sm shadow-primary/10 backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-sm shadow-violet-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            Recent Ideas
          </CardTitle>
          <CardDescription>Your latest startup ideas</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-violet-100 text-xs font-medium text-violet-600 hover:bg-violet-50"
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
                <article
                  className={cn(
                    "relative overflow-hidden rounded-3xl border border-transparent bg-white/95 transition-transform duration-200",
                    "shadow-sm shadow-violet-200/30 hover:-translate-y-1 hover:shadow-lg"
                  )}
                >
                  <div className="absolute inset-0 rounded-3xl border border-violet-100/60" />
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/20 via-sky-300/30 to-blue-300/30" />
                  <div className="relative flex flex-col gap-5 p-6">
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

                      <div className="flex flex-col items-end gap-2 text-right">
                        {confidenceScore >= 75 ? (
                          <div className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-semibold text-primary shadow-sm shadow-violet-200/30">
                            <Sparkles className="h-3 w-3" />
                            High confidence
                          </div>
                        ) : null}
                        <span className="text-xs text-muted-foreground">
                          {new Date(idea.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                      <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {idea.problem_statement}
                      </p>

                      {firstPainPoints.length > 0 && (
                        <div className="space-y-2 rounded-2xl border border-slate-100/70 bg-slate-50/70 p-4">
                          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                            Key pain points
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {firstPainPoints.map((point, idx) => (
                              <span
                                key={idx}
                                className="rounded-full border border-slate-100 bg-white/90 px-3 py-1 text-xs text-muted-foreground"
                              >
                                {point}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className={cn("flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium", colors.chipBg)}>
                          <ConfidenceIcon className={cn("h-3 w-3", colors.chipIcon)} />
                          <span className={colors.chipText}>{confidenceLabel}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="relative h-1.5 w-24 overflow-hidden rounded-full bg-primary/10">
                            <div
                              className={cn(
                                "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r",
                                colors.barGradient
                              )}
                              style={{ width: `${confidenceScore}%` }}
                            />
                          </div>
                          <span className={cn("text-xs font-mono font-semibold", colors.text)}>
                            {confidenceScore}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-medium text-primary transition-all group-hover:translate-x-1">
                        <span>Open idea</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>

        {ideas.length > 3 && (
          <div className="mt-6 border-t border-violet-50 pt-4">
            <Button
              variant="outline"
              className="w-full border-violet-100 text-primary hover:bg-violet-50"
              asChild
            >
              <Link href="/dashboard/ideas">
                View all {ideas.length} ideas
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
