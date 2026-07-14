# TripWise Mobile — Project Overview

## Project Purpose

TripWise is a greenfield React Native + Supabase travel collaboration platform. The goal is to replace the fragmented experience of using 8+ apps (WhatsApp, Google Photos, Splitwise, Google Maps, etc.) with a single intelligent platform that covers every phase of a trip — planning, during, and after.

**Status:** Not started. No code exists. This document defines what we are building before the first line of code is written.

---

## Core Problems We Solve

1. **Fragmented tools** — travelers juggle 8+ apps for one trip
2. **Lost memories** — photos scattered across devices with no trip context
3. **Expense nightmares** — manual splits, awkward money conversations, unresolved debts
4. **Poor planning** — generic recommendations, no personalized itineraries
5. **Collaboration chaos** — group decisions buried in endless message threads
6. **Storage costs** — users already pay for Google Drive; we should leverage it

---

## What We Are Building

### Platform
- React Native app (iOS + Android + Web via Expo)
- Supabase backend (PostgreSQL + Auth + Storage + Realtime + Edge Functions)
- Single codebase, three platforms

### Core Modules (in build order)

| # | Module | What it does |
|---|--------|-------------|
| 1 | Auth | OTP (email/phone), Google, Apple login — no passwords |
| 2 | User Profile | Rich profile with preferences, travel interests, emergency contacts |
| 3 | Trip Management | Create trips, invite members, role-based access |
| 4 | Expense Management | Log expenses, smart splitting, settlement optimization |
| 5 | Shared Memories | Photo/video uploads, trip albums, cloud storage integration |
| 6 | Chat & Collaboration | Real-time trip chat, polls, announcements |
| 7 | Timeline & Documents | Day-by-day trip story, document storage with expiry reminders |
| 8 | Maps & Places | Interactive trip maps, nearby recommendations |
| 9 | AI Assistant | Itinerary generation, recommendations, packing lists (OpenAI) |
| 10 | Analytics | Spending trends, budget vs actual, travel stats |

---

## Tech Stack

### Frontend
- **Framework:** React Native 0.81+ with Expo SDK 54+
- **Language:** TypeScript (strict mode)
- **Navigation:** React Navigation 7 (Stack + Bottom Tabs + Drawer where needed)
- **State:** Zustand (global) + React Context (auth session only)
- **Forms:** React Hook Form + Zod validation
- **UI:** Custom component library (no third-party UI kit — full design control)
- **Icons:** Lucide React Native
- **Animations:** React Native Reanimated 3 + Moti (gesture-driven micro-interactions)
- **Storage (local):** AsyncStorage 2.2.0+ (session), expo-sqlite (offline queue)
- **Image handling:** expo-image (fast, cached rendering) + expo-image-picker + expo-image-manipulator

### Backend
- **Database:** Supabase PostgreSQL 15
- **Auth:** Supabase Auth (Email OTP, Phone OTP, Google OAuth, Apple Sign In)
- **Storage:** Supabase Storage (S3-compatible)
- **Realtime:** Supabase Realtime (WebSockets)
- **Functions:** Supabase Edge Functions (Deno)
- **Extensions:** uuid-ossp, pgcrypto, pg_trgm, postgis, pgvector, pg_cron, pgjwt

### AI & Integrations
- **LLM:** OpenAI GPT-4o (recommendations, itineraries, chat)
- **Vision:** OpenAI GPT-4o Vision (receipt OCR)
- **Maps:** Google Maps API + Google Places API
- **Payments:** Razorpay (India), Stripe (international)
- **Email:** Resend (transactional) + React Email (templates)
- **SMS:** Twilio
- **Push:** Expo Push Notifications
- **Deep Linking:** expo-linking + expo-router (universal links)

### DevOps & Quality
- **Hosting:** Supabase + Vercel (web) + Expo EAS (mobile builds + OTA updates)
- **CI/CD:** GitHub Actions (lint, typecheck, test on PR; EAS build on merge)
- **Error tracking:** Sentry (sentry-expo)
- **Analytics:** PostHog (product analytics + feature flags + session replay)
- **Testing:** Jest + React Native Testing Library (unit/integration) + Maestro (E2E mobile)
- **Linting:** ESLint + Prettier + lint-staged + husky (pre-commit)
- **Type generation:** supabase gen types (auto-generated DB types from schema)

---

## Project Folder Structure

```
tripwise/
├── app.json                        # Expo config (reads from .env via extra)
├── babel.config.js
├── metro.config.js
├── .env                            # Never committed
├── .env.example                    # Committed, no real values
├── .gitignore
├── package.json
├── tsconfig.json
├── eas.json                        # EAS Build profiles (dev/preview/prod)
├── supabase/
│   ├── config.toml
│   ├── seed.sql                    # Dev seed data (categories, test users)
│   ├── migrations/
│   │   ├── 001_extensions.sql
│   │   ├── 002_schema.sql
│   │   ├── 003_rls.sql
│   │   ├── 004_storage.sql
│   │   └── 005_functions.sql       # Postgres functions (settlements, balances)
│   └── functions/
│       ├── _shared/                # Shared utilities across functions
│       │   ├── supabase-client.ts
│       │   └── cors.ts
│       ├── send-invite/
│       ├── send-push/
│       ├── calculate-settlements/
│       ├── ai-chat/
│       ├── ai-itinerary/
│       ├── receipt-ocr/
│       └── cloud-upload/
├── docs/                           # This folder — project documentation
│   ├── PRD.md
│   ├── PROJECT_OVERVIEW.md
│   ├── DEVELOPMENT_PHASES.md
│   ├── SCREEN_INVENTORY.md
│   ├── SUPABASE_FEASIBILITY.md
│   └── API_CONTRACTS.md            # Request/response contracts per endpoint
└── src/
    ├── app/                        # Entry point (if using expo-router in future)
    ├── lib/
    │   ├── supabase.ts             # Supabase client (reads from env, NO service-role key)
    │   ├── env.ts                  # Typed env reader via expo-constants
    │   └── queryClient.ts          # React Query client config (optional, see below)
    ├── navigation/
    │   ├── AppNavigator.tsx        # Root: AuthStack vs MainStack
    │   ├── AuthStack.tsx
    │   ├── MainTabs.tsx            # Bottom tab navigator
    │   ├── TripStack.tsx           # Trip detail sub-navigator
    │   ├── SettingsStack.tsx
    │   └── types.ts                # Navigation param types
    ├── screens/                    # One folder per module
    │   ├── auth/
    │   ├── profile/
    │   ├── trips/
    │   ├── expenses/
    │   ├── media/
    │   ├── chat/
    │   ├── timeline/
    │   ├── documents/
    │   ├── maps/
    │   ├── ai/
    │   ├── analytics/
    │   ├── settings/
    │   ├── notifications/
    │   ├── community/
    │   └── errors/
    ├── components/                 # Reusable UI primitives
    │   ├── ui/                     # Button, TextField, Dropdown, etc.
    │   ├── trip/                   # TripCard, StatsCard, etc.
    │   ├── expense/                # ExpenseRow, SplitPreview, etc.
    │   ├── media/                  # MediaGrid, Lightbox, etc.
    │   ├── chat/                   # MessageBubble, TypingIndicator, etc.
    │   └── shared/                 # LoadingIndicator, EmptyState, ErrorBoundary
    ├── stores/                     # Zustand stores
    │   ├── authStore.ts
    │   ├── tripStore.ts
    │   ├── expenseStore.ts
    │   ├── chatStore.ts
    │   └── uiStore.ts
    ├── services/                   # Supabase query functions (thin data layer)
    │   ├── auth.ts
    │   ├── trips.ts
    │   ├── expenses.ts
    │   ├── media.ts
    │   ├── messages.ts
    │   ├── documents.ts
    │   └── ai.ts
    ├── schemas/                    # Zod validation schemas
    │   ├── auth.ts
    │   ├── trip.ts
    │   ├── expense.ts
    │   └── common.ts
    ├── hooks/                      # Custom React hooks
    │   ├── useTrips.ts
    │   ├── useExpenses.ts
    │   ├── useRealtime.ts
    │   ├── useOfflineQueue.ts
    │   └── useLocation.ts
    ├── utils/
    │   ├── currency.ts             # Format, convert, symbol lookup
    │   ├── date.ts                 # date-fns wrappers, relative time
    │   ├── settlements.ts          # Debt simplification algorithm
    │   ├── permissions.ts          # Role-based UI guards
    │   ├── deepLink.ts             # Deep link parser
    │   ├── webAlert.ts             # Cross-platform Alert wrapper
    │   └── webStyles.ts            # Web-specific style helpers
    ├── theme/
    │   ├── colors.ts               # Light + dark palette
    │   ├── typography.ts           # Font families, sizes, weights
    │   ├── spacing.ts              # 4px grid scale
    │   ├── shadows.ts              # Elevation tokens
    │   ├── breakpoints.ts          # Responsive breakpoints (tablet/web)
    │   └── index.ts                # Unified export
    ├── i18n/
    │   ├── index.ts                # i18next config
    │   ├── en.json                 # English (default)
    │   └── hi.json                 # Hindi (second priority)
    ├── constants/
    │   ├── categories.ts           # Expense categories with icons/colors
    │   ├── tripTypes.ts            # Trip type definitions
    │   └── config.ts               # Feature flags, limits, API URLs
    └── types/
        ├── database.ts             # Auto-generated Supabase types (supabase gen types)
        ├── models.ts               # App-level model types
        └── navigation.ts           # Screen param types
```

---

## Conventions

### Naming
- **Files:** PascalCase for screens/components (`TripDetailScreen.tsx`), camelCase for everything else
- **Stores:** `useXxxStore` (Zustand)
- **Hooks:** `useXxx`
- **Services:** plain functions, no classes (`createTrip`, `getTripList`)
- **Types:** PascalCase interfaces, no `I` prefix
- **Constants:** UPPER_SNAKE_CASE for true constants, camelCase for config objects

### State Management Rules
- **Zustand** for all server-fetched data (trips, expenses, messages)
- **React Context** only for auth session (Supabase session object)
- **Local component state** for UI-only state (modal open, input focus)
- No Redux, no MobX
- Consider TanStack Query (React Query) if data fetching patterns get complex — decision point at Phase 3

### Data Fetching Pattern
- Services return `{ data, error }` (mirrors Supabase pattern)
- Zustand stores call services and cache results
- Screens read from stores, trigger fetches via store actions
- Optimistic updates for writes (expense add, message send, reaction)
- Background re-validation on screen focus for stale data

### Error Handling
- Every service function returns `{ data, error }` — never throws
- Screens handle errors via Snackbar (non-blocking) or full-screen error state (blocking)
- Never swallow errors silently — always log to Sentry + show user feedback
- Global error boundary catches unhandled crashes → `ServerErrorScreen`
- Network errors → `NoInternetScreen` (with retry + offline mode fallback)

### Loading States
- Every list screen must define: loading skeleton, empty state, error state
- Use shimmer/skeleton placeholders (not spinners) for content-heavy screens
- Use `LoadingIndicator` component only for full-screen blocking operations
- Use inline skeleton rows for list refreshes and pagination

### Cross-Platform
- All `Alert.alert` calls go through `src/utils/webAlert.ts`
- All fixed/floating elements use `src/utils/webStyles.ts` helpers
- Every scrollable screen uses `webScrollViewStyle` + `webScrollContentStyle`
- Test on iOS, Android, and web before marking any screen done
- Use `Platform.select` sparingly — prefer responsive design over platform branching

### Security Rules
- Service-role key **never** in client code — Edge Functions only
- All Supabase queries go through the anon client with RLS as the gate
- No hard-coded credentials anywhere in `src/`
- `.env` is git-ignored; `.env.example` is committed with placeholder values
- All user inputs validated with Zod before sending to backend
- Sanitize any user-generated content rendered in the UI (XSS prevention)

### Performance Guidelines
- Virtualize all lists (FlatList/FlashList) — never render unbounded arrays
- Lazy-load heavy screens with React.lazy + Suspense
- Images: use `expo-image` with caching, serve WebP thumbnails where possible
- Bundle size: monitor with `npx expo export --dump-sourcemap`, keep under 5MB JS
- Avoid re-renders: memoize expensive components, use `useCallback`/`useMemo` judiciously

### Accessibility (a11y)
- Every interactive element has an `accessibilityLabel`
- Every image has `accessibilityLabel` (meaningful) or `accessibilityElementsHidden` (decorative)
- Touch targets minimum 44×44pt
- Color contrast ratio ≥ 4.5:1 for text
- Screen reader tested on iOS VoiceOver and Android TalkBack per phase
- Support dynamic type / font scaling

---

## Revenue Model

**Freemium:**
- **Free:** 5 active trips, 10 members/trip, 2GB storage, standard AI, ads (non-intrusive)
- **Premium ($4.99/mo or $49.99/yr):** Unlimited trips/members, 50GB storage, priority AI, offline maps, exports, ad-free
- **Family ($9.99/mo):** 6 accounts, all premium features, shared family budget
- **Corporate ($29.99/mo/team):** Expense policies, approval workflows, SSO, API access, admin dashboard

---

## Target Users

1. **Young travelers (22-35)** — group trips, expense splitting, social sharing (60% of base)
2. **Families (35-50)** — vacation planning, document storage, budget tracking (25%)
3. **Couples (25-45)** — memory preservation, simple splits (10%)
4. **Corporate travelers** — expense compliance, reporting (5%)

---

## Success Metrics

| Metric | MVP (Month 3) | Phase 2 (Month 6) | Phase 3 (Month 9) | Phase 4 (Month 12) |
|--------|---------------|-------------------|-------------------|---------------------|
| Active Users | 5K | 50K | 200K | 1M |
| Trips Created | 2K | 25K | 100K | 500K |
| Premium Users | 100 | 2.5K | 20K | 100K |
| MRR | $500 | $12K | $50K | $200K |
| App Rating | 4.3 | 4.5 | 4.6 | 4.7 |
| 30-day Retention | 40% | 60% | 70% | 75% |

---

## What's Missing from Original Thinking (Additions)

The following items were not in the original documentation but are critical for a production app:

### 1. Onboarding & Activation
- **Progressive onboarding** — don't ask for everything upfront. Collect name + avatar on signup, ask for travel interests only when they create their first trip.
- **Empty state storytelling** — every empty screen should teach the user what to do, not just say "nothing here."
- **Invite virality loop** — when a user invites friends to a trip, those friends should have a zero-friction join experience (no signup wall before seeing the trip preview).

### 2. Offline-First Architecture
- Not just "offline mode" as a late phase — design the data layer from day one to work offline.
- Use expo-sqlite as a local cache. Sync on reconnect.
- Queue writes (expenses, messages, photos) locally and flush in order.
- Show a subtle sync indicator, not a blocking "you're offline" wall.

### 3. Performance & UX Polish
- **FlashList** instead of FlatList for large lists (expenses, media, messages) — significantly better performance.
- **Skeleton screens** for every data-fetching state (not blank screens with spinners).
- **Haptic feedback** on key actions (expense added, settle up confirmed).
- **Pull-to-refresh** on every list screen.
- **Infinite scroll / pagination** — never load all data at once.

### 4. Security Additions
- **Biometric lock** — optional Face ID / fingerprint to open the app (sensitive financial data).
- **Session management** — show active devices, allow remote logout.
- **Rate limiting** on all write operations client-side (debounce) and server-side (RLS + Edge Function guards).
- **Input sanitization** — prevent XSS in chat messages and notes.

### 5. Testing Strategy
- **Unit tests** for settlement algorithm, currency conversion, date utilities — these are pure logic.
- **Integration tests** for Zustand stores + services (mock Supabase client).
- **E2E tests** (Maestro) for critical flows: signup → create trip → add expense → settle up.
- **Supabase local dev** (`supabase start`) for testing RLS policies and migrations.

### 6. Monitoring & Observability
- **Sentry** for crash reporting + performance monitoring from day one.
- **PostHog** for product analytics — funnel tracking (signup → first trip → first expense → invite friend).
- **Custom events** for business metrics (expense_added, settlement_completed, photo_uploaded).
- **Supabase Dashboard** for DB performance, slow queries, storage usage.

### 7. Legal & Compliance
- **GDPR / India's DPDP Act** — data export, account deletion, consent management.
- **App Store / Play Store** guidelines compliance from the start (privacy labels, data safety forms).
- **Terms of Service + Privacy Policy** — must exist before any public beta.

### 8. Growth & Retention Mechanics
- **Push notification strategy** — not just "send everything." Smart timing, batching, quiet hours.
- **Trip reminders** — "Your Goa trip starts in 3 days! Have you packed?"
- **Settlement nudges** — "Rahul still owes you ₹450. Send a friendly reminder?"
- **Memory triggers** — "1 year ago today, you were in Manali 🏔️" (drives re-engagement).
- **Referral system** — "Invite 3 friends, get 1 month premium free."

### 9. Design System
- Build a **proper design system** before coding screens — tokens (colors, spacing, typography, shadows), components (Button variants, Card, Badge, Avatar, Chip), patterns (forms, lists, modals, sheets).
- Use **Figma** for design source of truth. Export tokens as code-ready JSON.
- Dark mode from day one — not retrofitted later.

### 10. Deployment & Release Strategy
- **Feature flags** (PostHog or custom) — ship code hidden behind flags, enable per user/percentage.
- **OTA updates** via EAS Update for JS-only changes (instant fixes without app store review).
- **Staged rollouts** — 10% → 50% → 100% for risky features.
- **Beta channels** — TestFlight (iOS) + Play Console internal track (Android) for early feedback.

---

*Last updated: July 2026 — Project not yet started. All features are planned, none are built.*
