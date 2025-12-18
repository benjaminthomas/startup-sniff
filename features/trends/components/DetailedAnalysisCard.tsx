import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  MessageCircle,
  ExternalLink,
  Target,
  Activity
} from "lucide-react";
import { RedditTrendAnalysis } from "../hooks/useRedditTrends";
import {
  getSentimentColor,
  getOpportunityColor,
  generateAnalysisTitle
} from "@/lib/utils/trend-helpers";

interface DetailedAnalysisCardProps {
  analysis: RedditTrendAnalysis;
}

export function DetailedAnalysisCard({ analysis }: DetailedAnalysisCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 mr-4">
            <CardTitle className="text-lg leading-tight mb-1">
              {generateAnalysisTitle(analysis)}
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              from r/{analysis.subreddit}
            </span>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Badge
              variant="outline"
              className={getSentimentColor(analysis.sentiment_score)}
            >
              {analysis.sentiment_score}% sentiment
            </Badge>
            <Badge
              variant="outline"
              className={getOpportunityColor(analysis.opportunity_score)}
            >
              {analysis.opportunity_score}/100 opportunity
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trending Topics */}
        <div>
          <h5 className="text-sm font-medium mb-2 flex items-center">
            <TrendingUp className="h-4 w-4 mr-1" />
            Trending Topics
          </h5>
          <div className="flex flex-wrap gap-2">
            {analysis.trending_topics.map((topic) => (
              <Badge key={topic} variant="secondary">
                {topic}
              </Badge>
            ))}
          </div>
        </div>

        {/* Engagement Metrics */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-sm font-medium flex items-center justify-center">
              <Target className="h-3 w-3 mr-1" />
              Avg Score
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {analysis.engagement_metrics.avg_score}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium flex items-center justify-center">
              <MessageCircle className="h-3 w-3 mr-1" />
              Comments
            </div>
            <div className="text-2xl font-bold text-green-600">
              {analysis.engagement_metrics.avg_comments}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium flex items-center justify-center">
              <Activity className="h-3 w-3 mr-1" />
              Posts
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {analysis.engagement_metrics.total_posts}
            </div>
          </div>
        </div>

        {/* Top Posts */}
        <div>
          <h5 className="text-sm font-medium mb-2">Top Posts</h5>
          <div className="space-y-2">
            {analysis.top_posts.slice(0, 2).map((post) => (
              <div
                key={post.id}
                className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h6 className="font-medium text-sm line-clamp-1 flex-1 mr-2">
                    {post.title}
                  </h6>
                  <Button variant="ghost" size="sm" asChild>
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {post.content}
                </p>
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <span className="flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {post.score} upvotes
                  </span>
                  <span className="flex items-center">
                    <MessageCircle className="h-3 w-3 mr-1" />
                    {post.num_comments} comments
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
