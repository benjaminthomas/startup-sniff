/**
 * Official Mailgun.js Email Service for StartupSniff
 * Based on Context7 MCP documentation and official Mailgun.js API
 */

import FormData from 'form-data'
import Mailgun from 'mailgun.js'
import { MailgunMessageData } from 'mailgun.js/definitions'
import { SignJWT, jwtVerify } from 'jose'
import { log } from '@/lib/logger'

// Mailgun configuration from environment
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN
const MAILGUN_HOST = process.env.MAILGUN_HOST || 'api.mailgun.net' // or 'api.eu.mailgun.net' for EU

// Email configuration
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@startupsniff.com'
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'StartupSniff'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

// JWT secret for email tokens
const EMAIL_JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-secret-key-min-32-chars'
)

/**
 * Create official Mailgun.js client (recommended by Context7 docs)
 */
function createMailgunClient() {
  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
    throw new Error('Mailgun credentials not configured. Please set MAILGUN_API_KEY and MAILGUN_DOMAIN environment variables.')
  }

  // Ensure we have the required credentials
  const apiKey = MAILGUN_API_KEY as string
  const domain = MAILGUN_DOMAIN as string

  // Official Mailgun.js setup from Context7 documentation
  const mailgun = new Mailgun(FormData)

  const mg = mailgun.client({
    username: 'api', // Always 'api' for Mailgun according to docs
    key: apiKey,
    url: `https://${MAILGUN_HOST}`, // Use the configured host
    ...(IS_PRODUCTION && {
      timeout: 60000, // 60 seconds for production
    })
  })

  log.info('📧 Creating official Mailgun.js client:', {
    domain,
    host: MAILGUN_HOST,
    hasApiKey: !!apiKey,
    environment: IS_PRODUCTION ? 'production' : 'development'
  })

  return { client: mg, domain }
}

/**
 * Verify Mailgun configuration using official API
 */
export async function verifyMailgunConfiguration(): Promise<{ success: boolean; error?: string; domain?: string }> {
  try {
    if (!MAILGUN_DOMAIN || MAILGUN_DOMAIN === 'sandbox-123.mailgun.org') {
      return {
        success: false,
        error: 'Please provide your actual Mailgun domain. Check: https://app.mailgun.com/app/sending/domains'
      }
    }

    const { client: mg, domain } = createMailgunClient()

    // Verify domain exists and is accessible
    log.info('🔍 Verifying Mailgun domain configuration...')
    const domainInfo = await mg.domains.get(domain)

    if (domainInfo) {
      log.info('✅ Mailgun domain verified:', {
        name: domainInfo.name,
        state: domainInfo.state,
        type: domainInfo.type
      })
      return { success: true, domain: domainInfo.name }
    } else {
      throw new Error('Domain verification failed')
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log.error('❌ Mailgun verification failed:', errorMessage)
    return { success: false, error: errorMessage }
  }
}

/**
 * Create email verification token
 */
async function createEmailVerificationToken(email: string): Promise<string> {
  const token = await new SignJWT({ email, type: 'email_verification' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setExpirationTime('24h')
    .setIssuedAt()
    .sign(EMAIL_JWT_SECRET)

  return token
}

/**
 * Generate email verification token
 */
export async function generateEmailVerificationToken(userId: string, email: string): Promise<string> {
  const token = await new SignJWT({
    userId,
    email,
    type: 'email_verification'
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setExpirationTime('24h') // 24 hours for email verification
    .setIssuedAt()
    .sign(EMAIL_JWT_SECRET)

  return token
}

/**
 * Generate password reset token
 */
export async function generatePasswordResetToken(userId: string, email: string): Promise<string> {
  const token = await new SignJWT({
    userId,
    email,
    type: 'password_reset'
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setExpirationTime('1h') // 1 hour expiry for security
    .setIssuedAt()
    .sign(EMAIL_JWT_SECRET)

  return token
}

/**
 * Verify email verification or password reset token
 */
export async function verifyEmailToken(token: string, expectedType: 'email_verification' | 'password_reset'): Promise<{ userId: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, EMAIL_JWT_SECRET)

    if (payload.type !== expectedType) {
      log.warn('Token type mismatch:', { expected: expectedType, actual: payload.type })
      return null
    }

    return {
      userId: payload.userId as string,
      email: payload.email as string
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.warn('Token verification failed', { error: errorMessage })
    return null
  }
}

/**
 * Alias for sendPasswordReset to match existing code
 */
export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  return sendPasswordReset(email, token)
}

/**
 * Send email verification using official Mailgun.js API
 */
export async function sendEmailVerification(email: string, token?: string): Promise<void> {
  const verificationToken = token || await createEmailVerificationToken(email)
  const verificationUrl = `${APP_URL}/auth/verify-email?token=${verificationToken}`

  const { client: mg, domain } = createMailgunClient()

  // Official Mailgun.js message structure from Context7 docs
  const messageData: MailgunMessageData = {
    from: `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`,
    to: [email],
    subject: 'Verify your StartupSniff account',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Email</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 40px 30px; text-align: center; }
          .content { padding: 40px 30px; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; background: #f9fafb; color: #6b7280; font-size: 14px; }
          .security { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 Welcome to StartupSniff!</h1>
            <p>Verify your email to start discovering trending startup opportunities</p>
          </div>

          <div class="content">
            <h2>Please verify your email address</h2>
            <p>Thanks for signing up! Please click the button below to verify your email address and activate your account:</p>

            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>

            <div class="security">
              <strong>🔒 Security Notice:</strong> This verification link will expire in 24 hours for your security. If you didn't create a StartupSniff account, you can safely ignore this email.
            </div>

            <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #059669;"><a href="${verificationUrl}">${verificationUrl}</a></p>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

            <h3>🎯 What's next?</h3>
            <ul>
              <li>Generate AI-powered startup ideas</li>
              <li>Analyze trending Reddit discussions</li>
              <li>Validate market opportunities</li>
              <li>Create marketing content</li>
            </ul>
          </div>

          <div class="footer">
            <p>Sent via Official Mailgun.js API • © ${new Date().getFullYear()} StartupSniff</p>
            <p>If you have questions, contact us at support@startupsniff.com</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Welcome to StartupSniff! 🚀

Please verify your email address to activate your account.

Verification link: ${verificationUrl}

This link will expire in 24 hours for security.

What's next after verification:
• Generate AI-powered startup ideas
• Analyze trending Reddit discussions
• Validate market opportunities
• Create marketing content

If you didn't create a StartupSniff account, you can safely ignore this email.

© ${new Date().getFullYear()} StartupSniff
Sent via Official Mailgun.js API
    `,
    // Mailgun tracking options from Context7 docs
    'o:tracking': 'yes',
    'o:tracking-clicks': 'yes',
    'o:tracking-opens': 'yes',
    'o:tag': 'email-verification'
  }

  try {
    log.info(`📧 Sending email verification to ${email} via Mailgun.js API...`)

    // Official Mailgun.js send method from Context7 docs
    const result = await mg.messages.create(domain, messageData)

    log.info('✅ Email verification sent successfully:', {
      id: result.id,
      message: result.message,
      to: email
    })
  } catch (error) {
    log.error('❌ Failed to send email verification via Mailgun.js:', error)
    throw new Error('Failed to send verification email')
  }
}

/**
 * Send password reset email using official Mailgun.js API
 */
export async function sendPasswordReset(email: string, token: string): Promise<void> {
  const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`

  const { client: mg, domain } = createMailgunClient()

  // Official Mailgun.js message structure
  const messageData: MailgunMessageData = {
    from: `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`,
    to: [email],
    subject: 'Reset your StartupSniff password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
          .header { background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 40px 30px; text-align: center; }
          .content { padding: 40px 30px; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; background: #f9fafb; color: #6b7280; font-size: 14px; }
          .security { background: #fef2f2; border: 1px solid #dc2626; border-radius: 6px; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Password Reset Request</h1>
            <p>Reset your StartupSniff account password</p>
          </div>

          <div class="content">
            <h2>Reset your password</h2>
            <p>We received a request to reset the password for your StartupSniff account. Click the button below to create a new password:</p>

            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>

            <div class="security">
              <strong>🔒 Security Notice:</strong> This reset link will expire in 1 hour for your security. If you didn't request a password reset, you can safely ignore this email.
            </div>

            <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #dc2626;"><a href="${resetUrl}">${resetUrl}</a></p>
          </div>

          <div class="footer">
            <p>Sent via Official Mailgun.js API • © ${new Date().getFullYear()} StartupSniff</p>
            <p>If you have questions, contact us at support@startupsniff.com</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Password Reset Request 🔒

We received a request to reset the password for your StartupSniff account.

Reset link: ${resetUrl}

This link will expire in 1 hour for security.

If you didn't request a password reset, you can safely ignore this email.

© ${new Date().getFullYear()} StartupSniff
Sent via Official Mailgun.js API
    `,
    // Mailgun tracking options
    'o:tracking': 'yes',
    'o:tracking-clicks': 'yes',
    'o:tracking-opens': 'yes',
    'o:tag': 'password-reset'
  }

  try {
    log.info(`📧 Sending password reset to ${email} via Mailgun.js API...`)

    // Official Mailgun.js send method
    const result = await mg.messages.create(domain, messageData)

    log.info('✅ Password reset email sent successfully:', {
      id: result.id,
      message: result.message,
      to: email
    })
  } catch (error) {
    log.error('❌ Failed to send password reset email via Mailgun.js:', error)
    throw new Error('Failed to send password reset email')
  }
}

/**
 * Send test email using official Mailgun.js API
 */
export async function sendTestEmail(toEmail: string): Promise<void> {
  const { client: mg, domain } = createMailgunClient()

  const messageData: MailgunMessageData = {
    from: `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`,
    to: [toEmail],
    subject: '✅ Official Mailgun.js Test - Success!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Official Mailgun.js Test</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
          <h1>✅ Official Mailgun.js Success!</h1>
          <p>Your Mailgun configuration is working perfectly</p>
        </div>

        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981;">
          <h3>📊 Configuration Details:</h3>
          <ul>
            <li><strong>Method:</strong> Official Mailgun.js API</li>
            <li><strong>Domain:</strong> ${domain}</li>
            <li><strong>Host:</strong> ${MAILGUN_HOST}</li>
            <li><strong>API Key:</strong> [CONFIGURED]</li>
            <li><strong>Environment:</strong> ${IS_PRODUCTION ? 'Production' : 'Development'}</li>
            <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
          </ul>

          <p><strong>🎉 Your StartupSniff authentication system is ready for production!</strong></p>
          <p>Based on Context7 MCP official Mailgun.js documentation</p>
        </div>
      </body>
      </html>
    `,
    text: `
Official Mailgun.js Test - Success! ✅

Your Mailgun configuration is working perfectly using the official Mailgun.js API.

Configuration Details:
- Method: Official Mailgun.js API
- Domain: ${domain}
- Host: ${MAILGUN_HOST}
- API Key: [CONFIGURED]
- Environment: ${IS_PRODUCTION ? 'Production' : 'Development'}
- Timestamp: ${new Date().toISOString()}

🎉 Your StartupSniff authentication system is ready for production!
Based on Context7 MCP official Mailgun.js documentation

© ${new Date().getFullYear()} StartupSniff
    `,
    'o:tracking': 'yes',
    'o:tag': 'test-email'
  }

  try {
    log.info(`📧 Sending test email to ${toEmail} via official Mailgun.js API...`)

    const result = await mg.messages.create(domain, messageData)

    log.info('Test email sent successfully!')
    log.info('Message ID received', { messageId: result.id })
    log.info('Message received', { message: result.message })
  } catch (error) {
    log.error('Failed to send test email via Mailgun.js', error)
    throw new Error('Failed to send test email')
  }
}