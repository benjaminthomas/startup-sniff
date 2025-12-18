/**
 * Email Template Renderer
 * Story 2.9: Email Notifications and Engagement
 *
 * Converts React email templates to HTML strings for Mailgun
 * Note: Using ReactDOMServer on server-side only
 */

import 'server-only'

/**
 * Render a React email component to HTML string
 * This is a server-side only function
 */
export async function renderEmailToHtml(component: React.ReactElement): Promise<string> {
  // Dynamic import to avoid Next.js client-side issues
  const { renderToStaticMarkup } = await import('react-dom/server')

  const html = renderToStaticMarkup(component)

  // Add DOCTYPE for better email client compatibility
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\n${html}`
}

/**
 * Helper to inline styles for better email client support
 * Note: Most email clients strip <style> tags, so we use inline styles in templates
 */
export function inlineStyles(html: string): string {
  // Basic style inlining - for production, consider using 'juice' or similar library
  // For now, our templates already use inline styles primarily
  return html
}
