import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createServerAdminClient } from '@/modules/supabase';

type RedditAPIPost = {
  id: string;
  title: string;
  selftext?: string;
  url?: string;
  author?: string;
  score?: number;
  num_comments?: number;
  created_utc?: number;
};

// This endpoint should be called by a cron job (e.g., Vercel Cron)
// Add CRON_SECRET to your environment variables for security

const REDDIT_API_BASE = 'https://www.reddit.com';
const SUBREDDITS = [
  'entrepreneur',
  'startups',
  'SaaS',
  'smallbusiness',
  'webdev',
  'freelance',
  'business',
  'sidehustle',
  'medicine',
  'healthcare',
  'teachers',
  'education',
  'shopify',
  'ecommerce',
  'sustainability',
  'logistics',
  'climate',
  'machinelearning',
  'ai'
];

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('🔄 Cron job: Fetching Reddit trends data...');

    // Fetch data from multiple subreddits
    const results = await Promise.all(
      SUBREDDITS.map(async (subreddit) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);

          const response = await fetch(`${REDDIT_API_BASE}/r/${subreddit}/hot.json?limit=25`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            console.error(`Failed to fetch r/${subreddit}: ${response.status}`);
            return null;
          }

          const data = (await response.json()) as {
            data: { children: Array<{ data: RedditAPIPost }> };
          };
          return { subreddit, posts: data.data.children.map((child) => child.data) };
        } catch (error) {
          console.error(`Error fetching r/${subreddit}:`, error);
          return null;
        }
      })
    );

    const validResults = results.filter(result => result !== null) as Array<{ subreddit: string; posts: RedditAPIPost[] }>;
    console.log(`✅ Cron job: Successfully fetched ${validResults.length} subreddits`);

    if (validResults.length > 0) {
      const supabase = createServerAdminClient();
      const now = new Date().toISOString();

      const rows = validResults.flatMap(({ subreddit, posts }) =>
        posts.map((post) => {
          const createdUtc =
            typeof post.created_utc === 'number'
              ? new Date(post.created_utc * 1000).toISOString()
              : new Date().toISOString();

          const content = post.selftext ?? '';

          return {
            reddit_id: post.id as string,
            subreddit,
            title: post.title,
            content,
            url: post.url ?? `https://reddit.com/r/${subreddit}/comments/${post.id}`,
            author: post.author ?? 'unknown',
            score: post.score ?? 0,
            comments: post.num_comments ?? 0,
            created_utc: createdUtc,
            processed_at: now,
            updated_at: now,
            sentiment: 0,
            intent_flags: [] as string[],
            analysis_data: null,
            hash: createHash('sha256').update(`${post.id}-${subreddit}`).digest('hex')
          };
        })
      );

      if (rows.length > 0) {
        const { error } = await supabase
          .from('reddit_posts')
          .upsert(rows, { onConflict: 'reddit_id' });

        if (error) {
          console.error('❌ Failed to store Reddit posts:', error);
        } else {
          console.log(`🗄️  Stored ${rows.length} Reddit posts`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      subredditsFetched: validResults.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Failed to fetch Reddit data' }, { status: 500 });
  }
}
