/**
 * SolutionDetails Component
 *
 * Displays solution architecture including:
 * - Solution overview
 * - Key features
 * - Revenue model
 * - Locked/placeholder state for non-validated ideas
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Star, DollarSign, Sparkles, Lock } from 'lucide-react';
import type { Solution as SolutionType } from '@/types/startup-ideas';

interface SolutionDetailsProps {
  isValidated: boolean;
  solution: SolutionType | null;
  validatedValueProposition?: string;
}

export function SolutionDetails({
  isValidated,
  solution,
  validatedValueProposition,
}: SolutionDetailsProps) {
  const hasSolutionData = solution && solution.description;

  return (
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
        {hasSolutionData ? (
          <div className="space-y-6">
            {solution.description && (
              <div className="p-6 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/10 dark:to-purple-950/10 border border-violet-200 dark:border-violet-800">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4 text-violet-600" />
                  Solution Overview
                </h4>
                <p className="text-muted-foreground leading-relaxed">{solution.description}</p>
              </div>
            )}

            <div>
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                Key Features
              </h4>
              {solution.key_features && Array.isArray(solution.key_features) && solution.key_features.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {solution.key_features.map((feature: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              ) : isValidated ? (
                <div className="p-6 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-900/10 border border-blue-200 dark:border-blue-800 text-center">
                  <Sparkles className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                  <h5 className="font-medium mb-2">Core Solution Features</h5>
                  <p className="text-sm text-muted-foreground mb-4">
                    This validated idea includes essential capabilities based on the problem
                    statement and market analysis.
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
                    Get comprehensive feature breakdown and technical specifications after
                    validation.
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      Validate to unlock the full feature breakdown, technical specs, and
                      go-to-market playbooks.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {solution.revenue_model &&
              Array.isArray(solution.revenue_model) &&
              solution.revenue_model.length > 0 && (
                <div className="p-6 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/10 dark:to-green-950/10 border border-emerald-200 dark:border-emerald-800">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    Revenue Model
                  </h4>
                  <div className="space-y-2">
                    {solution.revenue_model.map((model: string, index: number) => (
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
            {validatedValueProposition && (
              <div className="p-6 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/10 dark:to-purple-950/10 border border-violet-200 dark:border-violet-800">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4 text-violet-600" />
                  Value Proposition
                </h4>
                <p className="text-muted-foreground leading-relaxed">{validatedValueProposition}</p>
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
              <p className="text-muted-foreground">SaaS subscription model with tiered pricing</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
