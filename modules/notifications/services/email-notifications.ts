/**
 * Email Notifications Service for Epic 2
 *
 * Handles user engagement emails:
 * - Welcome emails
 * - Message sent confirmations
 * - Weekly summaries
 * - Onboarding drip campaign
 *
 * Uses shared Mailgun client from ./mailgun-client.ts
 */

import { MailgunMessageData } from 'mailgun.js/definitions'
import { createMailgunClient, EMAIL_CONFIG } from './mailgun-client'

// Re-export for convenience
const { from: EMAIL_FROM, fromName: EMAIL_FROM_NAME, appUrl: APP_URL } = EMAIL_CONFIG

// ==================== WELCOME EMAIL ====================

export interface WelcomeEmailData {
  email: string
  name?: string
}

/**
 * Send welcome email after signup
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
  const { client: mg, domain } = createMailgunClient()
  const displayName = data.name || 'there'

  const messageData: MailgunMessageData = {
    from: `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`,
    to: [data.email],
    subject: '🚀 Welcome to StartupSniff - Find Your Next Big Idea',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to StartupSniff</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 40px 30px; text-align: center; }
          .content { padding: 40px 30px; }
          .button { display: inline-block; background: #10b981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .feature { background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 15px 0; border-radius: 6px; }
          .footer { text-align: center; padding: 30px; background: #f9fafb; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 32px;">🚀 Welcome to StartupSniff!</h1>
            <p style="margin: 15px 0 0 0; font-size: 18px;">Discover Reddit's hottest startup opportunities</p>
          </div>

          <div class="content">
            <p style="font-size: 18px; margin: 0 0 20px 0;">Hi ${displayName},</p>

            <p>Thanks for joining StartupSniff! You now have access to curated startup opportunities discovered from 15+ entrepreneurial subreddits.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${APP_URL}/dashboard/opportunities" class="button">
                Explore Opportunities →
              </a>
            </div>

            <h3 style="color: #10b981; margin: 30px 0 20px 0;">🎯 What You Can Do Now:</h3>

            <div class="feature">
              <strong>📊 Browse 984+ Scored Opportunities</strong>
              <p style="margin: 5px 0 0 0; color: #666;">AI-scored Reddit posts showing business viability, market validation, and more.</p>
            </div>

            <div class="feature">
              <strong>🔍 Filter & Search</strong>
              <p style="margin: 5px 0 0 0; color: #666;">Find opportunities by score, subreddit, trend status, or keywords.</p>
            </div>

            <div class="feature">
              <strong>🔥 Spot Emerging Trends</strong>
              <p style="margin: 5px 0 0 0; color: #666;">See which pain points are trending up before they become saturated.</p>
            </div>

            <div class="feature">
              <strong>🤖 AI Deep Analysis</strong>
              <p style="margin: 5px 0 0 0; color: #666;">Get detailed breakdowns for high-potential opportunities (score ≥7.0).</p>
            </div>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

            <h3 style="color: #10b981; margin: 30px 0 20px 0;">💡 Pro Tips:</h3>
            <ul style="color: #666; line-height: 1.8;">
              <li>Filter by <strong>"High (≥7.0)"</strong> to see the top 1% opportunities</li>
              <li>Look for <strong>🔥 Emerging</strong> badges for early-stage trends</li>
              <li>Check <strong>AI Analysis</strong> on detail pages for deeper insights</li>
              <li>Export opportunities as CSV or JSON for offline analysis</li>
            </ul>

            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 6px;">
              <strong>🎉 Ready to Start Conversations?</strong>
              <p style="margin: 5px 0 0 0;">Upgrade to Pro ($20/month) to discover contacts, send personalized messages, and track conversations.</p>
              <a href="${APP_URL}/dashboard/billing" style="color: #f59e0b; font-weight: 600;">Learn more →</a>
            </div>

            <p style="margin: 30px 0 10px 0;">Happy exploring!</p>
            <p style="margin: 0;"><strong>The StartupSniff Team</strong></p>
          </div>

          <div class="footer">
            <p style="margin: 0 0 10px 0;">
              <a href="${APP_URL}/dashboard/opportunities" style="color: #10b981; text-decoration: none;">Dashboard</a> •
              <a href="${APP_URL}/dashboard/billing" style="color: #10b981; text-decoration: none;">Upgrade</a> •
              <a href="${APP_URL}/contact" style="color: #10b981; text-decoration: none;">Support</a>
            </p>
            <p style="margin: 0; font-size: 13px;">© ${new Date().getFullYear()} StartupSniff • Finding opportunities in the noise</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Welcome to StartupSniff! 🚀

Hi ${displayName},

Thanks for joining StartupSniff! You now have access to curated startup opportunities discovered from 15+ entrepreneurial subreddits.

What You Can Do Now:

📊 Browse 984+ Scored Opportunities
AI-scored Reddit posts showing business viability, market validation, and more.

🔍 Filter & Search
Find opportunities by score, subreddit, trend status, or keywords.

🔥 Spot Emerging Trends
See which pain points are trending up before they become saturated.

🤖 AI Deep Analysis
Get detailed breakdowns for high-potential opportunities (score ≥7.0).

Pro Tips:
- Filter by "High (≥7.0)" to see the top 1% opportunities
- Look for 🔥 Emerging badges for early-stage trends
- Check AI Analysis on detail pages for deeper insights
- Export opportunities as CSV or JSON for offline analysis

Ready to Start Conversations?
Upgrade to Pro ($20/month) to discover contacts, send personalized messages, and track conversations.

Explore Opportunities: ${APP_URL}/dashboard/opportunities

Happy exploring!
The StartupSniff Team

© ${new Date().getFullYear()} StartupSniff
    `,
    'o:tracking': 'yes',
    'o:tracking-opens': 'yes',
    'o:tag': ['welcome', 'onboarding']
  }

  try {
    console.log(`📧 Sending welcome email to ${data.email}...`)
    const result = await mg.messages.create(domain, messageData)
    console.log('✅ Welcome email sent:', result.id)
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error)
    // Don't throw - email failure shouldn't block signup
  }
}

// ==================== MESSAGE CONFIRMATION ====================

export interface MessageConfirmationData {
  email: string
  name?: string
  recipientCount: number
  opportunityTitle: string
  opportunityId: string
}

/**
 * Send confirmation after messages are sent
 */
export async function sendMessageConfirmation(data: MessageConfirmationData): Promise<void> {
  const { client: mg, domain } = createMailgunClient()
  const displayName = data.name || 'there'

  const messageData: MailgunMessageData = {
    from: `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`,
    to: [data.email],
    subject: `✅ ${data.recipientCount} message${data.recipientCount > 1 ? 's' : ''} sent successfully`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Messages Sent</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
        <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">✅ Messages Sent!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">${data.recipientCount} message${data.recipientCount > 1 ? 's' : ''} on their way</p>
          </div>

          <div style="padding: 30px;">
            <p style="font-size: 16px;">Hi ${displayName},</p>

            <p>Great news! Your ${data.recipientCount} message${data.recipientCount > 1 ? 's have' : ' has'} been successfully sent via Reddit for:</p>

            <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 6px;">
              <strong style="color: #10b981;">Opportunity:</strong>
              <p style="margin: 5px 0 0 0; color: #333;">${data.opportunityTitle}</p>
            </div>

            <h3 style="color: #10b981; margin: 25px 0 15px 0;">📬 What Happens Next?</h3>
            <ul style="color: #666; line-height: 1.8; padding-left: 20px;">
              <li><strong>Check back in 24-48 hours</strong> for replies (typical response time)</li>
              <li><strong>Log into Reddit</strong> to see when recipients read your messages</li>
              <li><strong>Track outcomes</strong> in your Conversations dashboard</li>
            </ul>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${APP_URL}/dashboard/conversations" style="display: inline-block; background: #10b981; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                View Conversations
              </a>
            </div>

            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 6px;">
              <strong>💡 Pro Tip:</strong> Most Reddit users check messages within 24-48 hours. Don't worry if you don't get immediate replies!
            </div>

            <p style="margin: 25px 0 5px 0;">Good luck!</p>
            <p style="margin: 0;"><strong>The StartupSniff Team</strong></p>
          </div>

          <div style="text-align: center; padding: 20px; background: #f9fafb; color: #6b7280; font-size: 14px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} StartupSniff</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Messages Sent! ✅

Hi ${displayName},

Great news! Your ${data.recipientCount} message${data.recipientCount > 1 ? 's have' : ' has'} been successfully sent via Reddit for:

Opportunity: ${data.opportunityTitle}

What Happens Next?
- Check back in 24-48 hours for replies (typical response time)
- Log into Reddit to see when recipients read your messages
- Track outcomes in your Conversations dashboard: ${APP_URL}/dashboard/conversations

Pro Tip: Most Reddit users check messages within 24-48 hours. Don't worry if you don't get immediate replies!

Good luck!
The StartupSniff Team

© ${new Date().getFullYear()} StartupSniff
    `,
    'o:tracking': 'yes',
    'o:tag': ['message-confirmation', 'engagement']
  }

  try {
    console.log(`📧 Sending message confirmation to ${data.email}...`)
    const result = await mg.messages.create(domain, messageData)
    console.log('✅ Message confirmation sent:', result.id)
  } catch (error) {
    console.error('❌ Failed to send message confirmation:', error)
  }
}

// ==================== WEEKLY SUMMARY ====================

export interface WeeklySummaryData {
  email: string
  name?: string
  weekStats: {
    messagesSent: number
    repliesReceived: number
    callsScheduled: number
    opportunitiesViewed: number
    newHighPotentialOpportunities: number
  }
  topOpportunities: Array<{
    title: string
    score: number
    id: string
  }>
}

/**
 * Send weekly engagement summary
 */
export async function sendWeeklySummary(data: WeeklySummaryData): Promise<void> {
  const { client: mg, domain } = createMailgunClient()

  const stats = data.weekStats
  const displayName = data.name || 'there'

  const messageData: MailgunMessageData = {
    from: `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`,
    to: [data.email],
    subject: `📊 Your Weekly StartupSniff Summary - ${stats.messagesSent} messages sent`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Weekly Summary</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
        <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">📊 Weekly Summary</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Your progress this week</p>
          </div>

          <div style="padding: 30px;">
            <p style="font-size: 16px;">Hi ${displayName},</p>

            <p>Here's what you accomplished on StartupSniff this week:</p>

            <div style="display: table; width: 100%; margin: 25px 0;">
              <div style="display: table-row;">
                <div style="display: table-cell; padding: 15px; background: #eff6ff; border-radius: 8px; text-align: center; margin: 0 5px;">
                  <div style="font-size: 32px; font-weight: bold; color: #3b82f6;">${stats.messagesSent}</div>
                  <div style="color: #64748b; font-size: 14px;">Messages Sent</div>
                </div>
                <div style="display: table-cell; padding: 15px; background: #f0fdf4; border-radius: 8px; text-align: center; margin: 0 5px;">
                  <div style="font-size: 32px; font-weight: bold; color: #10b981;">${stats.repliesReceived}</div>
                  <div style="color: #64748b; font-size: 14px;">Replies Received</div>
                </div>
              </div>
            </div>

            <div style="display: table; width: 100%; margin: 25px 0;">
              <div style="display: table-row;">
                <div style="display: table-cell; padding: 15px; background: #fef3c7; border-radius: 8px; text-align: center; margin: 0 5px;">
                  <div style="font-size: 32px; font-weight: bold; color: #f59e0b;">${stats.callsScheduled}</div>
                  <div style="color: #64748b; font-size: 14px;">Calls Scheduled</div>
                </div>
                <div style="display: table-cell; padding: 15px; background: #fce7f3; border-radius: 8px; text-align: center; margin: 0 5px;">
                  <div style="font-size: 32px; font-weight: bold; color: #ec4899;">${stats.opportunitiesViewed}</div>
                  <div style="color: #64748b; font-size: 14px;">Opportunities Viewed</div>
                </div>
              </div>
            </div>

            ${stats.newHighPotentialOpportunities > 0 ? `
              <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 25px 0; border-radius: 6px;">
                <strong style="color: #10b981;">🔥 ${stats.newHighPotentialOpportunities} New High-Potential Opportunities</strong>
                <p style="margin: 5px 0 0 0; color: #666;">Check out the latest opportunities with scores ≥7.0!</p>
              </div>
            ` : ''}

            ${data.topOpportunities.length > 0 ? `
              <h3 style="color: #3b82f6; margin: 25px 0 15px 0;">🚀 Top Opportunities This Week:</h3>
              ${data.topOpportunities.map(opp => `
                <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 10px 0;">
                  <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                      <strong style="color: #333;">${opp.title}</strong>
                    </div>
                    <div style="background: #10b981; color: white; padding: 5px 12px; border-radius: 6px; font-weight: bold; margin-left: 10px;">
                      ${opp.score.toFixed(1)}
                    </div>
                  </div>
                  <a href="${APP_URL}/dashboard/opportunities/${opp.id}" style="color: #3b82f6; font-size: 14px; text-decoration: none;">View details →</a>
                </div>
              `).join('')}
            ` : ''}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${APP_URL}/dashboard/opportunities" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Explore More Opportunities
              </a>
            </div>

            ${stats.messagesSent > 0 && stats.repliesReceived === 0 ? `
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 6px;">
                <strong>💡 Keep Going!</strong>
                <p style="margin: 5px 0 0 0; color: #666;">You've sent ${stats.messagesSent} messages. Most replies come within 24-48 hours. Check back soon!</p>
              </div>
            ` : ''}

            <p style="margin: 25px 0 5px 0;">Keep discovering!</p>
            <p style="margin: 0;"><strong>The StartupSniff Team</strong></p>
          </div>

          <div style="text-align: center; padding: 20px; background: #f9fafb; color: #6b7280; font-size: 14px;">
            <p style="margin: 0 0 10px 0;">
              <a href="${APP_URL}/dashboard" style="color: #3b82f6; text-decoration: none;">Dashboard</a> •
              <a href="${APP_URL}/dashboard/opportunities" style="color: #3b82f6; text-decoration: none;">Opportunities</a> •
              <a href="${APP_URL}/dashboard/conversations" style="color: #3b82f6; text-decoration: none;">Conversations</a>
            </p>
            <p style="margin: 0;">© ${new Date().getFullYear()} StartupSniff</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Weekly Summary 📊

Hi ${displayName},

Here's what you accomplished on StartupSniff this week:

Messages Sent: ${stats.messagesSent}
Replies Received: ${stats.repliesReceived}
Calls Scheduled: ${stats.callsScheduled}
Opportunities Viewed: ${stats.opportunitiesViewed}

${stats.newHighPotentialOpportunities > 0 ? `🔥 ${stats.newHighPotentialOpportunities} new high-potential opportunities (score ≥7.0)!\n` : ''}

${data.topOpportunities.length > 0 ? `
Top Opportunities This Week:
${data.topOpportunities.map(opp => `- ${opp.title} (${opp.score.toFixed(1)}/10)\n  ${APP_URL}/dashboard/opportunities/${opp.id}`).join('\n')}
` : ''}

Explore More: ${APP_URL}/dashboard/opportunities

Keep discovering!
The StartupSniff Team

© ${new Date().getFullYear()} StartupSniff
    `,
    'o:tracking': 'yes',
    'o:tag': ['weekly-summary', 'engagement']
  }

  try {
    console.log(`📧 Sending weekly summary to ${data.email}...`)
    const result = await mg.messages.create(domain, messageData)
    console.log('✅ Weekly summary sent:', result.id)
  } catch (error) {
    console.error('❌ Failed to send weekly summary:', error)
  }
}

// ==================== ONBOARDING DRIP CAMPAIGN ====================

/**
 * Send Day 1 onboarding email (tips & getting started)
 */
export async function sendOnboardingDay1(email: string, name?: string): Promise<void> {
  const displayName = name || 'there'
  const { client: mg, domain } = createMailgunClient()

  const messageData: MailgunMessageData = {
    from: `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`,
    to: [email],
    subject: '💡 Day 1: How to Find Gold on StartupSniff',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
        <div style="background: white; border-radius: 12px; padding: 30px;">
          <h1 style="color: #10b981;">💡 Day 1: Finding Gold</h1>

          <p>Hi ${displayName},</p>

          <p>Welcome to StartupSniff! Let me show you how to find the best opportunities:</p>

          <h3 style="color: #10b981;">🎯 3 Steps to Success:</h3>

          <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 15px 0; border-radius: 6px;">
            <strong>1. Filter by "High (≥7.0)"</strong>
            <p style="margin: 5px 0 0 0; color: #666;">These are the top 1% opportunities validated by AI.</p>
          </div>

          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0; border-radius: 6px;">
            <strong>2. Look for 🔥 Emerging badges</strong>
            <p style="margin: 5px 0 0 0; color: #666;">These pain points are trending up before they become saturated.</p>
          </div>

          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 15px 0; border-radius: 6px;">
            <strong>3. Check the AI analysis</strong>
            <p style="margin: 5px 0 0 0; color: #666;">Click any opportunity to see GPT-4's detailed breakdown.</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${APP_URL}/dashboard/opportunities?minScore=7" style="display: inline-block; background: #10b981; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              View Top Opportunities
            </a>
          </div>

          <p style="margin: 20px 0 5px 0;">Talk soon,</p>
          <p style="margin: 0;"><strong>The StartupSniff Team</strong></p>
        </div>
      </body>
      </html>
    `,
    text: `
Day 1: Finding Gold 💡

Hi ${displayName},

Welcome to StartupSniff! Let me show you how to find the best opportunities:

3 Steps to Success:

1. Filter by "High (≥7.0)"
   These are the top 1% opportunities validated by AI.

2. Look for 🔥 Emerging badges
   These pain points are trending up before they become saturated.

3. Check the AI analysis
   Click any opportunity to see GPT-4's detailed breakdown.

View Top Opportunities: ${APP_URL}/dashboard/opportunities?minScore=7

Talk soon,
The StartupSniff Team
    `,
    'o:tracking': 'yes',
    'o:tag': ['onboarding', 'drip-day-1']
  }

  try {
    const result = await mg.messages.create(domain, messageData)
    console.log('✅ Onboarding Day 1 sent:', result.id)
  } catch (error) {
    console.error('❌ Failed to send onboarding day 1:', error)
  }
}

/**
 * Send Day 3 onboarding email (success stories)
 */
export async function sendOnboardingDay3(email: string, name?: string): Promise<void> {
  const displayName = name || 'there'
  const { client: mg, domain } = createMailgunClient()

  const messageData: MailgunMessageData = {
    from: `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`,
    to: [email],
    subject: '🎉 Real founders using StartupSniff (their stories)',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
        <div style="background: white; border-radius: 12px; padding: 30px;">
          <h1 style="color: #10b981;">🎉 Success Stories</h1>

          <p>Hi ${displayName},</p>

          <p>Here's how other founders are using StartupSniff:</p>

          <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; background: #f9fafb;">
            <p style="font-style: italic; color: #666; margin: 0 0 15px 0;">
              "I found a pain point about SaaS churn tracking with a 9/10 score. 3 weeks later, I had 5 beta customers. StartupSniff compressed months of research into 10 minutes."
            </p>
            <p style="margin: 0; font-weight: 600;">— Sarah K., SaaS Founder</p>
          </div>

          <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; background: #f9fafb;">
            <p style="font-style: italic; color: #666; margin: 0 0 15px 0;">
              "The emerging trend detection is gold. I spotted a payment processing frustration before it exploded. Now I'm building exactly what the market needs."
            </p>
            <p style="margin: 0; font-weight: 600;">— Mike T., Solo Founder</p>
          </div>

          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 6px;">
            <strong>💡 Your Turn:</strong>
            <p style="margin: 5px 0 0 0; color: #666;">Filter by emerging trends to find opportunities before they're saturated!</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${APP_URL}/dashboard/opportunities?trend=emerging" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              See Emerging Trends
            </a>
          </div>

          <p style="margin: 20px 0 5px 0;">Keep exploring,</p>
          <p style="margin: 0;"><strong>The StartupSniff Team</strong></p>
        </div>
      </body>
      </html>
    `,
    text: `
Success Stories 🎉

Hi ${displayName},

Here's how other founders are using StartupSniff:

"I found a pain point about SaaS churn tracking with a 9/10 score. 3 weeks later, I had 5 beta customers. StartupSniff compressed months of research into 10 minutes."
— Sarah K., SaaS Founder

"The emerging trend detection is gold. I spotted a payment processing frustration before it exploded. Now I'm building exactly what the market needs."
— Mike T., Solo Founder

Your Turn:
Filter by emerging trends to find opportunities before they're saturated!

See Emerging Trends: ${APP_URL}/dashboard/opportunities?trend=emerging

Keep exploring,
The StartupSniff Team
    `,
    'o:tracking': 'yes',
    'o:tag': ['onboarding', 'drip-day-3']
  }

  try {
    const result = await mg.messages.create(domain, messageData)
    console.log('✅ Onboarding Day 3 sent:', result.id)
  } catch (error) {
    console.error('❌ Failed to send onboarding day 3:', error)
  }
}

/**
 * Send Day 7 onboarding email (upgrade prompt)
 */
export async function sendOnboardingDay7(email: string, name?: string): Promise<void> {
  const displayName = name || 'there'
  const { client: mg, domain } = createMailgunClient()

  const messageData: MailgunMessageData = {
    from: `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`,
    to: [email],
    subject: '🚀 Ready to start conversations? (Upgrade to Pro)',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
        <div style="background: white; border-radius: 12px; padding: 30px;">
          <h1 style="color: #10b981;">🚀 Time to Take Action</h1>

          <p>Hi ${displayName},</p>

          <p>You've been exploring opportunities for a week. Ready to start conversations with real potential customers?</p>

          <h3 style="color: #10b981;">With Pro ($20/month), you can:</h3>

          <div style="margin: 20px 0;">
            <div style="padding: 15px 0; border-bottom: 1px solid #e5e7eb;">
              ✅ <strong>Discover contacts</strong> from any opportunity
            </div>
            <div style="padding: 15px 0; border-bottom: 1px solid #e5e7eb;">
              ✅ <strong>Send personalized messages</strong> via Reddit
            </div>
            <div style="padding: 15px 0; border-bottom: 1px solid #e5e7eb;">
              ✅ <strong>AI-generated templates</strong> for every conversation
            </div>
            <div style="padding: 15px 0;">
              ✅ <strong>Track responses</strong> and conversions
            </div>
          </div>

          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 6px;">
            <strong>💡 Most founders get their first customer within 2 weeks of upgrading</strong>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${APP_URL}/dashboard/billing" style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Upgrade to Pro →
            </a>
          </div>

          <p style="color: #666; font-size: 14px; text-align: center; margin: 20px 0;">Cancel anytime • No long-term commitment</p>

          <p style="margin: 20px 0 5px 0;">Let's build something great,</p>
          <p style="margin: 0;"><strong>The StartupSniff Team</strong></p>
        </div>
      </body>
      </html>
    `,
    text: `
Ready to Start Conversations? 🚀

Hi ${displayName},

You've been exploring opportunities for a week. Ready to start conversations with real potential customers?

With Pro ($20/month), you can:

✅ Discover contacts from any opportunity
✅ Send personalized messages via Reddit
✅ AI-generated templates for every conversation
✅ Track responses and conversions

💡 Most founders get their first customer within 2 weeks of upgrading

Upgrade to Pro: ${APP_URL}/dashboard/billing

Cancel anytime • No long-term commitment

Let's build something great,
The StartupSniff Team
    `,
    'o:tracking': 'yes',
    'o:tag': ['onboarding', 'drip-day-7', 'upgrade-prompt']
  }

  try {
    const result = await mg.messages.create(domain, messageData)
    console.log('✅ Onboarding Day 7 sent:', result.id)
  } catch (error) {
    console.error('❌ Failed to send onboarding day 7:', error)
  }
}
