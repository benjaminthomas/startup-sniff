/**
 * Onboarding Day 1 Email Template
 * Story 2.9: Email Notifications and Engagement
 *
 * Welcome email sent immediately after user signs up
 */

/* eslint-disable react/no-unescaped-entities */

import { BaseEmailTemplate } from './base'

interface OnboardingDay1Props {
  userName: string
  dashboardUrl: string
}

export function OnboardingDay1Email({ userName, dashboardUrl }: OnboardingDay1Props) {
  return (
    <BaseEmailTemplate preheader="Welcome to StartupSniff! Discover pain points, connect with potential customers, and validate your ideas.">
      <h1>Welcome to StartupSniff, {userName}! 🎉</h1>

      <p>
        You just unlocked the secret weapon for finding your first customers. StartupSniff helps you discover real pain points from Reddit and connect with the humans experiencing them.
      </p>

      <h2>Here's what you can do right now:</h2>

      <div className="highlight-box">
        <p style={{ margin: 0, fontWeight: 600, color: '#1f2937' }}>
          1. 🔍 Explore pain points from 15+ startup subreddits
        </p>
        <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#6b7280' }}>
          AI-scored opportunities ranked by commercial viability
        </p>
      </div>

      <div className="highlight-box">
        <p style={{ margin: 0, fontWeight: 600, color: '#1f2937' }}>
          2. 🤝 Discover humans behind the pain points
        </p>
        <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#6b7280' }}>
          Find Reddit users actively discussing problems you can solve
        </p>
      </div>

      <div className="highlight-box">
        <p style={{ margin: 0, fontWeight: 600, color: '#1f2937' }}>
          3. ✨ Generate personalized outreach messages
        </p>
        <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#6b7280' }}>
          AI-powered templates that feel human, not spammy
        </p>
      </div>

      <a href={dashboardUrl} className="button">
        Start Exploring Pain Points →
      </a>

      <h2>🚀 Pro Tip: Connect Reddit in 2 Minutes</h2>

      <p>
        To send messages directly from StartupSniff, connect your Reddit account. This takes 30 seconds and makes outreach 10x faster.
      </p>

      <p style={{ fontSize: '14px', color: '#6b7280', fontStyle: 'italic' }}>
        Don't worry - we'll never post anything without your permission. You control every message.
      </p>

      <h2>What to Expect Next</h2>

      <p>
        Over the next 7 days, we'll send you tips on finding the best opportunities, crafting messages that get responses, and turning conversations into customers.
      </p>

      <p>
        <strong>Your first mission:</strong> Browse the Opportunities page and find 3 pain points you could solve. That's it!
      </p>

      <a href={dashboardUrl} className="button">
        View Your Dashboard
      </a>

      <p style={{ marginTop: '32px', fontSize: '14px', color: '#6b7280' }}>
        Questions? Hit reply - we read every email.
      </p>

      <p style={{ fontSize: '14px', color: '#6b7280' }}>
        Happy hunting,<br />
        <strong>The StartupSniff Team</strong>
      </p>
    </BaseEmailTemplate>
  )
}
