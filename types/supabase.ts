/**
 * Supabase Database Types
 * Placeholder until types are regenerated
 */

// Re-export from database types for now
export type { User } from './database';

// Placeholder for RedditContact type
export interface RedditContact {
  id: string;
  reddit_post_id: string;
  reddit_username: string;
  contact_score: number | null;
  reddit_karma: number | null;
  account_age_days: number | null;
  post_frequency: number | null;
  relevance_score: number | null;
  first_seen_at: string;
  last_seen_at: string;
  contacted_at: string | null;
  response_status: string | null;
  post_excerpt: string | null;
  karma: number | null;
  engagement_score: number;
  posting_frequency: number | null;
  created_at: string;
  updated_at: string;
}

export type RedditContactInsert = Partial<Omit<RedditContact, 'id' | 'created_at' | 'updated_at'>>;

// Placeholder for RedditPost type
export interface RedditPost {
  id: string;
  reddit_id: string;
  subreddit: string;
  title: string;
  content: string | null;
  url: string | null;
  author: string;
  score: number | null;
  comments: number | null;
  created_utc: string;
  viability_score: number | null;
  viability_explanation: string | null;
  pain_score: number | null;
  engagement_score: number | null;
  market_size_score: number | null;
  solution_difficulty_score: number | null;
  is_emerging: boolean | null;
  trend_direction: string | null;
  trend_percentage: number | null;
  weekly_frequency: number | null;
  created_at: string;
  updated_at: string;
}
