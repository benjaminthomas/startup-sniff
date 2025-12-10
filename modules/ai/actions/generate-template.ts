'use server'

import { getCurrentSession } from '@/modules/auth/services/jwt'
import { createServerAdminClient } from '@/modules/supabase/server'
import { generateMessageTemplate } from '../services/template-generator'
import type { TemplateVariant } from '@/lib/constants/template-variants'
import { log } from '@/lib/logger'

/**
 * Epic 2, Story 2.3: AI Message Templates
 *
 * Server action to generate personalized message templates for contacts
 */

interface GenerateTemplateResult {
  success: boolean
  messageId?: string
  template?: string
  tokensUsed?: number
  error?: string
}

export async function generateTemplateAction(
  contactId: string,
  variant: TemplateVariant = 'professional'
): Promise<GenerateTemplateResult> {
  try {
    // Check authentication
    const session = await getCurrentSession()
    if (!session) {
      return {
        success: false,
        error: 'Not authenticated'
      }
    }

    const supabase = createServerAdminClient()

    // Get contact details
    const { data: contact, error: contactError } = await supabase
      .from('reddit_contacts')
      .select('*')
      .eq('id', contactId)
      .single()

    if (contactError || !contact) {
      log.error('[generate-template] Contact not found:', contactId)
      return {
        success: false,
        error: 'Contact not found'
      }
    }

    // Get pain point details
    const { data: painPoint, error: painPointError } = await supabase
      .from('reddit_posts')
      .select('id, title, content')
      .eq('id', contact.pain_point_id)
      .single()

    if (painPointError || !painPoint) {
      log.error('[generate-template] Pain point not found:', contact.pain_point_id)
      return {
        success: false,
        error: 'Pain point not found'
      }
    }

    log.info(`[generate-template] Generating ${variant} template for contact ${contactId}`)

    // Check if template already exists for this contact + variant (within last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: existingMessage } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', session.userId)
      .eq('contact_id', contactId)
      .eq('template_variant', variant)
      .eq('send_status', 'draft')
      .gte('created_at', oneHourAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existingMessage) {
      log.info('[generate-template] Returning cached template from last hour')
      return {
        success: true,
        messageId: existingMessage.id,
        template: existingMessage.message_text,
        tokensUsed: 0 // Cached, no tokens used
      }
    }

    // Generate template using AI
    const generationResult = await generateMessageTemplate({
      contact,
      painPointTitle: painPoint.title,
      painPointContent: painPoint.content,
      variant
    })

    if (!generationResult.success || !generationResult.template) {
      return {
        success: false,
        error: generationResult.error || 'Failed to generate template'
      }
    }

    // Store template in database as draft
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        user_id: session.userId,
        pain_point_id: painPoint.id,
        contact_id: contactId,
        reddit_username: contact.reddit_username,
        template_variant: variant,
        message_text: generationResult.template,
        send_status: 'draft'
      })
      .select()
      .single()

    if (insertError || !message) {
      log.error('[generate-template] Failed to save template:', insertError)
      // Still return the template even if save failed
      return {
        success: true,
        template: generationResult.template,
        tokensUsed: generationResult.tokensUsed,
        error: 'Template generated but failed to save'
      }
    }

    log.info(`[generate-template] Successfully generated and saved template ${message.id}`)

    return {
      success: true,
      messageId: message.id,
      template: message.message_text,
      tokensUsed: generationResult.tokensUsed
    }
  } catch (error) {
    log.error('[generate-template] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Generate all 4 template variants for a contact
 */
export async function generateAllTemplateVariantsAction(
  contactId: string
): Promise<Record<TemplateVariant, GenerateTemplateResult>> {
  const variants: TemplateVariant[] = ['professional', 'casual', 'concise', 'value_first']

  const results = await Promise.all(
    variants.map(variant => generateTemplateAction(contactId, variant))
  )

  return {
    professional: results[0],
    casual: results[1],
    concise: results[2],
    value_first: results[3]
  }
}
