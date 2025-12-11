import { useState, useEffect } from 'react';
import { log } from '@/lib/logger/client';

export interface RedditTrendAnalysis {
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

export interface TrendOpportunity {
  subreddit: string;
  opportunityScore: number;
  trendingTopics: string[];
  topPost: Record<string, unknown> | null;
}

export interface TrendsSummary {
  totalTopics: number;
  activeCommunities: number;
  weeklyGrowth: string;
  topOpportunities: TrendOpportunity[];
  fullAnalysis?: RedditTrendAnalysis[];
}

export function useRedditTrends() {
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

  const toggleFullAnalysis = () => {
    setShowFullAnalysis(!showFullAnalysis);
  };

  return {
    isLoading,
    error,
    summary,
    fullAnalysis,
    showFullAnalysis,
    loadTrends,
    toggleFullAnalysis
  };
}
