import { notFound } from 'next/navigation';
import { getCurrentSession } from '@/modules/auth/services/jwt';
import { createServerAdminClient } from '@/modules/supabase';
import { mapDatabaseRowToStartupIdea } from '@/types/startup-ideas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ValidationButton } from '@/components/features/validation/validation-button';
import { ValidationStatusAlert } from '@/components/features/validation/validation-status-alert';
import { RedditSources } from '@/components/features/ideas/reddit-sources';
import { FavoriteButton } from '@/components/features/ideas/favorite-button';
import { ExportPDFButton } from '@/components/features/ideas/export-pdf-button';
import {
  TrendingUp,
  Target,
  Users,
  DollarSign,
  BarChart3,
  CheckCircle,
  ArrowLeft,
  Lightbulb,
  Zap,
  Clock,
  Star,
  AlertCircle,
  Lock,
  Sparkles,
  Shield,
  Eye,
  FileText,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

function dedupeStrings(values: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const result: string[] = [];
  values.forEach((value) => {
    if (!value) return;
    const cleaned = value.trim();
    if (!cleaned) return;
    if (!/[a-zA-Z]/.test(cleaned)) return;
    if (!cleaned.includes(' ') && cleaned.length < 12) return;
    const key = cleaned.replace(/\s+/g, ' ').toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(cleaned);
  });
  return result;
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
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      text: 'text-emerald-700 dark:text-emerald-300',
      icon: 'text-emerald-600 dark:text-emerald-400',
      progress: 'bg-gradient-to-r from-emerald-500 to-green-500',
      border: 'border-emerald-200 dark:border-emerald-800',
    },
    good: {
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      text: 'text-blue-700 dark:text-blue-300',
      icon: 'text-blue-600 dark:text-blue-400',
      progress: 'bg-gradient-to-r from-blue-500 to-cyan-500',
      border: 'border-blue-200 dark:border-blue-800',
    },
    moderate: {
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      text: 'text-amber-700 dark:text-amber-300',
      icon: 'text-amber-600 dark:text-amber-400',
      progress: 'bg-gradient-to-r from-amber-500 to-orange-500',
      border: 'border-amber-200 dark:border-amber-800',
    },
    low: {
      bg: 'bg-red-50 dark:bg-red-950/20',
      text: 'text-red-700 dark:text-red-300',
      icon: 'text-red-600 dark:text-red-400',
      progress: 'bg-gradient-to-r from-red-500 to-rose-500',
      border: 'border-red-200 dark:border-red-800',
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

export default async function IdeaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Use JWT session instead of Supabase auth
  const session = await getCurrentSession();
  if (!session) {
    notFound();
  }

  const supabase = createServerAdminClient();

  const { data: ideaRaw, error } = await supabase
    .from('startup_ideas')
    .select('*')
    .eq('id', id)
    .eq('user_id', session.userId)
    .single();

  if (error || !ideaRaw) {
    notFound();
  }

  // Create properly typed idea object using the helper function
  const idea = mapDatabaseRowToStartupIdea(ideaRaw);

  const sourceData = (idea.source_data as Record<string, unknown>) || {};
  const solutionData = (idea.solution as unknown as Record<string, unknown>) || {};

  const rawPainPointSources = Array.isArray(sourceData.pain_point_sources)
    ? (sourceData.pain_point_sources as string[])
    : [];
  const rawSpecificPainPoints = Array.isArray(sourceData.specific_pain_points)
    ? (sourceData.specific_pain_points as string[])
    : [];

  const painPoints = dedupeStrings([...rawSpecificPainPoints, ...rawPainPointSources]);
  if (painPoints.length === 0 && idea.problem_statement) {
    painPoints.push(idea.problem_statement);
  }

  const solutionSummary =
    (solutionData.description as string | undefined) ??
    (sourceData.solution_summary as string | undefined) ??
    idea.problem_statement;

  const valueProposition =
    (solutionData.unique_value_proposition as string | undefined) ??
    (sourceData.value_proposition as string | undefined) ??
    solutionSummary;

  const distinctValueProposition =
    valueProposition !== solutionSummary ? valueProposition : undefined;

  const primaryPainPoint = painPoints[0] || idea.problem_statement;
  const heroSummary = valueProposition || solutionSummary;

  const personas = Array.isArray(sourceData.target_personas)
    ? (sourceData.target_personas as Array<{ name: string; role: string; painPoints?: string[] }>)
    : [];

  const primaryPersona = personas[0];

  // Reddit sources functionality disabled until posts table schema is updated
  const redditSources: Record<string, unknown>[] = [];

  const confidenceScore = idea.ai_confidence_score || 0;
  const confidenceLevel = getConfidenceLevel(confidenceScore);
  const colors = getConfidenceColors(confidenceLevel);
  const confidenceLabel = getConfidenceLabel(confidenceScore);

  return (
    <div className="container mx-auto py-2 space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/ideas">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Ideas
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <FavoriteButton
            ideaId={idea.id}
            initialFavoriteState={!!idea.is_favorite}
          />
          <ExportPDFButton
            ideaId={idea.id}
            ideaTitle={idea.title}
          />
        </div>
      </div>

      {/* Hero Section with Idea Title and AI Score */}
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
                  <h1 className="text-3xl font-bold leading-tight">{idea.title}</h1>
                </div>
              </div>
              <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
                {heroSummary}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-muted/30 border">
                  <h4 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Primary Pain Point</h4>
                  <p className="text-sm leading-relaxed">{primaryPainPoint}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/20 border">
                  <h4 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Who We Serve</h4>
                  <p className="text-sm leading-relaxed">
                    {primaryPersona?.role ||
                      (typeof idea.target_market === 'string'
                        ? idea.target_market
                        : Array.isArray(sourceData.target_market_description)
                        ? (sourceData.target_market_description as string[])[0]
                        : 'Growth-focused teams looking for an edge')}
                  </p>
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

      {/* Status Alert */}
  <ValidationStatusAlert ideaId={idea.id} isValidated={idea.is_validated ?? null} />

      {/* Idea Overview Section - Always visible */}
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-950/10 dark:to-gray-950/10">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900/20">
              <FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
            Idea Overview
          </CardTitle>
          <CardDescription>Detailed breakdown of this startup concept</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <>
            {(idea.source_data as Record<string, unknown>)?.product_type && (
              <div>
                <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Product Type</h4>
                <Badge variant="secondary" className="text-sm">
                  {(idea.source_data as Record<string, unknown>).product_type as string}
                </Badge>
              </div>
            )}

            <div>
              <h4 className="font-semibold mb-2 text-sm text-muted-foreground">What is it?</h4>
              <p className="text-sm leading-relaxed">{solutionSummary}</p>
            </div>

            {painPoints.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 text-sm text-muted-foreground">Pain Points Being Solved</h4>
                <div className="space-y-2">
                  {painPoints.map((point, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {personas.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 text-sm text-muted-foreground">Target User Personas</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {personas.map((persona, idx) => (
                    <div key={idx} className="p-4 rounded-lg border bg-muted/30">
                      <h5 className="font-medium mb-1">{persona.name}</h5>
                      <p className="text-xs text-muted-foreground mb-3">{persona.role}</p>
                      {persona.painPoints && persona.painPoints.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium">Their challenges:</p>
                          <ul className="text-xs text-muted-foreground space-y-0.5">
                            {dedupeStrings(persona.painPoints).map((point, i) => (
                              <li key={i}>• {point}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(idea.source_data as Record<string, unknown>)?.technical_stack &&
             Array.isArray((idea.source_data as Record<string, unknown>).technical_stack) &&
             ((idea.source_data as Record<string, unknown>).technical_stack as string[]).length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 text-sm text-muted-foreground">Suggested Tech Stack</h4>
                <div className="flex flex-wrap gap-2">
                  {((idea.source_data as Record<string, unknown>).technical_stack as string[]).map((tech, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {idea.target_market && typeof idea.target_market === 'string' && (
              <div>
                <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Target Market</h4>
                <p className="text-sm">{idea.target_market}</p>
              </div>
            )}
          </>
        </CardContent>
      </Card>

      {/* Reddit Sources Section */}
      {redditSources.length > 0 && (
        <Card className="border border-orange-200 bg-orange-50/30 dark:border-orange-800 dark:bg-orange-950/10">
          <CardContent className="p-6">
            <RedditSources
              sources={redditSources as never[]}
              title="Inspiration from Reddit Discussions"
            />
          </CardContent>
        </Card>
      )}

      {/* Main Content - Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column - Basic Information */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Target Market - Enhanced */}
          <Card className="border-2 py-0">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/10 dark:to-emerald-950/10 py-4">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                  <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                Target Market Analysis
              </CardTitle>
              <CardDescription>Who will benefit from this solution?</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <>
                {typeof idea.target_market === 'object' && idea.target_market && (idea.target_market as unknown as Record<string, unknown>).primary_demographic ? (
                  <div className="space-y-4">
                    <div className="p-6 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-900/10">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        Target Demographics
                      </h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {(idea.target_market as unknown as Record<string, unknown>).primary_demographic as string}
                      </p>
                    </div>

                    <>
                      {(idea.target_market as unknown as Record<string, unknown>).user_personas && Array.isArray((idea.target_market as unknown as Record<string, unknown>).user_personas) && ((idea.target_market as unknown as Record<string, unknown>).user_personas as Array<unknown>).length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Target className="h-4 w-4 text-purple-600" />
                            User Personas
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {((idea.target_market as unknown as Record<string, unknown>).user_personas as Array<{ name: string; description: string; pain_points: string[] }>).map((persona, idx) => (
                              <div key={idx} className="p-4 rounded-lg bg-muted/30 border">
                                <h5 className="font-medium mb-2">{persona.name}</h5>
                                <p className="text-sm text-muted-foreground mb-3">{persona.description}</p>
                                {persona.pain_points && persona.pain_points.length > 0 && (
                                  <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground">Pain Points:</p>
                                    <ul className="text-xs text-muted-foreground space-y-0.5">
                                      {persona.pain_points.map((point, i) => (
                                        <li key={i}>• {point}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>

                  </div>
                ) : (
                <div className="text-center py-12">
                  <div className="relative">
                    <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <div className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      Pro
                    </div>
                  </div>
                  <h4 className="font-semibold mb-2">Detailed Market Data Available After Validation</h4>
                  <p className="text-muted-foreground max-w-md mx-auto mb-4">
                    Get comprehensive demographic analysis, market size calculations, and pain point assessment through AI-powered validation.
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Validate this idea to unlock market sizing, demographics, and persona insights.</p>
                    <Link href="#validation-cta" className="inline-flex items-center text-primary font-medium text-xs">
                      Go to validation
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </div>
                </div>
                )}
              </>
            </CardContent>
          </Card>

          {/* Solution Details */}
          <Card className="border-2 py-0">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/10 dark:to-blue-950/10 py-4">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/20">
                  <CheckCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                Solution Architecture
              </CardTitle>
              <CardDescription>How this idea solves the problem</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
        {typeof idea.solution === 'object' && idea.solution && idea.solution.description ? (
                <div className="space-y-6">
                  {idea.solution.description && (
                    <div className="p-6 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/10 dark:to-purple-950/10 border border-violet-200 dark:border-violet-800">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Star className="h-4 w-4 text-violet-600" />
                        Solution Overview
                      </h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {idea.solution.description}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                      Key Features
                    </h4>
                    {idea.solution.key_features && Array.isArray(idea.solution.key_features) && idea.solution.key_features.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {idea.solution.key_features.map((feature: string, index: number) => (
                          <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    ) : idea.is_validated ? (
                      <div className="p-6 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-900/10 border border-blue-200 dark:border-blue-800 text-center">
                        <Sparkles className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                        <h5 className="font-medium mb-2">Core Solution Features</h5>
                        <p className="text-sm text-muted-foreground mb-4">
                          This validated idea includes essential capabilities based on the problem statement and market analysis.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex items-start gap-3 p-3 rounded-lg bg-white/60 dark:bg-black/20">
                            <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">Core functionality implementation</span>
                          </div>
                          <div className="flex items-start gap-3 p-3 rounded-lg bg-white/60 dark:bg-black/20">
                            <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">User-friendly interface design</span>
                          </div>
                          <div className="flex items-start gap-3 p-3 rounded-lg bg-white/60 dark:bg-black/20">
                            <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">Data management system</span>
                          </div>
                          <div className="flex items-start gap-3 p-3 rounded-lg bg-white/60 dark:bg-black/20">
                            <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">Analytics and reporting tools</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 rounded-lg bg-muted/30 text-center">
                        <div className="relative mb-4">
                          <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <div className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                            Pro
                          </div>
                        </div>
                        <h5 className="font-medium mb-2">Detailed Features Available</h5>
                        <p className="text-sm text-muted-foreground mb-3">
                          Get comprehensive feature breakdown and technical specifications after validation.
                        </p>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <p>Validate to unlock the full feature breakdown, technical specs, and go-to-market playbooks.</p>
                          <Link href="#validation-cta" className="inline-flex items-center justify-center text-primary font-medium text-xs">
                            Run validation
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                  
          {idea.solution.revenue_model && Array.isArray(idea.solution.revenue_model) && idea.solution.revenue_model.length > 0 && (
                    <div className="p-6 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/10 dark:to-green-950/10 border border-emerald-200 dark:border-emerald-800">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                        Revenue Model
                      </h4>
                      <div className="space-y-2">
                        {idea.solution.revenue_model.map((model: string, index: number) => (
                          <p key={index} className="text-muted-foreground">
                            • {model}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {distinctValueProposition && (
                    <div className="p-6 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/10 dark:to-purple-950/10 border border-violet-200 dark:border-violet-800">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Star className="h-4 w-4 text-violet-600" />
                        Value Proposition
                      </h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {distinctValueProposition}
                      </p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">AI-powered automation</span>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Personalized insights</span>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Smart task scheduling</span>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Productivity tracking</span>
                    </div>
                  </div>
                  
                  <div className="p-6 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/10 dark:to-green-950/10 border border-emerald-200 dark:border-emerald-800">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-emerald-600" />
                      Business Model
                    </h4>
                    <p className="text-muted-foreground">
                      SaaS subscription model with tiered pricing
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Market Analysis */}
          <Card className="border-2 py-0">
            <CardHeader className="bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-950/10 dark:to-red-950/10 py-4">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/20">
                  <BarChart3 className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                </div>
                Market Analysis & Competition
              </CardTitle>
              <CardDescription>Competitive landscape and market opportunities</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {idea.is_validated && typeof idea.market_analysis === 'object' && idea.market_analysis ? (
                <div className="space-y-6">
                  <>
                    {(idea.market_analysis as unknown as Record<string, unknown>).market_size && (
                    <div className="p-6 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-900/10 border border-indigo-200 dark:border-indigo-800">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-indigo-600" />
                        Market Opportunity
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">
                            ${Math.round((((idea.market_analysis as unknown as Record<string, unknown>).market_size as Record<string, unknown>)?.tam as number || 0) / 1000000)}M
                          </div>
                          <div className="text-xs text-muted-foreground">TAM (Total Addressable)</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-indigo-600">
                            ${Math.round((((idea.market_analysis as unknown as Record<string, unknown>).market_size as Record<string, unknown>)?.sam as number || 0) / 1000000)}M
                          </div>
                          <div className="text-xs text-muted-foreground">SAM (Serviceable)</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-600">
                            ${Math.round((((idea.market_analysis as unknown as Record<string, unknown>).market_size as Record<string, unknown>)?.som as number || 0) / 1000000)}M
                          </div>
                          <div className="text-xs text-muted-foreground">SOM (Obtainable)</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {(idea.market_analysis as unknown as Record<string, unknown>).competition_level && (
                    <div className="p-6 rounded-xl bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-950/10 dark:to-red-950/10 border border-rose-200 dark:border-rose-800">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Target className="h-5 w-5 text-rose-600" />
                        Competition Analysis
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Competition Level</span>
                          <Badge variant="outline" className="capitalize">{(idea.market_analysis as unknown as Record<string, unknown>).competition_level as string}</Badge>
                        </div>
                        <>
                          {(idea.market_analysis as unknown as Record<string, unknown>).entry_barriers && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Entry Barriers</span>
                              <Badge variant="outline" className="capitalize">{(idea.market_analysis as unknown as Record<string, unknown>).entry_barriers as string}</Badge>
                            </div>
                          )}
                        </>
                      </div>
                    </div>
                  )}

                  <>
                    {(idea.market_analysis as unknown as Record<string, unknown>).competitive_advantages && Array.isArray((idea.market_analysis as unknown as Record<string, unknown>).competitive_advantages) && ((idea.market_analysis as unknown as Record<string, unknown>).competitive_advantages as Array<unknown>).length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Competitive Advantages
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {((idea.market_analysis as unknown as Record<string, unknown>).competitive_advantages as string[]).map((advantage, idx) => (
                            <div key={idx} className="flex items-start gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{advantage}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>

                  <>
                    {(idea.market_analysis as unknown as Record<string, unknown>).market_timing && (
                      <div className="p-6 rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/10 dark:to-violet-950/10 border border-purple-200 dark:border-purple-800">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Clock className="h-5 w-5 text-purple-600" />
                          Market Timing
                        </h4>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {(idea.market_analysis as unknown as Record<string, unknown>).market_timing as string}
                        </p>
                      </div>
                    )}
                  </>

                  </>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="relative mb-6">
                    <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      Pro
                    </div>
                  </div>
                  
                  <h4 className="text-xl font-semibold mb-3">Market Analysis & Competition Data</h4>
                  <p className="text-muted-foreground max-w-2xl mx-auto mb-6 leading-relaxed">
                    Get comprehensive competitive analysis and market insights powered by AI research. 
                    Our validation process analyzes your market landscape to provide actionable intelligence.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 max-w-4xl mx-auto">
                    <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-900/10 border border-indigo-100 dark:border-indigo-900/30">
                      <TrendingUp className="h-6 w-6 text-indigo-600 mx-auto mb-2" />
                      <h5 className="font-medium text-sm mb-1">Market Opportunity Size</h5>
                      <p className="text-xs text-muted-foreground">TAM, SAM, SOM breakdown</p>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-900/10 border border-red-100 dark:border-red-900/30">
                      <Target className="h-6 w-6 text-red-600 mx-auto mb-2" />
                      <h5 className="font-medium text-sm mb-1">Competition Level</h5>
                      <p className="text-xs text-muted-foreground">Barriers & intensity analysis</p>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-900/10 border border-green-100 dark:border-green-900/30">
                      <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <h5 className="font-medium text-sm mb-1">Competitive Advantages</h5>
                      <p className="text-xs text-muted-foreground">Key differentiators</p>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-900/10 border border-purple-100 dark:border-purple-900/30">
                      <Clock className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                      <h5 className="font-medium text-sm mb-1">Market Timing Analysis</h5>
                      <p className="text-xs text-muted-foreground">Current conditions & trends</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground text-center">
                      <p className="mb-2">Validate this idea to unlock competitive benchmarking, TAM/SAM/SOM sizing, and risk assessment.</p>
                      <Link href="#validation-cta" className="inline-flex items-center justify-center text-primary font-medium text-xs">
                        Start validation
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p className="flex items-center justify-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-blue-500" />
                        <span>Market validation includes:</span>
                      </p>
                      <div className="flex flex-wrap justify-center gap-x-8 gap-y-1 text-xs max-w-lg mx-auto">
                        <span className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                          Competitor landscape
                        </span>
                        <span className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                          Market opportunity sizing
                        </span>
                        <span className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                          Success probability
                        </span>
                        <span className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                          Risk assessment
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Implementation Details */}
          <Card className="border-2 py-0">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/10 dark:to-violet-950/10 py-4">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                  <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                Implementation Roadmap
              </CardTitle>
              <CardDescription>How to bring this idea to life</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {typeof idea.implementation === 'object' && idea.implementation ? (
                <div className="space-y-6">
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <>
                        {(idea.implementation as unknown as Record<string, unknown>).technical_complexity && (
                          <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-900/10 border border-indigo-200 dark:border-indigo-800">
                            <h4 className="font-semibold mb-2 text-sm">Technical Complexity</h4>
                            <Badge variant="outline" className="capitalize">{(idea.implementation as unknown as Record<string, unknown>).technical_complexity as string}</Badge>
                          </div>
                        )}
                      </>
                      <>
                        {(idea.implementation as unknown as Record<string, unknown>).time_to_market && (
                          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/10 dark:to-violet-950/10 border border-purple-200 dark:border-purple-800">
                            <h4 className="font-semibold mb-2 text-sm">Time to Market</h4>
                            <p className="text-sm text-muted-foreground">{(idea.implementation as unknown as Record<string, unknown>).time_to_market as string}</p>
                          </div>
                        )}
                      </>
                    </div>

                    <>
                      {(idea.implementation as unknown as Record<string, unknown>).phases && Array.isArray((idea.implementation as unknown as Record<string, unknown>).phases) && ((idea.implementation as unknown as Record<string, unknown>).phases as Array<unknown>).length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Zap className="h-5 w-5 text-indigo-600" />
                        Development Phases
                      </h4>
                      <div className="space-y-3">
                        {((idea.implementation as unknown as Record<string, unknown>).phases as Array<{ phase: string; duration: string; description: string }>).map((phase, idx) => (
                          <div key={idx} className="p-4 rounded-lg border bg-muted/30">
                            <div className="flex items-start justify-between mb-2">
                              <h5 className="font-medium">{phase.phase}</h5>
                              <Badge variant="secondary" className="text-xs">{phase.duration}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{phase.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                      )}
                    </>

                    <>
                      {(idea.implementation as unknown as Record<string, unknown>).milestones && Array.isArray((idea.implementation as unknown as Record<string, unknown>).milestones) && ((idea.implementation as unknown as Record<string, unknown>).milestones as Array<unknown>).length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Key Milestones
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {((idea.implementation as unknown as Record<string, unknown>).milestones as string[]).map((milestone, idx) => (
                          <div key={idx} className="flex items-start gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{milestone}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                      )}
                    </>

                    <>
                      {(idea.implementation as unknown as Record<string, unknown>).tech_stack && Array.isArray((idea.implementation as unknown as Record<string, unknown>).tech_stack) && ((idea.implementation as unknown as Record<string, unknown>).tech_stack as Array<unknown>).length > 0 && (
                    <div className="p-6 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/10 dark:to-cyan-950/10 border border-blue-200 dark:border-blue-800">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Zap className="h-5 w-5 text-blue-600" />
                        Recommended Tech Stack
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {((idea.implementation as unknown as Record<string, unknown>).tech_stack as string[]).map((tech, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                      )}
                    </>

                    <>
                      {(idea.implementation as unknown as Record<string, unknown>).team_capacity && (
                    <div className="p-6 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/10 dark:to-purple-950/10 border border-violet-200 dark:border-violet-800">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Users className="h-5 w-5 text-violet-600" />
                        Team Capacity
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {(idea.implementation as unknown as Record<string, unknown>).team_capacity as string}
                      </p>
                    </div>
                      )}
                    </>

                    <>
                      {(idea.implementation as unknown as Record<string, unknown>).resource_requirements && Array.isArray((idea.implementation as unknown as Record<string, unknown>).resource_requirements) && ((idea.implementation as unknown as Record<string, unknown>).resource_requirements as Array<unknown>).length > 0 && (
                    <div className="p-6 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/10 dark:to-orange-950/10 border border-amber-200 dark:border-amber-800">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-amber-600" />
                        Resource Requirements
                      </h4>
                      <ul className="space-y-2">
                        {((idea.implementation as unknown as Record<string, unknown>).resource_requirements as string[]).map((req, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground">• {req}</li>
                        ))}
                      </ul>
                    </div>
                      )}
                    </>

                  </>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="relative mb-6">
                    <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      Pro
                    </div>
                  </div>
                  
                  <h4 className="text-xl font-semibold mb-3">Implementation Roadmap</h4>
                  <p className="text-muted-foreground max-w-2xl mx-auto mb-6 leading-relaxed">
                    Get detailed implementation guidance, development timelines, and technical specifications through AI-powered validation.
                  </p>
                  
                  <div className="text-sm text-muted-foreground">
                    <p className="flex items-center justify-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-purple-500" />
                      <span>Implementation roadmap includes:</span>
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Actions & Metadata */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Validation Status */}
          <Card
            id="validation-cta"
            className={cn(
              "border-2",
              idea.is_validated
                ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/10"
                : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/10"
            )}
          > 
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {idea.is_validated ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </>
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                )}
                Validation Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {idea.is_validated ? (
                <div className="text-center py-4">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <h4 className="font-semibold mb-2 text-green-800 dark:text-green-200">Validated!</h4>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    This idea has been validated with comprehensive market research.
                  </p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-500 rounded-full animate-pulse"></div>
                    </div>
                    <Eye className="h-12 w-12 text-amber-600 mx-auto mb-3 relative z-10" />
                  </div>
                  <h4 className="font-semibold mb-2 text-amber-800 dark:text-amber-200">Ready to Validate</h4>
                  <p className="text-sm text-amber-600 dark:text-amber-400 mb-4">
                    Unlock detailed insights about your idea&apos;s market potential.
                  </p>
                  <div className="space-y-3">
                    <ValidationButton ideaId={idea.id} isValidated={!!idea.is_validated} className="w-full" />
                    <div className="text-xs text-center space-y-1">
                      <p className="text-muted-foreground">✨ Unlock with validation:</p>
                      <div className="text-xs space-y-0.5">
                        <p className="text-blue-600">• Market size & demographics</p>
                        <p className="text-green-600">• Competition analysis</p>
                        <p className="text-purple-600">• Success probability</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Key Metrics Infographic */}
          <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 dark:border-indigo-800 dark:from-indigo-950/20 dark:to-blue-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
                Key Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {idea.is_validated || (idea.market_analysis && Object.keys(idea.market_analysis).length > 0) ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    {/* AI Confidence */}
                    <div className="text-center p-4 rounded-xl bg-white/60 dark:bg-black/20">
                      <TrendingUp className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-600">{confidenceScore}%</div>
                      <div className="text-xs text-muted-foreground">AI Confidence</div>
                    </div>
                    
                    {/* Market Opportunity */}
                    <div className="text-center p-4 rounded-xl bg-white/60 dark:bg-black/20">
                      <Target className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-600">
                        {(idea.market_analysis as unknown as Record<string, unknown>)?.market_size ?
                          `$${Math.round(((idea.market_analysis as unknown as Record<string, unknown>).market_size as Record<string, unknown>)?.tam as number || 0) / 1000000}M` :
                          'TBD'
                        }
                      </div>
                      <div className="text-xs text-muted-foreground">Market Size</div>
                    </div>
                    
                    {/* Validation Status */}
                    <div className="text-center p-4 rounded-xl bg-white/60 dark:bg-black/20">
                      <Shield className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <div className={cn("text-sm font-bold capitalize", idea.is_validated ? "text-green-600" : "text-amber-600")}
                      >
                        {idea.is_validated ? 'Validated' : 'Pending'}
                      </div>
                      <div className="text-xs text-muted-foreground">Status</div>
                    </div>

                    {/* Implementation Ready */}
                    <div className="text-center p-4 rounded-xl bg-white/60 dark:bg-black/20">
                      <CheckCircle className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                      <div className="text-sm font-bold text-purple-600">
                        {idea.is_validated ? 'Ready' : 'In planning'}
                      </div>
                      <div className="text-xs text-muted-foreground">Implementation</div>
                    </div>
                  </div>

                  {/* Progress Indicators */}
                  <div className="mt-6 space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Market Readiness</span>
                        <span>{confidenceScore}%</span>
                      </div>
                      <Progress value={confidenceScore} className="h-2" />
                    </div>

                    {idea.is_validated && (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Validation Complete</span>
                          <span>100%</span>
                        </div>
                        <Progress value={100} className="h-2" />
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 flex items-center justify-center mx-auto mb-3">
                      <BarChart3 className="h-8 w-8 text-indigo-500" />
                    </div>
                    <div className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      Pro
                    </div>
                  </div>
                  
                  <h4 className="font-semibold mb-2">Comprehensive Metrics Available</h4>
                  <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                    Unlock detailed performance metrics, market sizing, and risk assessment through AI validation.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                    <div className="p-2 rounded bg-white/60 dark:bg-black/20">
                      <TrendingUp className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                      <div className="text-muted-foreground">AI Score</div>
                    </div>
                    <div className="p-2 rounded bg-white/60 dark:bg-black/20">
                      <Target className="h-4 w-4 text-green-500 mx-auto mb-1" />
                      <div className="text-muted-foreground">Market Size</div>
                    </div>
                    <div className="p-2 rounded bg-white/60 dark:bg-black/20">
                      <Shield className="h-4 w-4 text-red-500 mx-auto mb-1" />
                      <div className="text-muted-foreground">Competition</div>
                    </div>
                    <div className="p-2 rounded bg-white/60 dark:bg-black/20">
                      <Clock className="h-4 w-4 text-purple-500 mx-auto mb-1" />
                      <div className="text-muted-foreground">Timeline</div>
                    </div>
                  </div>
                  
                  <Link href="#validation-cta" className="inline-flex items-center justify-center text-primary font-medium text-xs">
                    Validate to unlock metrics
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Generate Content
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                Analyze Trends  
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <Target className="h-4 w-4 mr-2" />
                Similar Ideas
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Idea Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm font-medium">{new Date(idea.created_at).toLocaleDateString()}</span>
              </div>
              
              {idea.updated_at !== idea.created_at && (
                <div className="flex items-center justify-between py-2 border-t">
                  <span className="text-sm text-muted-foreground">Last Updated</span>
                  <span className="text-sm font-medium">{new Date(idea.updated_at).toLocaleDateString()}</span>
                </div>
              )}
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-muted-foreground">Idea Generated</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <div className={cn("w-2 h-2 rounded-full", idea.is_validated ? "bg-green-500" : "bg-gray-300")}></div>
                  <span className={cn("text-muted-foreground", idea.is_validated && "text-green-600")}>
                    Market Validated {idea.is_validated ? "✓" : ""}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  <span className="text-muted-foreground">Content Generated</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
