export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      auth_rate_limits: {
        Row: {
          attempts: number | null
          blocked_until: string | null
          created_at: string | null
          endpoint: string
          id: string
          identifier: string
          updated_at: string | null
          window_start: string | null
        }
        Insert: {
          attempts?: number | null
          blocked_until?: string | null
          created_at?: string | null
          endpoint: string
          id?: string
          identifier: string
          updated_at?: string | null
          window_start?: string | null
        }
        Update: {
          attempts?: number | null
          blocked_until?: string | null
          created_at?: string | null
          endpoint?: string
          id?: string
          identifier?: string
          updated_at?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      generated_content: {
        Row: {
          brand_voice: string | null
          content: string
          content_type: string
          created_at: string
          id: string
          seo_keywords: string[] | null
          startup_idea_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_voice?: string | null
          content: string
          content_type: string
          created_at?: string
          id?: string
          seo_keywords?: string[] | null
          startup_idea_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_voice?: string | null
          content?: string
          content_type?: string
          created_at?: string
          id?: string
          seo_keywords?: string[] | null
          startup_idea_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_content_startup_idea_id_fkey"
            columns: ["startup_idea_id"]
            isOneToOne: false
            referencedRelation: "startup_ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_content_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          contact_id: string
          created_at: string | null
          error_message: string | null
          id: string
          message_text: string
          outcome: string | null
          pain_point_id: string
          reddit_username: string
          replied_at: string | null
          send_status: string
          sent_at: string | null
          template_variant: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          message_text: string
          outcome?: string | null
          pain_point_id: string
          reddit_username: string
          replied_at?: string | null
          send_status?: string
          sent_at?: string | null
          template_variant: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          message_text?: string
          outcome?: string | null
          pain_point_id?: string
          reddit_username?: string
          replied_at?: string | null
          send_status?: string
          sent_at?: string | null
          template_variant?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "reddit_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_pain_point_id_fkey"
            columns: ["pain_point_id"]
            isOneToOne: false
            referencedRelation: "reddit_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reddit_contacts: {
        Row: {
          account_age_days: number
          created_at: string | null
          discovered_at: string
          engagement_score: number
          id: string
          karma: number
          pain_point_id: string
          post_excerpt: string | null
          post_id: string
          posting_frequency: number | null
          reddit_user_id: string
          reddit_username: string
          updated_at: string | null
        }
        Insert: {
          account_age_days?: number
          created_at?: string | null
          discovered_at?: string
          engagement_score?: number
          id?: string
          karma?: number
          pain_point_id: string
          post_excerpt?: string | null
          post_id: string
          posting_frequency?: number | null
          reddit_user_id: string
          reddit_username: string
          updated_at?: string | null
        }
        Update: {
          account_age_days?: number
          created_at?: string | null
          discovered_at?: string
          engagement_score?: number
          id?: string
          karma?: number
          pain_point_id?: string
          post_excerpt?: string | null
          post_id?: string
          posting_frequency?: number | null
          reddit_user_id?: string
          reddit_username?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reddit_contacts_pain_point_id_fkey"
            columns: ["pain_point_id"]
            isOneToOne: false
            referencedRelation: "reddit_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      reddit_posts: {
        Row: {
          analysis_data: Json | null
          author: string
          comments: number | null
          content: string | null
          created_at: string | null
          created_utc: string
          hash: string
          id: string
          intent_flags: string[] | null
          is_emerging: boolean | null
          processed_at: string | null
          reddit_id: string
          score: number | null
          search_vector: unknown
          sentiment: number | null
          subreddit: string
          title: string
          trend_direction: string | null
          trend_percentage: number | null
          updated_at: string | null
          url: string | null
          viability_explanation: string | null
          viability_score: number | null
          weekly_frequency: number | null
        }
        Insert: {
          analysis_data?: Json | null
          author: string
          comments?: number | null
          content?: string | null
          created_at?: string | null
          created_utc: string
          hash: string
          id?: string
          intent_flags?: string[] | null
          is_emerging?: boolean | null
          processed_at?: string | null
          reddit_id: string
          score?: number | null
          search_vector?: unknown
          sentiment?: number | null
          subreddit: string
          title: string
          trend_direction?: string | null
          trend_percentage?: number | null
          updated_at?: string | null
          url?: string | null
          viability_explanation?: string | null
          viability_score?: number | null
          weekly_frequency?: number | null
        }
        Update: {
          analysis_data?: Json | null
          author?: string
          comments?: number | null
          content?: string | null
          created_at?: string | null
          created_utc?: string
          hash?: string
          id?: string
          intent_flags?: string[] | null
          is_emerging?: boolean | null
          processed_at?: string | null
          reddit_id?: string
          score?: number | null
          search_vector?: unknown
          sentiment?: number | null
          subreddit?: string
          title?: string
          trend_direction?: string | null
          trend_percentage?: number | null
          updated_at?: string | null
          url?: string | null
          viability_explanation?: string | null
          viability_score?: number | null
          weekly_frequency?: number | null
        }
        Relationships: []
      }
      startup_ideas: {
        Row: {
          ai_confidence_score: number | null
          created_at: string
          id: string
          implementation: Json
          is_favorite: boolean | null
          is_validated: boolean | null
          market_analysis: Json
          problem_statement: string
          solution: Json
          source_data: Json | null
          success_metrics: Json
          target_market: Json
          title: string
          updated_at: string
          user_id: string
          validation_data: Json | null
        }
        Insert: {
          ai_confidence_score?: number | null
          created_at?: string
          id?: string
          implementation: Json
          is_favorite?: boolean | null
          is_validated?: boolean | null
          market_analysis: Json
          problem_statement: string
          solution: Json
          source_data?: Json | null
          success_metrics: Json
          target_market: Json
          title: string
          updated_at?: string
          user_id: string
          validation_data?: Json | null
        }
        Update: {
          ai_confidence_score?: number | null
          created_at?: string
          id?: string
          implementation?: Json
          is_favorite?: boolean | null
          is_validated?: boolean | null
          market_analysis?: Json
          problem_statement?: string
          solution?: Json
          source_data?: Json | null
          success_metrics?: Json
          target_market?: Json
          title?: string
          updated_at?: string
          user_id?: string
          validation_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "startup_ideas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          discount_applied: number | null
          id: string
          offer_id: string | null
          offer_name: string | null
          plan_type: Database["public"]["Enums"]["plan_type"] | null
          razorpay_customer_id: string | null
          razorpay_plan_id: string | null
          razorpay_subscription_id: string | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          stripe_price_id: string
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          discount_applied?: number | null
          id?: string
          offer_id?: string | null
          offer_name?: string | null
          plan_type?: Database["public"]["Enums"]["plan_type"] | null
          razorpay_customer_id?: string | null
          razorpay_plan_id?: string | null
          razorpay_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          stripe_price_id: string
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          discount_applied?: number | null
          id?: string
          offer_id?: string | null
          offer_name?: string | null
          plan_type?: Database["public"]["Enums"]["plan_type"] | null
          razorpay_customer_id?: string | null
          razorpay_plan_id?: string | null
          razorpay_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          stripe_price_id?: string
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_limits: {
        Row: {
          content_generated: number | null
          created_at: string
          id: string
          ideas_generated: number | null
          message_reset_date: string | null
          messages_sent_today: number | null
          monthly_limit_content: number | null
          monthly_limit_ideas: number
          monthly_limit_validations: number
          plan_type: Database["public"]["Enums"]["plan_type"]
          reset_date: string
          updated_at: string
          user_id: string
          validations_completed: number | null
        }
        Insert: {
          content_generated?: number | null
          created_at?: string
          id?: string
          ideas_generated?: number | null
          message_reset_date?: string | null
          messages_sent_today?: number | null
          monthly_limit_content?: number | null
          monthly_limit_ideas: number
          monthly_limit_validations: number
          plan_type: Database["public"]["Enums"]["plan_type"]
          reset_date?: string
          updated_at?: string
          user_id: string
          validations_completed?: number | null
        }
        Update: {
          content_generated?: number | null
          created_at?: string
          id?: string
          ideas_generated?: number | null
          message_reset_date?: string | null
          messages_sent_today?: number | null
          monthly_limit_content?: number | null
          monthly_limit_ideas?: number
          monthly_limit_validations?: number
          plan_type?: Database["public"]["Enums"]["plan_type"]
          reset_date?: string
          updated_at?: string
          user_id?: string
          validations_completed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          ip_address: unknown
          session_token: string
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: unknown
          session_token: string
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown
          session_token?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          email_verification_expires_at: string | null
          email_verification_token: string | null
          email_verified: boolean | null
          full_name: string | null
          id: string
          last_login_at: string | null
          locked_until: string | null
          login_attempts: number | null
          password_hash: string | null
          password_reset_expires_at: string | null
          password_reset_token: string | null
          plan_type: Database["public"]["Enums"]["plan_type"]
          razorpay_customer_id: string | null
          reddit_access_token: string | null
          reddit_connected_at: string | null
          reddit_refresh_token: string | null
          reddit_token_expires_at: string | null
          reddit_username: string | null
          stripe_customer_id: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          email_verification_expires_at?: string | null
          email_verification_token?: string | null
          email_verified?: boolean | null
          full_name?: string | null
          id: string
          last_login_at?: string | null
          locked_until?: string | null
          login_attempts?: number | null
          password_hash?: string | null
          password_reset_expires_at?: string | null
          password_reset_token?: string | null
          plan_type?: Database["public"]["Enums"]["plan_type"]
          razorpay_customer_id?: string | null
          reddit_access_token?: string | null
          reddit_connected_at?: string | null
          reddit_refresh_token?: string | null
          reddit_token_expires_at?: string | null
          reddit_username?: string | null
          stripe_customer_id?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          email_verification_expires_at?: string | null
          email_verification_token?: string | null
          email_verified?: boolean | null
          full_name?: string | null
          id?: string
          last_login_at?: string | null
          locked_until?: string | null
          login_attempts?: number | null
          password_hash?: string | null
          password_reset_expires_at?: string | null
          password_reset_token?: string | null
          plan_type?: Database["public"]["Enums"]["plan_type"]
          razorpay_customer_id?: string | null
          reddit_access_token?: string | null
          reddit_connected_at?: string | null
          reddit_refresh_token?: string | null
          reddit_token_expires_at?: string | null
          reddit_username?: string | null
          stripe_customer_id?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_auth_data: { Args: never; Returns: undefined }
    }
    Enums: {
      plan_type: "free" | "pro_monthly" | "pro_yearly"
      subscription_status: "trial" | "active" | "inactive" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      plan_type: ["free", "pro_monthly", "pro_yearly"],
      subscription_status: ["trial", "active", "inactive", "cancelled"],
    },
  },
} as const

// Helper types for Reddit posts
export type RedditPost = Database['public']['Tables']['reddit_posts']['Row']
export type RedditPostInsert = Database['public']['Tables']['reddit_posts']['Insert']
export type RedditPostUpdate = Database['public']['Tables']['reddit_posts']['Update']

// Helper types for startup ideas
export type StartupIdea = Database['public']['Tables']['startup_ideas']['Row']
export type StartupIdeaInsert = Database['public']['Tables']['startup_ideas']['Insert']
export type StartupIdeaUpdate = Database['public']['Tables']['startup_ideas']['Update']

// Helper types for users
export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

// Helper types for usage limits
export type UsageLimits = Database['public']['Tables']['usage_limits']['Row']
export type UsageLimitsInsert = Database['public']['Tables']['usage_limits']['Insert']
export type UsageLimitsUpdate = Database['public']['Tables']['usage_limits']['Update']

// Helper types for reddit contacts (Epic 2: Human Discovery)
export type RedditContact = Database['public']['Tables']['reddit_contacts']['Row']
export type RedditContactInsert = Database['public']['Tables']['reddit_contacts']['Insert']
export type RedditContactUpdate = Database['public']['Tables']['reddit_contacts']['Update']

// Plan and subscription types
export type PlanType = Database['public']['Enums']['plan_type']
export type SubscriptionStatus = Database['public']['Enums']['subscription_status']
