export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
          id: string
          plan_type: Database["public"]["Enums"]["plan_type"]
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
          id?: string
          plan_type: Database["public"]["Enums"]["plan_type"]
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
          id?: string
          plan_type?: Database["public"]["Enums"]["plan_type"]
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
          created_at: string
          id: string
          ideas_generated: number | null
          monthly_limit_ideas: number
          monthly_limit_validations: number
          plan_type: Database["public"]["Enums"]["plan_type"]
          reset_date: string
          updated_at: string
          user_id: string
          validations_completed: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          ideas_generated?: number | null
          monthly_limit_ideas: number
          monthly_limit_validations: number
          plan_type: Database["public"]["Enums"]["plan_type"]
          reset_date?: string
          updated_at?: string
          user_id: string
          validations_completed?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          ideas_generated?: number | null
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
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          plan_type: Database["public"]["Enums"]["plan_type"] | null
          stripe_customer_id: string | null
          subscription_status: Database["public"]["Enums"]["subscription_status"] | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          plan_type?: Database["public"]["Enums"]["plan_type"] | null
          stripe_customer_id?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"] | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          plan_type?: Database["public"]["Enums"]["plan_type"] | null
          stripe_customer_id?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"] | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      plan_type: "explorer" | "founder" | "growth"
      subscription_status: "trial" | "active" | "inactive" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}