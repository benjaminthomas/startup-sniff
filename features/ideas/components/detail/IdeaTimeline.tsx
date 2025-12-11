/**
 * IdeaTimeline Component
 *
 * Displays the idea's timeline including:
 * - Creation date
 * - Last updated date
 * - Milestone progress (generated, validated, content generated)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IdeaTimelineProps {
  createdAt: string;
  updatedAt: string;
  isValidated: boolean;
}

export function IdeaTimeline({ createdAt, updatedAt, isValidated }: IdeaTimelineProps) {
  return (
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
          <span className="text-sm font-medium">{new Date(createdAt).toLocaleDateString()}</span>
        </div>

        {updatedAt !== createdAt && (
          <div className="flex items-center justify-between py-2 border-t">
            <span className="text-sm text-muted-foreground">Last Updated</span>
            <span className="text-sm font-medium">{new Date(updatedAt).toLocaleDateString()}</span>
          </div>
        )}

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-muted-foreground">Idea Generated</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                isValidated ? "bg-green-500" : "bg-gray-300"
              )}
            ></div>
            <span className={cn("text-muted-foreground", isValidated && "text-green-600")}>
              Market Validated {isValidated ? "✓" : ""}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            <span className="text-muted-foreground">Content Generated</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
