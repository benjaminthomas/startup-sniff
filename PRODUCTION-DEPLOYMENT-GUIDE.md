# Production Deployment Guide
**Last Updated:** November 21, 2025
**Status:** Ready for Deployment

---

## ✅ Pre-Flight Checklist

### Build Verification
- [x] TypeScript compilation passes (`npx tsc --noEmit`)
- [x] Production build succeeds (`npm run build`)
- [x] All cron jobs configured in `vercel.json`
- [x] Epic 1 & 2 complete (100%)
- [x] Story 2.10 (Template A/B Testing) complete

### Important Note
⚠️ **DO NOT set NODE_ENV manually in production**
Next.js automatically sets NODE_ENV based on the environment. Setting it manually causes build failures.

---

## 🔐 Environment Variables for Production

### Required Environment Variables

#### Supabase (Database)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Reddit API
```env
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_REFRESH_TOKEN=your_reddit_refresh_token
REDDIT_USER_AGENT=StartupSniff/1.0
```

#### OpenAI (AI Features)
```env
OPENAI_API_KEY=sk-proj-...
```

#### Razorpay (Payments)
```env
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=your_key_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

#### Mailgun (Email Service)
```env
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=mg.your-domain.com
MAILGUN_FROM_EMAIL=noreply@your-domain.com
MAILGUN_FROM_NAME=StartupSniff
```

#### Application Configuration
```env
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
NEXT_PUBLIC_BASE_URL=https://your-production-domain.com
API_SECRET=generate_random_secure_string_min_32_chars
CRON_SECRET=generate_random_secure_string_for_cron_jobs
```

#### Optional: Sentry Error Tracking (Story 1.11)
```env
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_ORG=your_org
SENTRY_PROJECT=your_project
SENTRY_AUTH_TOKEN=your_auth_token
```

#### Optional: Redis Caching
```env
REDIS_URL=redis://...
REDIS_TOKEN=your_redis_token
```

---

## 📦 Database Migrations (In Order)

Run these migrations in your production Supabase project:

### Initial Setup
1. `20250829174112_create_initial_schema.sql`
2. `20250830032313_create_rate_limits_table.sql`
3. `20250830033600_create_security_events_table.sql`

### Reddit Integration
4. `20250113000000_create_reddit_posts_table.sql`
5. `20250904035058_create_reddit_trend_engine_tables.sql`
6. `20250904035134_create_reddit_trend_rls_policies.sql`
7. `20250904035158_create_reddit_trend_indexes.sql`

### Epic 1: Opportunity Discovery
8. `20251013120000_add_epic1_viability_and_trend_fields.sql`
9. `20251014000000_create_analytics_tables.sql`

### Epic 2: Human Contact & Messaging
10. `20251013000000_rename_stripe_to_razorpay_fields.sql`
11. `20250113000001_update_pricing_strategy_free_premium.sql`
12. `20241009_update_plan_types.sql`
13. `20251014010000_create_reddit_contacts.sql`
14. `20251014020000_add_reddit_oauth_fields.sql`
15. `20251014030000_create_messages_table.sql`
16. `20251014040000_add_message_quota.sql`

### Story 2.9: Email Notifications
17. `20251023000000_add_email_preferences.sql`
18. `20251024000000_create_email_tables.sql`

### Story 2.10: Template A/B Testing
19. `20251024010000_add_template_variants.sql`

### Migration Command
```bash
# Using Supabase CLI (recommended)
cd /path/to/your/project
npx supabase db push

# Or manually via Supabase Dashboard:
# 1. Go to SQL Editor in Supabase Dashboard
# 2. Run each migration file in order
# 3. Verify no errors
```

---

## 🚀 Vercel Deployment Steps

### Step 1: Prepare Repository
```bash
# Ensure all changes are committed
git status

# Push to main branch
git checkout main
git merge feature/bmad_method_implementation
git push origin main
```

### Step 2: Create Vercel Project
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Select the repository: `your-username/startup-sniff`
4. Framework Preset: **Next.js**
5. Root Directory: `./` (default)
6. Build Command: `npm run build` (default)
7. Output Directory: `.next` (default)
8. Install Command: `npm install` (default)

### Step 3: Configure Environment Variables
In Vercel Project Settings → Environment Variables:

1. Add all environment variables from the section above
2. Scope: **Production, Preview, Development**
3. **CRITICAL**: Do NOT set `NODE_ENV` manually

### Step 4: Deploy
1. Click "Deploy"
2. Wait for build to complete (~2-3 minutes)
3. Verify deployment success

---

## ⏰ Cron Jobs Configuration

Vercel automatically reads `vercel.json` and configures these cron jobs:

| Job | Schedule | Description |
|-----|----------|-------------|
| `/api/reddit/fetch` | Every 4 hours | Fetch new Reddit posts |
| `/api/cron/send-weekly-summaries` | Monday 9 AM | Send weekly performance emails |
| `/api/cron/send-scheduled-emails` | Every hour | Send onboarding drip campaign |
| `/api/cron/update-variant-metrics` | Daily 1 AM | Update template variant metrics |

### Cron Job Security
Each cron endpoint checks for the `CRON_SECRET` header:
```typescript
if (request.headers.get('x-vercel-cron-secret') !== process.env.CRON_SECRET) {
  return new Response('Unauthorized', { status: 401 })
}
```

---

## 🎯 Post-Deployment Verification

### Immediate Checks (First 10 Minutes)
- [ ] Visit production URL: https://your-domain.com
- [ ] Homepage loads without errors
- [ ] Sign up for a test account
- [ ] Email verification works (check Mailgun logs)
- [ ] Login with test account
- [ ] Dashboard loads: `/dashboard`
- [ ] Opportunities page loads: `/dashboard/opportunities`
- [ ] Check Vercel logs for errors
- [ ] Check Supabase logs for database errors

### Critical Flow Testing (First Hour)
- [ ] Browse opportunities and filters
- [ ] Search functionality works
- [ ] Click into opportunity detail
- [ ] Export CSV/JSON
- [ ] Reddit OAuth connection
- [ ] Message composition (if Reddit connected)
- [ ] Billing page loads
- [ ] Analytics dashboards load
- [ ] Template variants dashboard loads

### First Data Load (First 4 Hours)
- [ ] Wait for first cron job execution (every 4 hours)
- [ ] Check Vercel Cron logs
- [ ] Verify new Reddit posts appear in database
- [ ] Verify opportunities display in dashboard

### Manual Trigger (Optional)
```bash
# Trigger Reddit fetch manually
curl -X GET https://your-domain.com/api/reddit/fetch \
  -H "x-vercel-cron-secret: YOUR_CRON_SECRET"

# Check response for success
```

---

## 📊 Monitoring Setup

### Vercel Dashboard
- Monitor deployments
- Check build logs
- Review function logs
- Monitor cron job execution

### Supabase Dashboard
- Monitor database size
- Check query performance
- Review API usage
- Monitor authentication

### Mailgun Dashboard
- Track email delivery
- Monitor bounce rates
- Check spam complaints
- Review email logs

### Optional: Sentry (Story 1.11)
When ready to enable:
1. Uncomment Sentry imports in `instrumentation.ts`
2. Uncomment Sentry config in `next.config.ts`
3. Add `NEXT_PUBLIC_SENTRY_DSN` to Vercel env vars
4. Redeploy

---

## 🐛 Common Issues & Solutions

### Issue: Build Fails with "Html import" Error
**Solution**: Ensure NODE_ENV is NOT manually set in Vercel env vars

### Issue: Database Connection Fails
**Solution**:
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Check Supabase project is not paused
- Verify RLS policies are enabled

### Issue: Reddit API Returns 401
**Solution**:
- Regenerate Reddit refresh token
- Verify OAuth app credentials
- Check redirect URI matches production domain

### Issue: Cron Jobs Not Running
**Solution**:
- Verify `CRON_SECRET` is set in Vercel
- Check cron job syntax in `vercel.json`
- Review Vercel Cron logs

### Issue: Emails Not Sending
**Solution**:
- Verify Mailgun API key and domain
- Check Mailgun DNS settings
- Review Mailgun logs for errors
- Ensure `MAILGUN_FROM_EMAIL` uses verified domain

### Issue: OpenAI Rate Limits
**Solution**:
- Check OpenAI usage dashboard
- Increase rate limit tier
- Add delays between requests
- Implement retry logic

---

## 📈 Success Metrics

### Day 1 (Launch Day)
- [ ] Site accessible at production URL
- [ ] No 500 errors in logs
- [ ] At least 10 Reddit posts fetched
- [ ] Test user can complete signup flow
- [ ] Test message sent successfully

### Week 1
- [ ] Cron jobs running on schedule
- [ ] >100 opportunities scored
- [ ] 2+ real users signed up
- [ ] Email notifications working
- [ ] No critical errors

### Month 1 (Epic 1 Validation)
- [ ] >100 active opportunities
- [ ] >25% user return rate (7-day)
- [ ] >2 min average session time
- [ ] >2 opportunities explored per session
- [ ] Template A/B testing collecting data

---

## 🔄 Rollback Plan

### If Critical Issue Occurs:

1. **Immediate Rollback**
   - Go to Vercel Dashboard → Deployments
   - Find previous stable deployment
   - Click "Promote to Production"
   - Issue resolved in <1 minute

2. **Database Rollback**
   - Supabase has point-in-time recovery
   - Can restore to any point in last 7 days
   - Contact Supabase support if needed

3. **Investigate & Fix**
   - Review error logs in Vercel
   - Check Sentry (if enabled)
   - Fix issue in development
   - Redeploy when ready

---

## 📝 Post-Launch Checklist

### Immediate (Day 1)
- [ ] Announce launch on social media
- [ ] Share on ProductHunt (optional)
- [ ] Monitor error logs every 2 hours
- [ ] Respond to any user feedback
- [ ] Fix critical bugs immediately

### Week 1
- [ ] Analyze user behavior in analytics
- [ ] Identify and fix UX friction points
- [ ] Optimize slow-loading pages
- [ ] Gather user feedback via email
- [ ] Review OpenAI costs and optimize

### Week 2
- [ ] Set up external analytics (Google Analytics/Mixpanel/Posthog)
- [ ] Configure event tracking for validation metrics
- [ ] Implement Story 1.11 (Sentry) if not done
- [ ] Set up automated monitoring alerts
- [ ] Prepare for Epic 2 validation

---

## 🎓 Next Steps After Deployment

1. **Monitor for 1 Week**
   - Track all metrics
   - Fix any bugs
   - Gather user feedback

2. **Set Up Analytics Tools**
   - External analytics (Google Analytics/Mixpanel/Posthog)
   - Event tracking for Epic 1 & 2 validation
   - Razorpay reporting integration

3. **Data-Driven Decision**
   - Analyze validation metrics
   - Determine if GREEN/YELLOW/RED
   - Decide: Optimize Epic 2 or Start Epic 3

---

## 📞 Support Resources

- **Vercel Support**: https://vercel.com/support
- **Supabase Support**: https://supabase.com/support
- **Reddit API**: r/redditdev
- **OpenAI Support**: help.openai.com
- **Razorpay Support**: https://razorpay.com/support
- **Mailgun Support**: https://www.mailgun.com/support

---

## 🎉 You're Ready to Deploy!

**Deployment Time Estimate:** 2-3 hours
**Monitoring Period:** 1 week
**Next Milestone:** Epic 1 & 2 Validation

Good luck with your launch! 🚀
