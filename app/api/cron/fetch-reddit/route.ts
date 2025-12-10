import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createServerAdminClient } from '@/modules/supabase';
import { log } from '@/lib/logger'

const FALLBACK_USER_AGENT = 'startup-sniff-cron/1.0 (https://startupsniff.com)';
let cachedToken: { token: string; expiresAt: number } | null = null;

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

const REDDIT_API_BASE = 'https://oauth.reddit.com';
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

async function getRedditAccessToken() {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  const userAgent = process.env.REDDIT_USER_AGENT || FALLBACK_USER_AGENT;

  if (!clientId || !clientSecret) {
    return null;
  }

  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  try {
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': userAgent,
      },
      body: new URLSearchParams({ grant_type: 'client_credentials' }),
    });

    if (!response.ok) {
      const text = await response.text();
      log.error('Failed to obtain Reddit token', undefined, { status: response.status, response: text });
      return null;
    }

    const data = (await response.json()) as { access_token: string; expires_in: number };
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    };

    return cachedToken.token;
  } catch (error) {
    log.error('❌ Error fetching Reddit token:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    log.info('🔄 Cron job: Fetching Reddit trends data...');

    const userAgent = process.env.REDDIT_USER_AGENT || FALLBACK_USER_AGENT;
    const accessToken = await getRedditAccessToken();
    const apiBase = accessToken ? REDDIT_API_BASE : 'https://www.reddit.com';
    if (!accessToken) {
      log.warn('⚠️  Reddit access token unavailable – falling back to public endpoints (may be rate limited).');
    }

    // Fetch data from multiple subreddits
    const results = await Promise.all(
      SUBREDDITS.map(async (subreddit) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);

          const response = await fetch(`${apiBase}/r/${subreddit}/hot.json?limit=25&raw_json=1`, {
            headers: {
              'User-Agent': userAgent,
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            log.error(`Failed to fetch r/${subreddit}: ${response.status}`);
            return null;
          }

          const data = (await response.json()) as {
            data: { children: Array<{ data: RedditAPIPost }> };
          };
          return { subreddit, posts: data.data.children.map((child) => child.data) };
        } catch (error) {
          log.error(`Error fetching r/${subreddit}:`, error);
          return null;
        }
      })
    );

    const validResults = results.filter(result => result !== null) as Array<{ subreddit: string; posts: RedditAPIPost[] }>;
    log.info(`✅ Cron job: Successfully fetched ${validResults.length} subreddits`);

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
          log.error('❌ Failed to store Reddit posts:', error);
        } else {
          log.info(`🗄️  Stored ${rows.length} Reddit posts`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      subredditsFetched: validResults.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    log.error('Cron job error:', error);
    return NextResponse.json({ error: 'Failed to fetch Reddit data' }, { status: 500 });
  }
}
