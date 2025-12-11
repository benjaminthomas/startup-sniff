import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getIdeaWithDetails } from '@/features/ideas/data-access';
import { ValidationStatusAlert } from '@/features/validation/components/validation-status-alert';
import { RedditSources } from '@/features/ideas/components/reddit-sources';
import { FavoriteButton } from '@/features/ideas/components/favorite-button';
import { ExportPDFButton } from '@/features/ideas/components/export-pdf-button';
import { Card, CardContent } from '@/components/ui/card';
import {
  IdeaHeader,
  IdeaOverview,
  TargetMarketSection,
  SolutionDetails,
  MarketAnalysis,
  ImplementationRoadmap,
  ValidationBadge,
  KeyMetrics,
  QuickActions,
  IdeaTimeline,
} from '@/features/ideas/components/detail';
import {
  dedupeStrings,
  normalizeNarrative,
  extractSentences,
  extractFirstSentence,
  pickNarrative,
  getConfidenceLevel,
  getConfidenceColors,
  getConfidenceLabel,
} from '@/lib/utils/narrative-processing';
import type { ValidationData } from '@/types/startup-ideas';

export default async function IdeaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch idea data
  const idea = await getIdeaWithDetails(id);

  // Extract and type-cast data structures
  const sourceData = (idea.source_data as Record<string, unknown>) || {};
  const solutionData = (idea.solution as unknown as Record<string, unknown>) || {};
  const marketAnalysisData = (idea.market_analysis as unknown as Record<string, unknown>) || {};
  const targetMarketData =
    typeof idea.target_market === 'object' && idea.target_market
      ? (idea.target_market as unknown as Record<string, unknown>)
      : null;
  const successMetricsData =
    typeof idea.success_metrics === 'object' && idea.success_metrics
      ? (idea.success_metrics as unknown as Record<string, unknown>)
      : null;
  const validationData = idea.validation_data ?? null;

  // Extract and deduplicate pain points from various sources
  const rawPainPointSources = Array.isArray(sourceData.pain_point_sources)
    ? (sourceData.pain_point_sources as string[])
    : [];
  const rawSpecificPainPoints = Array.isArray(sourceData.specific_pain_points)
    ? (sourceData.specific_pain_points as string[])
    : [];
  const validatedPersonaPainPoints = Array.isArray(targetMarketData?.user_personas)
    ? (
        targetMarketData?.user_personas as Array<{
          pain_points?: string[];
        }>
      ).flatMap((persona) => persona.pain_points ?? [])
    : [];
  const validatedRiskFactors = Array.isArray(successMetricsData?.risk_factors)
    ? (successMetricsData?.risk_factors as string[])
    : [];

  const painPoints = dedupeStrings([
    ...rawSpecificPainPoints,
    ...rawPainPointSources,
    ...validatedPersonaPainPoints,
    ...validatedRiskFactors,
    idea.problem_statement,
  ]);

  // Extract solution descriptions
  const solutionDescription =
    typeof solutionData.description === 'string' ? solutionData.description : undefined;
  const uniqueValueProposition =
    typeof solutionData.unique_value_proposition === 'string'
      ? solutionData.unique_value_proposition
      : undefined;
  const originalSolutionDescription =
    typeof sourceData.solution_summary === 'string'
      ? (sourceData.solution_summary as string)
      : undefined;
  const validatedValueProposition = uniqueValueProposition || solutionDescription;

  // Extract validation feedback
  const validationFeedbackRaw = (() => {
    if (!validationData) return undefined;
    if (typeof validationData.feedback === 'string') return validationData.feedback;
    if (Array.isArray(validationData.feedback)) {
      return validationData.feedback.join(' ');
    }
    return undefined;
  })();

  // Extract validation insights with proper typing
  const validationDataTyped = validationData as ValidationData | null;
  const validationStrengths = Array.isArray(validationDataTyped?.strengths)
    ? dedupeStrings(validationDataTyped.strengths)
    : [];
  const validationRecommendations = Array.isArray(validationDataTyped?.recommendations)
    ? dedupeStrings(validationDataTyped.recommendations)
    : [];
  const validationFeedbackSentences = validationFeedbackRaw
    ? dedupeStrings(extractSentences(validationFeedbackRaw))
    : [];

  // Extract personas
  const sourcePersonas = Array.isArray(sourceData.target_personas)
    ? (sourceData.target_personas as Array<{ name: string; role: string; painPoints?: string[] }>)
    : [];
  const validatedPersonas = Array.isArray(targetMarketData?.user_personas)
    ? (
        targetMarketData?.user_personas as Array<{
          name: string;
          description?: string;
          pain_points?: string[];
        }>
      ).map((persona) => ({
        name: persona.name,
        role: persona.description ?? 'Target persona',
        painPoints: persona.pain_points ?? [],
      }))
    : [];

  const personas = [...sourcePersonas, ...validatedPersonas].filter((persona, index, arr) => {
    const key = `${persona.name}|${persona.role}`.toLowerCase();
    return arr.findIndex((p) => `${p.name}|${p.role}`.toLowerCase() === key) === index;
  });
  const personaPainPoints = personas.flatMap((persona) => persona.painPoints ?? []);

  // ============================================================================
  // NARRATIVE EXTRACTION STRATEGY
  // ============================================================================
  // Carefully extract distinct narratives for different sections to avoid duplication
  const narrativePool: string[] = [];

  // 1. Hero Summary - WHAT: main value proposition
  const heroSummary =
    pickNarrative(
      [
        extractFirstSentence(validationFeedbackRaw),
        uniqueValueProposition,
        solutionDescription,
        originalSolutionDescription,
      ],
      narrativePool,
      'We uncovered a promising opportunity grounded in real customer sentiment.'
    ) ?? 'We uncovered a promising opportunity grounded in real customer sentiment.';

  const normalizedHeroSummary = normalizeNarrative(heroSummary);

  // 2. Primary Pain Point
  const primaryPainPoint =
    pickNarrative(
      [
        idea.problem_statement,
        rawSpecificPainPoints[0],
        personaPainPoints[0],
        rawPainPointSources[0],
      ],
      narrativePool,
      'We identified a recurring operator challenge that currently goes unsolved.'
    ) ?? 'We identified a recurring operator challenge that currently goes unsolved.';

  const normalizedPrimaryPain = normalizeNarrative(primaryPainPoint);

  // 3. Filter validation data to exclude already used narratives
  const validationStrengthsUnique = validationStrengths.filter((item) => {
    const normalized = normalizeNarrative(item);
    return (
      normalized && normalized !== normalizedPrimaryPain && normalized !== normalizedHeroSummary
    );
  });
  const validationRecommendationsUnique = validationRecommendations.filter((item) => {
    const normalized = normalizeNarrative(item);
    return (
      normalized && normalized !== normalizedPrimaryPain && normalized !== normalizedHeroSummary
    );
  });

  // 4. Solution Narrative - HOW
  const solutionNarrative = (() => {
    const normalizedSolution = normalizeNarrative(solutionDescription);
    if (normalizedSolution && normalizedSolution !== normalizedHeroSummary) {
      narrativePool.push(solutionDescription!);
      return solutionDescription!;
    }

    const normalizedOriginal = normalizeNarrative(originalSolutionDescription);
    if (normalizedOriginal && normalizedOriginal !== normalizedHeroSummary) {
      narrativePool.push(originalSolutionDescription!);
      return originalSolutionDescription!;
    }

    if (solutionDescription) {
      const sentences = extractSentences(solutionDescription);
      for (const sentence of sentences) {
        const normalized = normalizeNarrative(sentence);
        if (normalized && normalized !== normalizedHeroSummary) {
          narrativePool.push(sentence);
          return sentence;
        }
      }
    }

    return (
      pickNarrative(
        [validationRecommendationsUnique[0], validationStrengthsUnique[0]],
        narrativePool,
        'An AI-powered platform that streamlines operations and automates key workflows to solve the core challenges.'
      ) ??
      'An AI-powered platform that streamlines operations and automates key workflows to solve the core challenges.'
    );
  })();

  const marketOpportunityCandidates = Array.isArray(marketAnalysisData?.opportunities)
    ? (marketAnalysisData.opportunities as string[])
    : [];
  const additionalValidationNarrative = validationFeedbackSentences.find((sentence) => {
    const normalized = normalizeNarrative(sentence);
    return (
      normalized && normalized !== normalizedHeroSummary && normalized !== normalizedPrimaryPain
    );
  });

  // 5. Why Now - WHY
  const whyNowNarrative =
    pickNarrative(
      [
        marketOpportunityCandidates[0],
        additionalValidationNarrative,
        validationStrengthsUnique[1],
      ],
      narrativePool,
      'Market momentum and buyer urgency make this the right moment to launch.'
    ) ?? 'Market momentum and buyer urgency make this the right moment to launch.';

  // 6. Secondary Pain Points
  const usedNarratives = new Set(
    [
      normalizeNarrative(heroSummary),
      normalizeNarrative(primaryPainPoint),
      normalizeNarrative(solutionNarrative),
      normalizeNarrative(whyNowNarrative),
    ].filter((n): n is string => !!n)
  );

  const secondaryPainPoints = painPoints
    .filter((point) => {
      const normalized = normalizeNarrative(point);
      return normalized && !usedNarratives.has(normalized);
    })
    .slice(0, 5);

  // 7. Process personas with unique challenges
  const personasWithUniqueChallenges = personas.map((persona) => {
    const uniqueChallenges = dedupeStrings(persona.painPoints ?? []).filter((point) => {
      const normalized = normalizeNarrative(point);
      return normalized && !usedNarratives.has(normalized);
    });
    return {
      ...persona,
      painPoints: uniqueChallenges,
    };
  });
  const primaryPersona = personasWithUniqueChallenges[0] ?? undefined;

  // Reddit sources (disabled until posts table schema is updated)
  const redditSources: Record<string, unknown>[] = [];

  // Calculate confidence metrics
  const confidenceScore = idea.ai_confidence_score || 0;
  const confidenceLevel = getConfidenceLevel(confidenceScore);
  const colors = getConfidenceColors(confidenceLevel);
  const confidenceLabel = getConfidenceLabel(confidenceScore);

  // Determine target audience for header
  const targetAudience =
    primaryPersona?.role ||
    (typeof idea.target_market === 'string'
      ? idea.target_market
      : Array.isArray(sourceData.target_market_description)
      ? (sourceData.target_market_description as string[])[0]
      : 'Growth-focused teams looking for an edge');

  // Extract product type and tech stack
  const productType =
    typeof sourceData.product_type === 'string'
      ? (sourceData.product_type as string)
      : undefined;
  const techStack =
    Array.isArray(sourceData.technical_stack) && (sourceData.technical_stack as string[]).length > 0
      ? (sourceData.technical_stack as string[])
      : undefined;
  const targetMarketString =
    typeof idea.target_market === 'string' ? idea.target_market : undefined;

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
          <FavoriteButton ideaId={idea.id} initialFavoriteState={!!idea.is_favorite} />
          <ExportPDFButton ideaId={idea.id} ideaTitle={idea.title} />
        </div>
      </div>

      {/* Hero Section */}
      <IdeaHeader
        title={idea.title}
        heroSummary={heroSummary}
        primaryPainPoint={primaryPainPoint}
        targetAudience={targetAudience}
        confidenceScore={confidenceScore}
        confidenceLabel={confidenceLabel}
        colors={colors}
      />

      {/* Status Alert */}
      <ValidationStatusAlert ideaId={idea.id} isValidated={idea.is_validated ?? null} />

      {/* Idea Overview Section */}
      <IdeaOverview
        productType={productType}
        solutionNarrative={solutionNarrative}
        whyNowNarrative={whyNowNarrative}
        secondaryPainPoints={secondaryPainPoints}
        personas={personasWithUniqueChallenges}
        techStack={techStack}
        targetMarket={targetMarketString}
      />

      {/* Reddit Sources Section */}
      {redditSources.length > 0 && (
        <Card className="border border-orange-200 bg-orange-50/30 dark:border-orange-800 dark:bg-orange-950/10">
          <CardContent className="p-6">
            <RedditSources sources={redditSources as never[]} title="Inspiration from Reddit Discussions" />
          </CardContent>
        </Card>
      )}

      {/* Main Content - Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Basic Information */}
        <div className="lg:col-span-8 space-y-6">
          <TargetMarketSection isValidated={!!idea.is_validated} targetMarket={idea.target_market} />

          <SolutionDetails
            isValidated={!!idea.is_validated}
            solution={idea.solution}
            validatedValueProposition={validatedValueProposition}
          />

          <MarketAnalysis isValidated={!!idea.is_validated} marketAnalysis={idea.market_analysis} />

          <ImplementationRoadmap implementation={idea.implementation} />
        </div>

        {/* Right Column - Actions & Metadata */}
        <div className="lg:col-span-4 space-y-6">
          <ValidationBadge ideaId={idea.id} isValidated={!!idea.is_validated} />

          <KeyMetrics
            isValidated={!!idea.is_validated}
            confidenceScore={confidenceScore}
            marketAnalysis={idea.market_analysis}
          />

          <QuickActions />

          <IdeaTimeline
            createdAt={idea.created_at}
            updatedAt={idea.updated_at}
            isValidated={!!idea.is_validated}
          />
        </div>
      </div>
    </div>
  );
}
