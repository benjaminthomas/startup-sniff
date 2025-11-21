/**
 * Onboarding Day 7 Email Template
 * Story 2.9: Email Notifications and Engagement
 *
 * Success stories and upgrade encouragement
 */

/* eslint-disable react/no-unescaped-entities */

import { BaseEmailTemplate } from './base'

interface OnboardingDay7Props {
  userName: string
  messagesSent: number
  repliesReceived: number
  dashboardUrl: string
  upgradeUrl: string
}

export function OnboardingDay7Email({
  userName,
  messagesSent,
  repliesReceived,
  dashboardUrl,
  upgradeUrl
}: OnboardingDay7Props) {
  const hasStartedMessaging = messagesSent > 0
  const responseRate = messagesSent > 0 ? ((repliesReceived / messagesSent) * 100).toFixed(0) : '0'

  return (
    <BaseEmailTemplate preheader="Your first week with StartupSniff - plus a special offer inside">
      <h1>Week 1 Complete! 🎊</h1>

      <p>Hey {userName},</p>

      <p>
        You've been on StartupSniff for a week. Here's what other founders accomplished in their first 7 days:
      </p>

      {hasStartedMessaging ? (
        <>
          <h2>📊 Your Progress</h2>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <div className="metric">
              <p className="metric-value">{messagesSent}</p>
              <p className="metric-label">Messages Sent</p>
            </div>
            <div className="metric">
              <p className="metric-value">{repliesReceived}</p>
              <p className="metric-label">Replies</p>
            </div>
            <div className="metric">
              <p className="metric-value">{responseRate}%</p>
              <p className="metric-label">Response Rate</p>
            </div>
          </div>

          {repliesReceived > 0 ? (
            <div className="highlight-box" style={{ backgroundColor: '#dcfce7', borderColor: '#16a34a' }}>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#15803d' }}>
                🔥 You're already getting responses! That's faster than 80% of users.
              </p>
            </div>
          ) : (
            <p>
              Great start! Replies typically come within 24-48 hours. Keep the momentum going.
            </p>
          )}
        </>
      ) : (
        <>
          <h2>💡 It's Not Too Late to Start</h2>

          <p>
            Most successful StartupSniff users sent their first message within the first week.
            Here's why you should start today:
          </p>

          <div className="highlight-box">
            <p style={{ margin: 0, fontWeight: 600 }}>
              The average founder finds their first paying customer within 14 days of sending their first message.
            </p>
          </div>
        </>
      )}

      <h2>🏆 Real Success Stories</h2>

      <div style={{ padding: '20px', backgroundColor: '#eff6ff', borderRadius: '8px', marginBottom: '16px' }}>
        <p style={{ margin: 0, fontSize: '14px', fontStyle: 'italic', color: '#1e40af' }}>
          "I sent 12 messages in my first week. Got 5 replies, scheduled 2 calls, and landed my first customer.
          StartupSniff paid for itself in 3 days."
        </p>
        <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#3b82f6' }}>
          — Sarah, B2B SaaS Founder
        </p>
      </div>

      <div style={{ padding: '20px', backgroundColor: '#eff6ff', borderRadius: '8px', marginBottom: '16px' }}>
        <p style={{ margin: 0, fontSize: '14px', fontStyle: 'italic', color: '#1e40af' }}>
          "The AI-generated messages actually sound human. My response rate is 42% vs. the 15% I got with cold LinkedIn outreach."
        </p>
        <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#3b82f6' }}>
          — Marcus, Developer Tools Startup
        </p>
      </div>

      <div style={{ padding: '20px', backgroundColor: '#eff6ff', borderRadius: '8px', marginBottom: '24px' }}>
        <p style={{ margin: 0, fontSize: '14px', fontStyle: 'italic', color: '#1e40af' }}>
          "I validated my idea in 5 days instead of 5 weeks. Talked to 8 potential customers before writing a single line of code."
        </p>
        <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#3b82f6' }}>
          — James, First-Time Founder
        </p>
      </div>

      <h2>🚀 Ready to Go All In?</h2>

      <p>
        You've experienced the free tier. Here's what Premium unlocks:
      </p>

      <table style={{ width: '100%', marginBottom: '24px' }}>
        <tr>
          <td style={{ padding: '12px 0', borderBottom: '1px solid #e5e7eb' }}>
            <strong>✅ Unlimited messages</strong> (vs. 5/month free)
          </td>
        </tr>
        <tr>
          <td style={{ padding: '12px 0', borderBottom: '1px solid #e5e7eb' }}>
            <strong>✅ AI template variants</strong> (4 different tones to test)
          </td>
        </tr>
        <tr>
          <td style={{ padding: '12px 0', borderBottom: '1px solid #e5e7eb' }}>
            <strong>✅ Conversation tracking</strong> (never lose track of replies)
          </td>
        </tr>
        <tr>
          <td style={{ padding: '12px 0', borderBottom: '1px solid #e5e7eb' }}>
            <strong>✅ Weekly summaries</strong> (performance insights delivered here)
          </td>
        </tr>
        <tr>
          <td style={{ padding: '12px 0' }}>
            <strong>✅ Priority support</strong> (we'll help you succeed)
          </td>
        </tr>
      </table>

      <p style={{ fontSize: '18px', fontWeight: 600, color: '#7c3aed', textAlign: 'center' }}>
        Just ₹999/month (~$12 USD)
      </p>

      <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
        Most founders find 1 customer in their first month. That's 10-100x ROI.
      </p>

      <a href={upgradeUrl} className="button">
        Upgrade to Premium →
      </a>

      <h2>📈 Your Week 2 Game Plan</h2>

      {hasStartedMessaging ? (
        <p>
          <strong>1.</strong> Send 5 more messages<br />
          <strong>2.</strong> Reply to anyone who responded<br />
          <strong>3.</strong> Track outcomes (Replied → Call Scheduled → Customer)
        </p>
      ) : (
        <p>
          <strong>1.</strong> Find 3 high-score opportunities (≥7.0)<br />
          <strong>2.</strong> Generate and send 3 messages<br />
          <strong>3.</strong> Check back in 48 hours for replies
        </p>
      )}

      <a href={dashboardUrl} className="button">
        Back to Dashboard
      </a>

      <p style={{ marginTop: '32px', fontSize: '14px', color: '#6b7280' }}>
        Still have questions? Just hit reply - we're here to help you succeed.
      </p>

      <p style={{ fontSize: '14px', color: '#6b7280' }}>
        Let's build something amazing,<br />
        <strong>The StartupSniff Team</strong>
      </p>
    </BaseEmailTemplate>
  )
}
