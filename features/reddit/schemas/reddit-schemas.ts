import { z } from 'zod';

/**
 * Reddit Schemas
 * Validation schemas for Reddit-related operations
 */

/**
 * Pagination validation schema
 * SECURITY: Prevents DoS attacks from extreme values
 */
export const paginationSchema = z.object({
  page: z.number().int().min(1).max(1000),
  limit: z.number().int().min(1).max(100)
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/**
 * Send Reddit message request schema
 */
export const sendRedditMessageSchema = z.object({
  messageId: z.string().uuid('Invalid message ID format'),
  editedText: z.string().min(1).max(10000).optional()
});

export type SendRedditMessageInput = z.infer<typeof sendRedditMessageSchema>;

/**
 * Discover contacts request schema
 */
export const discoverContactsSchema = z.object({
  painPointId: z.string().uuid('Invalid pain point ID format'),
  pagination: paginationSchema.optional()
});

export type DiscoverContactsInput = z.infer<typeof discoverContactsSchema>;

/**
 * Reddit post scoring schema
 */
export const redditPostScoreSchema = z.object({
  postId: z.string().min(1),
  subreddit: z.string().min(1).max(100),
  title: z.string().min(1).max(500),
  content: z.string().max(40000).nullable(),
  score: z.number().int().min(0),
  comments: z.number().int().min(0),
  author: z.string().min(1).max(100),
  created_utc: z.string().datetime()
});

export type RedditPostScore = z.infer<typeof redditPostScoreSchema>;

/**
 * Reddit contact validation schema
 */
export const redditContactSchema = z.object({
  reddit_username: z.string().min(1).max(100),
  reddit_post_id: z.string().min(1),
  contact_score: z.number().min(0).max(100).nullable(),
  reddit_karma: z.number().int().min(0).nullable(),
  account_age_days: z.number().int().min(0).nullable(),
  post_frequency: z.number().min(0).nullable(),
  relevance_score: z.number().min(0).max(100).nullable(),
  engagement_score: z.number().min(0).max(100),
  posting_frequency: z.number().min(0).nullable()
});

export type RedditContactInput = z.infer<typeof redditContactSchema>;
