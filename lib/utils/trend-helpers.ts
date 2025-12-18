import { TrendOpportunity, RedditTrendAnalysis } from "@/features/trends/hooks/useRedditTrends";

/**
 * Get the color class for sentiment score
 */
export function getSentimentColor(score: number): string {
  if (score >= 70) return 'text-green-600 bg-green-50 border-green-200';
  if (score >= 50) return 'text-blue-600 bg-blue-50 border-blue-200';
  if (score >= 30) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-red-600 bg-red-50 border-red-200';
}

/**
 * Get the color class for opportunity score
 */
export function getOpportunityColor(score: number): string {
  if (score >= 80) return 'text-emerald-700';
  if (score >= 60) return 'text-green-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-gray-600';
}

/**
 * Generate meaningful title from trending topics and posts
 */
export function generateMeaningfulTitle(opportunity: TrendOpportunity): string {
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
}

/**
 * Generate title for full analysis card
 */
export function generateAnalysisTitle(analysis: RedditTrendAnalysis): string {
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
}
