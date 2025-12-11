/**
 * Update Email Preferences Action
 * Story 2.9: Email Notifications and Engagement
 *
 * Server action for updating user email preferences
 *
 * SECURITY: This action now properly validates that the authenticated user
 * matches the user whose preferences are being updated. No longer accepts
 * arbitrary userId parameter.
 */

'use server'

import { z } from 'zod'
import { getCurrentSession } from '@/features/auth/services/jwt'
import { createServerSupabaseClient as createClient } from '@/features/supabase/server'
import { log } from '@/lib/logger'

export interface EmailPreferences {
  onboarding?: boolean
  weekly_summary?: boolean
  product_updates?: boolean
  marketing?: boolean
  message_confirmations?: boolean
}

/**
 * Zod schema for email preferences validation
 * Ensures only valid boolean values are accepted
 */
const emailPreferencesSchema = z.object({
  onboarding: z.boolean().optional(),
  weekly_summary: z.boolean().optional(),
  product_updates: z.boolean().optional(),
  marketing: z.boolean().optional(),
  message_confirmations: z.boolean().optional()
}).strict() // Reject any extra fields

/**
 * Update user's email preferences
 *
 * SECURITY FIX: Removed userId parameter to prevent privilege escalation.
 * Now uses authenticated session userId only.
 *
 * @param preferences - Email preference settings to update
 * @returns Success status with optional error message
 */
export async function updateEmailPreferences(
  preferences: EmailPreferences
) {
  try {
    // Verify authentication
    const session = await getCurrentSession()

    if (!session) {
      log.warn('[update-preferences] Unauthenticated access attempt')
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    // Validate preferences structure with Zod
    const validationResult = emailPreferencesSchema.safeParse(preferences)

    if (!validationResult.success) {
      log.warn('[update-preferences] Invalid preferences format', {
        userId: session.userId,
        errors: validationResult.error.errors
      })
      return {
        success: false,
        error: 'Invalid preferences format'
      }
    }

    const validatedPreferences = validationResult.data

    const supabase = await createClient()

    // Update preferences using authenticated user's ID
    const { error } = await supabase
      .from('users')
      .update({ email_preferences: validatedPreferences })
      .eq('id', session.userId) // Use session userId, not parameter

    if (error) {
      log.error('[update-preferences] Database error', error, {
        userId: session.userId
      })
      return {
        success: false,
        error: 'Failed to update preferences'
      }
    }

    log.info('[update-preferences] Preferences updated successfully', {
      userId: session.userId
    })

    return { success: true }
  } catch (error) {
    log.error('[update-preferences] Unexpected error', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get user's email preferences
 *
 * SECURITY FIX: Removed userId parameter to prevent unauthorized access.
 * Now uses authenticated session userId only.
 *
 * @returns User's email preferences or default values
 */
export async function getEmailPreferences() {
  try {
    // Verify authentication
    const session = await getCurrentSession()

    if (!session) {
      log.warn('[get-preferences] Unauthenticated access attempt')
      return {
        success: false,
        error: 'Authentication required',
        preferences: null
      }
    }

    const supabase = await createClient()

    // Fetch preferences using authenticated user's ID
    const { data, error } = await supabase
      .from('users')
      .select('email_preferences')
      .eq('id', session.userId) // Use session userId, not parameter
      .single()

    if (error) {
      log.error('[get-preferences] Database error', error, {
        userId: session.userId
      })
      return {
        success: false,
        error: 'Failed to fetch preferences',
        preferences: null
      }
    }

    return {
      success: true,
      preferences: (data.email_preferences as EmailPreferences) || {
        onboarding: true,
        weekly_summary: true,
        product_updates: true,
        marketing: false,
        message_confirmations: true
      }
    }
  } catch (error) {
    log.error('[get-preferences] Unexpected error', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      preferences: null
    }
  }
}
