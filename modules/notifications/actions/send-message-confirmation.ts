'use server'

/**
 * Send Message Confirmation Email Action
 *
 * Server action to send confirmation after Reddit messages are sent
 */

import { sendMessageConfirmation, type MessageConfirmationData } from '../services/email-notifications'

export async function sendMessageConfirmationAction(
  data: MessageConfirmationData
): Promise<{ success: boolean; error?: string }> {
  try {
    await sendMessageConfirmation(data)
    return { success: true }
  } catch (error) {
    console.error('Failed to send message confirmation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send confirmation email'
    }
  }
}
