/**
 * Weekly Summary Email Template
 * Story 2.9: Email Notifications and Engagement
 *
 * Weekly engagement email with user's metrics and actionable insights
 */

/* eslint-disable react/no-unescaped-entities */

import { BaseEmailTemplate } from './base'

interface WeeklySummaryProps {
  userName: string
  weekNumber: number
  metrics: {
    messagesSent: number
    repliesReceived: number
    callsScheduled: number
    customersAcquired: number
    opportunitiesViewed: number
  }
  insights: {
    bestPerformingSubreddit?: string
    responseRate: number
    comparisonToLastWeek: 'up' | 'down' | 'same'
    percentChange: number
  }
  topOpportunity?: {
    title: string
    score: number
    url: string
  }
  dashboardUrl: string
}

export function WeeklySummaryEmail({
  userName,
  weekNumber,
  metrics,
  insights,
  topOpportunity,
  dashboardUrl
}: WeeklySummaryProps) {
  const hasActivity = metrics.messagesSent > 0 || metrics.opportunitiesViewed > 0

  return (
    <BaseEmailTemplate preheader={`Week ${weekNumber} Summary: ${metrics.messagesSent} messages sent, ${metrics.repliesReceived} replies received`}>
      <h1>Your Week {weekNumber} Summary 📊</h1>

      <p>Hey {userName},</p>

      {hasActivity ? (
        <>
          <p>
            Here's how your customer discovery went this week:
          </p>

          <h2>📈 Your Numbers</h2>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <div className="metric">
              <p className="metric-value">{metrics.messagesSent}</p>
              <p className="metric-label">Messages Sent</p>
            </div>
            <div className="metric">
              <p className="metric-value">{metrics.repliesReceived}</p>
              <p className="metric-label">Replies</p>
            </div>
            <div className="metric">
              <p className="metric-value">{metrics.callsScheduled}</p>
              <p className="metric-label">Calls Scheduled</p>
            </div>
            <div className="metric">
              <p className="metric-value">{metrics.customersAcquired}</p>
              <p className="metric-label">Customers</p>
            </div>
          </div>

          {/* Response Rate Analysis */}
          {metrics.messagesSent > 0 && (
            <div className="highlight-box" style={{
              backgroundColor: insights.responseRate >= 15 ? '#dcfce7' : '#fef3c7',
              borderColor: insights.responseRate >= 15 ? '#16a34a' : '#f59e0b'
            }}>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                {insights.responseRate}% Response Rate {insights.responseRate >= 15 ? '🔥' : '📊'}
              </p>
              <p style={{ margin: '8px 0 0', fontSize: '14px' }}>
                {insights.responseRate >= 40 && "Exceptional! You're in the top 5% of users."}
                {insights.responseRate >= 20 && insights.responseRate < 40 && "Excellent! Above the 20% average for cold outreach."}
                {insights.responseRate >= 15 && insights.responseRate < 20 && "Solid! This beats typical cold email response rates."}
                {insights.responseRate < 15 && "Room to improve. Try our different template variants."}
              </p>
            </div>
          )}

          {/* Week-over-Week Comparison */}
          {weekNumber > 1 && insights.percentChange !== 0 && (
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>
                {insights.comparisonToLastWeek === 'up' && `📈 Up ${insights.percentChange}% from last week - you're building momentum!`}
                {insights.comparisonToLastWeek === 'down' && `📉 Down ${Math.abs(insights.percentChange)}% from last week - let's turn this around.`}
              </p>
            </div>
          )}

          {/* Insights */}
          {insights.bestPerformingSubreddit && (
            <>
              <h2>💡 Insights</h2>
              <p>
                <strong>Your best-performing subreddit:</strong> r/{insights.bestPerformingSubreddit}
              </p>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                Focus more energy here - this audience is responding to your outreach.
              </p>
            </>
          )}

          {/* Conversion Funnel */}
          {metrics.messagesSent > 0 && (
            <>
              <h2>🎯 Your Funnel</h2>
              <table style={{ width: '100%', marginBottom: '24px' }}>
                <tr>
                  <td style={{ padding: '8px 0', fontSize: '14px' }}>Sent</td>
                  <td style={{ padding: '8px 0', fontSize: '14px', textAlign: 'right' }}>
                    <strong>{metrics.messagesSent}</strong>
                  </td>
                  <td style={{ padding: '8px 0', textAlign: 'right' }}>
                    <div style={{ width: '100px', height: '8px', backgroundColor: '#3b82f6', borderRadius: '4px' }}></div>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', fontSize: '14px' }}>Replied</td>
                  <td style={{ padding: '8px 0', fontSize: '14px', textAlign: 'right' }}>
                    <strong>{metrics.repliesReceived}</strong> ({insights.responseRate}%)
                  </td>
                  <td style={{ padding: '8px 0', textAlign: 'right' }}>
                    <div style={{
                      width: `${Math.min(100, insights.responseRate * 2.5)}px`,
                      height: '8px',
                      backgroundColor: '#10b981',
                      borderRadius: '4px'
                    }}></div>
                  </td>
                </tr>
                {metrics.callsScheduled > 0 && (
                  <tr>
                    <td style={{ padding: '8px 0', fontSize: '14px' }}>Calls Scheduled</td>
                    <td style={{ padding: '8px 0', fontSize: '14px', textAlign: 'right' }}>
                      <strong>{metrics.callsScheduled}</strong> ({((metrics.callsScheduled / metrics.repliesReceived) * 100).toFixed(0)}%)
                    </td>
                    <td style={{ padding: '8px 0', textAlign: 'right' }}>
                      <div style={{
                        width: `${Math.min(100, (metrics.callsScheduled / metrics.repliesReceived) * 100 * 2)}px`,
                        height: '8px',
                        backgroundColor: '#8b5cf6',
                        borderRadius: '4px'
                      }}></div>
                    </td>
                  </tr>
                )}
                {metrics.customersAcquired > 0 && (
                  <tr>
                    <td style={{ padding: '8px 0', fontSize: '14px' }}>Customers</td>
                    <td style={{ padding: '8px 0', fontSize: '14px', textAlign: 'right' }}>
                      <strong>{metrics.customersAcquired}</strong> 🎉
                    </td>
                    <td style={{ padding: '8px 0', textAlign: 'right' }}>
                      <div style={{
                        width: `${Math.min(100, (metrics.customersAcquired / metrics.messagesSent) * 100 * 5)}px`,
                        height: '8px',
                        backgroundColor: '#eab308',
                        borderRadius: '4px'
                      }}></div>
                    </td>
                  </tr>
                )}
              </table>
            </>
          )}

          {/* Customer Wins */}
          {metrics.customersAcquired > 0 && (
            <div className="highlight-box" style={{ backgroundColor: '#fef3c7', borderColor: '#eab308' }}>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#854d0e' }}>
                🎉 {metrics.customersAcquired} New Customer{metrics.customersAcquired > 1 ? 's' : ''} This Week!
              </p>
              <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#a16207' }}>
                This is what it's all about. Incredible work, {userName}!
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          <p>
            We noticed you haven't been active on StartupSniff this week. No worries - life happens!
          </p>

          <div className="highlight-box">
            <p style={{ margin: 0, fontWeight: 600 }}>
              Quick reminder: The founders who see the most success check in 2-3 times per week.
            </p>
          </div>

          <p>
            Even 10 minutes of exploring opportunities or sending 1-2 messages can lead to surprising connections.
          </p>
        </>
      )}

      {/* Top Opportunity This Week */}
      {topOpportunity && (
        <>
          <h2>🔥 Don't Miss This</h2>
          <div style={{
            padding: '20px',
            backgroundColor: '#fef3c7',
            border: '2px solid #eab308',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#854d0e' }}>
              NEW HIGH-SCORE OPPORTUNITY
            </p>
            <p style={{ margin: '8px 0', fontSize: '16px', fontWeight: 600, color: '#111827' }}>
              {topOpportunity.title}
            </p>
            <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#a16207' }}>
              Viability Score: <strong>{topOpportunity.score}/10</strong>
            </p>
            <a
              href={topOpportunity.url}
              style={{
                display: 'inline-block',
                marginTop: '12px',
                padding: '8px 16px',
                backgroundColor: '#eab308',
                color: '#854d0e',
                textDecoration: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '14px'
              }}
            >
              View Opportunity →
            </a>
          </div>
        </>
      )}

      <h2>🎯 Action Items for Next Week</h2>

      {metrics.messagesSent === 0 ? (
        <p>
          <strong>1.</strong> Send your first 3 messages (use AI templates - they convert at 20%+)<br />
          <strong>2.</strong> Connect your Reddit account if you haven't yet<br />
          <strong>3.</strong> Explore opportunities with score ≥7.0
        </p>
      ) : (
        <p>
          <strong>1.</strong> Send {metrics.messagesSent < 5 ? '5 more' : 'another 10'} messages<br />
          <strong>2.</strong> Reply to anyone who responded (within 24 hours is ideal)<br />
          <strong>3.</strong> Track outcomes in your Conversations dashboard
        </p>
      )}

      <a href={dashboardUrl} className="button">
        Go to Dashboard →
      </a>

      <p style={{ marginTop: '32px', fontSize: '14px', color: '#6b7280' }}>
        Keep building,<br />
        <strong>The StartupSniff Team</strong>
      </p>

      <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '24px' }}>
        P.S. You can adjust email frequency in your{' '}
        <a href={`${dashboardUrl}/settings`} style={{ color: '#2563eb' }}>
          settings
        </a>
        .
      </p>
    </BaseEmailTemplate>
  )
}
