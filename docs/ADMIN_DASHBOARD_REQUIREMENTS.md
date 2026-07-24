# ExpenseX — Admin Dashboard & Analytics Requirements

> As the app owner, you need visibility into user behavior, app health, feedback, and revenue. This document outlines everything you should track, monitor, and build for an admin dashboard.

---

## 1. User Analytics

### Key Metrics
| Metric | What It Tells You |
|--------|-------------------|
| Total Users (registered) | Overall growth |
| Daily Active Users (DAU) | Daily engagement |
| Weekly Active Users (WAU) | Weekly retention |
| Monthly Active Users (MAU) | Monthly health |
| DAU/MAU Ratio | Stickiness (target: >20%) |
| New Signups (per day/week/month) | Growth rate |
| Churn Rate | How many stop using the app |
| User Retention (Day 1, Day 7, Day 30) | Onboarding effectiveness |

### User Segmentation
- By location (city/country)
- By platform (Android/iOS/Web)
- By group type usage (Trip/Flatmates/Office etc.)
- By activity level (power users vs casual)
- By signup method (email vs phone)

---

## 2. App Usage Analytics

### Feature Usage
| Feature | Track |
|---------|-------|
| Groups Created | Count per day/week |
| Expenses Added | Count per day, avg amount |
| Settlements Completed | Count, total amount |
| Chat Messages Sent | Volume per day |
| Photos Uploaded | Count, storage used |
| UPI Payments Initiated | Count, success rate |
| Profile Completions | Conversion from signup |

### Screen Analytics
- Most visited screens
- Average session duration
- Screen flow / user journey
- Drop-off points (where users leave)
- Time spent per screen

### Group Analytics
- Avg members per group
- Avg expenses per group
- Most popular group types
- Groups created vs abandoned (no activity after creation)
- Avg group lifespan

---

## 3. Revenue & Business Metrics

### Current (Free App)
- Cost per user (server + storage)
- Supabase usage (bandwidth, DB size, storage, edge function invocations)
- Google Drive API quota usage

### Future (When Monetized)
- Premium subscribers count
- Monthly Recurring Revenue (MRR)
- Average Revenue Per User (ARPU)
- Conversion rate (free → paid)
- Lifetime Value (LTV)

---

## 4. Error & Crash Monitoring

### What to Track
| Type | Tool Suggestion |
|------|-----------------|
| App Crashes | Sentry / Firebase Crashlytics |
| JS Errors | Sentry (React Native) |
| API Failures | Supabase Dashboard + custom logging |
| Auth Failures | Login errors, OTP delivery failures |
| Upload Failures | File upload success/failure rate |
| Payment Failures | UPI deep link failures |

### Key Error Metrics
- Crash-free sessions percentage (target: >99.5%)
- Top crash causes
- Error rate by screen
- Error rate by device/OS version
- Average response time for API calls

---

## 5. User Feedback & Support

### Channels
| Channel | Purpose |
|---------|---------|
| In-app feedback (existing) | Star rating + text |
| In-app bug report | Capture screen + description |
| Support email | support@expensex.app |
| App Store reviews | Public perception |
| Social media mentions | Brand monitoring |

### Admin Should See
- All feedback submissions (rating, text, user, timestamp)
- Average rating trend (daily/weekly)
- Common complaints (keyword clustering)
- Response status (replied / pending / resolved)
- Bug reports with screenshots

---

## 6. Notifications & Communications

### Track
- Push notification delivery rate
- Notification open rate
- Email delivery rate (via Resend)
- Email open rate
- Most effective notification types

---

## 7. Security & Compliance

### Monitor
- Failed login attempts (brute force detection)
- Suspicious activity (mass data access)
- RLS policy violations
- Data deletion requests (GDPR/privacy)
- Account deactivations

---

## 8. Infrastructure Health

### Supabase Monitoring
- Database size & growth rate
- Connection pool usage
- Slow queries
- RPC function execution times
- Realtime channel connections
- Storage bucket size
- Edge function cold starts & errors

### App Performance
- App startup time (cold/warm)
- Frame rate (target: 60fps)
- Memory usage
- Network request latency
- Bundle size

---

## 9. Admin Website Requirements

### Pages Needed

#### Dashboard (Home)
- Total users, DAU, MAU at a glance
- New signups today/this week
- Total groups, expenses, settlements
- Revenue (when applicable)
- System health status

#### Users
- User list with search/filter
- User detail (profile, groups, activity)
- Ability to suspend/ban accounts
- Export user data (CSV)

#### Groups
- Group list with search
- Group detail (members, expenses, settlements)
- Flag inactive groups
- Most active groups

#### Analytics
- Charts: signups over time, DAU/WAU/MAU trends
- Feature usage breakdown
- User retention cohorts
- Geographic heatmap

#### Feedback & Support
- All feedback submissions
- Bug reports
- Reply to users
- Mark as resolved

#### Notifications
- Send broadcast notifications
- Schedule notifications
- View delivery stats

#### Settings
- App configuration
- Feature flags (enable/disable features)
- Maintenance mode toggle
- Rate limits

---

## 10. Recommended Tech Stack for Admin Dashboard

| Component | Recommendation | Why |
|-----------|---------------|-----|
| Frontend | Next.js + Tailwind + shadcn/ui | Fast to build, modern |
| Auth | Supabase Auth (same project) | Shared user base |
| Database | Same Supabase project | Direct access to data |
| Analytics | PostHog (self-hosted or cloud) | Free tier, powerful |
| Crash Monitoring | Sentry | Industry standard for RN |
| Email | Resend (already using) | Already configured |
| Push Notifications | Expo Notifications | Built into Expo |
| Hosting | Vercel | Free for Next.js |
| Charts | Recharts or Tremor | Clean charts |

---

## 11. Implementation Priority

### Phase 1 — Must Have (Before Launch)
1. Sentry for crash reporting (free tier: 5k events/month)
2. Basic Supabase SQL queries for user counts
3. In-app feedback collection (already exists)
4. App Store listing

### Phase 2 — After First 100 Users
1. PostHog integration for usage analytics
2. Simple admin page (Next.js) showing user stats
3. Notification broadcasting
4. Export tools

### Phase 3 — After 1000 Users
1. Full admin dashboard
2. User segmentation
3. Feature flags
4. Automated alerts (crash spikes, signup drops)
5. Revenue tracking

### Phase 4 — Scale
1. A/B testing infrastructure
2. Advanced analytics (cohort, funnel)
3. Customer support ticketing
4. Automated email campaigns

---

## 12. Quick Supabase Queries for Immediate Insights

Run these in Supabase SQL Editor anytime:

```sql
-- Total registered users
SELECT COUNT(*) AS total_users FROM profiles;

-- New signups this week
SELECT COUNT(*) AS new_this_week FROM profiles
WHERE created_at > NOW() - INTERVAL '7 days';

-- Users by signup month
SELECT DATE_TRUNC('month', created_at) AS month, COUNT(*) AS signups
FROM profiles GROUP BY month ORDER BY month DESC;

-- Total groups
SELECT COUNT(*) AS total_groups FROM trips;

-- Groups by type
SELECT group_type, COUNT(*) AS count FROM trips GROUP BY group_type ORDER BY count DESC;

-- Total expenses and amount
SELECT COUNT(*) AS total_expenses, SUM(amount) AS total_amount FROM expenses;

-- Top spending categories
SELECT category, COUNT(*) AS count, SUM(amount) AS total
FROM expenses GROUP BY category ORDER BY total DESC LIMIT 10;

-- Active users (used app in last 7 days based on expenses/messages)
SELECT COUNT(DISTINCT user_id) AS active_users_7d FROM (
  SELECT paid_by AS user_id FROM expenses WHERE created_at > NOW() - INTERVAL '7 days'
  UNION
  SELECT user_id FROM messages WHERE created_at > NOW() - INTERVAL '7 days'
) active;

-- Settlements summary
SELECT status, COUNT(*) AS count, SUM(amount) AS total
FROM settlements GROUP BY status;

-- Average group size
SELECT AVG(member_count) AS avg_members FROM (
  SELECT trip_id, COUNT(*) AS member_count FROM trip_members WHERE status = 'active' GROUP BY trip_id
) g;

-- Users who signed up but never created/joined a group
SELECT COUNT(*) AS inactive_users FROM profiles p
WHERE NOT EXISTS (SELECT 1 FROM trip_members tm WHERE tm.user_id = p.id);

-- Feedback ratings (if stored)
-- SELECT rating, COUNT(*) FROM feedback GROUP BY rating ORDER BY rating;
```

---

## 13. Geographic Insights

To know where users are from, you can:
1. Use the `home_city` field from profiles
2. Add IP-based geolocation on signup (via Edge Function)
3. Use PostHog's automatic geo-detection

```sql
-- Users by city
SELECT home_city, COUNT(*) AS users
FROM profiles
WHERE home_city IS NOT NULL
GROUP BY home_city
ORDER BY users DESC
LIMIT 20;
```

---

## Summary: What You Need as an App Owner

| Need | Solution | Cost |
|------|----------|------|
| "How many users do I have?" | Supabase SQL query | Free |
| "Is my app crashing?" | Sentry | Free (5k events) |
| "What features are popular?" | PostHog | Free (1M events/mo) |
| "What do users think?" | In-app feedback (already built) | Free |
| "Where are my users?" | home_city + PostHog geo | Free |
| "Full admin dashboard" | Next.js + Supabase | Vercel free tier |
| "Push notifications" | Expo Notifications | Free |
| "Email campaigns" | Resend | Free (3k/mo) |
