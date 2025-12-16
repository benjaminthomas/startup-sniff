import { z } from 'zod';

/**
 * Email Schemas
 * Validation schemas for email-related operations
 */

/**
 * Email preferences validation schema
 * Ensures only valid boolean values are accepted for each preference
 */
export const emailPreferencesSchema = z.object({
  onboarding: z.boolean().optional(),
  weekly_summary: z.boolean().optional(),
  product_updates: z.boolean().optional(),
  marketing: z.boolean().optional(),
  message_confirmations: z.boolean().optional()
}).strict(); // Reject any extra fields

export type EmailPreferences = z.infer<typeof emailPreferencesSchema>;

/**
 * Weekly summary email data schema
 */
export const weeklySummaryDataSchema = z.object({
  messages_sent: z.number().int().min(0),
  replies_received: z.number().int().min(0),
  new_opportunities: z.number().int().min(0),
  top_performing_messages: z.array(z.object({
    id: z.string(),
    reddit_username: z.string(),
    outcome: z.enum(['replied', 'call_scheduled', 'customer_acquired', 'dead_end']).nullable()
  })).optional()
});

export type WeeklySummaryData = z.infer<typeof weeklySummaryDataSchema>;

/**
 * Onboarding email step schema
 */
export const onboardingStepSchema = z.enum([
  'welcome',
  'connect_reddit',
  'first_opportunity',
  'send_message',
  'track_conversation'
]);

export type OnboardingStep = z.infer<typeof onboardingStepSchema>;
