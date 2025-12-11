'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  MessageCircle,
  BarChart3,
  RefreshCw,
  ChevronRight
} from "lucide-react";
import { useRedditTrends } from "../hooks/useRedditTrends";
import { TrendCard } from "./TrendCard";
import { TrendsLoadingSkeleton } from "./TrendsLoadingSkeleton";
import { DetailedAnalysisCard } from "./DetailedAnalysisCard";

export function RedditTrends() {
  const {
    isLoading,
    error,
    summary,
    fullAnalysis,
    showFullAnalysis,
    loadTrends,
    toggleFullAnalysis
  } = useRedditTrends();

  if (isLoading && !summary) {
    return <TrendsLoadingSkeleton />;
  }

  if (error && !summary) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="text-center text-muted-foreground mb-4">
            <p>{error}</p>
          </div>
          <Button onClick={loadTrends} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trending Topics</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalTopics || 0}</div>
            <p className="text-xs text-muted-foreground">Identified across communities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Communities</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.activeCommunities || 0}</div>
            <p className="text-xs text-muted-foreground">Subreddits analyzed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Potential</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.weeklyGrowth || '+0%'}</div>
            <p className="text-xs text-muted-foreground">Opportunity score average</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analysis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Market Pain Points & Opportunities</CardTitle>
              <CardDescription>
                Real user problems and business opportunities discovered from active Reddit discussions
              </CardDescription>
            </div>
            <Button
              onClick={loadTrends}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {summary?.topOpportunities && summary.topOpportunities.length > 0 ? (
            <div className="space-y-6">
              {/* Top Opportunities */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Top Opportunities</h4>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {summary.topOpportunities.map((opportunity) => (
                    <TrendCard key={opportunity.subreddit} opportunity={opportunity} />
                  ))}
                </div>
              </div>

              {/* Full Analysis Toggle */}
              <div className="flex items-center justify-center pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={toggleFullAnalysis}
                  className="w-full max-w-md"
                >
                  {showFullAnalysis ? 'Hide' : 'Show'} Detailed Analysis
                  <ChevronRight className={`ml-2 h-4 w-4 transition-transform ${showFullAnalysis ? 'rotate-90' : ''}`} />
                </Button>
              </div>

              {/* Full Analysis */}
              {showFullAnalysis && fullAnalysis && (
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="text-sm font-semibold">Detailed Community Analysis</h4>
                  <div className="space-y-4">
                    {fullAnalysis.map((analysis) => (
                      <DetailedAnalysisCard
                        key={analysis.subreddit}
                        analysis={analysis}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-center text-muted-foreground mb-4">
                No trend data available. Click refresh to analyze Reddit communities.
              </p>
              <Button onClick={loadTrends} disabled={isLoading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Analyze Trends
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
