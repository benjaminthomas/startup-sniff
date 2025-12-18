import { z } from 'zod';

/**
 * Schema for activating user subscriptions (admin only)
 */
export const activateSubscriptionSchema = z.object({
  email: z.string().email('Invalid email format').min(1, 'Email is required'),
  planType: z.enum(['pro_monthly', 'pro_yearly'], {
    errorMap: () => ({ message: 'Plan type must be pro_monthly or pro_yearly' })
  })
});

export type ActivateSubscriptionInput = z.infer<typeof activateSubscriptionSchema>;

/**
 * Schema for verifying Razorpay payments
 */
export const verifyPaymentSchema = z.object({
  razorpay_payment_id: z.string()
    .min(1, 'Payment ID is required')
    .regex(/^pay_[a-zA-Z0-9]+$/, 'Invalid Razorpay payment ID format'),
  razorpay_subscription_id: z.string()
    .min(1, 'Subscription ID is required')
    .regex(/^sub_[a-zA-Z0-9]+$/, 'Invalid Razorpay subscription ID format'),
  razorpay_signature: z.string()
    .min(1, 'Signature is required')
    .min(64, 'Invalid signature format')
});

export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;

/**
 * Schema for Reddit fetch API parameters
 */
export const redditFetchSchema = z.object({
  mode: z.enum(['high-priority', 'low-priority', 'all'])
    .default('high-priority')
    .describe('Fetch mode for Reddit posts'),
  subreddits: z.array(z.string().min(1))
    .nullable()
    .default(null)
    .describe('Specific subreddits to fetch from, or null for all'),
  limit: z.number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(25)
    .describe('Maximum number of posts to fetch')
});

export type RedditFetchInput = z.infer<typeof redditFetchSchema>;

/**
 * Schema for clearing database (admin only)
 */
export const clearDatabaseSchema = z.object({
  confirm: z.literal(true, {
    errorMap: () => ({ message: 'Must explicitly confirm database clearing' })
  }),
  tables: z.array(z.string()).optional()
    .describe('Specific tables to clear, or omit to clear all')
});

export type ClearDatabaseInput = z.infer<typeof clearDatabaseSchema>;

/**
 * Helper function to validate request body with Zod schema
 * Returns validated data or throws with formatted error
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formatted = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new Error(`Validation failed: ${formatted}`);
    }
    throw error;
  }
}
