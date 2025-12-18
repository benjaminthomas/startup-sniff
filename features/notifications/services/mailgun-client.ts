/**
 * Mailgun Client Configuration
 * Shared client setup for all email services
 */

import FormData from 'form-data'
import Mailgun from 'mailgun.js'

// Mailgun configuration from environment
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN
const MAILGUN_HOST = process.env.MAILGUN_HOST || 'api.mailgun.net'
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

// Email configuration
export const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || 'noreply@startupsniff.com',
  fromName: process.env.EMAIL_FROM_NAME || 'StartupSniff',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
}

/**
 * Create configured Mailgun client
 */
export function createMailgunClient() {
  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
    throw new Error('Mailgun credentials not configured')
  }

  const mailgun = new Mailgun(FormData)
  return {
    client: mailgun.client({
      username: 'api',
      key: MAILGUN_API_KEY as string,
      url: `https://${MAILGUN_HOST}`,
      ...(IS_PRODUCTION && { timeout: 60000 })
    }),
    domain: MAILGUN_DOMAIN as string
  }
}
