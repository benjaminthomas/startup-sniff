export type PlanType = 'explorer' | 'founder' | 'growth';
export type SubscriptionStatus = 'trial' | 'active' | 'inactive' | 'cancelled';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  subscription_status?: SubscriptionStatus;
  plan_type?: PlanType;
  stripe_customer_id?: string;
  trial_ends_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UsageLimits {
  id: string;
  user_id: string;
  plan_type: PlanType;
  ideas_generated: number;
  validations_completed: number;
  monthly_limit_ideas: number;
  monthly_limit_validations: number;
  reset_date: string;
  created_at: string;
  updated_at: string;
}

export interface TargetMarket {
  demographic: string;
  size: string;
  pain_level: number;
}

export interface Solution {
  value_proposition: string;
  features: string[];
  business_model: string;
}

export interface MarketAnalysis {
  competition_level: string;
  timing: string;
  barriers: string[];
}

export interface Implementation {
  complexity: number;
  mvp: string;
  time_to_market: string;
}

export interface SuccessMetrics {
  probability_score: number;
  risk_factors: string[];
}

export interface StartupIdea {
  id: string;
  user_id: string;
  title: string;
  problem_statement: string;
  target_market: TargetMarket;
  solution: Solution;
  market_analysis: MarketAnalysis;
  implementation: Implementation;
  success_metrics: SuccessMetrics;
  ai_confidence_score?: number;
  source_data?: {
    pain_point_sources?: string[];
    research_urls?: string[];
    [key: string]: unknown;
  };
  is_validated?: boolean;
  validation_data?: {
    market_size?: {
      tam?: number;
      sam?: number;
    };
    revenue_potential?: {
      monthly?: number;
      annual?: number;
    };
    validation_score?: number;
    [key: string]: unknown;
  };
  is_favorite?: boolean;
  created_at: string;
  updated_at: string;
}

export interface GeneratedContent {
  id: string;
  user_id: string;
  startup_idea_id?: string;
  content_type: 'blog_post' | 'tweet' | 'email' | 'landing_page';
  title: string;
  content: string;
  brand_voice?: string;
  seo_keywords?: string[];
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id?: string;
  stripe_price_id: string;
  status?: SubscriptionStatus;
  plan_type: PlanType;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  created_at: string;
  updated_at: string;
}

export interface PricingPlan {
  id: PlanType;
  name: string;
  price: number;
  priceId: string;
  features: string[];
  limits: {
    ideas: number;
    validations: number;
  };
  popular?: boolean;
}

export interface AIIdeaGeneration {
  problem_statement: string;
  target_market: TargetMarket;
  solution: Solution;
  market_analysis: MarketAnalysis;
  implementation: Implementation;
  success_metrics: SuccessMetrics;
}

export interface RedditPost {
  id: string;
  title: string;
  content: string;
  subreddit: string;
  score: number;
  num_comments: number;
  created_at: string;
  url: string;
}

export interface MarketValidation {
  tam_sam_estimates: {
    tam: string;
    sam: string;
  };
  growth_rates: {
    annual: number;
    seasonal_trends: string[];
  };
  competitors: {
    name: string;
    description: string;
    gaps: string[];
  }[];
  icp: {
    demographics: string;
    cac: number;
    clv: number;
  };
  pricing_strategy: {
    model: string;
    price_range: string;
  };
  go_to_market: string[];
  risk_assessment: {
    market_risks: string[];
    technical_risks: string[];
    competitive_risks: string[];
  };
  confidence_score: number;
  justification: string;
}