'use server'

/**
 * Email Preferences Actions
 * Epic 2, Story 2.9: Email Notifications and Engagement
 *
 * Server actions for managing user email preferences
 */

import { getCurrentSession } from '@/modules/auth/services/jwt'
import { createServerAdminClient } from '@/modules/supabase/server'

export interface EmailPreferences {
  marketing: boolean
  product_updates: boolean
  weekly_summary: boolean
  message_confirmations: boolean
  onboarding: boolean
}

/**
 * Get current user's email preferences
 */
export async function getEmailPreferencesAction(): Promise<{
  success: boolean
  preferences?: EmailPreferences
  error?: string
}> {
  try {
    const session = await getCurrentSession()
    if (!session) {
      return {
        success: false,
        error: 'Not authenticated',
      }
    }

    const supabase = createServerAdminClient()

    const { data, error } = await supabase
      .from('users')
      .select('email_preferences')
      .eq('id', session.userId)
      .single()

    if (error) {
      console.error('Failed to get email preferences:', error)
      return {
        success: false,
        error: 'Failed to load preferences',
      }
    }

    // Return preferences or defaults
    const preferences = data?.email_preferences || {
      marketing: true,
      product_updates: true,
      weekly_summary: true,
      message_confirmations: true,
      onboarding: true,
    }

    return {
      success: true,
      preferences: preferences as unknown as EmailPreferences,
    }
  } catch (error) {
    console.error('Error in getEmailPreferencesAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Update user's email preferences
 */
export async function updateEmailPreferencesAction(
  preferences: EmailPreferences
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const session = await getCurrentSession()
    if (!session) {
      return {
        success: false,
        error: 'Not authenticated',
      }
    }

    const supabase = createServerAdminClient()

    const { error } = await supabase
      .from('users')
      .update({
        email_preferences: preferences as unknown as Record<string, boolean>,
      })
      .eq('id', session.userId)

    if (error) {
      console.error('Failed to update email preferences:', error)
      return {
        success: false,
        error: 'Failed to save preferences',
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in updateEmailPreferencesAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Unsubscribe user from all emails
 */
export async function unsubscribeFromAllEmailsAction(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const session = await getCurrentSession()
    if (!session) {
      return {
        success: false,
        error: 'Not authenticated',
      }
    }

    const supabase = createServerAdminClient()

    const { error } = await supabase
      .from('users')
      .update({
        email_unsubscribed: true,
      })
      .eq('id', session.userId)

    if (error) {
      console.error('Failed to unsubscribe from emails:', error)
      return {
        success: false,
        error: 'Failed to unsubscribe',
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in unsubscribeFromAllEmailsAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Check if user can receive specific email type
 * Used by email notification services to respect preferences
 */
export async function canSendEmailAction(
  emailType: keyof EmailPreferences
): Promise<{
  canSend: boolean
  error?: string
}> {
  try {
    const session = await getCurrentSession()
    if (!session) {
      return {
        canSend: false,
        error: 'Not authenticated',
      }
    }

    const supabase = createServerAdminClient()

    const { data, error } = await supabase
      .from('users')
      .select('email_preferences, email_unsubscribed')
      .eq('id', session.userId)
      .single()

    if (error) {
      console.error('Failed to check email preferences:', error)
      return {
        canSend: false,
        error: 'Failed to check preferences',
      }
    }

    // Check if user has unsubscribed from all emails
    if (data?.email_unsubscribed) {
      return {
        canSend: false,
      }
    }

    // Check specific preference
    const preferences = (data?.email_preferences || {}) as unknown as EmailPreferences
    const canSend = preferences[emailType] !== false // Default to true if not set

    return {
      canSend,
    }
  } catch (error) {
    console.error('Error in canSendEmailAction:', error)
    return {
      canSend: false,
      error: 'An unexpected error occurred',
    }
  }
}
