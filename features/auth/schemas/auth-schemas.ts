import { z } from 'zod'

/**
 * Authentication Validation Schemas
 */

export const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address').max(255, 'Email too long').toLowerCase().trim(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password too long'),
  fullName: z.string().min(1, 'Full name is required').max(100, 'Name too long').trim(),
  csrfToken: z.string(),
})

export const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address').max(255, 'Email too long').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
  csrfToken: z.string(),
  rememberMe: z.boolean().optional(),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address').max(255, 'Email too long').toLowerCase().trim(),
  csrfToken: z.string(),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password too long'),
  csrfToken: z.string(),
})
