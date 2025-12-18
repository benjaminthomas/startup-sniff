/**
 * Shared Component Types
 * Common interfaces for component props and data structures
 */

// ============================================================================
// Common Result Types
// ============================================================================

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// Idea Types
// ============================================================================

export interface IdeaCardData {
  id: string;
  title: string;
  problem_statement: string;
  target_market: {
    description: string;
    size: string;
  } | null;
  solution: {
    description: string;
    unique_value_proposition: string;
    revenue_model: string;
  } | null;
  implementation: {
    estimated_cost: string;
    time_to_market: string;
    next_steps: string | string[];
  } | null;
  validation_data: Record<string, unknown> | null;
  is_validated: boolean | null;
  is_favorite: boolean | null;
  ai_confidence_score: number | null;
  created_at: string;
}

// ============================================================================
// Message Types
// ============================================================================

export type MessageOutcome = 'replied' | 'call_scheduled' | 'customer_acquired' | 'dead_end' | null;
export type SendStatus = 'draft' | 'sent' | 'failed' | 'pending' | null;

export interface MessageContact {
  reddit_username: string;
  post_excerpt: string | null;
  karma: number | null;
  engagement_score: number;
}

export interface MessagePainPoint {
  reddit_id: string;
  title: string;
  subreddit: string;
}

export interface MessageCardData {
  id: string;
  reddit_username: string;
  message_text: string;
  template_variant: string | null;
  send_status: SendStatus;
  sent_at: string | null;
  outcome: MessageOutcome;
  replied_at: string | null;
  created_at: string | null;
  contact: MessageContact | null;
  pain_point: MessagePainPoint | null;
}

// ============================================================================
// Contact Types
// ============================================================================

export interface ContactCardData {
  id: string;
  reddit_username: string;
  contact_score: number | null;
  reddit_karma: number | null;
  account_age_days: number | null;
  post_frequency: number | null;
  relevance_score: number | null;
  engagement_score: number;
  post_excerpt: string | null;
  first_seen_at: string;
  last_seen_at: string;
  contacted_at: string | null;
  response_status: string | null;
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationButtonData {
  ideaId: string;
  isValidated: boolean;
}

// ============================================================================
// Billing Types
// ============================================================================

export interface PlanLimits {
  ideas: number;
  validations: number;
  content: number;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  priceId: string;
  billingCycle?: 'monthly' | 'yearly';
  features: string[];
  limits: PlanLimits;
  popular?: boolean;
  badge?: string;
}

// ============================================================================
// Action Handler Types (for Dependency Injection)
// ============================================================================

export type ToggleFavoriteHandler = (ideaId: string, currentState: boolean | null) => Promise<ActionResult<{ is_favorite: boolean }>>;
export type ValidateIdeaHandler = (ideaId: string) => Promise<ActionResult>;
export type UpdateMessageOutcomeHandler = (messageId: string, outcome: MessageOutcome) => Promise<ActionResult>;
export type GenerateTemplateHandler = (contactId: string, variant: string) => Promise<ActionResult<{ template: string; messageId: string }>>;
export type SendMessageHandler = (messageId: string, editedText?: string) => Promise<ActionResult<{ quotaRemaining: number }>>;
export type GetQuotaHandler = () => Promise<ActionResult<{ sent: number; remaining: number; limit: number }>>;
export type ConnectRedditHandler = () => Promise<ActionResult<{ authUrl: string }>>;
