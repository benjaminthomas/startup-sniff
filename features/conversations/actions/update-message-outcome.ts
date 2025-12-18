/**
 * Update Message Outcome Action
 * Epic 2, Story 2.6: Conversation Tracking Dashboard
 *
 * Allows users to manually log conversation outcomes
 */

'use server'

import { createServerAdminClient } from '@/features/supabase/server'
import { getCurrentSession } from '@/features/auth/services/jwt'
import { revalidatePath } from 'next/cache'
import { log } from '@/lib/logger'
import { messageOutcomeSchema, type MessageOutcome } from '@/features/conversations/schemas/conversation-schemas'

type OutcomeType = MessageOutcome

interface UpdateOutcomeResult {
  success: boolean
  error?: string
}

export async function updateMessageOutcomeAction(
  messageId: string,
  outcome: OutcomeType
): Promise<UpdateOutcomeResult> {
  try {
    log.info('[update-outcome] Updating message to outcome', { messageId, outcome })

    // Validate outcome parameter (Security: VULN-003)
    const validationResult = messageOutcomeSchema.safeParse(outcome)
    if (!validationResult.success) {
      log.warn('[update-outcome] Invalid outcome parameter', {
        outcome,
        errors: validationResult.error.errors
      })
      return {
        success: false,
        error: 'Invalid outcome value'
      }
    }

    const validatedOutcome = validationResult.data

    // Authenticate user
    const session = await getCurrentSession()
    if (!session) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    const supabase = createServerAdminClient()

    // Verify message belongs to user
    const { data: message, error: fetchError } = await supabase
      .from('messages')
      .select('id, user_id, send_status, replied_at')
      .eq('id', messageId)
      .single()

    const typedMessage = message as { id: string; user_id: string; send_status: string; replied_at: string | null } | null;

    if (fetchError || !typedMessage) {
      log.error('[update-outcome] Message not found:', fetchError)
      return {
        success: false,
        error: 'Message not found'
      }
    }

    if (typedMessage.user_id !== session.userId) {
      log.error('[update-outcome] Unauthorized access attempt')
      return {
        success: false,
        error: 'Unauthorized'
      }
    }

    // Only allow updating outcomes for sent messages
    if (typedMessage.send_status !== 'sent') {
      return {
        success: false,
        error: 'Can only update outcomes for sent messages'
      }
    }

    // Update the outcome
    const updateData: {
      outcome: OutcomeType
      replied_at?: string | null
      updated_at: string
    } = {
      outcome: validatedOutcome,
      updated_at: new Date().toISOString()
    }

    // Set replied_at timestamp when outcome is set to replied
    if (validatedOutcome === 'replied' && !typedMessage.replied_at) {
      updateData.replied_at = new Date().toISOString()
    } else if (validatedOutcome === null) {
      // Clear replied_at when outcome is cleared
      updateData.replied_at = null
    }

    const { error: updateError } = await supabase
      .from('messages' as never)
      .update(updateData as never)
      .eq('id', messageId)

    if (updateError) {
      log.error('[update-outcome] Update failed:', updateError)
      return {
        success: false,
        error: 'Failed to update outcome'
      }
    }

    log.info('[update-outcome] Successfully updated outcome')

    // Revalidate the conversations page to show updated data
    revalidatePath('/dashboard/conversations')

    return {
      success: true
    }
  } catch (error) {
    log.error('[update-outcome] Unexpected error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred'
    }
  }
}
