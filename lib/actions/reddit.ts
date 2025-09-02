'use server';

import { RedditPost } from '@/types/global';
import { SUBREDDITS } from '@/constants';

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
  top_posts: RedditPost[];
}

interface TrendAnalysisResult {
  success: boolean;
  data?: RedditTrendAnalysis[];
  error?: string;
}

// Mock Reddit API response structure
interface MockRedditAPIResponse {
  data: {
    children: Array<{
      data: {
        id: string;
        title: string;
        selftext: string;
        subreddit: string;
        score: number;
        num_comments: number;
        created_utc: number;
        permalink: string;
        url: string;
      };
    }>;
  };
}

// Simulate Reddit API call with realistic data
async function fetchRedditPosts(subreddit: string): Promise<RedditPost[]> {
  // In a real implementation, this would call Reddit API
  // For now, we'll return mock data based on actual Reddit patterns
  
  const mockPosts: RedditPost[] = [
    {
      id: `${subreddit}_1`,
      title: getSubredditSpecificTitle(subreddit, 1),
      content: getSubredditSpecificContent(subreddit, 1),
      subreddit,
      score: Math.floor(Math.random() * 1000) + 100,
      num_comments: Math.floor(Math.random() * 200) + 10,
      created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      url: `https://reddit.com/r/${subreddit}/comments/${subreddit}_1`
    },
    {
      id: `${subreddit}_2`,
      title: getSubredditSpecificTitle(subreddit, 2),
      content: getSubredditSpecificContent(subreddit, 2),
      subreddit,
      score: Math.floor(Math.random() * 800) + 50,
      num_comments: Math.floor(Math.random() * 150) + 5,
      created_at: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
      url: `https://reddit.com/r/${subreddit}/comments/${subreddit}_2`
    },
    {
      id: `${subreddit}_3`,
      title: getSubredditSpecificTitle(subreddit, 3),
      content: getSubredditSpecificContent(subreddit, 3),
      subreddit,
      score: Math.floor(Math.random() * 600) + 25,
      num_comments: Math.floor(Math.random() * 100) + 2,
      created_at: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString(),
      url: `https://reddit.com/r/${subreddit}/comments/${subreddit}_3`
    }
  ];

  return mockPosts;
}

// Generate subreddit-specific realistic titles
function getSubredditSpecificTitle(subreddit: string, index: number): string {
  const titles = {
    entrepreneur: [
      'How I built a $100K ARR SaaS in 12 months - AMA',
      'Biggest mistake I made when starting my first business',
      'The one growth hack that 10x my customer acquisition'
    ],
    startups: [
      'YC W24 Demo Day highlights - which startups caught your eye?',
      'Fundraising in 2025: What VCs are actually looking for',
      'Building in public: 6 months of transparent revenue sharing'
    ],
    SaaS: [
      'Switched from Stripe to a custom billing solution - cut costs by 40%',
      'PLG vs Sales-led: Data from 50+ B2B SaaS companies',
      'MRR Milestone: From $0 to $50K in 18 months'
    ],
    technology: [
      'The AI tools that are actually worth paying for in 2025',
      'Why most no-code solutions fail at scale',
      'Open source alternatives to expensive enterprise software'
    ],
    business: [
      'Small business owners: What\'s your biggest challenge right now?',
      'The business model that nobody talks about but generates millions',
      'Local business ideas that are thriving post-pandemic'
    ],
    digitalnomad: [
      'Best cities for digital nomads with reliable internet in 2025',
      'How to maintain work-life balance while traveling full-time',
      'Tax implications of being a digital nomad - what I learned'
    ]
  };

  const subredditTitles = titles[subreddit as keyof typeof titles] || [
    `Trending discussion in r/${subreddit}`,
    `Popular post from r/${subreddit} community`,
    `Hot topic in r/${subreddit} this week`
  ];

  return subredditTitles[index - 1] || subredditTitles[0];
}

// Generate subreddit-specific realistic content
function getSubredditSpecificContent(subreddit: string, index: number): string {
  const contents = {
    entrepreneur: [
      'Started with a simple problem I faced daily. Bootstrapped for the first 8 months, then raised a small seed round. Here are the 5 key lessons I learned...',
      'Looking back, I wish someone had told me about customer discovery before I built anything. Spent 6 months building the wrong product...',
      'This single strategy helped me go from 10 to 1000 customers. It\'s not what you think...'
    ],
    startups: [
      'Attended Demo Day virtually and took notes on all the presentations. Some fascinating ideas in vertical SaaS and AI tooling...',
      'Talked to 20+ VCs this quarter. The market has definitely shifted. Here\'s what they care about now...',
      'Sharing our metrics dashboard publicly was scary but led to amazing conversations and partnerships...'
    ],
    SaaS: [
      'Stripe was taking 2.9% + $0.30 per transaction. Our volume made custom billing worth the engineering effort...',
      'Analyzed data from our portfolio companies. The differences between PLG and sales-led are more nuanced than expected...',
      'It wasn\'t linear. Had several false starts and one major pivot. But consistency paid off...'
    ]
  };

  const subredditContents = contents[subreddit as keyof typeof contents] || [
    `Interesting discussion happening in the ${subreddit} community about current trends and opportunities.`,
    `Community members are sharing valuable insights about challenges and solutions in the ${subreddit} space.`,
    `Active conversation in r/${subreddit} with lots of engagement and practical advice.`
  ];

  return subredditContents[index - 1] || subredditContents[0];
}

// Extract trending topics from posts
function extractTrendingTopics(posts: RedditPost[]): string[] {
  const commonKeywords = [
    'AI', 'SaaS', 'MVP', 'funding', 'growth', 'startup', 'business model', 
    'revenue', 'customers', 'product-market fit', 'scaling', 'remote work',
    'automation', 'productivity', 'marketing', 'sales', 'bootstrapped',
    'venture capital', 'angel investment', 'no-code', 'API', 'B2B', 'B2C'
  ];

  // Simulate topic extraction from post content
  const topics: string[] = [];
  posts.forEach(post => {
    const text = (post.title + ' ' + post.content).toLowerCase();
    commonKeywords.forEach(keyword => {
      if (text.includes(keyword.toLowerCase()) && !topics.includes(keyword)) {
        topics.push(keyword);
      }
    });
  });

  // Return top 5 trending topics
  return topics.slice(0, 5);
}

// Calculate sentiment score (0-100)
function calculateSentimentScore(posts: RedditPost[]): number {
  // Simple sentiment analysis based on engagement and keywords
  let totalSentiment = 0;
  
  posts.forEach(post => {
    const text = (post.title + ' ' + post.content).toLowerCase();
    const positiveWords = ['success', 'growth', 'amazing', 'great', 'excellent', 'profitable', 'milestone'];
    const negativeWords = ['failed', 'struggle', 'difficult', 'problem', 'challenge', 'mistake'];
    
    let postSentiment = 50; // Neutral baseline
    positiveWords.forEach(word => {
      if (text.includes(word)) postSentiment += 5;
    });
    negativeWords.forEach(word => {
      if (text.includes(word)) postSentiment -= 3;
    });
    
    // Factor in engagement (high engagement = more positive)
    const engagementBoost = Math.min((post.score / 100) + (post.num_comments / 20), 10);
    postSentiment += engagementBoost;
    
    totalSentiment += Math.max(0, Math.min(100, postSentiment));
  });

  return Math.round(totalSentiment / posts.length);
}

// Calculate opportunity score based on engagement and trending topics
function calculateOpportunityScore(posts: RedditPost[], trendingTopics: string[]): number {
  const avgEngagement = posts.reduce((sum, post) => sum + post.score + post.num_comments, 0) / posts.length;
  const topicCount = trendingTopics.length;
  const recentPosts = posts.filter(post => {
    const postDate = new Date(post.created_at);
    const daysDiff = (Date.now() - postDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 2; // Posts from last 2 days
  }).length;

  // Calculate score based on multiple factors
  const engagementScore = Math.min(avgEngagement / 10, 40); // Max 40 points
  const topicScore = Math.min(topicCount * 8, 30); // Max 30 points  
  const freshnessScore = Math.min(recentPosts * 10, 30); // Max 30 points

  return Math.round(engagementScore + topicScore + freshnessScore);
}

export async function analyzeRedditTrends(): Promise<TrendAnalysisResult> {
  try {
    // Analyze top subreddits for startup opportunities
    const topSubreddits = SUBREDDITS.slice(0, 8); // First 8 subreddits
    
    const analyses = await Promise.all(
      topSubreddits.map(async (subreddit): Promise<RedditTrendAnalysis> => {
        const posts = await fetchRedditPosts(subreddit);
        const trendingTopics = extractTrendingTopics(posts);
        const sentimentScore = calculateSentimentScore(posts);
        const opportunityScore = calculateOpportunityScore(posts, trendingTopics);
        
        const engagementMetrics = {
          avg_score: Math.round(posts.reduce((sum, post) => sum + post.score, 0) / posts.length),
          avg_comments: Math.round(posts.reduce((sum, post) => sum + post.num_comments, 0) / posts.length),
          total_posts: posts.length
        };

        return {
          subreddit,
          trending_topics: trendingTopics,
          sentiment_score: sentimentScore,
          engagement_metrics: engagementMetrics,
          opportunity_score: opportunityScore,
          top_posts: posts.sort((a, b) => b.score - a.score).slice(0, 3) // Top 3 posts by score
        };
      })
    );

    // Sort by opportunity score
    analyses.sort((a, b) => b.opportunity_score - a.opportunity_score);

    return {
      success: true,
      data: analyses
    };

  } catch (error) {
    console.error('Reddit trend analysis failed:', error);
    return {
      success: false,
      error: 'Failed to analyze Reddit trends. Please try again.'
    };
  }
}

export async function getRedditTrendsSummary() {
  const result = await analyzeRedditTrends();
  
  if (!result.success || !result.data) {
    return {
      totalTopics: 0,
      activeCommunities: 0,
      weeklyGrowth: '+0%',
      topOpportunities: []
    };
  }

  const totalTopics = result.data.reduce((sum, analysis) => sum + analysis.trending_topics.length, 0);
  const activeCommunities = result.data.length;
  const avgOpportunityScore = result.data.reduce((sum, analysis) => sum + analysis.opportunity_score, 0) / result.data.length;
  const weeklyGrowth = `+${Math.round(avgOpportunityScore)}%`;
  
  const topOpportunities = result.data
    .slice(0, 3)
    .map(analysis => ({
      subreddit: analysis.subreddit,
      opportunityScore: analysis.opportunity_score,
      trendingTopics: analysis.trending_topics,
      topPost: analysis.top_posts[0]
    }));

  return {
    totalTopics,
    activeCommunities,
    weeklyGrowth,
    topOpportunities,
    fullAnalysis: result.data
  };
}