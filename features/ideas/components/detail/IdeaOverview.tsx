/**
 * IdeaOverview Component
 *
 * Displays the overview section including:
 * - Product type
 * - Solution narrative (How it works)
 * - Why now narrative
 * - Additional pain points
 * - User personas
 * - Tech stack
 * - Target market
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, AlertCircle } from 'lucide-react';

interface Persona {
  name: string;
  role: string;
  painPoints?: string[];
}

interface IdeaOverviewProps {
  productType?: string;
  solutionNarrative: string;
  whyNowNarrative: string;
  secondaryPainPoints: string[];
  personas: Persona[];
  techStack?: string[];
  targetMarket?: string;
}

export function IdeaOverview({
  productType,
  solutionNarrative,
  whyNowNarrative,
  secondaryPainPoints,
  personas,
  techStack,
  targetMarket,
}: IdeaOverviewProps) {
  return (
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
        {productType && (
          <div>
            <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Product Type</h4>
            <Badge variant="secondary" className="text-sm">
              {productType}
            </Badge>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="font-semibold mb-2 text-sm text-muted-foreground">How does it work?</h4>
            <p className="text-sm leading-relaxed">{solutionNarrative}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Why now?</h4>
            <p className="text-sm leading-relaxed">{whyNowNarrative}</p>
          </div>
        </div>

        {secondaryPainPoints.length > 0 ? (
          <div>
            <h4 className="font-semibold mb-3 text-sm text-muted-foreground">Additional Pain Points</h4>
            <p className="text-xs text-muted-foreground mb-2">
              Beyond the primary challenge highlighted above, users also struggle with:
            </p>
            <div className="space-y-2">
              {secondaryPainPoints.map((point, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
                >
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{point}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h4 className="font-semibold mb-3 text-sm text-muted-foreground">Additional Pain Points</h4>
            <div className="p-4 rounded-lg border bg-muted/20 text-sm text-muted-foreground">
              The core challenge is captured in the primary pain point above. This focused problem
              definition helps with targeted validation and solution design.
            </div>
          </div>
        )}

        {personas.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 text-sm text-muted-foreground">Target User Personas</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {personas.slice(0, 3).map((persona, idx) => (
                <div key={idx} className="p-4 rounded-lg border bg-muted/30">
                  <h5 className="font-medium mb-1">{persona.name}</h5>
                  <p className="text-xs text-muted-foreground mb-3">{persona.role}</p>
                  {persona.painPoints && persona.painPoints.length > 0 ? (
                    <div className="space-y-1">
                      <p className="text-xs font-medium">Specific challenges:</p>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        {persona.painPoints.slice(0, 4).map((point, i) => (
                          <li key={i}>• {point}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      This persona is primarily impacted by the main pain point described above.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {techStack && techStack.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 text-sm text-muted-foreground">Suggested Tech Stack</h4>
            <div className="flex flex-wrap gap-2">
              {techStack.map((tech, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {targetMarket && (
          <div>
            <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Target Market</h4>
            <p className="text-sm">{targetMarket}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
