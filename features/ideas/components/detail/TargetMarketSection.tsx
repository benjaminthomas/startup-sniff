/**
 * TargetMarketSection Component
 *
 * Displays target market information including:
 * - Primary demographic
 * - User personas with pain points
 * - Locked state for non-validated ideas
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Target, Lock } from 'lucide-react';
import type { TargetMarket as TargetMarketType } from '@/types/startup-ideas';

interface TargetMarketSectionProps {
  isValidated: boolean;
  targetMarket: TargetMarketType | null;
}

export function TargetMarketSection({ isValidated, targetMarket }: TargetMarketSectionProps) {
  const targetMarketData = (targetMarket as unknown as Record<string, unknown>) || null;
  const hasDetailedMarketData =
    targetMarketData && targetMarketData.primary_demographic;

  return (
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
        {hasDetailedMarketData ? (
          <div className="space-y-4">
            <div className="p-6 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-900/10">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Target Demographics
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                {targetMarketData.primary_demographic as string}
              </p>
            </div>

            {targetMarketData.user_personas &&
              Array.isArray(targetMarketData.user_personas) &&
              (targetMarketData.user_personas as Array<unknown>).length > 0 ? (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4 text-purple-600" />
                    User Personas
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(targetMarketData.user_personas as Array<{
                      name: string;
                      description: string;
                      pain_points: string[];
                    }>).map((persona, idx) => (
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
              ) : null}
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
              Get comprehensive demographic analysis, market size calculations, and pain point
              assessment through AI-powered validation.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Validate this idea to unlock market sizing, demographics, and persona insights.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
