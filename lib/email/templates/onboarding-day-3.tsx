/**
 * Onboarding Day 3 Email Template
 * Story 2.9: Email Notifications and Engagement
 *
 * Tips for finding and evaluating opportunities
 */

/* eslint-disable react/no-unescaped-entities */

import { BaseEmailTemplate } from './base'

interface OnboardingDay3Props {
  userName: string
  opportunitiesViewedCount: number
  dashboardUrl: string
}

export function OnboardingDay3Email({
  userName,
  opportunitiesViewedCount,
  dashboardUrl
}: OnboardingDay3Props) {
  return (
    <BaseEmailTemplate preheader="3 secrets to finding high-potential pain points on StartupSniff">
      <h1>Day 3: How to Spot Gold 🏆</h1>

      <p>Hey {userName},</p>

      {opportunitiesViewedCount > 0 ? (
        <p>
          Nice! You've explored <strong>{opportunitiesViewedCount} opportunities</strong> so far.
          Here's how to separate the gems from the noise:
        </p>
      ) : (
        <p>
          Ready to find your first customers? Here's how to spot high-potential opportunities on StartupSniff:
        </p>
      )}

      <h2>🎯 The 3-Point Viability Check</h2>

      <div className="highlight-box">
        <p style={{ margin: 0, fontWeight: 600, color: '#1f2937' }}>
          1. Look for Viability Score ≥7.0
        </p>
        <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#6b7280' }}>
          Our AI analyzes commercial potential, urgency, and willingness to pay. High scores = serious buyers.
        </p>
      </div>

      <div className="highlight-box">
        <p style={{ margin: 0, fontWeight: 600, color: '#1f2937' }}>
          2. Check for "🔥 Emerging" Tags
        </p>
        <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#6b7280' }}>
          These pain points are trending UP. Get in early before someone else does.
        </p>
      </div>

      <div className="highlight-box">
        <p style={{ margin: 0, fontWeight: 600, color: '#1f2937' }}>
          3. Read the AI Explanation
        </p>
        <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#6b7280' }}>
          The blue box shows WHY it's valuable. If it resonates with you, it's worth pursuing.
        </p>
      </div>

      <h2>💡 Real Example: High vs. Low Potential</h2>

      <table style={{ width: '100%', marginTop: '16px', marginBottom: '24px' }}>
        <tr>
          <td style={{ padding: '16px', backgroundColor: '#dcfce7', borderRadius: '8px', marginBottom: '8px' }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#15803d' }}>
              ✅ HIGH POTENTIAL (Score: 8.5)
            </p>
            <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#166534' }}>
              "I spend 6 hours/week manually tracking customer feedback from Reddit, Twitter, and email.
              Willing to pay $200/mo for a tool that does this automatically."
            </p>
            <p style={{ margin: '12px 0 0', fontSize: '12px', color: '#166534', fontStyle: 'italic' }}>
              Why it works: Specific pain, quantified time loss, explicit price point, clear solution needed.
            </p>
          </td>
        </tr>
        <tr>
          <td style={{ padding: '16px', backgroundColor: '#fee2e2', borderRadius: '8px' }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#991b1b' }}>
              ❌ LOW POTENTIAL (Score: 3.2)
            </p>
            <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#991b1b' }}>
              "It would be cool if there was an app that made my morning coffee automatically."
            </p>
            <p style={{ margin: '12px 0 0', fontSize: '12px', color: '#991b1b', fontStyle: 'italic' }}>
              Why it fails: Vague desire, no urgency, hardware required, not a business problem.
            </p>
          </td>
        </tr>
      </table>

      <h2>🎬 Your Action Step for Today</h2>

      <p>
        <strong>Find 1 opportunity with a score ≥7.0 and click "Discover Contacts"</strong>
      </p>

      <p>
        You don't need to message anyone yet. Just see who's talking about the problem.
        That's validation step #1.
      </p>

      <a href={dashboardUrl} className="button">
        Browse Opportunities →
      </a>

      <p style={{ marginTop: '32px', fontSize: '14px', color: '#6b7280' }}>
        Tomorrow: How to craft messages that get 40%+ response rates
      </p>

      <p style={{ fontSize: '14px', color: '#6b7280' }}>
        Cheers,<br />
        <strong>The StartupSniff Team</strong>
      </p>
    </BaseEmailTemplate>
  )
}
