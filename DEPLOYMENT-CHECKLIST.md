# Deployment Checklist - StartupSniff

**Date Created:** October 23, 2025
**Version:** Epic 1 & 2 Initial Release
**Status:** Pre-deployment

---

## ✅ Pre-Deployment Checklist

### 1. Code & Build
- [x] All features committed to git
- [x] Working tree clean
- [ ] TypeScript compilation passes (`npx tsc --noEmit`)
- [ ] Build succeeds (`npm run build`)
- [ ] No console errors in development
- [ ] All tests passing (if applicable)

### 2. Environment Variables Required

#### Supabase
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### Reddit API
```env
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_REFRESH_TOKEN=your_refresh_token
REDDIT_USER_AGENT=StartupSniff/1.0
```

#### OpenAI
```env
OPENAI_API_KEY=your_openai_key
```

#### Razorpay (Payments)
```env
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_public_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

#### Application
```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
API_SECRET=your_api_secret_for_internal_endpoints
CRON_SECRET=your_cron_secret_for_vercel
```

#### Optional (Redis for caching)
```env
REDIS_URL=your_redis_url
REDIS_TOKEN=your_redis_token
```

### 3. Database Setup

#### Production Supabase
- [ ] Create production Supabase project
- [ ] Run all migrations in order:
  ```bash
  # Epic 1 migrations
  supabase/migrations/20251013120000_add_epic1_viability_and_trend_fields.sql

  # Analytics
  supabase/migrations/20251014000000_create_analytics_tables.sql

  # Epic 2 migrations
  supabase/migrations/20251014010000_create_reddit_contacts.sql
  supabase/migrations/20251014020000_add_reddit_oauth_fields.sql
  supabase/migrations/20251014030000_create_messages_table.sql
  supabase/migrations/20251014040000_add_message_quota.sql
  ```
- [ ] Verify all tables created
- [ ] Check indexes are created
- [ ] Enable Row Level Security (RLS) policies
- [ ] Test database connection from app

#### Initial Data
- [ ] No seed data required (posts fetched from Reddit)
- [ ] Verify reddit_posts table is empty
- [ ] Verify users table exists

### 4. External Services Setup

#### Reddit OAuth App
- [ ] Create Reddit OAuth app at https://www.reddit.com/prefs/apps
- [ ] Set redirect URI: `https://your-domain.com/api/auth/reddit/callback`
- [ ] Copy client ID and secret to env vars
- [ ] Generate refresh token for app account
- [ ] Test authentication flow

#### Razorpay Setup
- [ ] Create Razorpay account
- [ ] Create subscription plans:
  - Free: $0/month (10 messages, limited features)
  - Pro: $20/month (unlimited messages, all features)
- [ ] Configure webhook URL: `https://your-domain.com/api/billing/webhook`
- [ ] Copy API keys to env vars
- [ ] Test webhook locally with Razorpay CLI

#### OpenAI
- [ ] Create OpenAI API key
- [ ] Set spending limits ($50/month recommended)
- [ ] Monitor usage in OpenAI dashboard
- [ ] Verify GPT-4o model access

### 5. Vercel Deployment

#### Project Setup
- [ ] Create new Vercel project
- [ ] Connect GitHub repository
- [ ] Set environment variables in Vercel dashboard
- [ ] Configure custom domain (optional)
- [ ] Enable automatic deployments from `main` branch

#### Cron Jobs
Configure Vercel Cron to run:

```json
{
  "crons": [
    {
      "path": "/api/reddit/fetch",
      "schedule": "0 */4 * * *"
    }
  ]
}
```

- [ ] Reddit fetch job: Every 4 hours
- [ ] Set `x-vercel-cron-secret` header
- [ ] Test cron execution in Vercel logs

#### Build Settings
```
Build Command: npm run build
Output Directory: .next
Install Command: npm install
Node Version: 18.x
```

- [ ] Verify build command
- [ ] Check Node.js version compatibility
- [ ] Enable Vercel Analytics (optional)

### 6. Domain & SSL
- [ ] Configure custom domain in Vercel
- [ ] Wait for DNS propagation (24-48 hours)
- [ ] Verify SSL certificate issued
- [ ] Test HTTPS redirect
- [ ] Update Reddit OAuth redirect URI with production domain

### 7. Post-Deployment Testing

#### Critical Flows
- [ ] Visit homepage: https://your-domain.com
- [ ] Sign up new user account
- [ ] Verify email confirmation works
- [ ] Visit /dashboard/opportunities
- [ ] Test opportunity filters
- [ ] Test search functionality
- [ ] Export CSV/JSON
- [ ] Click into opportunity detail page
- [ ] Test Reddit account connection
- [ ] Test message composition (if Reddit connected)
- [ ] Verify analytics tracking
- [ ] Test billing page
- [ ] Test subscription upgrade flow

#### API Endpoints
- [ ] GET /api/reddit/score - Health check
- [ ] POST /api/reddit/fetch - Manual trigger (with auth)
- [ ] POST /api/reddit/score - Manual trigger (with auth)
- [ ] Verify cron jobs execute on schedule

#### Performance
- [ ] Lighthouse score > 80
- [ ] Page load time < 3 seconds
- [ ] Images optimized
- [ ] No console errors
- [ ] Mobile responsive (test on phone)

### 8. Monitoring & Alerts

#### Setup Monitoring
- [ ] Vercel error tracking enabled
- [ ] Set up error notifications (email/Slack)
- [ ] Monitor OpenAI API usage
- [ ] Monitor Razorpay transactions
- [ ] Monitor Supabase database size
- [ ] Monitor Reddit API rate limits

#### Logging
- [ ] Application logs in Vercel dashboard
- [ ] Database logs in Supabase
- [ ] Error tracking (Sentry optional)
- [ ] API request logs

### 9. Security

#### API Security
- [ ] All API routes have authentication
- [ ] Rate limiting on public endpoints
- [ ] CSRF protection enabled
- [ ] Secure environment variables
- [ ] No secrets in client-side code
- [ ] SQL injection prevention (using Supabase client)

#### User Data
- [ ] RLS policies enforced
- [ ] User data isolated per account
- [ ] Password hashing (handled by Supabase Auth)
- [ ] Session management secure

### 10. Documentation

- [ ] Update README.md with deployment instructions
- [ ] Document environment variables
- [ ] API endpoint documentation
- [ ] User guide (EPIC-2-UI-GUIDE.md)
- [ ] Troubleshooting guide

---

## 🚀 Deployment Steps

### Step 1: Prepare Codebase
```bash
# Ensure clean working tree
git status

# Push to GitHub
git push origin feature/bmad_method_implementation

# Merge to main (if ready)
git checkout main
git merge feature/bmad_method_implementation
git push origin main
```

### Step 2: Set Up Vercel
1. Go to https://vercel.com
2. Click "Add New Project"
3. Import from GitHub: `benjaminthomas/startup-sniff`
4. Configure environment variables (see section 2 above)
5. Deploy

### Step 3: Configure Services
1. **Supabase**: Run migrations, enable RLS
2. **Reddit**: Update OAuth redirect URI
3. **Razorpay**: Configure webhook
4. **Vercel Cron**: Enable cron jobs

### Step 4: Initial Data Load
```bash
# Manually trigger first Reddit fetch
curl -X POST https://your-domain.com/api/reddit/fetch \
  -H "Authorization: Bearer YOUR_API_SECRET"

# Manually trigger scoring
curl -X POST https://your-domain.com/api/reddit/score \
  -H "Authorization: Bearer YOUR_API_SECRET"
```

### Step 5: Verify
1. Visit production URL
2. Sign up test account
3. Verify opportunities display
4. Check all features work
5. Monitor logs for errors

---

## 📊 Success Metrics

### Immediate (Day 1)
- [ ] Site accessible at production URL
- [ ] No 500 errors
- [ ] Database connections work
- [ ] Reddit posts fetching successfully
- [ ] Scoring pipeline works
- [ ] Users can sign up and log in

### Week 1
- [ ] >10 Reddit posts displayed
- [ ] Cron jobs running on schedule
- [ ] No critical errors
- [ ] 2+ test users successfully navigating app

### Month 1 (Epic 1 Validation)
- [ ] >100 opportunities scored
- [ ] >25% user return rate (7-day)
- [ ] >2 min average session time
- [ ] >2 pain points explored per session

---

## ⚠️ Rollback Plan

If critical issues occur:

1. **Revert Deployment**
   ```bash
   # In Vercel dashboard
   Deployments → Previous Deployment → Promote to Production
   ```

2. **Database Rollback**
   - Supabase has automatic backups
   - Can restore to specific point in time
   - Contact Supabase support if needed

3. **DNS Rollback**
   - Point domain back to previous server
   - Wait for DNS propagation

---

## 📝 Post-Launch Tasks

### Immediate
- [ ] Announce launch (Twitter, ProductHunt, etc.)
- [ ] Monitor error logs closely
- [ ] Respond to user feedback
- [ ] Fix any critical bugs

### Week 1
- [ ] Analyze user behavior metrics
- [ ] Optimize slow pages
- [ ] Fix reported bugs
- [ ] Improve onboarding based on feedback

### Week 2
- [ ] Gather user testimonials
- [ ] Plan Epic 2 enhancements
- [ ] Optimize OpenAI costs
- [ ] Review conversion funnel

---

## 🐛 Common Issues & Solutions

### Build Fails
**Issue**: TypeScript errors
**Solution**: Run `npx tsc --noEmit` locally, fix errors

### Database Connection Fails
**Issue**: Invalid Supabase credentials
**Solution**: Verify env vars, check Supabase dashboard

### Reddit API Fails
**Issue**: 401 Unauthorized
**Solution**: Regenerate Reddit refresh token

### Cron Job Not Running
**Issue**: Missing cron secret
**Solution**: Set `CRON_SECRET` in Vercel env vars

### OpenAI Rate Limit
**Issue**: 429 Too Many Requests
**Solution**: Reduce concurrent requests, add delays

---

## 📞 Support Contacts

- **Vercel**: support@vercel.com
- **Supabase**: support@supabase.com
- **Reddit API**: /r/redditdev
- **OpenAI**: help.openai.com
- **Razorpay**: https://razorpay.com/support

---

**Last Updated:** October 23, 2025
**Next Review:** After first production deployment
