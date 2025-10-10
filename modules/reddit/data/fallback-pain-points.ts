import type { PainPoint } from '@/modules/reddit/services/pain-point-extractor';

export const fallbackPainPoints: PainPoint[] = [
  {
    id: 'r_healthcare_telemetry_alert_fatigue',
    title: 'ICU nurses overwhelmed by telemetry alert fatigue',
    content:
      'Our telemetry station throws 100+ alarms per shift. Most are false positives but we still have to acknowledge them manually. It is burning everyone out and we miss the true escalations.',
    subreddit: 'medicine',
    reddit_url: 'https://reddit.com/r/medicine/',
    pain_indicators: ['workflow_issue', 'time_waste', 'ux_issue'],
    opportunity_score: 82,
    engagement_score: 61,
    sentiment_score: -0.67,
    extracted_problems: [
      'Nurses receive hundreds of low priority telemetry alarms',
      'No intelligent filtering to suppress repeat false positives',
      'High cognitive load increases risk of missing true events'
    ],
    market_size_indicator: 'large',
    competition_level: 'medium',
    urgency_level: 'high',
    created_at: new Date().toISOString()
  },
  {
    id: 'r_saas_revops_reporting',
    title: 'RevOps teams still hand-building ARR dashboards monthly',
    content:
      'We have HubSpot + Stripe + Salesforce but every month I copy CSVs into a spreadsheet to reconcile ARR, churn, expansion. Takes 2-3 days and leadership keeps asking for real-time numbers.',
    subreddit: 'SaaS',
    reddit_url: 'https://reddit.com/r/SaaS/',
    pain_indicators: ['workflow_issue', 'integration_issue', 'time_waste'],
    opportunity_score: 76,
    engagement_score: 54,
    sentiment_score: -0.52,
    extracted_problems: [
      'Subscription metrics across tools require manual consolidation',
      'Finance leadership needs real-time ARR visibility',
      'High error risk when reconciling expansion and churn manually'
    ],
    market_size_indicator: 'large',
    competition_level: 'medium',
    urgency_level: 'medium',
    created_at: new Date().toISOString()
  },
  {
    id: 'r_smallbusiness_supply_chain_tracking',
    title: 'Independent retailers blind to upstream supply delays',
    content:
      'We run a specialty grocery chain. Suppliers email PDFs with ship dates. When ports are delayed we only find out when pallets don’t arrive. Need a simple alert before shelves go empty.',
    subreddit: 'smallbusiness',
    reddit_url: 'https://reddit.com/r/smallbusiness/',
    pain_indicators: ['integration_issue', 'time_waste', 'help_seeking'],
    opportunity_score: 71,
    engagement_score: 47,
    sentiment_score: -0.48,
    extracted_problems: [
      'Supplier updates are buried in email attachments',
      'No predictive signal when containers slip ETA',
      'Stores can’t adjust promotions when inventory slips'
    ],
    market_size_indicator: 'medium',
    competition_level: 'low',
    urgency_level: 'high',
    created_at: new Date().toISOString()
  },
  {
    id: 'r_teachers_ai_plagiarism',
    title: 'Teachers struggling to detect AI-generated essays',
    content:
      'High school English teacher here. Students are clearly pasting AI essays. Existing detectors are inaccurate and parents push back. Need a workflow-friendly way to spot AI content and have evidence.',
    subreddit: 'Teachers',
    reddit_url: 'https://reddit.com/r/Teachers/',
    pain_indicators: ['problem', 'help_seeking', 'workflow_issue'],
    opportunity_score: 68,
    engagement_score: 45,
    sentiment_score: -0.6,
    extracted_problems: [
      'AI content slips through current plagiarism tools',
      'Teachers lack time to manually review writing style changes',
      'Need explainable evidence to discuss with students/parents'
    ],
    market_size_indicator: 'large',
    competition_level: 'high',
    urgency_level: 'medium',
    created_at: new Date().toISOString()
  }
];
