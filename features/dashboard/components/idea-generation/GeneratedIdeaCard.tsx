'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sparkles,
  AlertCircle,
  Zap,
  Target,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import type { StartupIdea } from '@/types/startup-ideas';

interface GeneratedIdeaCardProps {
  idea: StartupIdea;
  onViewAllIdeas: () => void;
  onGenerateAnother: () => void;
}

export function GeneratedIdeaCard({
  idea,
  onViewAllIdeas,
  onGenerateAnother
}: GeneratedIdeaCardProps) {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-purple/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="default" className="mb-2">
            <Sparkles className="w-3 h-3 mr-1" />
            AI Generated
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={onGenerateAnother}
            className="text-muted-foreground hover:text-foreground"
          >
            <AlertCircle className="h-4 w-4" />
          </Button>
        </div>
        <CardTitle className="text-xl text-primary flex items-center gap-2">
          <Zap className="w-5 h-5" />
          {idea.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground leading-relaxed">{idea.problem_statement}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-background/50 rounded-lg">
            <span className="font-semibold text-foreground flex items-center gap-1">
              <Target className="w-4 h-4" />
              Target Market:
            </span>
            <p className="text-muted-foreground mt-1">
              {idea.target_market.description || 'Not specified'}
            </p>
          </div>
          <div className="p-3 bg-background/50 rounded-lg">
            <span className="font-semibold text-foreground flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              Revenue Model:
            </span>
            <p className="text-muted-foreground mt-1">
              {idea.solution.revenue_model?.join(', ') || 'Not specified'}
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={onViewAllIdeas} className="flex-1">
            <TrendingUp className="w-4 h-4 mr-2" />
            View Full Details
          </Button>
          <Button variant="outline" onClick={onGenerateAnother}>
            Generate Another
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
