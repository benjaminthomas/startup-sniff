/**
 * Supabase Database Types
 * Placeholder until types are regenerated
 */

// Import User type
import type { User } from './database';

// Re-export from database types for now
export type { User } from './database';

// JSON type for database columns
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// Reddit Post Insert type
export interface RedditPostInsert {
  reddit_id: string;
  subreddit: string;
  title: string;
  content: string | null;
  url: string | null;
  author: string;
  score: number;
  comments: number;
  created_utc: string;
  hash: string;
  sentiment: number | null;
  intent_flags: string[];
}

// Message type
export interface Message {
  id: string;
  user_id: string;
  reddit_username: string;
  reddit_post_id: string | null;
  reddit_contact_id: string | null;
  template_variant: string | null;
  message_text: string;
  send_status: 'draft' | 'sent' | 'failed' | null;
  outcome: 'replied' | 'call_scheduled' | 'customer_acquired' | 'dead_end' | null;
  sent_at: string | null;
  replied_at: string | null;
  created_at: string;
  updated_at: string;
}

// Subscription type
export interface Subscription {
  id: string;
  user_id: string;
  razorpay_subscription_id: string;
  razorpay_plan_id: string | null;
  stripe_price_id: string | null;
  status: 'trial' | 'active' | 'inactive' | 'cancelled' | null;
  plan_type: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  created_at: string;
  updated_at: string;
}

// Startup Idea type
export interface StartupIdea {
  id: string;
  user_id: string;
  title: string;
  problem_statement: string;
  target_market: Json | null;
  solution: Json | null;
  market_analysis: Json | null;
  implementation: Json | null;
  success_metrics: Json | null;
  ai_confidence_score: number | null;
  source_data: Json | null;
  validation_data: Json | null;
  is_validated: boolean | null;
  is_favorite: boolean | null;
  created_at: string;
  updated_at: string;
}

// Minimal Database type for SupabaseClient generic
export interface Database {
  public: {
    Tables: {
      reddit_posts: {
        Row: RedditPost;
        Insert: Partial<RedditPost>;
        Update: Partial<RedditPost>;
      };
      reddit_contacts: {
        Row: RedditContact;
        Insert: RedditContactInsert;
        Update: Partial<RedditContact>;
      };
      users: {
        Row: User;
        Insert: Partial<User>;
        Update: Partial<User>;
      };
      messages: {
        Row: Message;
        Insert: Partial<Message>;
        Update: Partial<Message>;
      };
      subscriptions: {
        Row: Subscription;
        Insert: Partial<Subscription>;
        Update: Partial<Subscription>;
      };
      startup_ideas: {
        Row: StartupIdea;
        Insert: Partial<StartupIdea>;
        Update: Partial<StartupIdea>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

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
