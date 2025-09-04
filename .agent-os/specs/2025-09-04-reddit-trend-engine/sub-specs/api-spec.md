# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-09-04-reddit-trend-engine/spec.md

> Created: 2025-09-04
> Version: 1.0.0

## API Endpoints

### 1. GET /api/trends

**Purpose:** Retrieve trending topics with filtering and pagination

**Authentication:** Required, plan limits enforced

**Parameters:**
- `timeWindow` (query): '24h' | '7d' | '30d' (default: '7d')
- `limit` (query): number (default: 10, max: 50)
- `subreddit` (query): string - filter by specific subreddit (e.g., 'entrepreneur', 'startups')
- `minScore` (query): number - minimum trend score threshold (0-100)
- `category` (query): 'business' | 'technology' | 'lifestyle' | 'all' (default: 'all')

**Request Example:**
```javascript
GET /api/trends?timeWindow=7d&limit=20&subreddit=entrepreneur&minScore=70

Headers:
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "trends": [
      {
        "id": "trend_123",
        "topic": "AI automation tools",
        "score": 85,
        "velocity": 12.5,
        "sentiment": {
          "positive": 0.72,
          "negative": 0.18,
          "neutral": 0.10
        },
        "subreddit_distribution": {
          "entrepreneur": 45,
          "startups": 32,
          "SaaS": 23
        },
        "keywords": ["AI", "automation", "productivity", "SaaS"],
        "posts_count": 147,
        "time_window": "7d",
        "created_at": "2025-09-04T10:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 3,
      "total_count": 56,
      "has_more": true
    },
    "usage": {
      "requests_used": 15,
      "requests_limit": 100,
      "resets_at": "2025-09-05T00:00:00Z"
    }
  }
}
```

**Errors:**
- `401` Unauthorized - Invalid or missing authentication token
- `403` Forbidden - Plan limit exceeded or feature not available
- `422` Unprocessable Entity - Invalid query parameters
- `429` Too Many Requests - Rate limit exceeded

### 2. GET /api/trends/[topicId]/posts

**Purpose:** Get representative posts for a specific trending topic

**Authentication:** Required, Starter+ plan

**Parameters:**
- `topicId` (path): UUID of the trending topic
- `limit` (query): number (default: 5, max: 20)
- `sortBy` (query): 'score' | 'sentiment' | 'recency' (default: 'score')
- `includeComments` (query): boolean - include top comments (Founder+ only)

**Request Example:**
```javascript
GET /api/trends/trend_123/posts?limit=10&sortBy=sentiment&includeComments=true

Headers:
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "topic": {
      "id": "trend_123",
      "topic": "AI automation tools",
      "score": 85
    },
    "posts": [
      {
        "id": "post_456",
        "title": "Built an AI tool that saves 10 hours/week",
        "content": "After months of development...",
        "author": "u/[REDACTED]",
        "subreddit": "entrepreneur",
        "score": 342,
        "comments_count": 89,
        "sentiment_score": 0.87,
        "engagement_rate": 0.26,
        "created_at": "2025-09-03T14:30:00Z",
        "url": "https://reddit.com/r/entrepreneur/comments/...",
        "top_comments": [
          {
            "content": "This is exactly what I need for my startup",
            "score": 45,
            "sentiment_score": 0.92
          }
        ]
      }
    ],
    "analysis": {
      "common_pain_points": [
        "Time-consuming manual tasks",
        "Lack of automation expertise",
        "High cost of existing solutions"
      ],
      "opportunity_indicators": [
        "High engagement on solution posts",
        "Multiple requests for similar tools",
        "Positive sentiment toward automation"
      ]
    }
  }
}
```

**Errors:**
- `401` Unauthorized
- `403` Forbidden - Feature requires Starter+ plan
- `404` Not Found - Topic ID not found
- `429` Too Many Requests

### 3. POST /api/trends/analyze

**Purpose:** Trigger manual trend analysis for user's tracked keywords

**Authentication:** Required, Founder+ plan only

**Parameters (Request Body):**
```json
{
  "keywords": ["string array", "max 10 for Founder+", "max 25 for Growth"],
  "timeWindow": "24h | 7d | 30d",
  "subreddits": ["entrepreneur", "startups", "SaaS"],
  "priority": "normal | high"
}
```

**Request Example:**
```javascript
POST /api/trends/analyze

Headers:
Authorization: Bearer <jwt_token>
Content-Type: application/json

Body:
{
  "keywords": ["AI productivity", "remote work tools", "SaaS automation"],
  "timeWindow": "7d",
  "subreddits": ["entrepreneur", "startups", "digitalnomad"],
  "priority": "high"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "job_id": "analysis_789",
    "status": "queued",
    "estimated_completion": "2025-09-04T10:15:00Z",
    "keywords_count": 3,
    "subreddits_count": 3,
    "time_window": "7d",
    "priority": "high",
    "webhook_url": "/api/webhooks/trend-analysis"
  }
}
```

**Errors:**
- `401` Unauthorized
- `403` Forbidden - Feature requires Founder+ plan
- `422` Unprocessable Entity - Invalid keywords or parameters
- `429` Too Many Requests - Analysis limit exceeded

### 4. GET /api/trends/stats

**Purpose:** Get user's trend analysis usage statistics

**Authentication:** Required

**Request Example:**
```javascript
GET /api/trends/stats

Headers:
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "current_period": {
      "period_start": "2025-09-01T00:00:00Z",
      "period_end": "2025-09-30T23:59:59Z"
    },
    "usage": {
      "trend_requests": {
        "used": 45,
        "limit": 100,
        "remaining": 55
      },
      "keyword_analysis": {
        "used": 3,
        "limit": 10,
        "remaining": 7
      },
      "post_details": {
        "used": 23,
        "limit": 200,
        "remaining": 177
      }
    },
    "plan": {
      "type": "founder",
      "tier": "paid",
      "features": [
        "unlimited_trend_viewing",
        "keyword_analysis",
        "post_details",
        "sentiment_analysis"
      ]
    },
    "reset_date": "2025-10-01T00:00:00Z"
  }
}
```

**Errors:**
- `401` Unauthorized

### 5. POST /api/ideas/from-trend

**Purpose:** Generate startup ideas based on trending topic

**Authentication:** Required, counts against idea generation quota

**Parameters (Request Body):**
```json
{
  "topicId": "UUID of trending topic",
  "focusArea": "Optional focus for idea generation",
  "ideaCount": "Number of ideas to generate (1-3)",
  "targetMarket": "Optional target market specification"
}
```

**Request Example:**
```javascript
POST /api/ideas/from-trend

Headers:
Authorization: Bearer <jwt_token>
Content-Type: application/json

Body:
{
  "topicId": "trend_123",
  "focusArea": "SaaS productivity tools",
  "ideaCount": 2,
  "targetMarket": "Remote teams and digital nomads"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "trend_context": {
      "topic": "AI automation tools",
      "score": 85,
      "velocity": 12.5,
      "key_insights": [
        "High demand for time-saving automation",
        "Users frustrated with complex existing tools",
        "Strong willingness to pay for effective solutions"
      ]
    },
    "generated_ideas": [
      {
        "id": "idea_987",
        "title": "AI-Powered Email Assistant for Entrepreneurs",
        "problem_statement": "Entrepreneurs waste 2+ hours daily on email management...",
        "solution": {
          "value_proposition": "Reduce email time by 80% with AI that understands business context",
          "features": [
            "Smart email categorization",
            "AI-generated responses",
            "Meeting scheduling automation"
          ],
          "business_model": "SaaS subscription with usage-based pricing"
        },
        "why_now": {
          "trend_alignment": "Matches current AI automation trend with 85% score",
          "market_timing": "Reddit discussions show 340% increase in automation interest",
          "user_readiness": "High positive sentiment (72%) toward AI productivity tools"
        },
        "target_market": {
          "demographic": "Startup founders and small business owners",
          "size": 2500000,
          "pain_level": "high"
        },
        "ai_confidence_score": 89
      }
    ],
    "usage_impact": {
      "ideas_used": 2,
      "ideas_remaining": 23,
      "resets_at": "2025-10-01T00:00:00Z"
    }
  }
}
```

**Errors:**
- `401` Unauthorized
- `403` Forbidden - Idea generation limit exceeded
- `404` Not Found - Topic ID not found
- `422` Unprocessable Entity - Invalid parameters

### 6. GET /api/trends/jobs/[jobId]

**Purpose:** Check status of trend analysis job

**Authentication:** Required

**Request Example:**
```javascript
GET /api/trends/jobs/analysis_789

Headers:
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "job_id": "analysis_789",
    "status": "completed | processing | queued | failed",
    "progress": 100,
    "results": {
      "trends_found": 12,
      "total_posts_analyzed": 1247,
      "keywords_matched": 3,
      "top_trend": {
        "topic": "AI productivity tools",
        "score": 87
      }
    },
    "created_at": "2025-09-04T10:00:00Z",
    "completed_at": "2025-09-04T10:14:32Z"
  }
}
```

## Controllers

### TrendsController

**Location:** `app/api/trends/route.ts`

**Business Logic:**
- Plan-based rate limiting enforcement
- Subreddit filtering and validation
- Score threshold validation
- Pagination handling
- Usage tracking and quota management

**Key Methods:**
```typescript
export async function GET(request: NextRequest) {
  // 1. Authenticate user and get plan
  const user = await authenticateUser(request)
  const plan = await getUserPlan(user.id)
  
  // 2. Check rate limits
  await checkRateLimit(user.id, plan.type, 'trend_requests')
  
  // 3. Parse and validate query parameters
  const params = await validateTrendParams(request.url)
  
  // 4. Apply plan-based restrictions
  const effectiveLimit = Math.min(params.limit, PLAN_LIMITS[plan.type].max_trends_per_request)
  
  // 5. Query trends with filters
  const trends = await queryTrends({
    ...params,
    limit: effectiveLimit,
    userId: user.id
  })
  
  // 6. Track usage
  await updateUsageStats(user.id, 'trend_requests', 1)
  
  // 7. Return formatted response
  return Response.json({
    success: true,
    data: {
      trends,
      pagination: buildPagination(trends, params),
      usage: await getUserUsage(user.id)
    }
  })
}
```

**Error Handling:**
- Plan validation and feature access control
- Rate limiting with exponential backoff
- Input sanitization and validation
- Graceful degradation for API failures

### TrendPostsController

**Location:** `app/api/trends/[topicId]/posts/route.ts`

**Business Logic:**
- Topic existence validation
- Plan feature access (Starter+ required)
- Comment inclusion based on plan (Founder+ only)
- Sentiment analysis integration
- Content moderation and PII redaction

### TrendAnalysisController

**Location:** `app/api/trends/analyze/route.ts`

**Business Logic:**
- Founder+ plan requirement enforcement
- Keyword validation and limits
- Subreddit whitelist validation
- Analysis job queue management
- Webhook notification setup

**Key Features:**
- Async processing with job queue
- Priority handling based on plan
- Keyword clustering and optimization
- Real-time progress tracking

### IdeaGenerationController

**Location:** `app/api/ideas/from-trend/route.ts`

**Business Logic:**
- Integration with existing idea generation system
- Trend context injection into AI prompts
- "Why now" analysis generation
- Usage quota enforcement
- Trend-to-idea mapping optimization

## Integration Points

### 1. Existing StartupSniff Features

**Dashboard Integration:**
- Trend widgets on main dashboard
- Usage statistics in sidebar
- Quick trend-to-idea generation buttons

**Idea Management Integration:**
- Trend-generated ideas marked with special badges
- "Why now" section in idea details
- Trend source attribution and links

**Analytics Integration:**
- Trend engagement tracking
- Conversion rates from trends to ideas
- User behavior analysis on trend features

### 2. Plan Limit Enforcement Strategy

**Real-time Quota Checking:**
```typescript
interface PlanLimits {
  explorer: {
    trend_requests: 20,
    post_details: 0,
    keyword_analysis: 0,
    idea_from_trend: 1
  },
  founder: {
    trend_requests: 100,
    post_details: 200,
    keyword_analysis: 10,
    idea_from_trend: 25
  },
  growth: {
    trend_requests: -1, // unlimited
    post_details: -1,
    keyword_analysis: 50,
    idea_from_trend: -1
  }
}
```

**Middleware Implementation:**
- Pre-request quota validation
- Soft and hard limit enforcement
- Grace period handling for plan upgrades
- Usage reset scheduling

### 3. Usage Tracking Integration

**Event Tracking:**
- Trend view events
- Post detail access events
- Keyword analysis triggers
- Idea generation from trends

**Analytics Pipeline:**
```typescript
await trackEvent('trend_viewed', {
  userId: user.id,
  trendId: trend.id,
  trendTopic: trend.topic,
  userPlan: user.plan,
  timeWindow: params.timeWindow
})
```

### 4. AI Idea Generation Pipeline Integration

**Enhanced Prompts with Trend Context:**
```typescript
const trendContext = {
  topic: trend.topic,
  score: trend.score,
  velocity: trend.velocity,
  sentiment: trend.sentiment,
  keyPosts: representativePosts,
  painPoints: extractedPainPoints,
  opportunities: opportunityIndicators
}

const enhancedPrompt = `
Generate a startup idea based on this trending topic:
${JSON.stringify(trendContext)}

Focus on the "Why now" factor given the trend momentum and timing.
`
```

**Response Enhancement:**
- Trend attribution in generated ideas
- "Why now" section with trend data
- Market timing validation
- Trend momentum scores

### 5. Rate Limiting Strategy

**Multi-tier Rate Limiting:**
- Per-user limits based on plan
- Per-endpoint specific limits
- Global system protection limits
- Burst allowance for premium plans

**Implementation:**
```typescript
const rateLimits = {
  '/api/trends': {
    explorer: '20/hour',
    founder: '100/hour',
    growth: '500/hour'
  },
  '/api/trends/analyze': {
    explorer: '0/hour',
    founder: '10/hour', 
    growth: '50/hour'
  }
}
```

### 6. Error Handling and Monitoring

**Comprehensive Error Tracking:**
- API response time monitoring
- Error rate tracking by endpoint
- Plan-based usage analytics
- Reddit API health monitoring

**Fallback Strategies:**
- Cached trend data for API failures
- Graceful degradation for premium features
- User-friendly error messages
- Automatic retry mechanisms

This API specification ensures seamless integration with the existing StartupSniff architecture while providing robust trend analysis capabilities across all subscription tiers.