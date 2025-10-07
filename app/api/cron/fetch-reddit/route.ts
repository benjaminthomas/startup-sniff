import { NextRequest, NextResponse } from 'next/server';

// This endpoint should be called by a cron job (e.g., Vercel Cron)
// Add CRON_SECRET to your environment variables for security

const REDDIT_API_BASE = 'https://www.reddit.com';
const SUBREDDITS = ['entrepreneur', 'startups', 'SaaS', 'smallbusiness', 'webdev', 'freelance', 'business', 'sidehustle'];

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

          const data = await response.json();
          return { subreddit, posts: data.data.children.map((child: { data: unknown }) => child.data) };
        } catch (error) {
          console.error(`Error fetching r/${subreddit}:`, error);
          return null;
        }
      })
    );

    const validResults = results.filter(result => result !== null);
    console.log(`✅ Cron job: Successfully fetched ${validResults.length} subreddits`);

    // Store in a database or KV store (for now, just return success)
    // TODO: Implement storage (e.g., Vercel KV, Redis, or database)

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
