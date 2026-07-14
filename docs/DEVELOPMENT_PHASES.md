# TripWise — Development Phases

> A phase-by-phase execution plan to take TripWise from zero to a full travel collaboration platform. Nothing is built yet — this is a greenfield project.

**Last updated:** July 14, 2026  
**Owner:** TripWise product team  
**Stack:** Expo SDK 54+ · React Native 0.81+ · React 19 · TypeScript · Supabase (Postgres + Auth + Storage + Realtime + Edge Functions)  
**Platforms:** iOS · Android · Web

---

## How to read this document

Each phase is broken down into:

1. **Objective** — what "done" looks like for the phase.
2. **🚧 To build (React Native)** — client-side work.
3. **🚧 To build (Supabase)** — backend work.
4. **Deliverables / acceptance criteria** — measurable exit criteria.
5. **Estimated effort** — rough calendar weeks for a small team.

Phases are ordered so each one unlocks the next. Phases 0–3 form the "must-ship MVP". Phases 4–7 build the collaboration and memory story. Phases 8+ are growth and monetization.

---

## Current state: Nothing exists

- ❌ No Expo project scaffolded
- ❌ No Supabase project created
- ❌ No database schema
- ❌ No screens built
- ❌ No services written
- ❌ No CI/CD pipeline

Everything described below is **to be built from scratch**.

---

## Phase overview

| # | Phase | Weeks | Screens shipped (cumulative) | Ships to users? |
|---|-------|-------|------------------------------|-----------------|
| 0 | Project scaffold + backend bootstrap | 1–2 | 0 | No (internal) |
| 1 | Authentication + user profile | 2 | 9 | Alpha |
| 2 | Trip management + invitations | 2 | 18 | Alpha |
| 3 | Expense management + smart splitting | 2–3 | 25 | **MVP GA** |
| 4 | Shared memories (media upload + albums) | 2 | 31 | v1.1 |
| 5 | Chat, notifications, invitations | 2 | 38 | v1.2 |
| 6 | Timeline, documents, analytics, settings | 3 | 59 | v1.3 |
| 7 | Maps + AI travel assistant | 3 | 70 | v2.0 |
| 8 | Cloud storage integrations (Drive / OneDrive) | 2 | 72 | v2.1 |
| 9 | Offline mode, security, compliance | 2 | 81 | v2.2 |
| 10 | Growth: bookings, premium, community | ongoing | 98+ | v3.0+ |

Per-screen breakdown lives in [`SCREEN_INVENTORY.md`](./SCREEN_INVENTORY.md).

**Total to MVP GA (end of Phase 3): ~7–9 weeks · 25 screens.**  
**Total to feature-complete v2.0: ~20–24 weeks · 70 screens.**

---

## Phase 0 — Project scaffold + backend bootstrap

**Objective:** Set up the Expo project, Supabase project, database schema, RLS, storage, CI/CD pipeline — so that Phase 1 can start building screens against a real backend.

### 🚧 To build (React Native / Project Setup)

- Initialize Expo project: `npx create-expo-app tripwise --template expo-template-blank-typescript`
- Configure `app.json` / `app.config.ts` with app name, slug, scheme (`tripwise://`), bundleIdentifier, package name.
- Set up folder structure as defined in `PROJECT_OVERVIEW.md`.
- Install core dependencies:
  - `@supabase/supabase-js` (Supabase client)
  - `@react-navigation/native`, `@react-navigation/stack`, `@react-navigation/bottom-tabs`
  - `react-native-screens`, `react-native-safe-area-context`, `react-native-gesture-handler`
  - `zustand` (state management)
  - `react-hook-form`, `@hookform/resolvers`, `zod`
  - `@react-native-async-storage/async-storage` (auth persistence)
  - `lucide-react-native` (icons)
  - `react-native-reanimated` (animations)
  - `expo-image` (optimized images)
  - `date-fns` (date utilities)
- Create `.env.example` with placeholder values for `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `EXPO_PUBLIC_*` vars.
- Create `src/lib/env.ts` — typed env reader via `expo-constants`.
- Create `src/lib/supabase.ts` — Supabase client initialized from env vars. **No service-role key in client.**
- Create theme tokens (`src/theme/`) — colors (light + dark), typography, spacing, shadows.
- Create basic navigation shell (`AuthStack` vs `MainStack` routing based on session).
- Set up ESLint + Prettier + TypeScript strict config.
- Set up `eas.json` for EAS Build profiles (development, preview, production).
- Initialize Git repo with proper `.gitignore`.

### 🚧 To build (Supabase)

- Create Supabase project via dashboard.
- Run `npx supabase init` to scaffold `supabase/` folder.
- Link project: `npx supabase link --project-ref <ref>`.
- **Enable extensions:** `uuid-ossp`, `pgcrypto`, `pg_trgm`, `postgis`, `vector`, `pg_cron`, `pgjwt`.
- **Create core schema** (migrations):
  - `profiles` (user profile data, linked to `auth.users`)
  - `trips`
  - `trip_members`
  - `trip_invitations`
- **Row Level Security policies:**
  - Users can read/update only their own `profiles` row.
  - Users can read `trips` only if they are a member.
  - Trip admins can update/delete their trips.
  - Members can read other members of the same trip.
- **Storage buckets:**
  - `avatars` (public read, owner write, max 5MB)
  - `trip-covers` (public read, member write, max 10MB)
  - `trip-media` (member-only read/write)
  - `documents` (private, member-only)
  - `receipts` (private, member-only)
- **Auth providers:**
  - Enable Email OTP (magic link + 6-digit code)
  - Enable Phone OTP (requires Twilio setup)
  - Configure Google OAuth (Google Cloud Console)
  - Configure Apple Sign In (Apple Developer)
- **Database triggers:**
  - `handle_new_user()` — auto-create `profiles` row when `auth.users` inserts.
  - `update_updated_at()` — auto-update `updated_at` on row changes.
- **Seed data:** default expense categories, sample trip types.
- **Generate TypeScript types:** `npx supabase gen types typescript --project-id <ref> > src/types/database.ts`

### 🚧 To build (CI/CD)

- GitHub Actions workflow: lint + typecheck + test on every PR.
- Supabase migration lint check on PR.
- EAS Build trigger on merge to `main`.
- Expo web deploy to Vercel on merge to `main`.

### Deliverables / acceptance criteria

- `npx expo start` runs without errors on iOS, Android, and web.
- Supabase migrations apply cleanly from scratch (idempotent).
- `src/lib/supabase.ts` reads from env — no hard-coded keys.
- Service-role key does NOT exist in any file under `src/`.
- Manual smoke test: create user via Supabase Studio → `profiles` row auto-creates → anon client can't read other users' rows.
- Storage buckets visible in Supabase Studio with correct RLS.
- CI pipeline passes on a clean PR.
- `README.md` has setup instructions (clone, env vars, `npx expo start`).

### Estimated effort
1–2 weeks (1 developer full-time).

---

## Phase 1 — Authentication + user profile end-to-end

**Objective:** Users can sign in via OTP or social login, complete their profile, and land on a working (empty) dashboard. Session persists across app restarts.

### 🚧 To build (React Native)

**Screens (7 new):**
- `SplashScreen` — animated logo, session check, routes to Welcome or Dashboard.
- `WelcomeScreen` — hero illustration, "Get Started" CTA, "I already have an account" link.
- `LoginScreen` — email/phone toggle, OTP send button, Google/Apple social buttons.
- `OtpVerificationScreen` — 6-digit input, auto-verify, resend with cooldown timer.
- `CompleteProfileScreen` — avatar, name, DOB, gender, city, currency, travel interests.
- `ProfileScreen` — read-only profile card with edit/settings/logout buttons.
- `EditProfileScreen` — editable form (reuses CompleteProfile layout).
- `TermsOfServiceScreen` — WebView or in-app markdown render.
- `PrivacyPolicyScreen` — same.

**Services:**
- `src/services/auth.ts` — wraps `supabase.auth.signInWithOtp()`, `verifyOtp()`, `signInWithOAuth()`, `signOut()`.
- `src/services/profile.ts` — CRUD on `profiles` table, avatar upload to `avatars` bucket.

**State:**
- `src/stores/authStore.ts` — session, user profile, loading state, `onAuthStateChange` listener.

**Components:**
- OtpInput (6-cell auto-advance)
- AvatarPicker (camera/gallery/emoji)
- TextField, Button, Dropdown, DatePicker (design system primitives)
- Snackbar, LoadingIndicator, ErrorMessage

**Other:**
- Deep link config for `tripwise://` scheme.
- Cross-platform Alert wrapper (`webAlert.ts`).
- Theme provider (light/dark mode support).

### 🚧 To build (Supabase)

- Configure Email OTP templates (custom subject, branding).
- Configure SMS OTP via Twilio.
- Wire Google OAuth (client ID, redirect URLs).
- Wire Apple Sign In (service ID, private key).
- Test auth flow end-to-end in Supabase Studio.

### Deliverables / acceptance criteria

- User can: enter email → receive OTP → verify → complete profile → see dashboard.
- User can: tap Google → OAuth flow → complete profile → see dashboard.
- Returning user skips profile completion and goes straight to dashboard.
- Session persists across app kill and restart (AsyncStorage).
- Web app refresh maintains session.
- RLS tested: user A cannot read user B's profile.
- Works on iOS, Android, and web without errors.

### Estimated effort
2 weeks.

---

## Phase 2 — Trip management + invitations

**Objective:** Users can create trips, invite others, and see only the trips they belong to. Real-time updates when members join.

### 🚧 To build (React Native)

**Screens (9 new):**
- `TripDashboardScreen` — stats row, trip list (FlatList), search, filter by status, empty state, FAB.
- `CreateTripScreen` — name, destination, dates, type, cover image, budget, description.
- `TripDetailScreen` — header with cover, tabs (Overview / Expenses / Photos / Chat / Timeline / Docs / Map), menu.
- `TripOverviewTab` — description, members strip, budget progress, recent activity.
- `EditTripScreen` — same form as Create, pre-filled. Admin only.
- `InviteMembersScreen` — email/phone input, pending invites list, shareable link.
- `MemberListScreen` — members with roles, admin actions (promote, remove).
- `TripSettingsScreen` — rename, cover, privacy, archive, delete, leave.
- `AcceptInviteScreen` — deep link landing: trip preview + Accept/Decline.

**Services:**
- `src/services/trips.ts` — `createTrip`, `getTripList`, `getTripDetail`, `updateTrip`, `deleteTrip`, `archiveTrip`.
- `src/services/members.ts` — `inviteMember`, `acceptInvite`, `removeMember`, `updateRole`, `getPendingInvites`.

**State:**
- `src/stores/tripStore.ts` — trip list, active trip, members, real-time subscription.

**Components:**
- TripCard, StatsCard, EmptyState, SearchBar, FloatingButton
- BottomNavigation (Trips / Expenses / Profile tabs — minimal for MVP)
- DashboardHeader (greeting, avatar, notifications bell)
- MemberAvatar, RoleBadge, InviteRow

**Real-time:**
- Subscribe to `trip_members` changes for live member join/leave updates.

### 🚧 To build (Supabase)

- Postgres function `create_trip_with_admin(...)` — single transaction: insert trip + insert creator as admin member.
- Postgres function `invite_to_trip(trip_id, identifier)` — creates invitation row, returns signed token.
- Edge Function `send-invite` — sends email/SMS with deep link using Resend/Twilio.
- RLS: only admin can update trip metadata; any member can read; only admin can delete.
- Enable Realtime on `trips` and `trip_members` tables.
- Trip cover image upload to `trip-covers` bucket.

### Deliverables / acceptance criteria

- User A creates trip → invites User B by email → B receives link → B accepts → appears in member list.
- Non-members get 0 rows when querying that trip (RLS enforced).
- Trip appears instantly in other members' dashboards without manual refresh (Realtime).
- Deep link `tripwise://invite/{token}` works on all platforms.
- Cover image uploads and displays correctly.
- Trip dashboard shows correct stats (total/upcoming/completed counts).

### Estimated effort
2 weeks.

---

## Phase 3 — Expense management + smart splitting *(MVP GA target)*

**Objective:** Users can log expenses on a trip, split them multiple ways, and see who owes whom with automatic settlement optimization.

### 🚧 To build (React Native)

**Screens (7 new):**
- `ExpensesListTab` — inside TripDetail. Grouped by date, filter by category/payer, total + budget bar.
- `AddExpenseScreen` — amount (hero input), category grid, title, date, paid by, split with, split type (equal/unequal/percentage/shares), receipt photo, location tag, live split preview.
- `ExpenseDetailScreen` — full breakdown, receipt viewer, edit/delete actions.
- `EditExpenseScreen` — reuses AddExpense form pre-filled.
- `BalancesScreen` — "You owe" / "You are owed" summary, simplified debt list, full matrix toggle.
- `SettleUpScreen` — record payment between two members (amount, method, notes).
- `SettlementHistoryScreen` — log of all settlements for the trip.

**Services:**
- `src/services/expenses.ts` — `addExpense`, `getExpenses`, `updateExpense`, `deleteExpense`, `getBalances`, `getSettlements`, `recordSettlement`.

**State:**
- `src/stores/expenseStore.ts` — expenses list, balances, settlements, real-time subscription.

**Utils:**
- `src/utils/settlements.ts` — greedy debt simplification algorithm (minimize number of transactions).
- `src/utils/currency.ts` — format amounts, currency symbols, basic conversion.

**Components:**
- ExpenseRow, CategoryIcon, SplitPreview, BalanceRow, SettleUpSheet
- AmountInput (large, currency-aware)
- CategoryGrid (icon + label grid picker)
- MemberPicker (multi-select with avatars)

### 🚧 To build (Supabase)

- Tables: `expenses`, `expense_splits`, `settlements`.
- Seed default categories (Food, Fuel, Hotel, Flight, Shopping, Parking, Entertainment, Emergency, Medical, Transport, Miscellaneous).
- Postgres function `compute_balances(trip_id)` — returns net balance per member.
- Postgres function `optimize_settlements(trip_id)` — greedy debt simplification (N members settle in at most N-1 transactions).
- RLS: only trip members can read/write expenses for their trip.
- Trigger: prevent editing settled expenses without admin override.
- Enable Realtime on `expenses` and `expense_splits`.
- Receipt image upload to `receipts` bucket.

### Deliverables / acceptance criteria

- Given 5 friends with expenses ₹5000, ₹10000, ₹200, ₹0, ₹3000 — `compute_balances` returns correct net values.
- `optimize_settlements` produces valid minimal transaction set.
- Adding an expense triggers real-time balance update for every member.
- Split types (equal, unequal, percentage, shares) all calculate correctly.
- Receipt photo uploads and displays in expense detail.
- Settlement recording updates balances immediately.
- **This is the MVP GA release** — app goes to beta testers after this phase.

### Estimated effort
2–3 weeks.

---

## Phase 4 — Shared memories (media upload + trip albums)

**Objective:** Every trip becomes a private album. Members can upload photos/videos, react, and comment.

### 🚧 To build (React Native)

**Screens (6 new):**
- `PhotosTab` — masonry grid, filter by member, selection mode, date headers.
- `UploadMediaScreen` — multi-select picker, preview strip, captions, upload queue with progress.
- `MediaViewerScreen` — full-screen lightbox, swipe, pinch-zoom, download, share.
- `MediaCommentsSheet` — bottom sheet with reactions + comments on a media item.
- `AlbumsScreen` — curated sub-albums (Day 1, Beach, etc.) with create album FAB.
- `LanguageScreen` — i18n starts this phase.

**Libraries to add:**
- `expo-image-picker`, `expo-image-manipulator`, `expo-av` (video/voice), `expo-file-system`
- `i18next`, `react-i18next`, `expo-localization`

**Key behaviors:**
- Upload queue persisted to AsyncStorage — survives app kill.
- Client-side thumbnail generation before upload.
- Optimistic UI — photo appears in grid immediately, progress indicator on thumbnail.

### 🚧 To build (Supabase)

- Tables: `media`, `media_reactions`, `media_comments`.
- Storage policies: only trip members can read/write in `trip-media/{trip_id}/`.
- Optional Edge Function `generate-thumbnail` for server-side processing.
- Realtime on `media`, `media_reactions`, `media_comments`.

### Estimated effort
2 weeks.

---

## Phase 5 — Chat, notifications, invitations polish

**Objective:** In-trip real-time chat and push notifications for every important event.

### 🚧 To build (React Native)

**Screens (7 new):**
- `ChatTab` — message list, input, image/voice, reactions, replies, pinned, announcements, typing indicator.
- `ChatInfoScreen` — members, shared media summary, notification toggle, export.
- `SharedMediaGalleryScreen` — media/docs/links shared in chat.
- `PollScreen` — create/vote on polls ("Which restaurant?").
- `NotificationsInboxScreen` — unified inbox, tabs (All/Unread/Trips/Expenses).
- `NotificationDetailScreen` — rich notification content.
- `NotificationPreferencesScreen` — per-category toggles.

**Libraries:**
- `expo-notifications` (push tokens + local notifications)

**Key behaviors:**
- Typing indicator via Supabase Realtime Presence.
- Push notification → deep link to relevant screen.
- Message virtualization (FlashList) for performance with 1000s of messages.
- Voice note recording + playback.

### 🚧 To build (Supabase)

- Tables: `messages`, `message_reactions`, `notifications`, `user_devices` (push tokens).
- Realtime on `messages` + Presence channel per trip.
- Edge Function `send-push` — triggered by DB triggers, uses Expo Push API.
- pg_cron job `daily-summary` — optional trip digest emails.

### Estimated effort
2 weeks.

---

## Phase 6 — Timeline, documents, analytics, settings, support

**Objective:** Trip becomes a day-by-day story. Users store travel documents. Full settings surface. This is the "app becomes production-shaped" phase — ships ~21 new screens.

### 🚧 To build (React Native)

**Timeline (3):** TimelineTab, AddNoteScreen, NoteDetailScreen.  
**Documents (4):** DocumentsTab, UploadDocumentScreen, DocumentDetailScreen, PersonalDocumentsScreen.  
**Analytics (2):** AnalyticsDashboardScreen, CategoryBreakdownScreen.  
**Settings (6):** SettingsScreen, AccountSettingsScreen, AppearanceScreen, CurrencyScreen, AboutScreen, EmergencyContactsScreen.  
**Dashboard (3):** AllTripsScreen, GlobalSearchScreen, GlobalExpensesScreen.  
**Support (3):** HelpCenterScreen, ContactSupportScreen, FeedbackScreen.

**Libraries:**
- `victory-native` or `react-native-gifted-charts` (charts)
- `react-native-pdf` (document viewer)

### 🚧 To build (Supabase)

- Tables: `documents`, `trip_notes`.
- Postgres function `get_trip_timeline(trip_id)` — unions photos, expenses, notes, messages by timestamp.
- Materialized view `user_analytics` refreshed nightly by pg_cron.
- pg_cron `notify-document-expiry` — fires reminders 30/7/1 days before expiry.

### Estimated effort
3 weeks.

---

## Phase 7 — Maps + AI travel assistant

**Objective:** Smart companion — recommend places, generate itineraries, show interactive maps.

### 🚧 To build (React Native)

**Maps (4):** MapTab, PlaceDetailScreen, AddPinScreen, DirectionsScreen.  
**AI (4):** AIAssistantScreen, ItineraryGeneratorScreen, ItineraryDetailScreen, AIHistoryScreen.  
**Other (3):** HighlightsScreen, TravelHeatmapScreen, TripTemplatesScreen.

**Libraries:**
- `react-native-maps` (native) + web map solution (Mapbox GL or Google Maps JS)
- Streaming response handling for AI chat

### 🚧 To build (Supabase)

- Tables: `destinations` (with embedding vector), `ai_conversations`, `ai_messages`.
- Edge Function `ai-chat` — streams responses from OpenAI GPT-4o.
- Edge Function `ai-itinerary` — generates day-by-day plan.
- Edge Function `recommend-places` — PostGIS radius + pgvector similarity hybrid search.
- Edge Function `receipt-ocr` — GPT-4o Vision for receipt parsing.
- pg_cron `refresh-destination-embeddings` — nightly embedding refresh.

### Estimated effort
3 weeks.

---

## Phase 8 — Cloud storage integrations

**Objective:** Users can connect their Google Drive / OneDrive and store trip media there instead of consuming Supabase storage.

### 🚧 To build (React Native)

- ConnectedAccountsScreen — manage OAuth links to cloud providers.
- StorageScreen — show storage used per trip, cache clear.
- "Upload from Drive" option in media picker.
- OAuth flows via `expo-auth-session`.

### 🚧 To build (Supabase)

- Table: `cloud_connections` (encrypted tokens).
- Edge Function `cloud-upload` — pushes file to user's Drive, returns shareable URL.
- Edge Function `cloud-refresh-token` — keeps OAuth tokens alive.
- Update `media` table with `provider` field.

### Estimated effort
2 weeks.

---

## Phase 9 — Offline mode, security, compliance

**Objective:** Production-ready quality. Works offline, biometric lock, GDPR compliance, crash reporting.

### 🚧 To build (React Native)

**Screens (9):** PrivacySecurityScreen, OfflineDataScreen, DeveloperMenuScreen, AccountLockedScreen, NoInternetScreen, ServerErrorScreen, MaintenanceScreen, UpdateRequiredScreen, NotFoundScreen.

**Key work:**
- Offline write queue: expenses, notes, photos queued in expo-sqlite and flushed on reconnect.
- Optimistic UI updates for all write operations.
- Biometric app lock via `expo-local-authentication`.
- Crash reporting: `sentry-expo`.
- Analytics: PostHog SDK.
- Global error boundary routing to appropriate error screen.
- "Delete my data" flow (GDPR/DPDP).
- Network state detection via `@react-native-community/netinfo`.

### 🚧 To build (Supabase)

- Audit log table + triggers on sensitive tables.
- Edge Function `delete-user-data` — cascades removal across all schemas + storage.
- Rate limiting and abuse protection configuration.
- Security audit on all RLS policies.

### Estimated effort
2 weeks.

---

## Phase 10 — Growth: bookings, premium, community *(v3 and beyond)*

**Objective:** Monetize and expand.

Not a single phase — a portfolio of parallel workstreams:

- **Premium subscriptions:** RevenueCat integration, gated features, plan comparison UI.
- **Payments & settlements:** UPI deep links, QR codes, Stripe checkout.
- **Bookings:** flight/hotel/train affiliate APIs (Skyscanner, Booking.com, MakeMyTrip).
- **Community:** public itineraries, discover feed, follow users.
- **Corporate plans:** org accounts, admin dashboards, expense export.
- **Year in Review:** Spotify-Wrapped-style travel recap.
- **Gamification:** travel badges, streak rewards.
- **Referral system:** invite friends, earn premium time.

Each item scoped as its own 2–4 week initiative.

---

## Cross-cutting concerns (run in parallel through every phase)

| Concern | What it means in practice |
|---------|---------------------------|
| Design system | Build tokens (colors/spacing/typography) in Phase 0. Audit every screen against them before phase exit. |
| Testing | Jest + React Native Testing Library from Phase 1. Supabase local dev + migration tests from Phase 0. Maestro E2E from Phase 3 (MVP). |
| CI/CD | GitHub Actions: lint + typecheck + test on every PR. Supabase migration linting. EAS build on merge to `main`. Expo web deploy to Vercel. |
| Docs | Keep PRD, PROJECT_OVERVIEW, and this file in sync as scope evolves. |
| Analytics events | Instrument key user actions from Phase 1 — track activation funnel (signup → first trip → first expense → invite friend). |
| Accessibility | Screen reader labels, contrast checks, 44×44pt touch targets on every new screen. Tested with VoiceOver/TalkBack per phase. |
| Localization | Wrap all user-facing strings with `i18next` starting Phase 4. English first, Hindi second. |
| Performance | FlashList for long lists. Monitor JS bundle size. Profile render times on low-end Android devices. |
| Security | RLS is the final gate on every operation. Client-side checks are UX helpers, not security. Review RLS coverage each phase. |

---

## Immediate next actions (Phase 0 kickoff checklist)

Ordered. Do them top-to-bottom; each unblocks the next.

1. **Create Supabase project** at supabase.com. Note project ref, URL, anon key.
2. **Scaffold Expo project** with TypeScript template.
3. **Install core dependencies** (navigation, supabase-js, zustand, zod, etc.).
4. **Set up folder structure** as defined in PROJECT_OVERVIEW.md.
5. **Create `.env.example`** and `src/lib/env.ts` + `src/lib/supabase.ts`.
6. **Init Supabase CLI**: `npx supabase init` → creates `supabase/config.toml`.
7. **Author migrations** (`001_extensions.sql` through `005_functions.sql`).
8. **Apply migrations** to the live Supabase project.
9. **Enable auth providers** in Supabase Dashboard (Email OTP first, social later).
10. **Create storage buckets** with RLS policies.
11. **Set up GitHub repo** with CI workflow (lint + typecheck on PR).
12. **Verify:** `npx expo start` → app loads → Supabase client connects → ready for Phase 1.

---

## Additions to the original plan (what was missing)

These items weren't in the original thinking but are critical for a successful launch:

### Architecture Decisions to Lock Early
- **React Query vs Zustand-only** — decide at Phase 2 based on data fetching complexity. React Query gives caching, background refetch, and pagination for free. Zustand is simpler but requires manual cache management.
- **expo-router vs React Navigation** — expo-router (file-based routing) is newer and pairs well with deep links. React Navigation is battle-tested. Pick one in Phase 0 and commit.
- **FlashList from day one** — don't start with FlatList and migrate later. Use `@shopify/flash-list` for all lists from Phase 2.

### Missing from Original Feature Set
- **Expense receipt OCR** — should be in Phase 3 (MVP), not Phase 7. Users photograph a receipt → AI extracts amount, category, date. Massive UX win.
- **Quick expense from notification** — "Add ₹200 for lunch" directly from a push notification action button.
- **Expense reminders** — periodic nudge to log expenses during an active trip.
- **Trip countdown widget** — iOS/Android home screen widget showing days until next trip.
- **Export to PDF/CSV** — trip summary, expense report. Critical for corporate users even in v1.
- **Multi-currency per trip** — international trips have expenses in multiple currencies. Need exchange rate handling from Phase 3.
- **Recurring trips** — "Weekend Goa trip" template that pre-fills everything.

### Operational Gaps
- **Error budget & SLOs** — define uptime target (99.5% for MVP, 99.9% for v2). Monitor with Supabase dashboard + Sentry.
- **Backup strategy** — Supabase does daily backups on Pro plan. Document restore procedure. Test it once.
- **Incident response** — who gets paged when the app is down? Simple PagerDuty or Opsgenie setup.
- **User feedback loop** — in-app feedback button from Phase 3 onward. Aggregate with Canny or simple Supabase table.
- **App Store Optimization (ASO)** — screenshots, description, keywords ready before MVP GA submission.
- **Beta testing program** — TestFlight (iOS) + Play Console internal track (Android). 50–100 testers before public launch.

---

*Last updated: July 14, 2026 — Project not yet started. All phases are planned, none have begun.*
