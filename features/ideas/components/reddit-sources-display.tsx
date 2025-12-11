import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  MessageCircle,
  TrendingUp,
  Globe,
  Calendar,
  BarChart3
} from 'lucide-react';
import { RedditSource } from '@/types/reddit';

interface RedditSourceData {
  pain_point_sources?: RedditSource[];
  generation_method?: string;
  reddit_powered?: boolean;
  [key: string]: unknown;
}

interface RedditSourcesDisplayProps {
  ideaId: string;
  sourceData: RedditSourceData | null;
}

export function RedditSourcesDisplay({ sourceData }: RedditSourcesDisplayProps) {
  const painPointSources = sourceData?.pain_point_sources || [];
  const isRedditPowered = sourceData?.reddit_powered || false;

  // Calculate dynamic metrics from actual data
  const discussionCount = painPointSources.length;
  const communityCount = [...new Set(painPointSources.map((p) => p.subreddit))].length;
  const avgScore = painPointSources.length > 0
    ? Math.round(painPointSources.reduce((acc: number, p) => acc + (p.score || 0), 0) / painPointSources.length)
    : 0;
  const engagementLevel = avgScore > 50 ? 'High' : avgScore > 20 ? 'Medium' : 'Low';
  const isRecent = painPointSources.some((p) => {
    const postDate = new Date((p.created_utc as unknown as number) * 1000);
    const daysDiff = (Date.now() - postDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7;
  });

  if (!isRedditPowered || painPointSources.length === 0) {
    return null;
  }

  return (
    <Card className="border-2 py-0">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/10 dark:to-red-950/10 py-4">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
            <Globe className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          Reddit Intelligence Sources
          <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
            {painPointSources.length} Pain Points
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/10 dark:to-indigo-950/10 border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Data Source Validation
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              This startup idea was generated from real user pain points expressed on Reddit.
              The AI analyzed discussions, complaints, and feature requests to identify genuine market needs.
            </p>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                Real user problems
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                Market validated
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                Community sourced
              </span>
            </div>
          </div>

          {/* Reddit Source Analytics */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm text-muted-foreground">SOURCE ANALYTICS</h4>
              <Badge variant="secondary" className="text-xs">
                {painPointSources.length} Pain Points Analyzed
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/10 border border-blue-200 dark:border-blue-800">
                <MessageCircle className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-blue-600">{discussionCount}</div>
                <div className="text-xs text-muted-foreground">Discussions</div>
              </div>

              <div className="text-center p-3 rounded-lg bg-orange-50 dark:bg-orange-950/10 border border-orange-200 dark:border-orange-800">
                <TrendingUp className="h-5 w-5 text-orange-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-orange-600">{engagementLevel}</div>
                <div className="text-xs text-muted-foreground">Engagement</div>
              </div>

              <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/10 border border-green-200 dark:border-green-800">
                <Users className="h-5 w-5 text-green-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-green-600">{communityCount > 0 ? `${communityCount}+` : '0'}</div>
                <div className="text-xs text-muted-foreground">Communities</div>
              </div>

              <div className="text-center p-3 rounded-lg bg-purple-50 dark:bg-purple-950/10 border border-purple-200 dark:border-purple-800">
                <Calendar className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-purple-600">{isRecent ? 'Recent' : 'Archived'}</div>
                <div className="text-xs text-muted-foreground">Activity</div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h5 className="font-medium text-sm">Data-Driven Opportunity</h5>
                  <p className="text-xs text-muted-foreground">
                    This idea was generated from real user frustrations and market gaps identified in active Reddit communities.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}