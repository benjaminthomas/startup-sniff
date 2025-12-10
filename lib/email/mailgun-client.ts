/**
 * Mailgun Email Client
 * Story 2.9: Email Notifications and Engagement
 *
 * Wrapper around Mailgun.js for sending transactional and marketing emails
 */

import formData from 'form-data'
import Mailgun from 'mailgun.js'
import { log } from '@/lib/logger'

// Initialize Mailgun client
const mailgun = new Mailgun(formData)

const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY || '',
  url: process.env.MAILGUN_API_URL || 'https://api.mailgun.net', // EU: https://api.eu.mailgun.net
})

const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || ''
const FROM_EMAIL = process.env.MAILGUN_FROM_EMAIL || 'StartupSniff <noreply@startupsniff.com>'

/**
 * Validate Mailgun configuration
 */
export function validateMailgunConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!process.env.MAILGUN_API_KEY) {
    errors.push('MAILGUN_API_KEY is not set')
  }

  if (!process.env.MAILGUN_DOMAIN) {
    errors.push('MAILGUN_DOMAIN is not set')
  }

  if (!process.env.MAILGUN_FROM_EMAIL) {
    errors.push('MAILGUN_FROM_EMAIL is not set')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Send email using Mailgun
 */
export interface SendEmailParams {
  to: string
  subject: string
  html: string
  text?: string
  tags?: string[]
  variables?: Record<string, string>
}

export async function sendEmail(params: SendEmailParams): Promise<{
  success: boolean
  messageId?: string
  error?: string
}> {
  try {
    // Validate configuration
    const config = validateMailgunConfig()
    if (!config.valid) {
      log.error('[mailgun] Configuration errors:', config.errors)
      return {
        success: false,
        error: `Mailgun not configured: ${config.errors.join(', ')}`,
      }
    }

    // Send email
    const result = await mg.messages.create(MAILGUN_DOMAIN, {
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text || stripHtml(params.html),
      'o:tag': params.tags || [],
      'v:variables': params.variables ? JSON.stringify(params.variables) : undefined,
    })

    log.info('[mailgun] Email sent successfully:', {
      to: params.to,
      subject: params.subject,
      messageId: result.id,
    })

    return {
      success: true,
      messageId: result.id,
    }
  } catch (error) {
    log.error('[mailgun] Failed to send email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send bulk emails (for weekly summaries, announcements)
 */
export async function sendBulkEmails(
  recipients: Array<{ email: string; variables?: Record<string, string> }>,
  subject: string,
  html: string,
  tags?: string[]
): Promise<{
  success: boolean
  sent: number
  failed: number
  errors: string[]
}> {
  const results = {
    sent: 0,
    failed: 0,
    errors: [] as string[],
  }

  // Send in batches of 1000 (Mailgun limit)
  const batchSize = 1000
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize)

    for (const recipient of batch) {
      const result = await sendEmail({
        to: recipient.email,
        subject,
        html,
        tags,
        variables: recipient.variables,
      })

      if (result.success) {
        results.sent++
      } else {
        results.failed++
        results.errors.push(`${recipient.email}: ${result.error}`)
      }

      // Rate limiting: 300 emails/second on Mailgun
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
  }

  return {
    success: results.failed === 0,
    ...results,
  }
}

/**
 * Get email delivery statistics
 */
export async function getEmailStats(): Promise<{
  success: boolean
  stats?: {
    accepted: number
    delivered: number
    failed: number
    opened: number
    clicked: number
  }
  error?: string
}> {
  try {
    const config = validateMailgunConfig()
    if (!config.valid) {
      return {
        success: false,
        error: `Mailgun not configured: ${config.errors.join(', ')}`,
      }
    }

    // Get stats from Mailgun
    const stats = await mg.stats.getDomain(MAILGUN_DOMAIN, {
      event: ['accepted', 'delivered', 'failed', 'opened', 'clicked'],
      duration: '30d',
    })

    // Aggregate stats
    const aggregated = {
      accepted: 0,
      delivered: 0,
      failed: 0,
      opened: 0,
      clicked: 0,
    }

    if (stats.stats && Array.isArray(stats.stats)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stats.stats.forEach((stat: any) => {
        if (stat.accepted) aggregated.accepted += stat.accepted
        if (stat.delivered) aggregated.delivered += stat.delivered
        if (stat.failed) aggregated.failed += stat.failed
        if (stat.opened) aggregated.opened += stat.opened
        if (stat.clicked) aggregated.clicked += stat.clicked
      })
    }

    return {
      success: true,
      stats: aggregated,
    }
  } catch (error) {
    log.error('[mailgun] Failed to get stats:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Strip HTML tags for plain text fallback
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&[a-z]+;/gi, '') // Remove HTML entities
    .trim()
}

/**
 * Test email configuration
 */
export async function testEmailConfig(testEmail: string): Promise<{
  success: boolean
  error?: string
}> {
  return sendEmail({
    to: testEmail,
    subject: 'StartupSniff Email Test',
    html: '<h1>Test Email</h1><p>If you received this, Mailgun is configured correctly!</p>',
    tags: ['test'],
  })
}
