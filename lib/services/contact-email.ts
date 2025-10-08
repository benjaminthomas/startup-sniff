/**
 * Contact Form Email Service using Mailgun
 * Handles contact form submissions and notifications
 */

import FormData from 'form-data'
import Mailgun from 'mailgun.js'
import { MailgunMessageData } from 'mailgun.js/definitions'

// Mailgun configuration from environment
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN
const MAILGUN_HOST = process.env.MAILGUN_HOST || 'api.mailgun.net'

// Email configuration
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@startupsniff.com'
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'StartupSniff'
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'support@startupsniff.com'
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

/**
 * Create Mailgun client
 */
function createMailgunClient() {
  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
    throw new Error('Mailgun credentials not configured. Please set MAILGUN_API_KEY and MAILGUN_DOMAIN environment variables.')
  }

  const mailgun = new Mailgun(FormData)
  return mailgun.client({
    username: 'api',
    key: MAILGUN_API_KEY as string,
    url: `https://${MAILGUN_HOST}`,
    ...(IS_PRODUCTION && {
      timeout: 60000,
    })
  })
}

/**
 * Contact form submission data
 */
export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  company?: string;
  message: string;
}

/**
 * Send contact form submission email to support team
 */
export async function sendContactFormEmail(formData: ContactFormData): Promise<void> {
  try {
    const mg = createMailgunClient()

    // Get subject display name
    const subjectMap: { [key: string]: string } = {
      'technical_support': 'Technical Support',
      'billing': 'Billing & Subscriptions',
      'feature_request': 'Feature Request',
      'partnership': 'Partnership Inquiry',
      'bug_report': 'Bug Report',
      'general': 'General Question'
    }

    const subjectDisplay = subjectMap[formData.subject] || 'Contact Form Submission'

    // Email to support team
    const supportEmailData: MailgunMessageData = {
      from: `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`,
      to: CONTACT_EMAIL,
      subject: `[StartupSniff] ${subjectDisplay} - ${formData.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #7C3AED 0%, #A855F7 100%); padding: 30px; border-radius: 12px; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">New Contact Form Submission</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0;">StartupSniff Contact Form</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin: 0 0 20px 0; font-size: 18px;">Contact Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: 600; width: 120px;">Name:</td>
                <td style="padding: 8px 0; color: #333;">${formData.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: 600;">Email:</td>
                <td style="padding: 8px 0; color: #333;"><a href="mailto:${formData.email}" style="color: #7C3AED;">${formData.email}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: 600;">Subject:</td>
                <td style="padding: 8px 0; color: #333;">${subjectDisplay}</td>
              </tr>
              ${formData.company ? `
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: 600;">Company:</td>
                <td style="padding: 8px 0; color: #333;">${formData.company}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <div style="background: white; border: 1px solid #e0e0e0; padding: 25px; border-radius: 8px;">
            <h3 style="color: #333; margin: 0 0 15px 0; font-size: 16px;">Message</h3>
            <div style="color: #555; line-height: 1.6; white-space: pre-wrap;">${formData.message}</div>
          </div>
          
          <div style="margin-top: 30px; padding: 20px; background: #f0f0f0; border-radius: 8px; text-align: center;">
            <p style="color: #666; margin: 0; font-size: 14px;">
              This email was sent from the StartupSniff contact form.<br>
              Reply directly to this email to respond to ${formData.name}.
            </p>
          </div>
        </div>
      `,
      text: `
New Contact Form Submission - StartupSniff

Contact Details:
Name: ${formData.name}
Email: ${formData.email}
Subject: ${subjectDisplay}
${formData.company ? `Company: ${formData.company}` : ''}

Message:
${formData.message}

---
This email was sent from the StartupSniff contact form.
Reply directly to this email to respond to ${formData.name}.
      `,
      'h:Reply-To': formData.email
    }

    const supportResult = await mg.messages.create(MAILGUN_DOMAIN as string, supportEmailData)
    console.log('Contact form email sent to support:', supportResult.id)

    // Send confirmation email to user
    await sendContactConfirmationEmail(formData)

  } catch (error) {
    console.error('Failed to send contact form email:', error)
    throw new Error('Failed to send contact form email. Please try again.')
  }
}

/**
 * Send confirmation email to user who submitted the contact form
 */
export async function sendContactConfirmationEmail(formData: ContactFormData): Promise<void> {
  try {
    const mg = createMailgunClient()

    const subjectMap: { [key: string]: string } = {
      'technical_support': 'Technical Support',
      'billing': 'Billing & Subscriptions', 
      'feature_request': 'Feature Request',
      'partnership': 'Partnership Inquiry',
      'bug_report': 'Bug Report',
      'general': 'General Question'
    }

    const subjectDisplay = subjectMap[formData.subject] || 'Contact Form Submission'

    const confirmationEmailData: MailgunMessageData = {
      from: `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`,
      to: formData.email,
      subject: `Thank you for contacting StartupSniff - ${subjectDisplay}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #7C3AED 0%, #A855F7 100%); padding: 30px; border-radius: 12px; margin-bottom: 30px; text-align: center;">
            <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
              <div style="width: 30px; height: 30px; background: white; border-radius: 6px; display: flex; align-items: center; justify-content: center;">
                <span style="color: #7C3AED; font-size: 18px; font-weight: bold;">S</span>
              </div>
            </div>
            <h1 style="color: white; margin: 0; font-size: 28px;">Thank You, ${formData.name}!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 15px 0 0 0; font-size: 16px;">We've received your message and will get back to you soon.</p>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h2 style="color: #333; margin: 0 0 20px 0; font-size: 20px;">What happens next?</h2>
            <div style="border-left: 4px solid #7C3AED; padding-left: 20px; margin: 20px 0;">
              <h3 style="color: #7C3AED; margin: 0 0 10px 0; font-size: 16px;">📧 We'll review your message</h3>
              <p style="color: #666; margin: 0; line-height: 1.6;">Our team will carefully review your ${subjectDisplay.toLowerCase()} request.</p>
            </div>
            <div style="border-left: 4px solid #A855F7; padding-left: 20px; margin: 20px 0;">
              <h3 style="color: #A855F7; margin: 0 0 10px 0; font-size: 16px;">⚡ Quick response time</h3>
              <p style="color: #666; margin: 0; line-height: 1.6;">We typically respond within 24 hours during business days.</p>
            </div>
            <div style="border-left: 4px solid #8B5CF6; padding-left: 20px; margin: 20px 0;">
              <h3 style="color: #8B5CF6; margin: 0 0 10px 0; font-size: 16px;">💬 Personalized support</h3>
              <p style="color: #666; margin: 0; line-height: 1.6;">You'll receive a personalized response from our team.</p>
            </div>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="color: #333; margin: 0 0 15px 0; font-size: 16px;">Your Message Summary</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 5px 0; color: #666; font-weight: 600; width: 100px;">Subject:</td>
                <td style="padding: 5px 0; color: #333;">${subjectDisplay}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #666; font-weight: 600;">Submitted:</td>
                <td style="padding: 5px 0; color: #333;">${new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://startupsniff.com" style="background: linear-gradient(135deg, #7C3AED 0%, #A855F7 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
              Visit StartupSniff
            </a>
          </div>
          
          <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; text-align: center;">
            <p style="color: #999; margin: 0; font-size: 14px;">
              Need immediate assistance? Reply to this email or contact us at <a href="mailto:${CONTACT_EMAIL}" style="color: #7C3AED;">${CONTACT_EMAIL}</a>
            </p>
          </div>
        </div>
      `,
      text: `
Thank you for contacting StartupSniff!

Hi ${formData.name},

We've received your ${subjectDisplay.toLowerCase()} message and will get back to you within 24 hours during business days.

Your message summary:
- Subject: ${subjectDisplay}
- Submitted: ${new Date().toLocaleDateString()}

What happens next:
1. We'll review your message carefully
2. You'll receive a personalized response from our team
3. We typically respond within 24 hours during business days

Need immediate assistance? Reply to this email or contact us at ${CONTACT_EMAIL}

Best regards,
The StartupSniff Team
https://startupsniff.com
      `
    }

    const confirmationResult = await mg.messages.create(MAILGUN_DOMAIN as string, confirmationEmailData)
    console.log('Contact confirmation email sent to user:', confirmationResult.id)

  } catch (error) {
    console.error('Failed to send contact confirmation email:', error)
    // Don't throw error for confirmation email failure - the main email was sent
  }
}

/**
 * Verify Mailgun configuration for contact emails
 */
export async function verifyContactEmailConfiguration(): Promise<{ success: boolean; error?: string }> {
  try {
    if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
      return {
        success: false,
        error: 'Mailgun credentials not configured'
      }
    }

    const mg = createMailgunClient()
    
    // Test with domain validation endpoint
    await mg.domains.get(MAILGUN_DOMAIN as string)
    
    return { success: true }
  } catch (error) {
    console.error('Mailgun configuration verification failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}