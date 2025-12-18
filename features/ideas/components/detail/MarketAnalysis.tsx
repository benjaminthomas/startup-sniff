/**
 * MarketAnalysis Component
 *
 * Displays market analysis data including:
 * - Market opportunity (TAM/SAM/SOM)
 * - Competition level and entry barriers
 * - Competitive advantages
 * - Market timing
 * - Locked state for non-validated ideas
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  Target,
  CheckCircle,
  Clock,
  Lock,
  Sparkles,
} from 'lucide-react';
import type { MarketAnalysis as MarketAnalysisType } from '@/types/startup-ideas';

interface MarketAnalysisProps {
  isValidated: boolean;
  marketAnalysis: MarketAnalysisType | null;
}

export function MarketAnalysis({ isValidated, marketAnalysis }: MarketAnalysisProps) {
  const marketAnalysisData = (marketAnalysis as unknown as Record<string, unknown>) || {};
  const hasMarketData = isValidated && marketAnalysis && Object.keys(marketAnalysis).length > 0;

  return (
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
        {hasMarketData ? (
          <div className="space-y-6">
            {!!marketAnalysisData.market_size && (
              <div className="p-6 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-900/10 border border-indigo-200 dark:border-indigo-800">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                  Market Opportunity
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      ${Math.round(((marketAnalysisData.market_size as Record<string, unknown>)?.tam as number || 0) / 1000000)}M
                    </div>
                    <div className="text-xs text-muted-foreground">TAM (Total Addressable)</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-indigo-600">
                      ${Math.round(((marketAnalysisData.market_size as Record<string, unknown>)?.sam as number || 0) / 1000000)}M
                    </div>
                    <div className="text-xs text-muted-foreground">SAM (Serviceable)</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      ${Math.round(((marketAnalysisData.market_size as Record<string, unknown>)?.som as number || 0) / 1000000)}M
                    </div>
                    <div className="text-xs text-muted-foreground">SOM (Obtainable)</div>
                  </div>
                </div>
              </div>
            )}

            {!!marketAnalysisData.competition_level && (
              <div className="p-6 rounded-xl bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-950/10 dark:to-red-950/10 border border-rose-200 dark:border-rose-800">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Target className="h-5 w-5 text-rose-600" />
                  Competition Analysis
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Competition Level</span>
                    <Badge variant="outline" className="capitalize">
                      {marketAnalysisData.competition_level as string}
                    </Badge>
                  </div>
                  {!!marketAnalysisData.entry_barriers && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Entry Barriers</span>
                      <Badge variant="outline" className="capitalize">
                        {marketAnalysisData.entry_barriers as string}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            )}

            {marketAnalysisData.competitive_advantages &&
              Array.isArray(marketAnalysisData.competitive_advantages) &&
              (marketAnalysisData.competitive_advantages as string[]).length > 0 ? (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Competitive Advantages
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(marketAnalysisData.competitive_advantages as string[]).map((advantage, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
                      >
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{advantage}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

            {!!marketAnalysisData.market_timing && (
              <div className="p-6 rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/10 dark:to-violet-950/10 border border-purple-200 dark:border-purple-800">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                  Market Timing
                </h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {marketAnalysisData.market_timing as string}
                </p>
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
              Get comprehensive competitive analysis and market insights powered by AI research. Our
              validation process analyzes your market landscape to provide actionable intelligence.
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
                <p className="mb-2">
                  Validate this idea to unlock competitive benchmarking, TAM/SAM/SOM sizing, and risk
                  assessment.
                </p>
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
  );
}
