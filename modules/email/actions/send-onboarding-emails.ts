/**
 * Onboarding Email Actions
 * Story 2.9: Email Notifications and Engagement
 *
 * Server actions for sending onboarding drip campaign emails
 */

/* eslint-disable @typescript-eslint/ban-ts-comment */

'use server'

import { sendEmail } from '@/lib/email/mailgun-client'
import { renderEmailToHtml } from '@/lib/email/render'
import { OnboardingDay1Email } from '@/lib/email/templates/onboarding-day-1'
import { OnboardingDay3Email } from '@/lib/email/templates/onboarding-day-3'
import { OnboardingDay7Email } from '@/lib/email/templates/onboarding-day-7'
import { createServerSupabaseClient as createClient } from '@/modules/supabase/server'
import { createElement } from 'react'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://startupsniff.com'

/**
 * Send Day 1 onboarding email (welcome)
 */
export async function sendOnboardingDay1Email(userId: string) {
  try {
    const supabase = await createClient()

    // Get user details
    const { data: user, error } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', userId)
      .single()

    if (error || !user) {
      console.error('[onboarding-day-1] User not found:', error)
      return { success: false, error: 'User not found' }
    }

    // Render email template
    const emailComponent = createElement(OnboardingDay1Email, {
      userName: user.full_name || user.email.split('@')[0],
      dashboardUrl: `${BASE_URL}/dashboard`
    })
    const html = await renderEmailToHtml(emailComponent)

    // Send email
    const result = await sendEmail({
      to: user.email,
      subject: 'Welcome to StartupSniff! 🎉',
      html,
      tags: ['onboarding', 'day-1'],
      variables: {
        user_id: userId,
        campaign: 'onboarding-day-1'
      }
    })

    if (result.success) {
      // Track email sent
      // @ts-ignore - email_logs table will be created by migration
      await supabase.from('email_logs').insert({
        user_id: userId,
        email_type: 'onboarding_day_1',
        sent_at: new Date().toISOString(),
        mailgun_id: result.messageId
      })

      console.log('[onboarding-day-1] Email sent successfully:', user.email)
    }

    return result
  } catch (error) {
    console.error('[onboarding-day-1] Failed to send email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Send Day 3 onboarding email (tips)
 */
export async function sendOnboardingDay3Email(userId: string) {
  try {
    const supabase = await createClient()

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      console.error('[onboarding-day-3] User not found:', userError)
      return { success: false, error: 'User not found' }
    }

    // Get user's activity metrics (fallback to 0 if table doesn't exist yet)
    const { data: analytics } = await (supabase as any)
      .from('user_analytics')
      .select('opportunities_viewed')
      .eq('user_id', userId)
      .single()

    const opportunitiesViewedCount = analytics?.opportunities_viewed || 0

    // Render email template
    const emailComponent = createElement(OnboardingDay3Email, {
      userName: user.full_name || user.email.split('@')[0],
      opportunitiesViewedCount,
      dashboardUrl: `${BASE_URL}/dashboard`
    })
    const html = await renderEmailToHtml(emailComponent)

    // Send email
    const result = await sendEmail({
      to: user.email,
      subject: 'Day 3: How to Spot Gold 🏆',
      html,
      tags: ['onboarding', 'day-3'],
      variables: {
        user_id: userId,
        campaign: 'onboarding-day-3',
        opportunities_viewed: String(opportunitiesViewedCount)
      }
    })

    if (result.success) {
      // Track email sent
      // @ts-ignore - email_logs table will be created by migration
      await supabase.from('email_logs').insert({
        user_id: userId,
        email_type: 'onboarding_day_3',
        sent_at: new Date().toISOString(),
        mailgun_id: result.messageId
      })

      console.log('[onboarding-day-3] Email sent successfully:', user.email)
    }

    return result
  } catch (error) {
    console.error('[onboarding-day-3] Failed to send email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Send Day 7 onboarding email (success stories + upgrade)
 */
export async function sendOnboardingDay7Email(userId: string) {
  try {
    const supabase = await createClient()

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      console.error('[onboarding-day-7] User not found:', userError)
      return { success: false, error: 'User not found' }
    }

    // Get user's messaging metrics
    const { data: messages } = await supabase
      .from('messages')
      .select('outcome')
      .eq('user_id', userId)

    const messagesSent = messages?.length || 0
    const repliesReceived = messages?.filter(m => m.outcome && m.outcome !== 'draft').length || 0

    // Render email template
    const emailComponent = createElement(OnboardingDay7Email, {
      userName: user.full_name || user.email.split('@')[0],
      messagesSent,
      repliesReceived,
      dashboardUrl: `${BASE_URL}/dashboard`,
      upgradeUrl: `${BASE_URL}/dashboard/billing`
    })
    const html = await renderEmailToHtml(emailComponent)

    // Send email
    const result = await sendEmail({
      to: user.email,
      subject: 'Week 1 Complete! 🎊 (Plus a special offer)',
      html,
      tags: ['onboarding', 'day-7', 'upgrade-cta'],
      variables: {
        user_id: userId,
        campaign: 'onboarding-day-7',
        messages_sent: String(messagesSent),
        replies_received: String(repliesReceived)
      }
    })

    if (result.success) {
      // Track email sent
      // @ts-ignore - email_logs table will be created by migration
      await supabase.from('email_logs').insert({
        user_id: userId,
        email_type: 'onboarding_day_7',
        sent_at: new Date().toISOString(),
        mailgun_id: result.messageId
      })

      console.log('[onboarding-day-7] Email sent successfully:', user.email)
    }

    return result
  } catch (error) {
    console.error('[onboarding-day-7] Failed to send email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Trigger onboarding sequence for a new user
 * This should be called when a user completes registration
 */
export async function triggerOnboardingSequence(userId: string) {
  try {
    const supabase = await createClient()

    // Send Day 1 email immediately
    await sendOnboardingDay1Email(userId)

    // Schedule Day 3 and Day 7 emails in database
    const now = new Date()
    const day3 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) // 3 days
    const day7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // @ts-ignore - scheduled_emails table will be created by migration
    await supabase.from('scheduled_emails').insert([
      {
        user_id: userId,
        email_type: 'onboarding_day_3',
        scheduled_for: day3.toISOString()
      },
      {
        user_id: userId,
        email_type: 'onboarding_day_7',
        scheduled_for: day7.toISOString()
      }
    ])

    console.log('[onboarding-sequence] Onboarding emails scheduled for user:', userId)

    return { success: true }
  } catch (error) {
    console.error('[onboarding-sequence] Failed to trigger sequence:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
