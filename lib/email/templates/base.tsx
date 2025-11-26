/**
 * Base Email Template
 * Story 2.9: Email Notifications and Engagement
 *
 * Provides consistent HTML email layout with StartupSniff branding
 */

import 'server-only'

interface BaseEmailTemplateProps {
  preheader?: string
  children: React.ReactNode
  footerText?: string
}

export function BaseEmailTemplate({
  preheader,
  children,
  footerText = 'You received this email because you signed up for StartupSniff.'
}: BaseEmailTemplateProps) {
  return (
    <html lang="en">
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="x-apple-disable-message-reformatting" />
        <title>StartupSniff</title>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f3f4f6;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
          }

          .email-header {
            background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%);
            padding: 32px 24px;
            text-align: center;
          }

          .email-logo {
            font-size: 28px;
            font-weight: 700;
            color: #ffffff;
            margin: 0;
          }

          .email-tagline {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.9);
            margin: 8px 0 0;
          }

          .email-body {
            padding: 40px 24px;
            color: #111827;
          }

          .email-footer {
            background-color: #f9fafb;
            padding: 32px 24px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
          }

          .email-footer-text {
            font-size: 14px;
            color: #6b7280;
            margin: 0 0 16px;
          }

          .email-footer-links {
            font-size: 14px;
            color: #6b7280;
          }

          .email-footer-links a {
            color: #2563eb;
            text-decoration: none;
            margin: 0 8px;
          }

          .email-footer-links a:hover {
            text-decoration: underline;
          }

          h1 {
            font-size: 24px;
            font-weight: 700;
            color: #111827;
            margin: 0 0 16px;
            line-height: 1.3;
          }

          h2 {
            font-size: 20px;
            font-weight: 600;
            color: #111827;
            margin: 32px 0 16px;
            line-height: 1.4;
          }

          p {
            font-size: 16px;
            color: #374151;
            line-height: 1.6;
            margin: 0 0 16px;
          }

          .button {
            display: inline-block;
            padding: 14px 28px;
            background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%);
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 16px 0;
            transition: transform 0.2s;
          }

          .button:hover {
            transform: translateY(-1px);
          }

          .highlight-box {
            background-color: #eff6ff;
            border-left: 4px solid #2563eb;
            padding: 16px 20px;
            margin: 24px 0;
            border-radius: 4px;
          }

          .metric {
            display: inline-block;
            background-color: #f3f4f6;
            padding: 12px 20px;
            border-radius: 8px;
            margin: 8px 8px 8px 0;
            text-align: center;
          }

          .metric-value {
            font-size: 28px;
            font-weight: 700;
            color: #2563eb;
            margin: 0;
          }

          .metric-label {
            font-size: 14px;
            color: #6b7280;
            margin: 4px 0 0;
          }

          .preheader {
            display: none;
            max-height: 0;
            overflow: hidden;
            font-size: 1px;
            line-height: 1px;
            color: transparent;
            opacity: 0;
          }

          @media only screen and (max-width: 600px) {
            .email-wrapper {
              width: 100% !important;
            }

            .email-body {
              padding: 24px 16px !important;
            }

            h1 {
              font-size: 22px !important;
            }

            .button {
              display: block !important;
              width: 100% !important;
              box-sizing: border-box;
            }
          }
        `}</style>
      </head>
      <body>
        {preheader && (
          <div className="preheader">{preheader}</div>
        )}

        <table width="100%" cellPadding="0" cellSpacing="0" role="presentation" style={{ backgroundColor: '#f3f4f6', padding: '24px 0' }}>
          <tr>
            <td align="center">
              <div className="email-wrapper">
                {/* Header */}
                <div className="email-header">
                  <h1 className="email-logo">StartupSniff</h1>
                  <p className="email-tagline">Find Pain Points. Connect with Humans. Build Solutions.</p>
                </div>

                {/* Body */}
                <div className="email-body">
                  {children}
                </div>

                {/* Footer */}
                <div className="email-footer">
                  <p className="email-footer-text">{footerText}</p>
                  <div className="email-footer-links">
                    <a href="https://startupsniff.com/dashboard">Dashboard</a>
                    <span>•</span>
                    <a href="https://startupsniff.com/dashboard/settings">Email Preferences</a>
                    <span>•</span>
                    <a href="https://startupsniff.com/support">Support</a>
                  </div>
                  <p style={{ fontSize: '12px', color: '#9ca3af', margin: '16px 0 0' }}>
                    StartupSniff, Inc. • San Francisco, CA
                  </p>
                </div>
              </div>
            </td>
          </tr>
        </table>
      </body>
    </html>
  )
}
