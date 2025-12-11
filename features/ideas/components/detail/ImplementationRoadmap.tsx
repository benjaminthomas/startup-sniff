/**
 * ImplementationRoadmap Component
 *
 * Displays implementation details including:
 * - Technical complexity
 * - Time to market
 * - Development phases
 * - Key milestones
 * - Recommended tech stack
 * - Team capacity
 * - Resource requirements
 * - Locked state for non-validated ideas
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Users, DollarSign, CheckCircle, Lock, Sparkles } from 'lucide-react';
import type { Implementation as ImplementationType } from '@/types/startup-ideas';

interface ImplementationRoadmapProps {
  implementation: ImplementationType | null;
}

export function ImplementationRoadmap({ implementation }: ImplementationRoadmapProps) {
  const implementationData = (implementation as unknown as Record<string, unknown>) || {};
  const hasImplementationData = implementation && Object.keys(implementation).length > 0;

  return (
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
        {hasImplementationData ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {!!implementationData.technical_complexity && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-900/10 border border-indigo-200 dark:border-indigo-800">
                  <h4 className="font-semibold mb-2 text-sm">Technical Complexity</h4>
                  <Badge variant="outline" className="capitalize">
                    {implementationData.technical_complexity as string}
                  </Badge>
                </div>
              )}

              {!!implementationData.time_to_market && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/10 dark:to-violet-950/10 border border-purple-200 dark:border-purple-800">
                  <h4 className="font-semibold mb-2 text-sm">Time to Market</h4>
                  <p className="text-sm text-muted-foreground">
                    {implementationData.time_to_market as string}
                  </p>
                </div>
              )}
            </div>

            {implementationData.phases &&
              Array.isArray(implementationData.phases) &&
              (implementationData.phases as Array<unknown>).length > 0 ? (
                <div>
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-indigo-600" />
                    Development Phases
                  </h4>
                  <div className="space-y-3">
                    {(implementationData.phases as Array<{
                      phase: string;
                      duration: string;
                      description: string;
                    }>).map((phase, idx) => (
                      <div key={idx} className="p-4 rounded-lg border bg-muted/30">
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-medium">{phase.phase}</h5>
                          <Badge variant="secondary" className="text-xs">
                            {phase.duration}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{phase.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

            {implementationData.milestones &&
              Array.isArray(implementationData.milestones) &&
              (implementationData.milestones as Array<unknown>).length > 0 ? (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Key Milestones
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(implementationData.milestones as string[]).map((milestone, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
                      >
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{milestone}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

            {implementationData.tech_stack &&
              Array.isArray(implementationData.tech_stack) &&
              (implementationData.tech_stack as Array<unknown>).length > 0 ? (
                <div className="p-6 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/10 dark:to-cyan-950/10 border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-600" />
                    Recommended Tech Stack
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(implementationData.tech_stack as string[]).map((tech, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}

            {!!implementationData.team_capacity && (
              <div className="p-6 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/10 dark:to-purple-950/10 border border-violet-200 dark:border-violet-800">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5 text-violet-600" />
                  Team Capacity
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {implementationData.team_capacity as string}
                </p>
              </div>
            )}

            {implementationData.resource_requirements &&
              Array.isArray(implementationData.resource_requirements) &&
              (implementationData.resource_requirements as Array<unknown>).length > 0 ? (
                <div className="p-6 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/10 dark:to-orange-950/10 border border-amber-200 dark:border-amber-800">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-amber-600" />
                    Resource Requirements
                  </h4>
                  <ul className="space-y-2">
                    {(implementationData.resource_requirements as string[]).map((req, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">
                        • {req}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
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
              Get detailed implementation guidance, development timelines, and technical
              specifications through AI-powered validation.
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
  );
}
