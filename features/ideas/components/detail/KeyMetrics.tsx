/**
 * KeyMetrics Component
 *
 * Displays key metrics in the sidebar including:
 * - AI confidence score
 * - Market size (TAM)
 * - Validation status
 * - Implementation readiness
 * - Progress indicators
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  TrendingUp,
  Target,
  Shield,
  CheckCircle,
  Clock,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { MarketAnalysis } from '@/types/startup-ideas';

interface KeyMetricsProps {
  isValidated: boolean;
  confidenceScore: number;
  marketAnalysis: MarketAnalysis | null;
}

export function KeyMetrics({ isValidated, confidenceScore, marketAnalysis }: KeyMetricsProps) {
  const marketAnalysisData = (marketAnalysis as unknown as Record<string, unknown>) || {};
  const hasMarketData = marketAnalysis && Object.keys(marketAnalysis).length > 0;

  return (
    <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 dark:border-indigo-800 dark:from-indigo-950/20 dark:to-blue-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-indigo-600" />
          Key Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isValidated || hasMarketData ? (
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
                  {marketAnalysisData?.market_size
                    ? `$${Math.round(
                        ((marketAnalysisData.market_size as Record<string, unknown>)?.tam as number || 0) / 1000000
                      )}M`
                    : 'TBD'}
                </div>
                <div className="text-xs text-muted-foreground">Market Size</div>
              </div>

              {/* Validation Status */}
              <div className="text-center p-4 rounded-xl bg-white/60 dark:bg-black/20">
                <Shield className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <div
                  className={cn(
                    "text-sm font-bold capitalize",
                    isValidated ? "text-green-600" : "text-amber-600"
                  )}
                >
                  {isValidated ? 'Validated' : 'Pending'}
                </div>
                <div className="text-xs text-muted-foreground">Status</div>
              </div>

              {/* Implementation Ready */}
              <div className="text-center p-4 rounded-xl bg-white/60 dark:bg-black/20">
                <CheckCircle className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <div className="text-sm font-bold text-purple-600">
                  {isValidated ? 'Ready' : 'In planning'}
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

              {isValidated && (
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
              Unlock detailed performance metrics, market sizing, and risk assessment through AI
              validation.
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

            <Link
              href="#validation-cta"
              className="inline-flex items-center justify-center text-primary font-medium text-xs"
            >
              Validate to unlock metrics
              <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
