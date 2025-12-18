import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendOpportunity } from "../hooks/useRedditTrends";
import {
  getOpportunityColor,
  generateMeaningfulTitle
} from "@/lib/utils/trend-helpers";

interface TrendCardProps {
  opportunity: TrendOpportunity;
}

export function TrendCard({ opportunity }: TrendCardProps) {
  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h5 className="font-medium text-sm leading-tight">
            {generateMeaningfulTitle(opportunity)}
          </h5>
          <Badge
            variant="outline"
            className={getOpportunityColor(opportunity.opportunityScore)}
          >
            {opportunity.opportunityScore}/100
          </Badge>
        </div>
        <div className="mb-2">
          <span className="text-xs text-muted-foreground">
            from r/{opportunity.subreddit}
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {opportunity.trendingTopics.slice(0, 3).map((topic) => (
              <Badge key={topic} variant="secondary" className="text-xs">
                {topic}
              </Badge>
            ))}
          </div>
          {opportunity.topPost && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              &ldquo;{opportunity.topPost.title as string}&rdquo;
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
