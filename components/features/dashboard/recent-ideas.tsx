'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, TrendingUp, Eye } from 'lucide-react';
import Link from 'next/link';

interface RecentIdeasProps {
  ideas: any[];
}

export function RecentIdeas({ ideas }: RecentIdeasProps) {
  if (ideas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Ideas</CardTitle>
          <CardDescription>Your latest startup ideas will appear here</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="text-muted-foreground mb-4">
            No ideas generated yet. Get started by creating your first idea!
          </div>
          <Button asChild>
            <Link href="/dashboard/generate">Generate Your First Idea</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Ideas</CardTitle>
          <CardDescription>Your latest startup ideas</CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/ideas">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {ideas.slice(0, 3).map((idea, index) => (
            <div key={idea.id} className="flex items-start space-x-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-semibold truncate">{idea.title}</h3>
                  {idea.is_favorite && (
                    <Heart className="h-4 w-4 text-red-500 fill-current" />
                  )}
                  {idea.is_validated && (
                    <Badge variant="secondary" className="text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Validated
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {idea.problem_statement}
                </p>
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <span>{new Date(idea.created_at).toLocaleDateString()}</span>
                  {idea.ai_confidence_score && (
                    <span>Confidence: {idea.ai_confidence_score}%</span>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/dashboard/ideas/${idea.id}`}>
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}