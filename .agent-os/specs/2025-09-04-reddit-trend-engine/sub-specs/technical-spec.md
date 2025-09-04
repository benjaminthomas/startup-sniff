# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-09-04-reddit-trend-engine/spec.md

> Created: 2025-09-04
> Version: 1.0.0

## Technical Requirements

### 1. Reddit API Integration

**Authentication & Compliance**
- Implement Reddit OAuth2 authentication for production compliance
- User-agent string: `StartupSniff-TrendEngine/1.0 by u/startupsniff`
- Respect Reddit API Terms of Service and rate limiting requirements
- Store refresh tokens securely in database for long-term access

**Rate Limiting & Request Management**
- Enforce 60 requests per minute limit (Reddit API constraint)
- Implement exponential backoff with jitter for rate limit errors
- Request queue with priority system (trending > historical data)
- Circuit breaker pattern for API failure resilience

**Data Collection Schedule**
- Batch processing every 30 minutes using cron/scheduled jobs
- Off-peak collection (2-6 AM UTC) for heavy historical analysis
- Real-time collection for high-velocity trending detection
- Configurable collection intervals per subscription tier

**Target Subreddits**
```typescript
const CORE_SUBREDDITS = [
  'startups',           // Primary startup discussions
  'Entrepreneur',       // General entrepreneurship
  'SaaS',              // SaaS-specific opportunities  
  'SideProject',       // Side project showcases
  'indiehackers',      // Indie hacker community
  'freelance',         // Freelancing opportunities
  'webdev',            // Web development trends
  'marketing',         // Marketing strategy discussions
  'digitalnomad'       // Remote work trends
] as const
```

### 2. Data Processing Pipeline

**Content Deduplication Strategy**
```typescript
interface RedditPostHash {
  id: string
  hash: string // SHA-256 of subreddit+title+author+created_utc
  subreddit: string
  title: string
  author: string
  created_utc: number
}
```

**Sentiment Analysis Implementation**
- Basic polarity scoring: positive (+1 to 0), neutral (0), negative (0 to -1)
- Compound sentiment score calculation for posts and comments
- Weighted sentiment: post_score * 0.7 + avg_comment_score * 0.3
- Context-aware sentiment for business/startup terminology

**Problem-Intent Heuristics**
```typescript
const PROBLEM_KEYWORDS = {
  struggling: ['struggling', 'struggle', 'stuck'],
  inability: ['can\'t', 'cannot', 'unable', 'impossible'],
  seeking_tools: ['any tool', 'tools for', 'software for', 'app for'],
  help_requests: ['how to', 'need help', 'advice on', 'suggestions for']
}

const SOLUTION_INDICATORS = {
  market_validation: ['market', 'customers', 'demand', 'validation'],
  technical_solution: ['build', 'create', 'develop', 'automate'],
  business_model: ['monetize', 'pricing', 'revenue', 'business model']
}
```

**Topic Clustering with AI**
- Weekly clustering of collected posts using OpenAI embeddings
- K-means clustering with dynamic K selection (5-15 clusters)
- Theme identification and labeling via GPT-4
- Cluster stability scoring for trend persistence

### 3. Performance & Caching Strategy

**Edge Runtime Caching**
```typescript
interface TrendCache {
  key: string
  data: TrendData[]
  timestamp: number
  ttl: number // 15 minutes default
}

const CACHE_CONFIG = {
  hot_trends: 900,     // 15 minutes
  daily_data: 3600,    // 1 hour
  weekly_rollups: 14400, // 4 hours
  monthly_stats: 86400   // 24 hours
}
```

**Database Optimization**
- Materialized views for weekly/monthly trend aggregates
- Nightly rollup jobs for historical data consolidation
- Partitioned tables by date for efficient queries
- Composite indexes on (subreddit, created_at, sentiment_score)

**Velocity Scoring Algorithm**
```typescript
interface VelocityScore {
  velocity: number      // Posts per hour growth rate (weight: 0.4)
  volume_7d: number     // 7-day post count (weight: 0.3)
  neg_intent_ratio: number // Problem-intent ratio (weight: 0.2)
  engagement: number    // Upvotes + comments (weight: 0.1)
  final_score: number   // Weighted composite score
}

function calculateVelocityScore(trend: TrendData): number {
  return (
    trend.velocity * 0.4 +
    trend.volume_7d * 0.3 +
    trend.neg_intent_ratio * 0.2 +
    trend.engagement * 0.1
  )
}
```

### 4. UI Components Architecture

**Trend Visualization Components**
```typescript
// Sparkline trend indicators
interface SparklineProps {
  data: number[]
  timeRange: '24h' | '7d' | '30d'
  trend: 'rising' | 'stable' | 'falling'
}

// Trend status chips
interface TrendChipProps {
  trend: TrendDirection
  velocity: number
  change_percent: number
}

// Subreddit activity heatmap
interface HeatmapProps {
  subreddits: string[]
  activity_matrix: number[][]
  time_labels: string[]
}
```

**Time Window Controls**
- Daily view: Last 24 hours with hourly granularity
- Weekly view: Last 7 days with daily granularity (default)
- Monthly view: Last 30 days with weekly granularity
- Custom range picker for Founder+ subscribers

**Chart Implementation Strategy**
- Primary: Line charts for trend progression
- Secondary: Status badges for quick trend identification
- Minimal design: Focus on data clarity over complexity
- Responsive design: Mobile-first trend cards

### 5. AI Integration Pipeline

**Topic to Idea Generation Flow**
```typescript
interface TrendContext {
  topic_cluster: TopicCluster
  representative_posts: RedditPost[]
  velocity_score: number
  problem_statements: string[]
  market_signals: string[]
}

async function generateIdeaFromTrend(context: TrendContext): Promise<StartupIdea> {
  const prompt = `
    Analyze this trending topic from Reddit entrepreneurship communities:
    
    Topic: ${context.topic_cluster.theme}
    Velocity Score: ${context.velocity_score}
    
    Representative Problems:
    ${context.problem_statements.join('\n')}
    
    Market Context:
    ${context.market_signals.join('\n')}
    
    Generate a startup idea that addresses this trend...
  `
  
  return await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' }
  })
}
```

**Context Enrichment Strategy**
- Problem summary: Top 5 most upvoted problem statements
- Sample quotes: Direct user quotes showing pain points
- Velocity metrics: Why this trend is accelerating now
- Competitive landscape: Existing solutions mentioned in discussions

**"Why This Now" Explanation Generation**
```typescript
interface TrendExplanation {
  timing_factors: string[]
  market_conditions: string[]
  technology_enablers: string[]
  social_drivers: string[]
}
```

### 6. Subscription Tier Enforcement

**Plan Limits Configuration**
```typescript
const SUBSCRIPTION_LIMITS = {
  free: {
    trending_topics_per_week: 5,
    idea_generations_per_month: 1,
    time_windows: ['7d'],
    features: ['view_only']
  },
  starter: {
    trending_topics_per_week: 25,
    idea_generations_per_month: 10,
    time_windows: ['24h', '7d'],
    features: ['daily_charts', 'weekly_charts']
  },
  founder_plus: {
    trending_topics_per_week: -1, // unlimited
    idea_generations_per_month: 50,
    time_windows: ['24h', '7d', '30d', 'custom'],
    features: ['csv_export', 'trend_alerts', 'priority_support']
  }
} as const
```

**Overage Handling System**
- Soft caps: Show usage warnings at 80% of limit
- Add-on packages: $3 per additional 10 idea generations
- Grace period: 3-day buffer for plan upgrades
- Usage reset: Monthly cycle aligned with billing date

**Feature Gating Implementation**
```typescript
async function checkFeatureAccess(
  userId: string, 
  feature: FeatureName,
  usage_type: UsageType
): Promise<AccessResult> {
  const user = await getUserWithPlan(userId)
  const limits = SUBSCRIPTION_LIMITS[user.plan_type]
  const usage = await getCurrentUsage(userId)
  
  if (usage[usage_type] >= limits[usage_type]) {
    return {
      allowed: false,
      reason: 'limit_exceeded',
      upgrade_options: calculateUpgradeOptions(user.plan_type)
    }
  }
  
  return { allowed: true }
}
```

## External Dependencies

### reddit
- **Purpose:** Official Reddit API client for Node.js with OAuth2 support
- **Justification:** Reddit API integration requires specialized OAuth2 flow, rate limiting, and API compliance features not available in generic HTTP clients
- **Version:** ^1.2.1
- **Key Features:** Built-in rate limiting, token refresh, API method coverage

### node-cron  
- **Purpose:** Reliable scheduled job execution for batch processing
- **Justification:** 30-minute Reddit data collection intervals require robust cron scheduling with timezone support and failure recovery
- **Version:** ^3.0.3
- **Key Features:** Timezone support, job recovery, execution logging

### sentiment
- **Purpose:** Real-time sentiment analysis of Reddit posts and comments
- **Justification:** Basic sentiment polarity scoring needs efficient, lightweight library for processing high-volume Reddit content
- **Version:** ^5.0.2  
- **Key Features:** Polarity scoring, compound analysis, custom lexicon support

### openai (Enhanced)
- **Purpose:** Extended AI integration for topic clustering and enhanced idea generation
- **Justification:** Topic clustering via embeddings and GPT-4 trend analysis requires advanced OpenAI features beyond basic completions
- **Version:** ^4.20.1
- **New Features:** Embeddings API, batch processing, structured outputs

### Additional Performance Dependencies

### ioredis
- **Purpose:** High-performance Redis client for trend caching
- **Justification:** Edge runtime caching with 15-minute TTL requires efficient Redis operations with connection pooling
- **Version:** ^5.3.2

### @vercel/cron  
- **Purpose:** Vercel-native cron job scheduling
- **Justification:** Seamless integration with Vercel deployment for reliable batch processing execution
- **Version:** ^0.1.0