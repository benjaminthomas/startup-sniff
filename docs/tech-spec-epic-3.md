# Technical Specification: Epic 3 - Network Intelligence Foundation

**Project:** StartupSniff
**Epic:** Epic 3 - Network Intelligence Foundation
**Timeline:** Weeks 17-24 (Month 5-6)
**Story Count:** 9 stories
**Author:** Benjamin
**Date:** 2025-10-13
**Status:** Draft

---

## 1. Overview and Scope

### 1.1 Epic Goal

Build the defensive data moat by collecting anonymized experiment data and surfacing initial pattern recognition that competitors cannot replicate. This epic transforms StartupSniff from a workflow tool into a network intelligence platform where collective learning improves outcomes for all users.

### 1.2 Success Criteria

**Validation Metrics (GREEN Zone):**
- **Experiments Logged:** 500+ experiments with complete outcome data
- **Data Opt-In Rate:** >70% of users consent to anonymized data collection
- **Pattern Differentiation:** Measurable, statistically significant patterns detected (p-value <0.05)
- **Insight Usage:** >40% of users reference insights before sending messages
- **Prediction Accuracy:** >70% accuracy on validation set
- **Competitive Moat:** 12+ month replication time for competitors

**YELLOW Zone (Iteration Required):**
- Experiments: 300-500
- Opt-in: 50-70%
- Patterns: Marginal differentiation
- Insight usage: 20-40%
- Prediction accuracy: 60-70%

**RED Zone (Kill Criteria):**
- Experiments: <300
- Opt-in: <50%
- Patterns: No differentiation
- Insight usage: <20%
- Prediction accuracy: <60%

### 1.3 Prerequisites

**Epic 2 Validation Requirements:**
- Epic 2 in GREEN zone (>10% send rate, >15% response rate, $200+ MRR)
- Minimum 100 users with conversation tracking data
- Minimum 500 messages sent across user base
- Clean data pipeline from Epic 2 (messages, outcomes, pain points)

### 1.4 Scope

**In Scope:**
- Anonymized experiment data collection with explicit consent
- Social proof display on pain point cards
- Pattern recognition MVP (subreddit, timing, template analysis)
- "What worked for others" contextual insights
- Predictive validation scoring foundation (ML model)
- Data contribution gamification
- Privacy dashboard and GDPR compliance
- Network intelligence analytics
- Epic 3 validation dashboard

**Out of Scope (Future Enhancements):**
- Advanced ML models (deep learning, recommendation engines)
- Real-time collaborative filtering
- Cross-platform data integration (beyond Reddit)
- Premium insights tier (monetization of advanced patterns)
- Third-party data marketplace

**Technical Debt to Address:**
- None specific to Epic 3; maintain clean architecture from Epic 1-2

---

## 2. Detailed Design

### 2.1 Services and Modules

| Service/Module | Responsibility | Key Operations | Dependencies |
|----------------|----------------|----------------|--------------|
| `modules/experiments` | Experiment lifecycle management | Track experiments, log outcomes, anonymize data | Users, pain points, messages |
| `modules/insights` | Pattern detection and insight generation | Calculate patterns, score confidence, generate insights | Experiments, PostgreSQL, Redis |
| `modules/predictions` | Predictive scoring via ML | Train model, predict success likelihood, track accuracy | Experiments, Python/scikit-learn |
| `modules/privacy` | GDPR compliance and data controls | Export data, delete data, manage consent | Users, experiments |
| `modules/gamification` | Contribution tracking and badges | Award badges, track streaks, calculate impact | Users, experiments |
| `lib/ml/model-trainer` | ML model training pipeline | Feature engineering, model training, validation | Experiments, scikit-learn |
| `lib/stats` | Statistical analysis utilities | Significance testing, confidence intervals | None |

### 2.2 Data Models

#### 2.2.1 New Tables

**experiments (Core data collection table)**

```sql
CREATE TABLE experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  anonymous_id UUID NOT NULL DEFAULT gen_random_uuid(), -- For anonymized analysis
  pain_point_id UUID NOT NULL REFERENCES reddit_posts(id),
  contact_id UUID REFERENCES reddit_contacts(id),
  message_id UUID REFERENCES messages(id),

  -- Experiment context
  subreddit TEXT NOT NULL,
  commercial_viability_score INT, -- From pain point
  trend_status TEXT, -- 'emerging', 'trending_up', 'stable', 'declining'
  user_segment TEXT NOT NULL, -- 'first_timer', 'experienced'

  -- Outcome tracking
  outcome TEXT NOT NULL, -- 'explored', 'messaged', 'replied', 'call_scheduled', 'customer_acquired'
  template_variant TEXT, -- 'professional', 'casual', 'concise', 'value_first'
  send_time TIME, -- Time of day message sent (for timing patterns)
  send_day_of_week INT, -- 0-6 for pattern analysis

  -- Response metrics
  response_received BOOLEAN DEFAULT FALSE,
  response_time_hours INT, -- Hours until response (NULL if no response)

  -- Data quality
  outcome_confidence TEXT DEFAULT 'low', -- 'low', 'medium', 'high' (manual log quality)

  -- Consent
  data_sharing_consent BOOLEAN NOT NULL DEFAULT FALSE,

  -- Timestamps
  explored_at TIMESTAMPTZ,
  messaged_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  outcome_logged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_experiments_anonymous_id ON experiments(anonymous_id);
CREATE INDEX idx_experiments_pain_point_id ON experiments(pain_point_id);
CREATE INDEX idx_experiments_outcome ON experiments(outcome);
CREATE INDEX idx_experiments_subreddit ON experiments(subreddit);
CREATE INDEX idx_experiments_data_sharing_consent ON experiments(data_sharing_consent);
CREATE INDEX idx_experiments_messaged_at ON experiments(messaged_at DESC);
```

**insights (Pattern storage)**

```sql
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Pattern identification
  insight_type TEXT NOT NULL, -- 'subreddit_performance', 'timing_optimization', 'template_effectiveness', 'user_segment_success'
  category TEXT NOT NULL, -- 'subreddit', 'timing', 'template', 'segment'

  -- Pattern details
  title TEXT NOT NULL, -- "Morning messages get 2x response rate"
  description TEXT NOT NULL, -- Detailed explanation
  recommendation TEXT, -- Actionable advice

  -- Statistical metrics
  sample_size INT NOT NULL,
  confidence_score DECIMAL(3,2) NOT NULL, -- 0.00 to 1.00
  p_value DECIMAL(4,3), -- Statistical significance
  effect_size DECIMAL(3,2), -- Cohen's d or similar

  -- Pattern data
  segment_a_value TEXT, -- e.g., "morning" or "r/entrepreneur"
  segment_a_metric DECIMAL(5,2), -- e.g., 18.5% response rate
  segment_b_value TEXT, -- e.g., "evening" or "r/startups"
  segment_b_metric DECIMAL(5,2), -- e.g., 11.2% response rate

  -- Quality control
  is_active BOOLEAN DEFAULT TRUE, -- Deactivate if pattern becomes obsolete
  quality_score DECIMAL(3,2), -- Overall quality (0-1)

  -- Metadata
  first_detected_at TIMESTAMPTZ NOT NULL,
  last_validated_at TIMESTAMPTZ,
  validation_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_insights_category ON insights(category);
CREATE INDEX idx_insights_is_active ON insights(is_active);
CREATE INDEX idx_insights_confidence_score ON insights(confidence_score DESC);
CREATE INDEX idx_insights_insight_type ON insights(insight_type);
```

**user_contributions (Gamification tracking)**

```sql
CREATE TABLE user_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Contribution metrics
  experiments_logged INT DEFAULT 0,
  complete_outcomes INT DEFAULT 0, -- High-quality data (outcome logged)
  incomplete_outcomes INT DEFAULT 0,
  data_quality_score DECIMAL(3,2) DEFAULT 0, -- 0.00 to 1.00

  -- Impact tracking
  impact_score INT DEFAULT 0, -- Calculated based on contribution value
  patterns_contributed_to INT DEFAULT 0,

  -- Badges and achievements
  badges JSONB DEFAULT '[]'::jsonb, -- ['early_contributor', 'data_champion', 'pattern_pioneer']
  achievements JSONB DEFAULT '{}'::jsonb, -- {streak_days: 7, total_experiments: 50}

  -- Streaks
  current_streak_days INT DEFAULT 0,
  longest_streak_days INT DEFAULT 0,
  last_contribution_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_contributions_user_id ON user_contributions(user_id);
CREATE INDEX idx_user_contributions_impact_score ON user_contributions(impact_score DESC);
```

**predictions (ML model predictions)**

```sql
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Prediction target
  pain_point_id UUID NOT NULL REFERENCES reddit_posts(id),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Model information
  model_version TEXT NOT NULL, -- 'v1.0', 'v1.1', etc.
  model_type TEXT NOT NULL, -- 'logistic_regression', 'random_forest', etc.

  -- Prediction results
  success_probability DECIMAL(4,3) NOT NULL, -- 0.000 to 1.000
  confidence_interval_low DECIMAL(4,3), -- e.g., 0.70
  confidence_interval_high DECIMAL(4,3), -- e.g., 0.95

  -- Explanation
  explanation TEXT, -- "Similar founders (first-timers in SaaS) achieved 85% response rate"
  contributing_factors JSONB, -- {subreddit: 0.3, viability_score: 0.25, trend: 0.2, segment: 0.25}

  -- Validation
  actual_outcome TEXT, -- Filled after experiment completes
  prediction_correct BOOLEAN, -- TRUE if prediction matched outcome

  -- Feature values (for debugging/analysis)
  features JSONB, -- {subreddit: 'entrepreneur', score: 8, trend: 'up', segment: 'first_timer'}

  created_at TIMESTAMPTZ DEFAULT NOW(),
  validated_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_predictions_pain_point_id ON predictions(pain_point_id);
CREATE INDEX idx_predictions_model_version ON predictions(model_version);
CREATE INDEX idx_predictions_created_at ON predictions(created_at DESC);
```

**pattern_quality_feedback (User feedback on insights)**

```sql
CREATE TABLE pattern_quality_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_id UUID NOT NULL REFERENCES insights(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  was_helpful BOOLEAN NOT NULL,
  feedback_text TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pattern_quality_feedback_insight_id ON pattern_quality_feedback(insight_id);
```

#### 2.2.2 TypeScript Interfaces

```typescript
// modules/experiments/types.ts
export interface Experiment {
  id: string
  user_id: string
  anonymous_id: string
  pain_point_id: string
  contact_id: string | null
  message_id: string | null

  // Context
  subreddit: string
  commercial_viability_score: number | null
  trend_status: 'emerging' | 'trending_up' | 'stable' | 'declining' | null
  user_segment: 'first_timer' | 'experienced'

  // Outcome
  outcome: 'explored' | 'messaged' | 'replied' | 'call_scheduled' | 'customer_acquired'
  template_variant: 'professional' | 'casual' | 'concise' | 'value_first' | null
  send_time: string | null // HH:MM format
  send_day_of_week: number | null // 0-6

  // Response
  response_received: boolean
  response_time_hours: number | null

  // Quality
  outcome_confidence: 'low' | 'medium' | 'high'
  data_sharing_consent: boolean

  // Timestamps
  explored_at: string | null
  messaged_at: string | null
  responded_at: string | null
  outcome_logged_at: string | null
  created_at: string
  updated_at: string
}

// modules/insights/types.ts
export interface Insight {
  id: string
  insight_type: 'subreddit_performance' | 'timing_optimization' | 'template_effectiveness' | 'user_segment_success'
  category: 'subreddit' | 'timing' | 'template' | 'segment'

  title: string
  description: string
  recommendation: string | null

  // Stats
  sample_size: number
  confidence_score: number // 0-1
  p_value: number | null
  effect_size: number | null

  // Comparison
  segment_a_value: string
  segment_a_metric: number
  segment_b_value: string
  segment_b_metric: number

  is_active: boolean
  quality_score: number

  first_detected_at: string
  last_validated_at: string | null
  validation_count: number
  created_at: string
  updated_at: string
}

// modules/predictions/types.ts
export interface Prediction {
  id: string
  pain_point_id: string
  user_id: string | null

  model_version: string
  model_type: string

  success_probability: number // 0-1
  confidence_interval_low: number | null
  confidence_interval_high: number | null

  explanation: string | null
  contributing_factors: {
    subreddit: number
    viability_score: number
    trend: number
    segment: number
  } | null

  actual_outcome: string | null
  prediction_correct: boolean | null

  features: Record<string, any>

  created_at: string
  validated_at: string | null
  updated_at: string
}

// modules/gamification/types.ts
export interface UserContribution {
  id: string
  user_id: string

  experiments_logged: number
  complete_outcomes: number
  incomplete_outcomes: number
  data_quality_score: number

  impact_score: number
  patterns_contributed_to: number

  badges: Badge[]
  achievements: Record<string, number>

  current_streak_days: number
  longest_streak_days: number
  last_contribution_at: string | null

  created_at: string
  updated_at: string
}

export type Badge =
  | 'early_contributor'
  | 'data_champion'
  | 'pattern_pioneer'
  | 'consistency_master'
  | 'quality_expert'

export interface SocialProof {
  pain_point_id: string
  explored_count: number
  messaged_count: number
  replied_count: number
  call_count: number
  customer_count: number
  response_rate: number
  trending: 'up' | 'down' | 'stable'
}
```

### 2.3 API Signatures

#### 2.3.1 Server Actions

```typescript
// modules/experiments/actions/track-experiment.ts
export async function trackExperimentAction(
  data: {
    pain_point_id: string
    outcome: 'explored' | 'messaged' | 'replied' | 'call_scheduled' | 'customer_acquired'
    contact_id?: string
    message_id?: string
    outcome_confidence?: 'low' | 'medium' | 'high'
  }
): Promise<{
  success: boolean
  experiment_id?: string
  error?: string
}>

// modules/experiments/actions/update-consent.ts
export async function updateDataConsentAction(
  consent: boolean
): Promise<{
  success: boolean
}>

// modules/insights/actions/get-insights.ts
export async function getInsightsAction(
  filters?: {
    category?: 'subreddit' | 'timing' | 'template' | 'segment'
    minConfidence?: number
    limit?: number
  }
): Promise<{
  insights: Insight[]
  totalCount: number
}>

// modules/insights/actions/get-social-proof.ts
export async function getSocialProofAction(
  painPointId: string
): Promise<{
  socialProof: SocialProof | null
  error?: string
}>

// modules/insights/actions/get-contextual-insights.ts
export async function getContextualInsightsAction(
  context: {
    subreddit: string
    user_segment: 'first_timer' | 'experienced'
    time_of_day?: string
  }
): Promise<{
  insights: Insight[]
  recommendations: string[]
}>

// modules/predictions/actions/get-prediction.ts
export async function getPredictionAction(
  painPointId: string
): Promise<{
  prediction: Prediction | null
  display_text?: string // "85% likelihood of first customer"
  error?: string
}>

// modules/gamification/actions/get-contribution-stats.ts
export async function getContributionStatsAction(): Promise<{
  stats: UserContribution
  rank?: number // User's rank among contributors
  impact_message?: string // "Your data helped 500+ founders"
}>

// modules/privacy/actions/export-data.ts
export async function exportUserDataAction(): Promise<{
  download_url: string
  expires_at: string
}>

// modules/privacy/actions/delete-data.ts
export async function deleteUserDataAction(
  confirmation: string // User must type "DELETE" to confirm
): Promise<{
  success: boolean
  anonymization_date?: string // When data will be fully anonymized
  error?: string
}>
```

#### 2.3.2 API Routes

```typescript
// app/api/ml/train/route.ts (Admin only)
POST /api/ml/train
Body: {
  model_type: 'logistic_regression' | 'random_forest'
  hyperparameters?: Record<string, any>
}
Response: {
  job_id: string
  status: 'queued' | 'running' | 'completed' | 'failed'
}

// app/api/ml/predict/route.ts
POST /api/ml/predict
Body: {
  pain_point_id: string
  user_id: string
}
Response: {
  prediction: Prediction
}

// app/api/insights/calculate/route.ts (Cron job trigger)
POST /api/insights/calculate
Headers: { Authorization: 'Bearer CRON_SECRET' }
Response: {
  patterns_detected: number
  insights_created: number
  insights_deactivated: number
}

// app/api/experiments/aggregate/route.ts (Cron job trigger)
POST /api/experiments/aggregate
Headers: { Authorization: 'Bearer CRON_SECRET' }
Response: {
  experiments_processed: number
  social_proof_updated: number
}
```

### 2.4 Key Workflows

#### 2.4.1 Experiment Lifecycle Workflow

```
1. User explores pain point
   → trackExperimentAction({ outcome: 'explored' })
   → Experiment created with initial data

2. User sends message
   → trackExperimentAction({ outcome: 'messaged', message_id, contact_id })
   → Experiment updated with send_time, send_day_of_week, template_variant

3. User logs response (manual)
   → trackExperimentAction({ outcome: 'replied', outcome_confidence: 'high' })
   → Experiment updated with response_received, response_time_hours

4. User logs call/customer
   → trackExperimentAction({ outcome: 'call_scheduled' | 'customer_acquired' })
   → Experiment marked complete
   → UserContribution stats updated
   → Badge/achievement check triggered
```

#### 2.4.2 Pattern Detection Workflow (Cron Job)

```
1. Weekly cron job triggers /api/insights/calculate
2. Query experiments with data_sharing_consent = TRUE
3. For each pattern type:
   a. Subreddit performance:
      - GROUP BY subreddit
      - Calculate response_rate = replied / messaged
      - Compare top vs. bottom quartile
      - Chi-square test for significance

   b. Timing optimization:
      - GROUP BY send_time (bucketed into morning/afternoon/evening)
      - Calculate response_rate per time bucket
      - T-test for significance

   c. Template effectiveness:
      - GROUP BY template_variant
      - Calculate response_rate per variant
      - Chi-square test

   d. User segment success:
      - GROUP BY user_segment
      - Calculate time_to_first_customer
      - T-test for significance

4. Create/update Insight records
5. Deactivate insights with sample_size < 30 or p_value > 0.05
6. Cache results in Redis (key: insights:{category}, TTL: 24h)
```

#### 2.4.3 Prediction Generation Workflow

```
1. User views pain point detail
2. Frontend calls getPredictionAction(painPointId)
3. Check cache: Redis key predictions:{painPointId} (TTL: 24h)
4. If cache miss:
   a. Extract features:
      - subreddit (categorical → one-hot)
      - commercial_viability_score (numeric)
      - trend_status (categorical → one-hot)
      - user_segment (categorical → one-hot)

   b. Load latest model from storage
   c. Run prediction: model.predict_proba(features)
   d. Calculate confidence interval (bootstrap or model uncertainty)
   e. Generate explanation (SHAP values or simple feature importance)
   f. Store prediction in database
   g. Cache result

5. Return prediction to frontend with display formatting
```

#### 2.4.4 ML Model Training Pipeline (Monthly)

```
1. Admin triggers POST /api/ml/train (or scheduled cron)
2. Extract training data:
   - Query experiments with outcome IN ('replied', 'customer_acquired', 'messaged')
   - Target variable: success = (outcome IN ('replied', 'customer_acquired'))
   - Features: subreddit, commercial_viability_score, trend_status, user_segment
   - Train/test split: 80/20 stratified

3. Feature engineering:
   - One-hot encode categoricals
   - Normalize numeric features
   - Handle missing values

4. Model training:
   - If model_type = 'logistic_regression':
     - Train sklearn LogisticRegression with cross-validation
   - If model_type = 'random_forest':
     - Train sklearn RandomForestClassifier with grid search

5. Model evaluation:
   - Calculate metrics: accuracy, precision, recall, F1, AUC
   - Generate confusion matrix
   - Feature importance analysis

6. If new model accuracy > current model + 5%:
   - Save new model to storage (S3 or Supabase Storage)
   - Update model_version in config
   - Invalidate prediction cache

7. Log training metrics to analytics
```

---

## 3. Non-Functional Requirements

### 3.1 Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Social proof load time | <500ms | 95th percentile |
| Insight fetch time | <1s | 95th percentile |
| Prediction generation | <2s | 95th percentile (cache miss) |
| Pattern calculation (cron) | <5 min | For 1,000 experiments |
| Model training time | <15 min | For 1,000 experiments |
| Data export generation | <30s | For user with 100 experiments |

**Optimization Strategies:**
- Redis caching for social proof (1h TTL)
- Redis caching for insights (24h TTL)
- Redis caching for predictions (24h TTL)
- Materialized views for aggregated experiment metrics
- Background jobs for heavy computation (pattern detection, model training)
- Connection pooling for database queries

### 3.2 Security

**Data Privacy:**
- All experiment data collection requires explicit opt-in
- Anonymous_id used for pattern analysis (no link to user_id in aggregations)
- Encryption at rest for sensitive fields (user_id in experiments table)
- GDPR compliance: Right to access, right to erasure, right to data portability
- No PII in aggregated insights or ML training data

**Access Control:**
- Admin-only endpoints: /api/ml/train, /api/insights/calculate
- User-specific data isolation (RLS policies)
- OAuth tokens for ML API access (if external)
- Rate limiting on API endpoints (100 req/min per user)

**Data Retention:**
- Raw experiment data: 12 months (then anonymized)
- Aggregated insights: Indefinite (no PII)
- Deleted user data: Soft delete → anonymization (30 days) → hard delete (90 days)

### 3.3 Reliability

**Error Handling:**
- Graceful degradation if pattern detection fails (show cached insights)
- Graceful degradation if ML prediction fails (hide prediction, show social proof only)
- Retry logic for transient failures (3 attempts with exponential backoff)
- Dead letter queue for failed background jobs

**Data Quality:**
- Validation: Outcome confidence scoring (low/medium/high)
- Minimum sample size enforcement (insights hidden if <30 experiments)
- Statistical significance filtering (p-value <0.05)
- Anomaly detection for suspicious data (e.g., 100% response rate from single user)

**Monitoring:**
- Experiment volume dashboard (daily/weekly trends)
- Pattern detection job health (success/failure rate)
- ML model performance tracking (accuracy drift over time)
- Data quality metrics (% complete outcomes)

### 3.4 Observability

**Logging:**
- Experiment creation/update events
- Pattern detection runs (patterns found, deactivated)
- ML model training events (version, accuracy, features)
- Privacy actions (export, delete, consent changes)

**Metrics:**
- Experiment volume by outcome type
- Opt-in rate (weekly rolling average)
- Pattern count by category
- Prediction accuracy (actual vs. predicted)
- User contribution stats (top contributors, streaks)

**Alerting:**
- Pattern detection job failure (Slack/email)
- ML model accuracy drop >10% (Slack/email)
- Opt-in rate drop below 50% (email)
- Data quality score drop below 0.6 (email)

---

## 4. Dependencies and Integrations

### 4.1 Internal Dependencies

| Dependency | Required For | Risk Level |
|------------|--------------|------------|
| Epic 1 (reddit_posts) | Pain point data for experiments | **CRITICAL** |
| Epic 2 (messages, reddit_contacts) | Message data for outcome tracking | **CRITICAL** |
| Epic 2 (conversation tracking) | Complete experiment lifecycle | **CRITICAL** |
| User authentication | User-specific experiments | **CRITICAL** |
| PostgreSQL database | All data storage | **CRITICAL** |
| Redis cache | Performance optimization | **HIGH** |

### 4.2 External Dependencies

| Service | Purpose | Fallback Strategy |
|---------|---------|-------------------|
| scikit-learn 1.6.1 | ML model training/inference | Show social proof only (no predictions) |
| Python 3.11+ | ML pipeline execution | Queue jobs until service restored |
| NumPy/Pandas | Data processing | N/A (required for ML) |
| SciPy | Statistical tests | Use simpler heuristics |

### 4.3 New Infrastructure Requirements

**ML Service:**
- Option A: Python microservice (Flask/FastAPI) for model training/inference
  - Pros: Full control, scikit-learn ecosystem
  - Cons: Additional deployment, maintenance

- Option B: Serverless functions (AWS Lambda, Vercel Edge)
  - Pros: Scalable, minimal ops
  - Cons: Cold start latency, package size limits

- **Recommendation**: Start with serverless (Vercel Edge Functions with Python runtime), migrate to microservice if complexity grows

**Storage:**
- ML model artifacts: Supabase Storage or S3 (versioned)
- Training logs: PostgreSQL or dedicated logging service

---

## 5. Acceptance Criteria and Traceability Matrix

| Story | Acceptance Criteria | Validation Method | Priority |
|-------|---------------------|-------------------|----------|
| **3.1: Anonymized Experiment Data Collection** |
| AC 3.1.1 | Explicit opt-in during onboarding with clear explanation | Manual test: Verify consent flow | P0 |
| AC 3.1.2 | Data collected: pain points, messages sent, response rates, outcomes (NO content) | DB inspection | P0 |
| AC 3.1.3 | Opt-out available in settings, immediately stops collection | Manual test: Toggle and verify | P0 |
| AC 3.1.4 | Data anonymized: anonymous_id used for pattern analysis | SQL query validation | P0 |
| AC 3.1.5 | Data retention: 12 months raw, indefinite aggregated | Policy documentation | P1 |
| AC 3.1.6 | GDPR compliance: Export, delete, right to erasure | Manual test export/delete flow | P0 |
| AC 3.1.7 | Transparency page shows data usage | Content review | P1 |
| AC 3.1.8 | Consent recorded with timestamp | DB inspection | P0 |
| **3.2: Social Proof Display** |
| AC 3.2.1 | Social proof shows: explored, messaged, replied, calls, customers | Visual inspection | P0 |
| AC 3.2.2 | Funnel visualization with percentages | Visual inspection | P1 |
| AC 3.2.3 | Real-time updates (hourly aggregation acceptable) | Monitor cache refresh | P2 |
| AC 3.2.4 | Contextual display near "View contacts" button | UI review | P1 |
| AC 3.2.5 | Trust indicator: Response rate percentage | Visual inspection | P0 |
| AC 3.2.6 | Privacy-preserving: No individual user data | Code review | P0 |
| AC 3.2.7 | Minimum threshold: Hide if <10 experiments | Edge case testing | P1 |
| AC 3.2.8 | Trend over time: "Response rate improving 15% → 22%" | Visual inspection | P2 |
| **3.3: Pattern Recognition MVP** |
| AC 3.3.1 | Pattern: Response rate by subreddit | SQL query validation | P0 |
| AC 3.3.2 | Pattern: Response rate by time of day | SQL query validation | P0 |
| AC 3.3.3 | Pattern: Response rate by template variant | SQL query validation | P0 |
| AC 3.3.4 | Pattern: Time-to-first-customer by user segment | SQL query validation | P1 |
| AC 3.3.5 | Statistical significance: p-value <0.05, sample >30 | Automated test | P0 |
| AC 3.3.6 | Pattern quality score based on sample size and variance | Algorithm validation | P1 |
| AC 3.3.7 | Weekly recalculation via cron | Cron job logs | P0 |
| AC 3.3.8 | Admin dashboard showing patterns with significance | Manual review | P1 |
| **3.4: "What Worked for Others" Insights** |
| AC 3.4.1 | Contextual insights when composing message | UI test | P0 |
| AC 3.4.2 | Insight types: Subreddits, timing, templates, sequences | Content review | P0 |
| AC 3.4.3 | Confidence indicator: "High confidence (234 experiments)" | Visual inspection | P1 |
| AC 3.4.4 | Actionable suggestions with CTA | UI test | P1 |
| AC 3.4.5 | Insight library page organized by category | Manual navigation | P1 |
| AC 3.4.6 | User feedback: "Was this helpful?" | Analytics tracking | P2 |
| AC 3.4.7 | Personalized insights by user segment | Manual test different users | P2 |
| AC 3.4.8 | >40% reference insights before sending | Analytics validation | P0 |
| **3.5: Predictive Validation Scoring** |
| AC 3.5.1 | Prediction displayed: "85% likelihood based on 47 similar experiments" | Visual inspection | P0 |
| AC 3.5.2 | Model considers: subreddit, viability score, trend, segment | Model inspection | P0 |
| AC 3.5.3 | Explanation: "Similar founders achieved 85% response rate" | Text validation | P1 |
| AC 3.5.4 | Confidence interval: "70-95% range" | Math validation | P1 |
| AC 3.5.5 | Accuracy tracking: Compare predicted vs actual | Validation report | P0 |
| AC 3.5.6 | Minimum data: Hide if <30 similar experiments | Edge case testing | P1 |
| AC 3.5.7 | Monthly model retraining | Cron job logs | P0 |
| AC 3.5.8 | Disclaimer: "Predictions based on historical data" | Content review | P1 |
| **3.6: Data Contribution Gamification** |
| AC 3.6.1 | Contribution tracking: "12 experiments, helping 500+ founders" | Visual inspection | P1 |
| AC 3.6.2 | Badges: Early Contributor, Data Champion, Pattern Pioneer | Badge system test | P1 |
| AC 3.6.3 | Leaderboard (optional): Top contributors by count | UI review | P2 |
| AC 3.6.4 | Impact visualization: "Your data improved predictions by 3%" | Visual inspection | P2 |
| AC 3.6.5 | Thank you messaging on outcome logging | UI test | P2 |
| AC 3.6.6 | Contribution streaks: "7-day streak" | Streak calculation test | P2 |
| AC 3.6.7 | Incentive: Extra features for contributors (optional) | Feature flag test | P3 |
| AC 3.6.8 | Privacy-first: Anonymous or opt-in only | Privacy review | P0 |
| **3.7: Privacy Dashboard and Data Controls** |
| AC 3.7.1 | Dashboard shows: Data collected, usage, access | Content review | P0 |
| AC 3.7.2 | One-click data export (JSON format) | Manual export test | P0 |
| AC 3.7.3 | Request deletion with confirmation | Manual delete test | P0 |
| AC 3.7.4 | Opt-out toggle for data collection | Manual toggle test | P0 |
| AC 3.7.5 | Anonymization status displayed | Visual inspection | P1 |
| AC 3.7.6 | Data retention policy visible | Content review | P1 |
| AC 3.7.7 | Third-party sharing: NONE listed | Content review | P0 |
| AC 3.7.8 | Privacy policy linked (plain language) | Legal review | P0 |
| **3.8: Network Intelligence Analytics Dashboard** |
| AC 3.8.1 | Dashboard: Total experiments, opt-in rate, patterns, accuracy | Visual inspection | P0 |
| AC 3.8.2 | Growth metrics: Experiments/week, data quality score | Visual inspection | P0 |
| AC 3.8.3 | Pattern library growth over time | Chart validation | P1 |
| AC 3.8.4 | User engagement: % referencing insights | Analytics tracking | P0 |
| AC 3.8.5 | Model performance: Accuracy, precision, recall trending | Chart validation | P0 |
| AC 3.8.6 | Competitive moat indicator | Heuristic validation | P1 |
| AC 3.8.7 | Data quality breakdown: % complete vs. incomplete | Visual inspection | P1 |
| AC 3.8.8 | Recommendations to improve opt-in and data collection | Content review | P2 |
| **3.9: Epic 3 Validation Dashboard** |
| AC 3.9.1 | Metrics with GREEN/YELLOW/RED zones | Visual inspection | P0 |
| AC 3.9.2 | Experiments: >500 (GREEN), 300-500 (YELLOW), <300 (RED) | Calculation validation | P0 |
| AC 3.9.3 | Opt-in: >70% (GREEN), 50-70% (YELLOW), <50% (RED) | Calculation validation | P0 |
| AC 3.9.4 | Patterns: Measurable (GREEN), marginal (YELLOW), none (RED) | Manual assessment | P0 |
| AC 3.9.5 | Insight usage: >40% (GREEN), 20-40% (YELLOW), <20% (RED) | Analytics validation | P0 |
| AC 3.9.6 | Accuracy: >70% (GREEN), 60-70% (YELLOW), <60% (RED) | Model validation | P0 |
| AC 3.9.7 | Competitive moat: Strong (12+ months) vs. Weak | Manual assessment | P1 |
| AC 3.9.8 | Recommendation: SCALE / ITERATE / RECONSIDER | Decision logic test | P0 |

**Total Acceptance Criteria:** 72 across 9 stories

---

## 6. Risks, Assumptions, and Questions

### 6.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Low opt-in rate (<50%) | Data moat doesn't build | **MEDIUM** | A/B test consent messaging, offer incentives (extra features), demonstrate value early |
| Insufficient data for ML (< 500 experiments) | Predictions unreliable | **MEDIUM** | Graceful degradation (hide predictions), focus on social proof and simple patterns |
| ML model accuracy <60% | Users don't trust predictions | **MEDIUM** | Start with simple logistic regression, iterate with more features, validate thoroughly before launch |
| Privacy concerns damage reputation | User churn, bad press | **LOW** | Transparent consent, GDPR compliance, independent security audit |
| Pattern detection finds no significant patterns | Epic 3 fails validation | **MEDIUM** | Start pattern detection early (during Epic 2), validate hypothesis before full build |
| Python/ML infrastructure complexity | Deployment delays | **MEDIUM** | Start serverless (Vercel Edge), use managed services, defer microservice until necessary |

### 6.2 Product Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Users don't find insights valuable | Low engagement, churn | **MEDIUM** | Validate insights quality with beta users, A/B test impact on conversion |
| Gamification feels gimmicky | Negative user sentiment | **LOW** | Subtle badges, focus on impact messaging, optional leaderboard |
| Predictions feel like "black box" | Trust issues | **MEDIUM** | Explain predictions clearly, show contributing factors, allow user feedback |
| Data moat not defensible | Competitors replicate easily | **LOW** | Accumulate data fast (>500 experiments), network effects, proprietary patterns |

### 6.3 Assumptions

1. **Epic 2 delivers sufficient data:** Assumes >100 users actively sending messages and logging outcomes
2. **Users willing to share data:** Assumes >70% opt-in based on value exchange
3. **Patterns exist in data:** Assumes statistically significant differences by subreddit, timing, template
4. **ML adds value over simple heuristics:** Assumes prediction accuracy >70% achievable
5. **Infrastructure can support ML:** Assumes serverless or microservice can handle training/inference workloads
6. **GDPR compliance achievable:** Assumes legal review confirms privacy approach

### 6.4 Open Questions

**Technical:**
1. What ML framework? (scikit-learn vs. TensorFlow vs. PyTorch) → **Decision: scikit-learn** (simple, proven, sufficient for Epic 3)
2. Where to host ML service? (Serverless vs. microservice vs. third-party) → **Decision: Vercel Edge Functions** (start simple)
3. How to version ML models? (Git, S3, model registry) → **Decision: Supabase Storage with version in filename**
4. Real-time vs. batch predictions? → **Decision: Batch with 24h cache** (reduces latency, cost)

**Product:**
1. What incentives for opt-in? (Extra features, credit, recognition) → **Decision: Extra insights** (value-aligned)
2. Should leaderboard be public or private? → **Decision: Anonymous leaderboard** (privacy-first)
3. How to handle early stage with <500 experiments? → **Decision: Show social proof only**, hide predictions
4. What happens when patterns change over time? → **Decision: Monthly recalculation**, deactivate obsolete insights

**Business:**
1. Should Epic 3 be paid tier or free? → **Decision: Free for basic insights**, premium tier for advanced patterns (future)
2. How to monetize network intelligence? → **Decision: Defer**, focus on building moat first

---

## 7. Test Strategy

### 7.1 Unit Tests

**Coverage Target:** >80% for core logic

```typescript
// modules/experiments/services/experiment-tracker.test.ts
describe('ExperimentTracker', () => {
  test('creates experiment with correct anonymous_id')
  test('updates experiment outcome correctly')
  test('respects data_sharing_consent flag')
  test('calculates send_time and send_day_of_week from timestamp')
  test('validates outcome transitions (explored → messaged → replied)')
})

// modules/insights/services/pattern-detector.test.ts
describe('PatternDetector', () => {
  test('detects subreddit performance pattern with p-value <0.05')
  test('ignores patterns with sample_size <30')
  test('calculates confidence_score based on sample size and effect size')
  test('deactivates obsolete insights')
  test('handles edge case: all experiments in one subreddit')
})

// modules/predictions/services/prediction-engine.test.ts
describe('PredictionEngine', () => {
  test('generates prediction with correct probability')
  test('calculates confidence interval')
  test('generates human-readable explanation')
  test('handles missing features gracefully')
  test('validates model version exists')
})

// lib/stats/significance-test.test.ts
describe('SignificanceTest', () => {
  test('chi-square test returns correct p-value')
  test('t-test returns correct p-value')
  test('confidence interval calculation is accurate')
})
```

### 7.2 Integration Tests

```typescript
// modules/experiments/integration/experiment-flow.test.ts
describe('Experiment Flow Integration', () => {
  test('full lifecycle: explore → message → reply → log outcome')
  test('user contribution stats update after outcome logged')
  test('badge awarded when threshold reached')
  test('social proof updates after experiment completes')
})

// modules/insights/integration/pattern-pipeline.test.ts
describe('Pattern Detection Pipeline', () => {
  test('cron job detects patterns from test data')
  test('insights cached in Redis correctly')
  test('contextual insights returned for user segment')
  test('feedback updates insight quality_score')
})

// modules/privacy/integration/gdpr-compliance.test.ts
describe('GDPR Compliance', () => {
  test('user data export includes all experiments')
  test('data deletion anonymizes user_id after 30 days')
  test('opt-out stops all data collection')
  test('consent withdrawal retroactively anonymizes data')
})
```

### 7.3 End-to-End Tests

```typescript
// e2e/epic3/data-consent.spec.ts
test('user can opt-in to data collection during onboarding', async ({ page }) => {
  await page.goto('/onboarding')
  await page.check('[data-testid="data-consent-checkbox"]')
  await page.click('[data-testid="continue-button"]')
  // Verify consent recorded in DB
})

// e2e/epic3/social-proof.spec.ts
test('social proof displays on pain point card', async ({ page }) => {
  await page.goto('/ideas')
  const socialProof = page.locator('[data-testid="social-proof"]').first()
  await expect(socialProof).toContainText('127 founders explored')
  await expect(socialProof).toContainText('27% response rate')
})

// e2e/epic3/insights.spec.ts
test('contextual insights shown when composing message', async ({ page }) => {
  await page.goto('/ideas/[id]/contacts')
  await page.click('[data-testid="compose-message-button"]')
  const insights = page.locator('[data-testid="contextual-insights"]')
  await expect(insights).toBeVisible()
  await expect(insights).toContainText('Morning messages get 2x replies')
})

// e2e/epic3/predictions.spec.ts
test('prediction displayed on pain point detail page', async ({ page }) => {
  await page.goto('/ideas/[id]')
  const prediction = page.locator('[data-testid="prediction"]')
  await expect(prediction).toContainText('85% likelihood')
  await expect(prediction).toContainText('based on 47 similar experiments')
})

// e2e/epic3/privacy-controls.spec.ts
test('user can export and delete data', async ({ page }) => {
  await page.goto('/settings/privacy')

  // Export
  const downloadPromise = page.waitForEvent('download')
  await page.click('[data-testid="export-data-button"]')
  const download = await downloadPromise
  expect(download.suggestedFilename()).toContain('startupsniff-data')

  // Delete
  await page.click('[data-testid="delete-data-button"]')
  await page.fill('[data-testid="confirmation-input"]', 'DELETE')
  await page.click('[data-testid="confirm-delete-button"]')
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
})
```

### 7.4 ML Model Testing

```python
# ml/tests/test_model_training.py
def test_model_training_pipeline():
    """Test full training pipeline with synthetic data"""
    # Create synthetic experiment data
    data = create_synthetic_experiments(n=1000)

    # Train model
    model, metrics = train_model(data, model_type='logistic_regression')

    # Assertions
    assert metrics['accuracy'] > 0.65  # Minimum acceptable accuracy
    assert metrics['precision'] > 0.60
    assert metrics['recall'] > 0.60
    assert model.feature_importances_ is not None

def test_prediction_consistency():
    """Same input should produce same prediction"""
    features = {'subreddit': 'entrepreneur', 'score': 8, 'trend': 'up', 'segment': 'first_timer'}
    pred1 = model.predict_proba(features)
    pred2 = model.predict_proba(features)
    assert pred1 == pred2

def test_feature_importance():
    """Verify expected features have high importance"""
    importances = model.feature_importances_
    assert importances['commercial_viability_score'] > 0.15  # Should be important
    assert importances['subreddit'] > 0.20  # Should be very important
```

### 7.5 Performance Tests

```typescript
// tests/performance/social-proof-load.test.ts
test('social proof loads in <500ms for 1000 experiments', async () => {
  const start = Date.now()
  const result = await getSocialProofAction('pain-point-id')
  const duration = Date.now() - start
  expect(duration).toBeLessThan(500)
})

// tests/performance/pattern-calculation.test.ts
test('pattern calculation completes in <5min for 1000 experiments', async () => {
  // Run pattern detection cron job
  const start = Date.now()
  await calculatePatternsJob()
  const duration = Date.now() - start
  expect(duration).toBeLessThan(5 * 60 * 1000)
})
```

---

## 8. Implementation Checklist

### Week 17: Experiment Tracking Foundation

**Goals:** Core experiment data collection, consent management

- [ ] Database migrations
  - [ ] Create `experiments` table with indexes
  - [ ] Create `user_contributions` table
  - [ ] Add `data_sharing_consent` to users table
  - [ ] Create database triggers for auto-updating timestamps

- [ ] Backend services
  - [ ] `modules/experiments/services/experiment-tracker.ts` (create, update, query)
  - [ ] `modules/experiments/actions/track-experiment.ts` (server action)
  - [ ] `modules/experiments/actions/update-consent.ts` (server action)
  - [ ] RLS policies for experiments table

- [ ] Frontend components
  - [ ] Consent opt-in flow during onboarding (`components/onboarding/DataConsent.tsx`)
  - [ ] Opt-out toggle in settings (`app/settings/privacy/page.tsx`)
  - [ ] Automatic experiment tracking on key actions (explore, message, log outcome)

- [ ] Testing
  - [ ] Unit tests for experiment-tracker service
  - [ ] Integration tests for consent flow
  - [ ] E2E test: Opt-in during onboarding

**Deliverable:** Experiments logged to database with user consent

---

### Week 18: Social Proof and Aggregation

**Goals:** Display social proof on pain point cards

- [ ] Backend
  - [ ] Aggregation query: COUNT by pain_point_id, outcome
  - [ ] `modules/insights/services/social-proof-calculator.ts`
  - [ ] `modules/insights/actions/get-social-proof.ts`
  - [ ] Cron job: `/api/experiments/aggregate` (hourly)
  - [ ] Redis caching for aggregated metrics (1h TTL)

- [ ] Frontend
  - [ ] `components/ideas/SocialProof.tsx` (funnel visualization)
  - [ ] Integrate into PainPointCard component
  - [ ] Contextual display near "View contacts" button
  - [ ] Minimum threshold logic (hide if <10 experiments)

- [ ] Testing
  - [ ] Unit tests for aggregation logic
  - [ ] E2E test: Social proof displays on pain point card
  - [ ] Performance test: Aggregation <500ms for 1000 experiments

**Deliverable:** Social proof visible on pain point cards

---

### Week 19: Pattern Recognition MVP

**Goals:** Detect statistically significant patterns

- [ ] Database
  - [ ] Create `insights` table with indexes
  - [ ] Create `pattern_quality_feedback` table

- [ ] Backend - Pattern Detection
  - [ ] `lib/stats/significance-test.ts` (chi-square, t-test, confidence intervals)
  - [ ] `modules/insights/services/pattern-detector.ts`
    - [ ] Subreddit performance pattern
    - [ ] Timing optimization pattern
    - [ ] Template effectiveness pattern
    - [ ] User segment success pattern
  - [ ] `POST /api/insights/calculate` (cron endpoint)
  - [ ] Weekly cron job configuration (Vercel Cron or Inngest)

- [ ] Backend - Insight Retrieval
  - [ ] `modules/insights/actions/get-insights.ts` (filtered query)
  - [ ] Redis caching for insights (24h TTL)

- [ ] Admin Dashboard
  - [ ] `app/admin/insights/page.tsx` (view all detected patterns)
  - [ ] Display: pattern type, sample size, p-value, confidence score
  - [ ] Manual activate/deactivate controls

- [ ] Testing
  - [ ] Unit tests for each pattern detection algorithm
  - [ ] Unit tests for statistical significance functions
  - [ ] Integration test: Cron job detects patterns from seed data
  - [ ] Performance test: Pattern calculation <5min for 1000 experiments

**Deliverable:** Patterns detected and stored in database

---

### Week 20: Contextual Insights UI

**Goals:** Surface insights to users during message composition

- [ ] Backend
  - [ ] `modules/insights/actions/get-contextual-insights.ts` (filter by context)
  - [ ] Personalization logic (user_segment matching)

- [ ] Frontend - Insight Library
  - [ ] `app/insights/page.tsx` (dedicated insights library page)
  - [ ] Category tabs: Subreddits, Timing, Templates, Segments
  - [ ] Confidence indicators: "High confidence (234 experiments)"
  - [ ] User feedback: "Was this helpful?" buttons

- [ ] Frontend - Contextual Display
  - [ ] `components/messages/ContextualInsights.tsx`
  - [ ] Integrate into message composition modal
  - [ ] Actionable suggestions with CTAs
  - [ ] Analytics tracking: Insight viewed, clicked, helpful/not helpful

- [ ] Testing
  - [ ] E2E test: Insights shown when composing message
  - [ ] E2E test: Insight library navigation
  - [ ] Analytics validation: Track >40% reference insights

**Deliverable:** Insights visible to users during message workflow

---

### Week 21: Predictive ML Foundation

**Goals:** Train ML model and generate predictions

- [ ] Database
  - [ ] Create `predictions` table with indexes

- [ ] ML Infrastructure
  - [ ] Set up Python environment (scikit-learn, pandas, numpy)
  - [ ] `ml/data_loader.py` (extract experiments from PostgreSQL)
  - [ ] `ml/feature_engineering.py` (one-hot encoding, normalization)
  - [ ] `ml/model_trainer.py` (logistic regression with cross-validation)
  - [ ] `ml/model_evaluator.py` (accuracy, precision, recall, feature importance)
  - [ ] Model storage: Supabase Storage with versioning

- [ ] API Integration
  - [ ] `POST /api/ml/train` (admin endpoint)
  - [ ] `POST /api/ml/predict` (inference endpoint)
  - [ ] Background job queue for training (Inngest or Vercel Cron)

- [ ] Backend
  - [ ] `modules/predictions/services/prediction-engine.ts`
  - [ ] `modules/predictions/actions/get-prediction.ts`
  - [ ] Redis caching for predictions (24h TTL)

- [ ] Testing
  - [ ] Python unit tests for model training pipeline
  - [ ] API integration test: Train model, generate prediction
  - [ ] Model validation: Accuracy >65% on test set

**Deliverable:** ML model trained and predictions generated

---

### Week 22: Prediction UI and Gamification

**Goals:** Display predictions to users, implement gamification

- [ ] Frontend - Predictions
  - [ ] `components/ideas/Prediction.tsx`
  - [ ] Display: "85% likelihood based on 47 similar experiments"
  - [ ] Explanation and confidence interval
  - [ ] Disclaimer text
  - [ ] Integrate into pain point detail page

- [ ] Backend - Gamification
  - [ ] `modules/gamification/services/contribution-tracker.ts`
  - [ ] Badge unlock logic (early_contributor, data_champion, etc.)
  - [ ] Streak calculation (current_streak_days, longest_streak_days)
  - [ ] Impact score calculation
  - [ ] `modules/gamification/actions/get-contribution-stats.ts`

- [ ] Frontend - Gamification
  - [ ] `app/profile/contributions/page.tsx` (stats, badges, impact)
  - [ ] Badge notification on unlock (toast or modal)
  - [ ] Streak display in navigation
  - [ ] Optional: Anonymous leaderboard

- [ ] Testing
  - [ ] E2E test: Prediction displays on pain point page
  - [ ] E2E test: Badge awarded after logging 10 outcomes
  - [ ] Unit tests for badge unlock logic

**Deliverable:** Predictions visible, gamification active

---

### Week 23: Privacy Dashboard and GDPR

**Goals:** Full GDPR compliance with privacy controls

- [ ] Backend - Privacy
  - [ ] `modules/privacy/services/data-exporter.ts` (export to JSON)
  - [ ] `modules/privacy/services/data-eraser.ts` (soft delete → anonymize → hard delete)
  - [ ] `modules/privacy/actions/export-data.ts`
  - [ ] `modules/privacy/actions/delete-data.ts`
  - [ ] Background job: Anonymize deleted data after 30 days
  - [ ] Background job: Hard delete after 90 days

- [ ] Frontend - Privacy Dashboard
  - [ ] `app/settings/privacy/page.tsx` (comprehensive privacy controls)
    - [ ] What data is collected (visual list)
    - [ ] Data retention policy
    - [ ] Opt-out toggle
    - [ ] Export button → download JSON
    - [ ] Delete button → confirmation flow
  - [ ] Transparency page: How data is used
  - [ ] Privacy policy update (plain language)

- [ ] Legal Review
  - [ ] GDPR compliance checklist
  - [ ] Privacy policy review
  - [ ] Terms of service update

- [ ] Testing
  - [ ] E2E test: Export data (verify JSON contents)
  - [ ] E2E test: Delete data (verify anonymization)
  - [ ] Integration test: Opt-out stops data collection
  - [ ] Manual test: GDPR workflows with legal team

**Deliverable:** GDPR-compliant privacy controls

---

### Week 24: Analytics Dashboard and Validation

**Goals:** Epic 3 validation dashboard, final polish

- [ ] Network Intelligence Dashboard
  - [ ] `app/admin/network-intelligence/page.tsx`
    - [ ] Total experiments, opt-in rate, pattern count
    - [ ] Experiments per week (chart)
    - [ ] Data quality score (% complete outcomes)
    - [ ] Pattern library growth over time
    - [ ] User engagement: % referencing insights
    - [ ] Model performance metrics (accuracy, precision, recall)
    - [ ] Competitive moat indicator

- [ ] Epic 3 Validation Dashboard
  - [ ] `app/admin/epic3-validation/page.tsx`
    - [ ] GREEN/YELLOW/RED zone indicators
    - [ ] Experiments logged: >500 (GREEN)
    - [ ] Opt-in rate: >70% (GREEN)
    - [ ] Pattern differentiation: Measurable (GREEN)
    - [ ] Insight usage: >40% (GREEN)
    - [ ] Prediction accuracy: >70% (GREEN)
    - [ ] Competitive moat assessment
    - [ ] Recommendation: SCALE / ITERATE / RECONSIDER

- [ ] Model Retraining Automation
  - [ ] Monthly cron job: Trigger model training
  - [ ] Auto-deploy new model if accuracy improves >5%
  - [ ] Alerting on accuracy degradation

- [ ] Final Testing
  - [ ] Full regression suite (all E2E tests)
  - [ ] Performance testing under load
  - [ ] Security audit (penetration testing optional)
  - [ ] User acceptance testing with beta group

- [ ] Documentation
  - [ ] README: Network intelligence features
  - [ ] API documentation: ML endpoints
  - [ ] Admin guide: How to interpret validation dashboard
  - [ ] Privacy documentation: GDPR compliance summary

**Deliverable:** Epic 3 validated and ready for scale phase

---

## 9. Success Metrics and Validation

### 9.1 Leading Indicators (Weekly Tracking)

| Metric | Week 17 | Week 19 | Week 21 | Week 24 | Target |
|--------|---------|---------|---------|---------|--------|
| Experiments logged | 50 | 150 | 300 | 500+ | **500+** (GREEN) |
| Opt-in rate | 65% | 68% | 70% | 72% | **>70%** (GREEN) |
| Complete outcomes | 30 | 90 | 180 | 350 | >300 |
| Patterns detected | 0 | 4 | 8 | 12+ | >5 significant patterns |
| Insight usage rate | N/A | 25% | 35% | 42% | **>40%** (GREEN) |

### 9.2 Lagging Indicators (End of Epic 3)

| Metric | Measurement Method | Target (GREEN) |
|--------|-------------------|----------------|
| Prediction accuracy | Actual vs. predicted on validation set | **>70%** |
| Data quality score | % experiments with complete outcomes | >70% |
| User satisfaction | Survey: "Insights helpful?" (5-point scale) | >4.0 avg |
| Competitive moat | Time for competitor to replicate | 12+ months |
| Pattern differentiation | Statistical significance (p-value) | <0.05 for all patterns |

### 9.3 Kill Criteria (RED Zone)

**Proceed to scale phase ONLY if:**
1. ✅ Experiments logged: >500 (or >300 with high quality)
2. ✅ Opt-in rate: >70% (or >50% with strong engagement)
3. ✅ Patterns: Measurable, statistically significant (p<0.05)
4. ✅ Insight usage: >40% of users reference before sending (or >20% with positive feedback)
5. ✅ Prediction accuracy: >70% (or >60% with improving trend)

**If RED zone:**
- **Iterate:** 2 weeks focused on improving weakest metric
- **Pivot:** Reconsider Epic 3 approach (simpler heuristics, no ML)
- **Kill:** Focus resources on Epic 1-2 optimization, defer network intelligence

### 9.4 Validation Dashboard

**Epic 3 Validation Report (Generated Week 24)**

```markdown
# Epic 3: Network Intelligence Foundation - Validation Report

**Date:** 2025-MM-DD
**Status:** GREEN / YELLOW / RED

## Executive Summary
[Auto-generated based on metrics]

## Key Metrics

| Metric                    | Actual | Target (GREEN) | Zone        |
|---------------------------|--------|----------------|-------------|
| Experiments Logged        | 547    | >500           | 🟢 GREEN    |
| Data Opt-In Rate          | 72%    | >70%           | 🟢 GREEN    |
| Pattern Differentiation   | Yes    | Measurable     | 🟢 GREEN    |
| Insight Usage Rate        | 42%    | >40%           | 🟢 GREEN    |
| Prediction Accuracy       | 71%    | >70%           | 🟢 GREEN    |
| Competitive Moat          | Strong | 12+ months     | 🟢 GREEN    |

## Patterns Detected (Sample)

1. **Subreddit Performance**
   - r/entrepreneur: 18.5% response rate (n=234)
   - r/startups: 11.2% response rate (n=198)
   - p-value: 0.003 ✅ Significant

2. **Timing Optimization**
   - Morning (8-12 PM): 16.7% response rate (n=187)
   - Evening (6-10 PM): 10.4% response rate (n=165)
   - p-value: 0.012 ✅ Significant

3. **Template Effectiveness**
   - Value-first: 15.8% response rate (n=145)
   - Professional: 14.2% response rate (n=142)
   - Casual: 11.9% response rate (n=138)
   - p-value: 0.089 ⚠️ Marginal

## Recommendation

**PROCEED TO SCALE PHASE** 🚀

All critical metrics in GREEN zone. Network intelligence moat established.
Ready for growth phase investment.

## Next Actions

1. Launch public Epic 3 features to all users
2. Monthly model retraining automation
3. Begin planning Premium Insights tier (monetization)
4. Expand pattern detection to new categories
```

---

## 10. Appendix

### 10.1 ML Model Feature Set

```python
# Features for prediction model
FEATURES = {
    'subreddit': 'categorical',  # One-hot encoded (15+ values)
    'commercial_viability_score': 'numeric',  # 1-10
    'trend_status': 'categorical',  # One-hot encoded (4 values)
    'user_segment': 'categorical',  # One-hot encoded (2 values)
    'send_time_bucket': 'categorical',  # Morning/Afternoon/Evening (derived)
    'send_day_of_week': 'categorical',  # One-hot encoded (7 values)
}

# Target variable
TARGET = 'success'  # Boolean: outcome IN ('replied', 'customer_acquired')
```

### 10.2 Statistical Significance Thresholds

```python
MIN_SAMPLE_SIZE = 30  # Per segment
ALPHA = 0.05  # p-value threshold
MIN_EFFECT_SIZE = 0.3  # Cohen's d (medium effect)
```

### 10.3 Data Anonymization Logic

```sql
-- Example anonymization query (run after 30-day soft delete)
UPDATE experiments
SET
  user_id = '00000000-0000-0000-0000-000000000000',
  message_id = NULL,
  contact_id = NULL
WHERE
  user_id IN (SELECT id FROM users WHERE deleted_at < NOW() - INTERVAL '30 days')
  AND user_id != '00000000-0000-0000-0000-000000000000';
```

---

**End of Technical Specification: Epic 3**

**Next Steps:**
1. Review with stakeholders and technical team
2. Validate assumptions with Epic 2 beta users
3. Begin Week 17 implementation (Experiment Tracking Foundation)
4. Weekly progress checkpoints against leading indicators

---

_This technical specification provides the implementation roadmap for Epic 3: Network Intelligence Foundation. All designs, schemas, and workflows are ready for development execution._
