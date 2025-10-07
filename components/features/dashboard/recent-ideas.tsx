'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Heart,
  TrendingUp,
  Zap,
  Target,
  ArrowRight,
  Sparkles,
  BarChart3
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
  const colors = {
    excellent: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      icon: 'text-emerald-600',
      progress: 'bg-gradient-to-r from-emerald-500 to-green-500',
      border: 'border-emerald-200',
    },
    good: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      icon: 'text-blue-600',
      progress: 'bg-gradient-to-r from-blue-500 to-cyan-500',
      border: 'border-blue-200',
    },
    moderate: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      icon: 'text-amber-600',
      progress: 'bg-gradient-to-r from-amber-500 to-orange-500',
      border: 'border-amber-200',
    },
    low: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      icon: 'text-red-600',
      progress: 'bg-gradient-to-r from-red-500 to-rose-500',
      border: 'border-red-200',
    }
  };
  return colors[level as keyof typeof colors] || colors.moderate;
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
      <Card>
        <CardHeader>
          <CardTitle>Recent Ideas</CardTitle>
          <CardDescription>Your latest startup ideas will appear here</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="text-muted-foreground mb-4">
            No ideas generated yet. Get started by creating your first idea!
          </div>
          <Button asChild>
            <Link href="/dashboard/generate">Generate Your First Idea</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Ideas</CardTitle>
          <CardDescription>Your latest startup ideas</CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/ideas">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-6">
          {ideas.slice(0, 3).map((idea) => {
            const confidenceScore = idea.ai_confidence_score || 0;
            const confidenceLevel = getConfidenceLevel(confidenceScore);
            const colors = getConfidenceColors(confidenceLevel);
            const confidenceLabel = getConfidenceLabel(confidenceScore);
            const ConfidenceIcon = getConfidenceIcon(confidenceLevel);
            
            return (
              <Link key={idea.id} href={`/dashboard/ideas/${idea.id}`}>
                <div className={cn(
                  "group relative p-4 rounded-lg border transition-all duration-200",
                  "hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
                  "bg-gradient-to-r from-background via-background to-muted/20",
                  colors.border,
                  "hover:border-primary/30"
                )}>
                  {/* Confidence Indicator Bar */}
                  <div className="absolute top-0 left-0 right-0 h-1 rounded-t-lg overflow-hidden">
                    <div 
                      className={cn("h-full transition-all duration-500", colors.progress)}
                      style={{ width: `${confidenceScore}%` }}
                    />
                  </div>

                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                          {idea.title}
                        </h3>
                        <>
                          {idea.is_favorite && (
                            <Heart className="h-4 w-4 text-red-500 fill-current flex-shrink-0" />
                          )}
                        </>
                        <>
                          {idea.is_validated && (
                            <Badge variant="secondary" className="text-xs">
                              <TrendingUp className="h-3 w-3 mr-1" />
                            Validated
                          </Badge>
                          )}
                        </>
                      </div>

                      <>
                        {(idea.source_data as Record<string, unknown>)?.product_type && (
                          <Badge variant="outline" className="mb-2 text-xs">
                            {(idea.source_data as Record<string, unknown>).product_type as string}
                        </Badge>
                        )}
                      </>

                      <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                        {idea.problem_statement}
                      </p>

                      <>
                        {(idea.source_data as Record<string, unknown>)?.specific_pain_points &&
                         Array.isArray((idea.source_data as Record<string, unknown>).specific_pain_points) &&
                         ((idea.source_data as Record<string, unknown>).specific_pain_points as string[]).length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Key Pain Points:</p>
                            <ul className="text-xs text-muted-foreground space-y-0.5">
                              {((idea.source_data as Record<string, unknown>).specific_pain_points as string[]).slice(0, 2).map((point, idx) => (
                                <li key={idx} className="line-clamp-1">• {point}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>

                      {/* Enhanced Confidence Section */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={cn("flex items-center space-x-2 px-3 py-1 rounded-full", colors.bg)}>
                            <ConfidenceIcon className={cn("h-3 w-3", colors.icon)} />
                            <span className={cn("text-xs font-medium", colors.text)}>
                              {confidenceLabel}
                            </span>
                          </div>
                          
                          {/* Visual Confidence Score */}
                          <div className="flex items-center space-x-2">
                            <div className="w-16">
                              <Progress 
                                value={confidenceScore} 
                                className="h-1.5 bg-gray-200"
                              />
                            </div>
                            <span className={cn("text-xs font-mono font-semibold", colors.text)}>
                              {confidenceScore}%
                            </span>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {new Date(idea.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Action Button */}
                    <div className="flex flex-col items-center justify-center">
                      {/* Clickbait Arrow */}
                      <ArrowRight className={cn(
                        "h-5 w-5 transition-all duration-200 opacity-60",
                        "group-hover:opacity-100 group-hover:translate-x-1",
                        "text-primary"
                      )} />
                    </div>
                  </div>

                  {/* Trending Badge for High Confidence */}
                  {confidenceScore >= 75 && (
                    <div className="absolute -top-1 -right-1">
                      <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm">
                        🔥 Hot
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Enhanced Call-to-Action */}
        {ideas.length > 3 && (
          <div className="mt-6 pt-4 border-t">
            <Button variant="outline" className="w-full group" asChild>
              <Link href="/dashboard/ideas">
                <span>View All {ideas.length} Ideas</span>
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}