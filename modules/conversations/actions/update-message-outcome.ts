/**
 * Update Message Outcome Action
 * Epic 2, Story 2.6: Conversation Tracking Dashboard
 *
 * Allows users to manually log conversation outcomes
 */

'use server'

import { createServerAdminClient } from '@/modules/supabase/server'
import { getCurrentSession } from '@/modules/auth/services/jwt'
import { revalidatePath } from 'next/cache'

type OutcomeType = 'replied' | 'call_scheduled' | 'customer_acquired' | 'dead_end' | null

interface UpdateOutcomeResult {
  success: boolean
  error?: string
}

export async function updateMessageOutcomeAction(
  messageId: string,
  outcome: OutcomeType
): Promise<UpdateOutcomeResult> {
  try {
    console.log('[update-outcome] Updating message:', messageId, 'to outcome:', outcome)

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

    if (fetchError || !message) {
      console.error('[update-outcome] Message not found:', fetchError)
      return {
        success: false,
        error: 'Message not found'
      }
    }

    if (message.user_id !== session.userId) {
      console.error('[update-outcome] Unauthorized access attempt')
      return {
        success: false,
        error: 'Unauthorized'
      }
    }

    // Only allow updating outcomes for sent messages
    if (message.send_status !== 'sent') {
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
      outcome,
      updated_at: new Date().toISOString()
    }

    // Set replied_at timestamp when outcome is set to replied
    if (outcome === 'replied' && !message.replied_at) {
      updateData.replied_at = new Date().toISOString()
    } else if (outcome === null) {
      // Clear replied_at when outcome is cleared
      updateData.replied_at = null
    }

    const { error: updateError } = await supabase
      .from('messages')
      .update(updateData)
      .eq('id', messageId)

    if (updateError) {
      console.error('[update-outcome] Update failed:', updateError)
      return {
        success: false,
        error: 'Failed to update outcome'
      }
    }

    console.log('[update-outcome] Successfully updated outcome')

    // Revalidate the conversations page to show updated data
    revalidatePath('/dashboard/conversations')

    return {
      success: true
    }
  } catch (error) {
    console.error('[update-outcome] Unexpected error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred'
    }
  }
}
