'use server'

/**
 * Send Welcome Email Action
 *
 * Server action to send welcome email to new users
 */

import { sendWelcomeEmail, type WelcomeEmailData } from '../services/email-notifications'

export async function sendWelcomeEmailAction(
  data: WelcomeEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    await sendWelcomeEmail(data)
    return { success: true }
  } catch (error) {
    console.error('Failed to send welcome email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send welcome email'
    }
  }
}
