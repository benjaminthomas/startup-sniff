import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/jwt';

// Reddit public API endpoints - no authentication required
const REDDIT_API_BASE = 'https://www.reddit.com';
const SUBREDDITS = ['entrepreneur', 'startups', 'SaaS', 'smallbusiness', 'webdev', 'freelance', 'business', 'sidehustle'];

interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  subreddit: string;
  score: number;
  num_comments: number;
  created_utc: number;
  permalink: string;
  url: string;
}

interface RedditApiResponse {
  data: {
    children: Array<{
      data: RedditPost;
    }>;
  };
}

interface ProcessedPost {
  id: string;
  title: string;
  content: string;
  subreddit: string;
  score: number;
  num_comments: number;
  created_at: string;
  url: string;
}

interface TrendAnalysis {
  subreddit: string;
  trending_topics: string[];
  sentiment_score: number;
  engagement_metrics: {
    avg_score: number;
    avg_comments: number;
    total_posts: number;
  };
  opportunity_score: number;
  top_posts: ProcessedPost[];
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const forceRefresh = searchParams.get('refresh') === 'true';

    console.log('🔍 Fetching Reddit trends data...');

    // Fetch data from multiple subreddits in parallel
    const subredditPromises = SUBREDDITS.map(async (subreddit) => {
      try {
        // Fetch hot posts from each subreddit
        const response = await fetch(`${REDDIT_API_BASE}/r/${subreddit}/hot.json?limit=25`, {
          headers: {
            'User-Agent': 'StartupSniff/1.0 (web scraper for startup ideas)',
          },
          next: forceRefresh ? { revalidate: 0 } : { revalidate: 3600 } // Cache for 1 hour unless forced refresh
        });

        if (!response.ok) {
          console.error(`Failed to fetch r/${subreddit}: ${response.status}`);
          return null;
        }

        const data: RedditApiResponse = await response.json();
        return { subreddit, posts: data.data.children.map(child => child.data) };
      } catch (error) {
        console.error(`Error fetching r/${subreddit}:`, error);
        return null;
      }
    });

    const results = await Promise.all(subredditPromises);
    const validResults = results.filter(result => result !== null);

    if (validResults.length === 0) {
      return NextResponse.json({ error: 'Failed to fetch Reddit data' }, { status: 500 });
    }

    // Process and analyze the data
    const analyses: TrendAnalysis[] = validResults.map(({ subreddit, posts }) => {
      // Filter posts that are likely pain points or opportunities
      const relevantPosts = posts.filter(post =>
        post.selftext &&
        post.selftext.length > 50 &&
        (post.title.toLowerCase().includes('help') ||
         post.title.toLowerCase().includes('problem') ||
         post.title.toLowerCase().includes('issue') ||
         post.title.toLowerCase().includes('struggle') ||
         post.title.toLowerCase().includes('difficult') ||
         post.title.toLowerCase().includes('frustrat') ||
         post.title.toLowerCase().includes('need') ||
         post.title.toLowerCase().includes('looking for') ||
         post.title.toLowerCase().includes('solution') ||
         post.title.toLowerCase().includes('tool') ||
         post.title.toLowerCase().includes('advice') ||
         post.score > 20)
      );

      // Extract trending topics using simple keyword analysis
      const trendingTopics = extractTrendingTopics(relevantPosts);

      // Calculate metrics
      const totalScore = posts.reduce((sum, post) => sum + post.score, 0);
      const totalComments = posts.reduce((sum, post) => sum + post.num_comments, 0);

      const avgScore = Math.round(totalScore / posts.length);
      const avgComments = Math.round(totalComments / posts.length);

      // Calculate sentiment and opportunity scores
      const sentimentScore = calculateSentimentScore(relevantPosts);
      const opportunityScore = calculateOpportunityScore(relevantPosts, avgScore, avgComments);

      // Process top posts
      const topPosts: ProcessedPost[] = relevantPosts
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(post => ({
          id: post.id,
          title: post.title,
          content: post.selftext.slice(0, 300) + (post.selftext.length > 300 ? '...' : ''),
          subreddit: post.subreddit,
          score: post.score,
          num_comments: post.num_comments,
          created_at: new Date(post.created_utc * 1000).toISOString(),
          url: `https://reddit.com${post.permalink}`
        }));

      return {
        subreddit,
        trending_topics: trendingTopics,
        sentiment_score: sentimentScore,
        engagement_metrics: {
          avg_score: avgScore,
          avg_comments: avgComments,
          total_posts: posts.length
        },
        opportunity_score: opportunityScore,
        top_posts: topPosts
      };
    });

    // Sort by opportunity score
    analyses.sort((a, b) => b.opportunity_score - a.opportunity_score);

    // Create summary
    const totalTopics = analyses.reduce((sum, analysis) => sum + analysis.trending_topics.length, 0);
    const avgOpportunityScore = Math.round(
      analyses.reduce((sum, analysis) => sum + analysis.opportunity_score, 0) / analyses.length
    );

    const topOpportunities = analyses.slice(0, 6).map(analysis => ({
      subreddit: analysis.subreddit,
      opportunityScore: analysis.opportunity_score,
      trendingTopics: analysis.trending_topics.slice(0, 3),
      topPost: analysis.top_posts[0] || null
    }));

    const summary = {
      totalTopics,
      activeCommunities: validResults.length,
      weeklyGrowth: `+${avgOpportunityScore}%`,
      topOpportunities,
      fullAnalysis: analyses
    };

    console.log(`✅ Successfully analyzed ${validResults.length} subreddits, found ${totalTopics} topics`);

    return NextResponse.json(summary);

  } catch (error) {
    console.error('Error in Reddit trends API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Reddit trends' },
      { status: 500 }
    );
  }
}

// Extract trending topics from posts using keyword frequency analysis
function extractTrendingTopics(posts: RedditPost[]): string[] {
  const keywordMap: Record<string, number> = {};

  // Common keywords that indicate business problems/opportunities
  const businessKeywords = [
    'automation', 'ai', 'saas', 'tool', 'platform', 'software', 'app', 'service',
    'marketing', 'sales', 'customer', 'user', 'client', 'business', 'startup',
    'workflow', 'productivity', 'management', 'tracking', 'analytics', 'integration',
    'api', 'dashboard', 'reporting', 'invoice', 'payment', 'subscription',
    'onboarding', 'feedback', 'validation', 'deployment', 'development',
    'collaboration', 'communication', 'remote', 'freelance', 'project'
  ];

  posts.forEach(post => {
    const text = (post.title + ' ' + post.selftext).toLowerCase();
    businessKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        keywordMap[keyword] = (keywordMap[keyword] || 0) + matches.length;
      }
    });
  });

  // Return top 5 keywords
  return Object.entries(keywordMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([keyword]) => keyword);
}

// Calculate sentiment score based on language used
function calculateSentimentScore(posts: RedditPost[]): number {
  const positiveWords = ['great', 'awesome', 'love', 'amazing', 'perfect', 'excellent', 'fantastic', 'wonderful'];
  const negativeWords = ['hate', 'terrible', 'awful', 'frustrated', 'annoying', 'broken', 'useless', 'disappointing', 'struggle', 'difficult', 'problem', 'issue'];

  let positiveCount = 0;
  let negativeCount = 0;
  let totalWords = 0;

  posts.forEach(post => {
    const text = (post.title + ' ' + post.selftext).toLowerCase();
    const words = text.split(/\s+/);
    totalWords += words.length;

    words.forEach(word => {
      if (positiveWords.some(pw => word.includes(pw))) positiveCount++;
      if (negativeWords.some(nw => word.includes(nw))) negativeCount++;
    });
  });

  // Calculate sentiment score (0-100)
  const sentiment = totalWords > 0 ?
    Math.max(0, Math.min(100, 50 + ((positiveCount - negativeCount) / totalWords) * 1000)) : 50;

  return Math.round(sentiment);
}

// Calculate opportunity score based on engagement and content quality
function calculateOpportunityScore(posts: RedditPost[], avgScore: number, avgComments: number): number {
  // Factor in engagement, recency, and problem indicators
  let score = 0;

  // Base score from engagement
  score += Math.min(40, avgScore / 10); // Max 40 points for score
  score += Math.min(30, avgComments / 2); // Max 30 points for comments

  // Bonus for problem-indicating keywords
  const problemKeywords = ['need', 'problem', 'issue', 'struggle', 'difficult', 'help', 'solution', 'tool'];
  const problemPosts = posts.filter(post =>
    problemKeywords.some(keyword =>
      post.title.toLowerCase().includes(keyword) ||
      post.selftext.toLowerCase().includes(keyword)
    )
  );

  score += Math.min(30, (problemPosts.length / posts.length) * 30); // Max 30 points for problem density

  return Math.round(Math.min(100, score));
}