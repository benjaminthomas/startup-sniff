/**
 * Update Email Preferences Action
 * Story 2.9: Email Notifications and Engagement
 *
 * Server action for updating user email preferences
 */

'use server'

import { createServerSupabaseClient as createClient } from '@/modules/supabase/server'
import { log } from '@/lib/logger'

export interface EmailPreferences {
  onboarding?: boolean
  weekly_summary?: boolean
  product_updates?: boolean
  marketing?: boolean
  message_confirmations?: boolean
}

/**
 * Update user's email preferences
 */
export async function updateEmailPreferences(
  userId: string,
  preferences: EmailPreferences
) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('users')
      .update({ email_preferences: preferences as any })
      .eq('id', userId)

    if (error) {
      log.error('[update-preferences] Failed to update', error)
      return {
        success: false,
        error: 'Failed to update preferences'
      }
    }

    log.info('[update-preferences] Preferences updated successfully', { userId })

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
 */
export async function getEmailPreferences(userId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('users')
      .select('email_preferences')
      .eq('id', userId)
      .single()

    if (error) {
      log.error('[get-preferences] Failed to fetch', error)
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
