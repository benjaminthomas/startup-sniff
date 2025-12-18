import { z } from 'zod';

/**
 * Conversation Schemas
 * Validation schemas for conversation and message operations
 */

/**
 * Message outcome validation schema
 * Ensures only valid outcome values are accepted
 */
export const messageOutcomeSchema = z.enum([
  'replied',
  'call_scheduled',
  'customer_acquired',
  'dead_end'
]).nullable();

export type MessageOutcome = z.infer<typeof messageOutcomeSchema>;

/**
 * Send status validation schema
 */
export const sendStatusSchema = z.enum([
  'draft',
  'sent',
  'failed'
]).nullable();

export type SendStatus = z.infer<typeof sendStatusSchema>;

/**
 * Update message outcome request schema
 */
export const updateMessageOutcomeSchema = z.object({
  messageId: z.string().uuid('Invalid message ID format'),
  outcome: messageOutcomeSchema
});

export type UpdateMessageOutcomeInput = z.infer<typeof updateMessageOutcomeSchema>;

/**
 * Message filter schema for conversation list
 */
export const messageFilterSchema = z.object({
  status: sendStatusSchema.optional(),
  outcome: messageOutcomeSchema.optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  search: z.string().max(200).optional()
});

export type MessageFilter = z.infer<typeof messageFilterSchema>;
