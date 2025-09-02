import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/auth/supabase-server';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ValidationButton } from '@/components/features/validation/validation-button';
import { ValidationMessage } from '@/components/features/validation/validation-message';
import { ValidationStatusAlert } from '@/components/features/validation/validation-status-alert';
import { 
  Heart, 
  TrendingUp, 
  Target,
  Users,
  DollarSign,
  BarChart3,
  CheckCircle,
  ArrowLeft,
  ExternalLink,
  Lightbulb,
  Zap,
  Clock,
  Star,
  AlertCircle,
  Lock,
  Unlock,
  Sparkles,
  Shield,
  Eye,
  FileText,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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

export default async function IdeaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: idea, error } = await supabase
    .from('startup_ideas')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !idea) {
    notFound();
  }

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
          <Button variant="outline" size="sm">
            <Heart className={cn("h-4 w-4 mr-2", idea.is_favorite ? "text-red-500 fill-current" : "")} />
            {idea.is_favorite ? "Favorited" : "Add to Favorites"}
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
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
                {idea.problem_statement}
              </p>
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
      <ValidationStatusAlert ideaId={idea.id} isValidated={idea.is_validated} />

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
              {typeof idea.target_market === 'object' && idea.target_market && (idea.target_market.primary_demographic || idea.target_market.description) ? (
                <div className="space-y-4">
                  {/* Target Demographics */}
                  <div className="p-6 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-900/10">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      Target Demographics
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">
                      {idea.target_market.primary_demographic || idea.target_market.description || 'Students and professionals seeking better collaboration tools'}
                    </p>
                  </div>

                  {/* Pain Points & Needs */}
                  {idea.target_market.pain_level && (
                    <div className="p-6 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-900/10">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        Pain Level
                      </h4>
                      <Badge variant={
                        idea.target_market.pain_level === 'high' ? 'destructive' :
                        idea.target_market.pain_level === 'medium' ? 'secondary' : 'default'
                      } className="text-sm">
                        {idea.target_market.pain_level.charAt(0).toUpperCase() + idea.target_market.pain_level.slice(1)} Pain
                      </Badge>
                    </div>
                  )}
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
                  <div className="space-y-2">
                    <ValidationButton ideaId={idea.id} isValidated={idea.is_validated} className="w-full" />
                    <ValidationMessage className="text-center" />
                  </div>
                </div>
              )}
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
              {typeof idea.solution === 'object' && idea.solution && (idea.solution.value_proposition || idea.solution.description) ? (
                <div className="space-y-6">
                  {(idea.solution.value_proposition || idea.solution.unique_value_proposition || idea.solution.description) && (
                    <div className="p-6 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/10 dark:to-purple-950/10 border border-violet-200 dark:border-violet-800">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Star className="h-4 w-4 text-violet-600" />
                        Solution Overview
                      </h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {idea.solution.value_proposition || idea.solution.unique_value_proposition || idea.solution.description}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                      Key Features
                    </h4>
                    {idea.solution.features && Array.isArray(idea.solution.features) && idea.solution.features.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {idea.solution.features.map((feature: string, index: number) => (
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
                        <ValidationButton ideaId={idea.id} isValidated={idea.is_validated} className="w-full max-w-xs mx-auto" />
                      </div>
                    )}
                  </div>
                  
                  {(idea.solution.business_model || idea.solution.revenue_model) && (
                    <div className="p-6 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/10 dark:to-green-950/10 border border-emerald-200 dark:border-emerald-800">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                        Revenue Model
                      </h4>
                      {Array.isArray(idea.solution.revenue_model) ? (
                        <ul className="space-y-2">
                          {idea.solution.revenue_model.map((model: string, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></div>
                              <span className="text-muted-foreground">{model}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground">
                          {idea.solution.business_model || idea.solution.revenue_model}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-6 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/10 dark:to-purple-950/10 border border-violet-200 dark:border-violet-800">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Star className="h-4 w-4 text-violet-600" />
                      Value Proposition
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">
                      {idea.problem_statement}
                    </p>
                  </div>
                  
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
              {idea.is_validated && typeof idea.market_analysis === 'object' && idea.market_analysis && Object.keys(idea.market_analysis).length > 0 ? (
                <div className="space-y-8">
                  
                  {/* Market Size Overview - TAM/SAM/SOM */}
                  {idea.market_analysis.market_size && (
                    <div className="p-6 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-900/10 border border-indigo-200 dark:border-indigo-800">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-indigo-600" />
                        Market Opportunity Size
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 rounded-lg bg-white/60 dark:bg-black/20">
                          <div className="text-2xl font-bold text-indigo-600">
                            ${Math.round((idea.market_analysis.market_size.tam || 0) / 1000000)}M
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">TAM</div>
                          <div className="text-xs text-muted-foreground">Total Addressable Market</div>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-white/60 dark:bg-black/20">
                          <div className="text-2xl font-bold text-blue-600">
                            ${Math.round((idea.market_analysis.market_size.sam || 0) / 1000000)}M
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">SAM</div>
                          <div className="text-xs text-muted-foreground">Serviceable Available Market</div>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-white/60 dark:bg-black/20">
                          <div className="text-2xl font-bold text-cyan-600">
                            ${Math.round((idea.market_analysis.market_size.som || 0) / 1000000)}M
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">SOM</div>
                          <div className="text-xs text-muted-foreground">Serviceable Obtainable Market</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Competition & Advantages Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Competition Analysis */}
                    {idea.market_analysis.competition_level && (
                      <div className="p-6 rounded-xl bg-gradient-to-b from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-900/10 border border-red-200 dark:border-red-800">
                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                          <Target className="h-5 w-5 text-red-600" />
                          Competition Level
                        </h4>
                        <div className="text-center mb-4">
                          <Badge variant={
                            idea.market_analysis.competition_level === 'high' ? 'destructive' :
                            idea.market_analysis.competition_level === 'medium' ? 'secondary' : 'default'
                          } className="text-lg px-4 py-2">
                            {idea.market_analysis.competition_level.charAt(0).toUpperCase() + idea.market_analysis.competition_level.slice(1)}
                          </Badge>
                        </div>
                        
                        {/* Barriers to Entry */}
                        {idea.market_analysis.barriers_to_entry && Array.isArray(idea.market_analysis.barriers_to_entry) && (
                          <div className="mt-4">
                            <h5 className="font-medium mb-2 text-sm">Key Challenges:</h5>
                            <div className="space-y-2">
                              {idea.market_analysis.barriers_to_entry.map((barrier: string, index: number) => (
                                <div key={index} className="flex items-start gap-2">
                                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm text-muted-foreground">{barrier}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Competitive Advantages */}
                    {idea.market_analysis.competitive_advantages && Array.isArray(idea.market_analysis.competitive_advantages) && (
                      <div className="p-6 rounded-xl bg-gradient-to-b from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-900/10 border border-green-200 dark:border-green-800">
                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                          Competitive Advantages
                        </h4>
                        <div className="space-y-3">
                          {idea.market_analysis.competitive_advantages.map((advantage: string, index: number) => (
                            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-white/60 dark:bg-black/20">
                              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm font-medium">{advantage}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Market Timing */}
                  {(idea.market_analysis.timing || idea.market_analysis.market_timing) && (
                    <div className="p-6 rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-900/10 border border-purple-200 dark:border-purple-800">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-purple-600" />
                        Market Timing Analysis
                      </h4>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                          <TrendingUp className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium">{idea.market_analysis.market_timing || idea.market_analysis.timing}</p>
                          <p className="text-sm text-muted-foreground mt-1">Current market conditions and growth trends</p>
                        </div>
                      </div>
                    </div>
                  )}

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
                    <ValidationButton ideaId={idea.id} isValidated={idea.is_validated} className="w-full max-w-sm mx-auto" />
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
                    <ValidationMessage className="text-center" />
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
              {typeof idea.implementation === 'object' && idea.implementation && (idea.implementation.next_steps || idea.implementation.time_to_market || idea.implementation.estimated_cost) ? (
                <div className="space-y-6">
                  
                  {/* MVP & Time to Market */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {idea.implementation.time_to_market && (
                      <div className="p-6 rounded-xl bg-gradient-to-b from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-900/10 border border-blue-200 dark:border-blue-800">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Clock className="h-5 w-5 text-blue-600" />
                          Time to Market
                        </h4>
                        <div className="text-2xl font-bold text-blue-600 mb-2">
                          {idea.implementation.time_to_market}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Estimated development timeline for MVP launch
                        </p>
                      </div>
                    )}

                    {idea.implementation.estimated_cost && (
                      <div className="p-6 rounded-xl bg-gradient-to-b from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-900/10 border border-emerald-200 dark:border-emerald-800">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-emerald-600" />
                          Development Cost
                        </h4>
                        <div className="text-2xl font-bold text-emerald-600 mb-2">
                          {idea.implementation.estimated_cost}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Initial investment required for MVP development
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Implementation Complexity */}
                  {idea.implementation.complexity && (
                    <div className="p-6 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-900/10 border border-orange-200 dark:border-orange-800">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Target className="h-5 w-5 text-orange-600" />
                        Implementation Complexity
                      </h4>
                      <Badge variant={
                        idea.implementation.complexity === 'high' ? 'destructive' :
                        idea.implementation.complexity === 'medium' ? 'secondary' : 'default'
                      } className="text-sm mb-3">
                        {idea.implementation.complexity.charAt(0).toUpperCase() + idea.implementation.complexity.slice(1)} Complexity
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {idea.implementation.complexity === 'high' 
                          ? 'Complex implementation requiring specialized expertise and significant resources'
                          : idea.implementation.complexity === 'medium'
                          ? 'Moderate complexity with standard development requirements'
                          : 'Straightforward implementation with minimal technical barriers'
                        }
                      </p>
                    </div>
                  )}

                  {/* Next Steps & MVP */}
                  {(idea.implementation.next_steps || idea.implementation.mvp) && (
                    <div className="p-6 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-900/10 border border-indigo-200 dark:border-indigo-800">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <ArrowRight className="h-5 w-5 text-indigo-600" />
                        {idea.implementation.mvp ? 'MVP & Next Steps' : 'Implementation Steps'}
                      </h4>
                      
                      {idea.implementation.mvp && (
                        <div className="mb-4 p-4 rounded-lg bg-white/60 dark:bg-black/20">
                          <h5 className="font-medium mb-2 text-sm">Minimum Viable Product (MVP):</h5>
                          <p className="text-sm text-muted-foreground">{idea.implementation.mvp}</p>
                        </div>
                      )}
                      
                      {idea.implementation.next_steps && (
                        <div>
                          <h5 className="font-medium mb-3 text-sm">Action Items:</h5>
                          {Array.isArray(idea.implementation.next_steps) ? (
                            <div className="space-y-2">
                              {idea.implementation.next_steps.map((step: string, index: number) => (
                                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-white/60 dark:bg-black/20">
                                  <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-xs font-medium text-indigo-600">{index + 1}</span>
                                  </div>
                                  <span className="text-sm">{step}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">{idea.implementation.next_steps}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

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
                    Get a detailed implementation plan with cost estimates, timeline, and step-by-step roadmap 
                    for bringing your startup idea to market.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
                    <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-900/10 border border-blue-100 dark:border-blue-900/30">
                      <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <h5 className="font-medium text-sm mb-1">Timeline</h5>
                      <p className="text-xs text-muted-foreground">MVP development schedule</p>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-900/10 border border-emerald-100 dark:border-emerald-900/30">
                      <DollarSign className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                      <h5 className="font-medium text-sm mb-1">Budget</h5>
                      <p className="text-xs text-muted-foreground">Development cost estimates</p>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-900/10 border border-purple-100 dark:border-purple-900/30">
                      <ArrowRight className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                      <h5 className="font-medium text-sm mb-1">Roadmap</h5>
                      <p className="text-xs text-muted-foreground">Step-by-step action plan</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <ValidationButton ideaId={idea.id} isValidated={idea.is_validated} className="w-full max-w-sm mx-auto" />
                    <div className="text-sm text-muted-foreground">
                      <p className="flex items-center justify-center gap-2 mb-2">
                        <Zap className="h-4 w-4 text-purple-500" />
                        <span>Implementation planning includes:</span>
                      </p>
                      <div className="flex flex-wrap justify-center gap-x-8 gap-y-1 text-xs max-w-lg mx-auto">
                        <span className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                          Development timeline
                        </span>
                        <span className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                          Cost breakdown
                        </span>
                        <span className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                          Resource requirements
                        </span>
                        <span className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                          Risk assessment
                        </span>
                      </div>
                    </div>
                    <ValidationMessage className="text-center" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Actions & Metadata */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Validation Status */}
          <Card className={cn("border-2", idea.is_validated ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/10" : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/10")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {idea.is_validated ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
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
                    Unlock detailed insights about your idea's market potential.
                  </p>
                  <div className="space-y-3">
                    <ValidationButton ideaId={idea.id} isValidated={idea.is_validated} className="w-full" />
                    <div className="text-xs text-center space-y-1">
                      <p className="text-muted-foreground">✨ Unlock with validation:</p>
                      <div className="text-xs space-y-0.5">
                        <p className="text-blue-600">• Market size & demographics</p>
                        <p className="text-green-600">• Competition analysis</p>
                        <p className="text-purple-600">• Success probability</p>
                      </div>
                      <ValidationMessage className="mt-2" />
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
                        {idea.market_analysis?.market_size ? 
                          `$${Math.round((idea.market_analysis.market_size.tam || 0) / 1000000)}M` : 
                          'TBD'
                        }
                      </div>
                      <div className="text-xs text-muted-foreground">Market Size</div>
                    </div>
                    
                    {/* Competition Level */}
                    <div className="text-center p-4 rounded-xl bg-white/60 dark:bg-black/20">
                      <Shield className="h-6 w-6 text-red-600 mx-auto mb-2" />
                      <div className="text-sm font-bold text-red-600 capitalize">
                        {idea.market_analysis?.competition_level || 'Unknown'}
                      </div>
                      <div className="text-xs text-muted-foreground">Competition</div>
                    </div>
                    
                    {/* Implementation Time */}
                    <div className="text-center p-4 rounded-xl bg-white/60 dark:bg-black/20">
                      <Clock className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                      <div className="text-sm font-bold text-purple-600">
                        {idea.implementation?.time_to_market || 'TBD'}
                      </div>
                      <div className="text-xs text-muted-foreground">Time to Market</div>
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
                    
                    {idea.market_analysis?.competition_level && (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Competition Intensity</span>
                          <span>
                            {idea.market_analysis.competition_level === 'high' ? '85%' :
                             idea.market_analysis.competition_level === 'medium' ? '60%' : '30%'}
                          </span>
                        </div>
                        <Progress 
                          value={
                            idea.market_analysis.competition_level === 'high' ? 85 :
                            idea.market_analysis.competition_level === 'medium' ? 60 : 30
                          } 
                          className="h-2" 
                        />
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
                  
                  <ValidationButton ideaId={idea.id} isValidated={idea.is_validated} className="w-full max-w-xs mx-auto" />
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