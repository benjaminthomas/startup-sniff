# Spec Requirements Document

> Spec: Reddit Trend Analysis Engine
> Created: 2025-09-04
> Status: Planning

## Overview

Build a comprehensive Reddit trend analysis system that extracts startup opportunities from entrepreneurial communities, analyzes sentiment, and feeds trending topics into AI idea generation. This engine will provide entrepreneurs with real-time market insights and emerging pain points from key subreddits to validate and inspire startup concepts.

## User Stories

### 1. Market Research Discovery
**As an entrepreneur, I want to see trending discussions from startup communities so that I can identify emerging market opportunities and pain points.**

**Workflow:**
- User navigates to /dashboard/trends
- System displays trending topics from the last 24h/7d/30d across core subreddits
- User can filter by subreddit, sentiment (positive/negative/neutral), and velocity score
- Each trend shows: topic title, velocity score (growth rate), sentiment analysis, top 3 posts driving the trend
- User can click through to see detailed analysis and save trends for later reference

### 2. AI-Powered Idea Generation Integration
**As a user, I want trending Reddit topics to automatically feed into startup idea generation so that my AI-generated concepts are based on real market discussions.**

**Workflow:**
- User goes to /dashboard/generate and selects "Use Trending Topics" option
- System automatically pulls top 5 trending topics from their selected time window
- AI prompt includes trend context: "Based on trending discussion about [topic] with [sentiment] sentiment and [velocity] growth..."
- Generated ideas include "Why this now?" section explaining the trend timing and market opportunity
- User can regenerate ideas using different trending topics or combine multiple trends

### 3. Competitive Intelligence
**As a startup founder, I want to track sentiment and velocity of discussions around my market vertical so that I can time my product launch and positioning.**

**Workflow:**
- User creates custom keyword alerts for their market vertical (e.g., "productivity tools", "remote work")
- System tracks mentions across all monitored subreddits with daily sentiment and velocity reports
- User receives weekly digest showing trend direction, sentiment shifts, and emerging sub-topics
- Dashboard shows comparative analysis: "Productivity tools discussions up 45% this week vs. 12% average"
- Premium users can export trend data for deeper analysis and presentation to stakeholders

## Spec Scope

### 1. Multi-Subreddit Data Pipeline
Automated collection from 9 core entrepreneurial subreddits with scheduled 30-minute batch processing. Target subreddits: r/entrepreneur, r/startups, r/SaaS, r/digitalnomad, r/sidehustle, r/smallbusiness, r/growmybusiness, r/marketing, r/productivity. System collects post titles, content, scores, comments count, and metadata for trend analysis.

### 2. Trend Detection & Clustering  
AI-powered topic clustering using OpenAI embeddings to identify similar discussions across subreddits. Velocity scoring algorithm calculates trend momentum based on engagement growth rate over time windows. Basic sentiment analysis (positive/negative/neutral) using lightweight NLP to gauge market reception of trending topics.

### 3. Time-Window Analysis
Three distinct analysis periods: Daily (24h) for breaking trends, Weekly (7d) for emerging patterns, Monthly (30d) for established movements. Comparative analytics showing trend velocity changes and sentiment shifts over time. Historical trend tracking to identify cyclical patterns and seasonal opportunities.

### 4. AI Integration Pipeline
Direct integration with existing startup idea generation system. Trending topics automatically populate AI prompts with context about market timing, discussion volume, and sentiment. Generated ideas include trend-specific insights and "market readiness" scores based on discussion velocity and sentiment patterns.

### 5. Subscription-Tiered Access
Plan-based feature access: Explorer (3 trending topics/day, basic sentiment), Founder (25 topics/day, sentiment + velocity, 7-day history), Growth (unlimited access, 30-day history, custom alerts, CSV export). Usage tracking for all trend views and idea generation to enforce plan limits.

## Out of Scope

- **Real-time streaming updates** - Using 30-minute batch processing instead to manage API costs and rate limits
- **Advanced emotion analysis beyond basic sentiment** - Phase 1 focuses on positive/negative/neutral classification
- **Vertical-specific subreddit packs** - Postponed to future releases (e.g., crypto, AI, healthcare verticals)  
- **Direct Reddit posting or user interaction features** - Read-only analysis system to avoid Reddit API complexity
- **Historical data beyond 30 days** - Limited initial scope for MVP validation
- **Advanced NLP features** - Named entity recognition, topic modeling complexity reserved for Phase 2

## Expected Deliverable

### 1. Functional Trend Analysis Dashboard
Complete /dashboard/trends page showing top 10 trending topics with velocity scores (0-100), sentiment indicators, and source subreddit breakdown. Time window selector (24h/7d/30d) with smooth filtering and search functionality. Each trend displays engagement metrics, sample posts, and click-through to detailed analysis view.

### 2. AI Idea Generation Integration
Enhanced /dashboard/generate page with "Use Trending Topics" toggle that automatically incorporates Reddit trend data into AI prompts. Generated startup ideas include "Why this now?" sections with specific trend references, market timing analysis, and sentiment-based opportunity scoring. Seamless user experience with no additional friction in idea generation workflow.

### 3. Subscription-Aware API Infrastructure  
RESTful API endpoints (`/api/trends`, `/api/trends/[id]`) with proper authentication, rate limiting, and plan-based access control. Usage tracking integrated with existing billing system to enforce monthly limits. Error handling for Reddit API failures with graceful degradation and user notification system.

## Spec Documentation

- Tasks: @.agent-os/specs/2025-09-04-reddit-trend-engine/tasks.md
- Technical Specification: @.agent-os/specs/2025-09-04-reddit-trend-engine/sub-specs/technical-spec.md
- Database Schema: @.agent-os/specs/2025-09-04-reddit-trend-engine/sub-specs/database-schema.md
- API Specification: @.agent-os/specs/2025-09-04-reddit-trend-engine/sub-specs/api-spec.md
- Tests Coverage: @.agent-os/specs/2025-09-04-reddit-trend-engine/sub-specs/tests.md