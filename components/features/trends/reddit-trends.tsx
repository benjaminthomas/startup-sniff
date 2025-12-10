'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { log } from '@/lib/logger/client'
import { 
  TrendingUp, 
  MessageCircle, 
  BarChart3, 
  ExternalLink,
  RefreshCw,
  Target,
  Activity,
  ChevronRight
} from "lucide-react";
// import { getRedditTrendsSummary } from "@/modules/reddit";

interface RedditTrendAnalysis {
  subreddit: string;
  trending_topics: string[];
  sentiment_score: number;
  engagement_metrics: {
    avg_score: number;
    avg_comments: number;
    total_posts: number;
  };
  opportunity_score: number;
  top_posts: Array<{
    id: string;
    title: string;
    content: string;
    subreddit: string;
    score: number;
    num_comments: number;
    created_at: string;
    url: string;
  }>;
}

interface TrendOpportunity {
  subreddit: string;
  opportunityScore: number;
  trendingTopics: string[];
  topPost: Record<string, unknown> | null;
}

interface TrendsSummary {
  totalTopics: number;
  activeCommunities: number;
  weeklyGrowth: string;
  topOpportunities: TrendOpportunity[];
  fullAnalysis?: RedditTrendAnalysis[];
}

export function RedditTrends() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<TrendsSummary | null>(null);
  const [fullAnalysis, setFullAnalysis] = useState<RedditTrendAnalysis[] | null>(null);
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);

  const loadTrends = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reddit-trends', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 503 && data.status === 'service_unavailable') {
          setError(data.message || 'Reddit data is temporarily unavailable. This is a known issue we are working to resolve.');
        } else if (response.status === 401) {
          setError('Please sign in to view Reddit trends.');
        } else {
          setError(data.details || 'Failed to load Reddit trends. Please try again.');
        }
        return;
      }

      setSummary(data);
      if (data.fullAnalysis) {
        setFullAnalysis(data.fullAnalysis);
      }
    } catch (err) {
      setError('Unable to connect to the trends service. Please check your internet connection and try again.');
      log.error('Error loading trends:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTrends();
  }, []);

  const getSentimentColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 50) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 30) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getOpportunityColor = (score: number) => {
    if (score >= 80) return 'text-emerald-700';
    if (score >= 60) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-gray-600';
  };

  // Generate meaningful titles from trending topics and posts
  const generateMeaningfulTitle = (opportunity: TrendOpportunity) => {
    if (opportunity.topPost?.title) {
      // Extract the main problem/pain point from the post title
      const title = opportunity.topPost.title as string;
      if (title.length > 60) {
        return title.substring(0, 57) + '...';
      }
      return title;
    }

    // Fallback to trending topics if no post title
    if (opportunity.trendingTopics && opportunity.trendingTopics.length > 0) {
      const mainTopic = opportunity.trendingTopics[0];
      return `${mainTopic} Solutions Needed`;
    }

    // Last resort - community focus
    return `${opportunity.subreddit} Community Opportunities`;
  };

  const generateAnalysisTitle = (analysis: RedditTrendAnalysis) => {
    if (analysis.top_posts && analysis.top_posts.length > 0) {
      const topPost = analysis.top_posts[0];
      if ((topPost.title as string).length > 50) {
        return (topPost.title as string).substring(0, 47) + '...';
      }
      return topPost.title as string;
    }

    if (analysis.trending_topics && analysis.trending_topics.length > 0) {
      return `${analysis.trending_topics[0]} Market Opportunities`;
    }

    return `r/${analysis.subreddit} Pain Points`;
  };

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
                    <Card key={opportunity.subreddit} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-sm leading-tight">{generateMeaningfulTitle(opportunity)}</h5>
                          <Badge
                            variant="outline"
                            className={getOpportunityColor(opportunity.opportunityScore)}
                          >
                            {opportunity.opportunityScore}/100
                          </Badge>
                        </div>
                        <div className="mb-2">
                          <span className="text-xs text-muted-foreground">from r/{opportunity.subreddit}</span>
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
                  ))}
                </div>
              </div>

              {/* Full Analysis Toggle */}
              <div className="flex items-center justify-center pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setShowFullAnalysis(!showFullAnalysis)}
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
                      <Card key={analysis.subreddit}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 mr-4">
                              <CardTitle className="text-lg leading-tight mb-1">{generateAnalysisTitle(analysis)}</CardTitle>
                              <span className="text-sm text-muted-foreground">from r/{analysis.subreddit}</span>
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

function TrendsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border rounded-lg">
                <Skeleton className="h-5 w-32 mb-3" />
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    {[1, 2, 3].map((j) => (
                      <Skeleton key={j} className="h-5 w-16 rounded-full" />
                    ))}
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}