// Updated TypeScript types for Reddit Trend Engine
// Generated based on the new database schema migrations

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      posts: {
        Row: {
          id: string
          subreddit: string
          title: string
          body: string | null
          url: string | null
          author: string
          score: number
          comments: number
          created_utc: string
          sentiment: number | null
          intent_flags: string[]
          hash: string
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          subreddit: string
          title: string
          body?: string | null
          url?: string | null
          author: string
          score?: number
          comments?: number
          created_utc: string
          sentiment?: number | null
          intent_flags?: string[]
          hash: string
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          subreddit?: string
          title?: string
          body?: string | null
          url?: string | null
          author?: string
          score?: number
          comments?: number
          created_utc?: string
          sentiment?: number | null
          intent_flags?: string[]
          hash?: string
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      topics: {
        Row: {
          id: string
          label: string
          keywords: string[]
          description: string | null
          last_seen_utc: string
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          label: string
          keywords: string[]
          description?: string | null
          last_seen_utc: string
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          label?: string
          keywords?: string[]
          description?: string | null
          last_seen_utc?: string
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      topic_posts: {
        Row: {
          topic_id: string
          post_id: string
          similarity: number
          created_at: string
        }
        Insert: {
          topic_id: string
          post_id: string
          similarity?: number
          created_at?: string
        }
        Update: {
          topic_id?: string
          post_id?: string
          similarity?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_posts_topic_id_fkey"
            columns: ["topic_id"]
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_posts_post_id_fkey"
            columns: ["post_id"]
            referencedRelation: "posts"
            referencedColumns: ["id"]
          }
        ]
      }
      topic_stats: {
        Row: {
          id: string
          topic_id: string
          time_window: '24h' | '7d' | '30d'
          post_count: number
          velocity: number
          sentiment_avg: number | null
          engagement_score: number
          final_score: number
          updated_at: string
        }
        Insert: {
          id?: string
          topic_id: string
          time_window: '24h' | '7d' | '30d'
          post_count?: number
          velocity?: number
          sentiment_avg?: number | null
          engagement_score?: number
          final_score?: number
          updated_at?: string
        }
        Update: {
          id?: string
          topic_id?: string
          time_window?: '24h' | '7d' | '30d'
          post_count?: number
          velocity?: number
          sentiment_avg?: number | null
          engagement_score?: number
          final_score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_stats_topic_id_fkey"
            columns: ["topic_id"]
            referencedRelation: "topics"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          plan_type: 'free' | 'starter' | 'founder' | null
          stripe_customer_id: string | null
          created_at: string
          updated_at: string
          keyword_tracks: string[]
          last_trend_check: string | null
          trend_notifications_enabled: boolean
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          plan_type?: 'free' | 'starter' | 'founder' | null
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
          keyword_tracks?: string[]
          last_trend_check?: string | null
          trend_notifications_enabled?: boolean
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          plan_type?: 'free' | 'starter' | 'founder' | null
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
          keyword_tracks?: string[]
          last_trend_check?: string | null
          trend_notifications_enabled?: boolean
        }
        Relationships: []
      }
      startup_ideas: {
        Row: {
          id: string
          user_id: string
          title: string
          problem_statement: string
          target_market: Json | null
          solution: Json | null
          market_analysis: Json | null
          implementation: Json | null
          success_metrics: Json | null
          ai_confidence_score: number | null
          trends: Json | null
          created_at: string
          updated_at: string
          source_topic_id: string | null
          trend_context: Json | null
          trend_explanation: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          problem_statement: string
          target_market?: Json | null
          solution?: Json | null
          market_analysis?: Json | null
          implementation?: Json | null
          success_metrics?: Json | null
          ai_confidence_score?: number | null
          trends?: Json | null
          created_at?: string
          updated_at?: string
          source_topic_id?: string | null
          trend_context?: Json | null
          trend_explanation?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          problem_statement?: string
          target_market?: Json | null
          solution?: Json | null
          market_analysis?: Json | null
          implementation?: Json | null
          success_metrics?: Json | null
          ai_confidence_score?: number | null
          trends?: Json | null
          created_at?: string
          updated_at?: string
          source_topic_id?: string | null
          trend_context?: Json | null
          trend_explanation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "startup_ideas_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "startup_ideas_source_topic_id_fkey"
            columns: ["source_topic_id"]
            referencedRelation: "topics"
            referencedColumns: ["id"]
          }
        ]
      }
      // Add other existing tables as needed...
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for Reddit Trend Engine
export type RedditPost = Database['public']['Tables']['posts']['Row']
export type RedditPostInsert = Database['public']['Tables']['posts']['Insert']
export type RedditPostUpdate = Database['public']['Tables']['posts']['Update']

export type TrendingTopic = Database['public']['Tables']['topics']['Row']
export type TrendingTopicInsert = Database['public']['Tables']['topics']['Insert']
export type TrendingTopicUpdate = Database['public']['Tables']['topics']['Update']

export type TopicPost = Database['public']['Tables']['topic_posts']['Row']
export type TopicPostInsert = Database['public']['Tables']['topic_posts']['Insert']

export type TopicStats = Database['public']['Tables']['topic_stats']['Row']
export type TopicStatsInsert = Database['public']['Tables']['topic_stats']['Insert']
export type TopicStatsUpdate = Database['public']['Tables']['topic_stats']['Update']

export type TimeWindow = '24h' | '7d' | '30d'
export type PlanType = 'free' | 'starter' | 'founder'

// Enhanced StartupIdea type with trend integration
export type StartupIdea = Database['public']['Tables']['startup_ideas']['Row']
export type StartupIdeaInsert = Database['public']['Tables']['startup_ideas']['Insert']
export type StartupIdeaUpdate = Database['public']['Tables']['startup_ideas']['Update']

// Trend context structure for startup ideas
export interface TrendContext {
  velocity: number
  sentiment_avg: number
  post_count: number
  sample_posts: {
    title: string
    score: number
    url?: string
  }[]
  trending_keywords: string[]
}

// User with trend preferences
export type UserWithTrends = Database['public']['Tables']['users']['Row']