# TripWise — Development Phases

> A phase-by-phase execution plan to take TripWise from its current MVP shell to a full travel collaboration platform, mapped against what already exists in the React Native app and Supabase project.

**Last updated:** July 14, 2026
**Owner:** TripWise product team
**Stack:** Expo SDK 54 · React Native 0.81 · React 19 · TypeScript · Supabase (Postgres + Auth + Storage + Realtime + Edge Functions)
**Platforms:** iOS · Android · Web

---

## How to read this document

Each phase is broken down into five sections:

1. **Objective** — what "done" looks like for the phase.
2. **✅ Already in place (React Native)** — code, screens, and utilities already committed.
3. **✅ Already in place (Supabase)** — project resources already configured.
4. **🚧 To build (React Native)** — new work required on the client.
5. **🚧 To build (Supabase)** — new work required on the backend.
6. **Deliverables / acceptance criteria** — measurable exit criteria.
7. **Estimated effort** — rough calendar weeks for a small team (1 backend, 1 mobile, 1 designer part-time).

Phases are ordered so that each one unlocks the next. Phases 0–3 form the "must-ship MVP". Phases 4–7 build the collaboration and memory story. Phases 8+ are growth and monetization.

---

## Current state snapshot (baseline, before Phase 0)

### React Native app

| Area | Status | Notes |
|------|--------|-------|
| Expo project | ✅ Working | SDK 54, TS, RN 0.81, React 19 |
| Web platform | ✅ Working | `react-native-web`, custom `web/index.html`, `src/utils/webStyles.ts`, `src/utils/webAlert.ts` |
| Navigation | ✅ Basic | `@react-navigation/stack` with Auth vs Main split in `AppNavigator.tsx` |
| Auth screens | ✅ UI ready | `WelcomeScreen`, `LoginScreen`, `OtpVerificationScreen`, `CompleteProfileScreen` |
| Splash | ✅ | `SplashScreen.tsx` |
| Dashboard | ✅ Basic | `DashboardScreen.tsx`, `TripDashboardScreen.tsx` with header, search, stats, empty state, floating button |
| Trip creation | ✅ UI + wiring | `CreateTripScreen.tsx` with validation, Snackbar feedback, cross-platform alerts |
| Trip detail | 🟡 Partial | `TripDetailScreen.tsx` renders expenses + balances tabs; other tabs (Photos / Chat / Timeline / Docs / Map) still to build |
| Expenses | 🟡 Partial | `AddExpenseScreen.tsx` built; `services/expenses.ts` has `addExpense`, `getTripExpenses`, `getTripBalances`, `getTripMembers`, `settleUp` — all hitting **missing** Edge Functions |
| UI primitives | ✅ Rich | Button, TextField, Dropdown, DatePicker, OtpInput, BottomSheet, Snackbar, ConfirmationDialog, SuccessDialog, AvatarPicker, ThemeToggle, ErrorMessage, LoadingIndicator |
| Validation | ✅ | Zod schemas in `src/schemas/validation.ts` + react-hook-form resolvers |
| Auth service | 🟡 Uses Edge Functions | `services/auth.ts` calls `send-otp`, `verify-otp`, `register` edge functions that do **not** exist in the new Supabase project yet |
| Trips service | 🟡 Uses Edge Functions | `services/trips.ts` calls `/functions/v1/trips*` — needs migration to direct Supabase queries or new Edge Functions |
| Expenses service | 🟡 Uses Edge Functions | `services/expenses.ts` calls `/functions/v1/expenses/*` — same rewire needed |
| Auth context | 🟡 Ready | `AuthContext.tsx` handles OTP → register → session, but depends on the missing edge functions |
| Supabase credentials | 🟡 Hard-coded | URL / anon / service-role currently embedded in `src/lib/supabase.ts`. Needs to move to `.env` via `expo-constants` before beta |
| AsyncStorage version | ⚠️ Outdated | `1.24.0` installed; Expo SDK 54 expects `2.2.0` — bump before Phase 1 |

### Supabase project (`oroyqbgdnihqvdpfngqk`)

| Area | Status |
|------|--------|
| Project provisioned | ✅ |
| URL + anon key + service role key wired into `src/lib/supabase.ts` | ✅ |
| Admin client (`supabaseAdmin`) exported | ✅ |
| Auth providers (Email OTP, Phone OTP, Google, Apple) | ❌ Not configured |
| Database tables | ❌ Empty schema |
| RLS policies | ❌ None |
| Storage buckets | ❌ None |
| Edge Functions (`send-otp`, `verify-otp`, `register`, `trips`) | ❌ Not deployed |
| Realtime channels | ❌ Not enabled |
| Extensions (uuid-ossp, pgcrypto, vector, pg_cron, postgis) | ❌ Not enabled |

---

## Phase overview

| # | Phase | Weeks | Screens shipped (cumulative) | Ships to users? |
|---|-------|-------|------------------------------|-----------------|
| 0 | Foundation & backend bootstrap | 1 | 2 | No (internal) |
| 1 | Authentication + user profile end-to-end | 1–2 | 9 | Alpha |
| 2 | Trip management + group collaboration | 2 | 18 | Alpha |
| 3 | Expense management + smart splitting | 2–3 | 25 | **MVP GA** |
| 4 | Shared memories (media upload + album) | 2 | 31 | v1.1 |
| 5 | Chat, notifications, invitations | 2 | 38 | v1.2 |
| 6 | Timeline, documents, analytics, settings, support | 2–3 | 59 | v1.3 |
| 7 | Maps + AI travel assistant + recommendations | 3 | 70 | v2.0 |
| 8 | Cloud storage integrations (Drive / OneDrive / iCloud) | 2 | 72 | v2.1 |
| 9 | Offline mode, hardening, security, compliance, error screens | 2 | 81 | v2.2 |
| 10 | Growth: bookings, premium, community, marketplace | ongoing | 98+ | v3.0+ |

Per-screen breakdown lives in [`SCREEN_INVENTORY.md`](./SCREEN_INVENTORY.md).

Total to MVP GA (end of Phase 3): **~6–8 weeks · 25 screens**.
Total to feature-complete v2.0: **~18–22 weeks · 70 screens**.


---

## Phase 0 — Foundation & backend bootstrap

**Objective:** stand up a working Supabase backend (schema, RLS, storage, auth providers) so the existing React Native screens have a real backend to talk to.

### ✅ Already in place (React Native)
- Supabase JS SDK installed (`@supabase/supabase-js@2.110.2`).
- `src/lib/supabase.ts` exports both client (`supabase`) and admin (`supabaseAdmin`) instances.
- `FUNCTIONS_URL` and `STORAGE_URL` constants exported.
- `AsyncStorage` wired as the auth storage adapter.

### ✅ Already in place (Supabase)
- Project created, URL and keys provisioned.

### 🚧 To build (React Native)
Pre-flight (must land before any Phase 1 work):
- Bump `@react-native-async-storage/async-storage` to `2.2.0` via `npx expo install @react-native-async-storage/async-storage` (required by Expo SDK 54).
- Create `.env.example` and `.env` at repo root. Add `.env` to `.gitignore`.
- Add `src/lib/env.ts` that reads `SUPABASE_URL`, `SUPABASE_ANON_KEY` from `expo-constants` (`Constants.expoConfig?.extra`). Wire `app.json` `extra` to pass them through.
- Refactor `src/lib/supabase.ts` to import from `env.ts` instead of hard-coding keys. **Delete the service-role key from client code** — it must never ship to the app bundle. It lives only in Supabase (Edge Functions read it from their own env).
- Add `supabase/` folder at repo root. Run `npx supabase init` to scaffold `config.toml`.
- No new screens this phase.

### 🚧 To build (Supabase)
- **Enable extensions:** `uuid-ossp`, `pgcrypto`, `pg_trgm` (search), `postgis` (locations), `vector` (embeddings for Phase 7), `pg_cron` (scheduled jobs).
- **Create core schema** (see PRD §13):
  - `profiles` (mirrors `auth.users` with the fields Complete Profile collects)
  - `trips`
  - `trip_members`
  - `trip_invitations`
- **Row Level Security policies:**
  - Users can read/update only their own `profiles` row.
  - Users can read `trips` only if they are a member.
  - Trip admins can update/delete their trips.
- **Storage buckets:**
  - `avatars` (public read, owner write)
  - `trip-covers` (public read, member write)
  - `trip-media` (member-only read/write, RLS via `storage.objects` policies)
  - `documents` (private, member-only)
  - `receipts` (private, member-only)
- **Auth providers:**
  - Enable Email OTP (magic link + 6-digit code)
  - Enable Phone OTP (requires SMS provider — Twilio recommended)
  - Reserve Google + Apple provider slots (config in Phase 1)
- **Database helper functions:**
  - `handle_new_user()` trigger to auto-create a `profiles` row when `auth.users` inserts.

### Deliverables / acceptance criteria
- `.env.example` in repo; `.env` git-ignored; `src/lib/supabase.ts` reads from env.
- Service role key removed from client bundle (grep `service_role` returns 0 hits in `src/`).
- `supabase/config.toml` committed; `supabase/migrations/001_extensions.sql`, `002_schema.sql`, `003_rls.sql`, `004_storage.sql` committed.
- SQL runs cleanly from a fresh project (idempotent).
- Manual smoke test: create a user via Supabase Studio, confirm `profiles` row auto-creates, confirm anon client can't read other users' rows.

### Definition of Done
- [ ] All migrations applied to the live Supabase project.
- [ ] `.env` handling verified on iOS, Android, and web.
- [ ] Storage buckets visible in Supabase Studio with correct RLS.
- [ ] `README.md` updated with local setup instructions.

### Estimated effort
1 backend engineer × 1 week.

---

## Phase 1 — Authentication + user profile end-to-end

**Objective:** replace the missing custom edge functions with Supabase's native auth so the existing OTP screens actually sign users in.

### ✅ Already in place (React Native)
- `WelcomeScreen`, `LoginScreen`, `OtpVerificationScreen`, `CompleteProfileScreen` — all built and styled.
- `OtpInput` component, `AvatarPicker`, `DatePicker`, `Dropdown`, `TextField`.
- Zod validation schemas in `src/schemas/validation.ts`.
- `AuthContext.tsx` with `login`, `verifyOtp`, `completeProfile`, `logout` API.
- Session persistence via `AsyncStorage` (`auth_token` key).
- Splash + auth-vs-main routing in `AppNavigator.tsx`.

### ✅ Already in place (Supabase)
- Anon and service role keys wired.
- (After Phase 0) `profiles` table and auto-provisioning trigger.

### 🚧 To build (React Native)
- **Rewrite `src/services/auth.ts`** to use `supabase.auth.signInWithOtp()` and `supabase.auth.verifyOtp()` directly instead of custom edge functions.
- **Rewrite `src/services/trips.ts` `getMyProfile()`** to query the `profiles` table directly instead of hitting `/functions/v1/trips/me`. (Blocks `AuthContext.checkToken()` — must land in Phase 1, not Phase 2.)
- **Update `AuthContext.tsx`**:
  - Use `supabase.auth.onAuthStateChange()` to hydrate the user.
  - Remove the manual `auth_token` handling (Supabase SDK persists via `AsyncStorage` already).
  - After successful OTP verify, check if `profiles` row is complete; route to `CompleteProfile` if not, else dashboard.
- **Complete Profile flow:** `upsert` into `profiles` table (upload avatar to `avatars` bucket first, store returned public URL).
- Add Google + Apple sign-in buttons on `LoginScreen` (feature-flagged, off by default until provider config lands).
- Add "Resend OTP" cooldown UI on `OtpVerificationScreen` if not already present.
- **New screens this phase:**
  - `TermsOfServiceScreen` — required for App Store / Play Store review and social auth.
  - `PrivacyPolicyScreen` — same.
  - `EditProfileScreen` — extracted from CompleteProfile logic, allows profile updates.
- Wire `Alert.alert` to `webAlert` on all auth error paths (already done in CreateTrip; audit auth screens for consistency).

### 🚧 To build (Supabase)
- Configure **Email OTP** provider (subject line, template, redirect URL for web).
- Configure **SMS OTP** provider (Twilio credentials in Supabase Auth settings).
- (Optional this phase) Wire Google OAuth: create project in Google Cloud, add redirect URLs, paste client ID/secret into Supabase.
- (Optional this phase) Wire Apple Sign In: Apple Developer setup, service ID, private key.
- Rate-limit OTP requests (Supabase built-in setting).

### Deliverables / acceptance criteria
- User can enter email → receive OTP → verify → land on Complete Profile → save profile → land on dashboard.
- User can log out and log back in without re-entering profile.
- Refreshing the web app keeps the user logged in.
- Row Level Security tested: user A cannot read user B's profile via anon client.
- ToS and Privacy Policy accessible from LoginScreen.

### Definition of Done
- [ ] Working on iOS, Android, and web without warnings.
- [ ] Unit tests for `AuthContext` state transitions.
- [ ] `getMyProfile` returns 404 for unknown user, empty object for incomplete profile.
- [ ] All screens use theme tokens (no hard-coded colors introduced this phase).
- [ ] `docs/DEVELOPMENT_PHASES.md` current-state snapshot updated to reflect Phase 1 exit.

### Estimated effort
1 mobile engineer × 1–2 weeks.

---

## Phase 2 — Trip management + group collaboration

**Objective:** users can create trips, invite others, and see only the trips they belong to.

### ✅ Already in place (React Native)
- `CreateTripScreen.tsx` — form with trip name, destination, dates, validation, Snackbar feedback, cross-platform alert.
- `DashboardScreen.tsx` / `TripDashboardScreen.tsx` — list, stats, search bar, empty state, floating "+" button, bottom navigation.
- `TripCard`, `StatsCard`, `EmptyState`, `SearchBar`, `FloatingButton`, `BottomNavigation`, `DashboardHeader` components.
- `TripDetailScreen.tsx` shell to expand.
- `services/trips.ts` with `createTrip`, `getTripList`, `getTripSummary` (currently hitting missing edge functions — must be rewired).
- Mock data available in `src/data/mockTrips.ts` for reference UI states.

### ✅ Already in place (Supabase)
- `trips`, `trip_members`, `trip_invitations` tables and RLS from Phase 0.
- `trip-covers` storage bucket.

### 🚧 To build (React Native)
- Rewire `services/trips.ts` to use direct Supabase queries:
  - `createTrip` → `insert` into `trips` + `insert` creator into `trip_members` as admin.
  - `getTripList` → `select` with join on `trip_members` filtered by current user, paginated.
  - `getTripSummary` → counts grouped by `status`.
- Trip detail screen: overview, members list, tabs for Expenses / Photos / Chat / Docs (tab shells only this phase).
- **Invite flow:**
  - Bottom sheet to add members by email or phone.
  - Show pending vs accepted invites.
  - Deep link handler for `tripwise://invite/{token}` and web `/invite/{token}`.
- Trip cover image upload to `trip-covers` bucket.
- Real-time trip list refresh via `supabase.channel('trips')` subscription.

### 🚧 To build (Supabase)
- Postgres function `create_trip_with_admin(...)` (single transaction to insert trip + admin membership).
- Postgres function `invite_to_trip(trip_id, identifier)` that creates a `trip_invitations` row and returns a signed token.
- Edge Function `send-invite` to email/SMS the invite link (uses Resend or Supabase's native email if enabled).
- RLS policy: only trip admin can update trip metadata; any member can read; only admin can delete.
- Realtime enabled on `trips` and `trip_members` tables.

### Deliverables / acceptance criteria
- Two test accounts: user A creates trip, invites user B by email, user B receives link, accepts, appears in members list.
- Non-members get 0 rows when querying that trip.
- Trip appears instantly in other members' dashboards without refresh (Realtime).

### Estimated effort
1 mobile + 1 backend × 2 weeks.

---

## Phase 3 — Expense management + smart splitting  *(MVP GA target)*

**Objective:** users can log expenses on a trip and see who owes whom with automatic settlement math.

### ✅ Already in place (React Native)
- `AddExpenseScreen.tsx` — full form built (amount, category, participants, split, notes).
- `services/expenses.ts` — `addExpense`, `getTripExpenses`, `getTripBalances`, `getTripMembers`, `settleUp` all implemented (**calling missing Edge Functions**).
- `TripDetailScreen.tsx` — expenses + balances tabs rendering (also calling missing Edge Functions).
- Currency dropdown + amount input primitives.
- Zod schema patterns to extend.

### ✅ Already in place (Supabase)
- (Nothing yet — schema added this phase.)

### 🚧 To build (React Native)
- **Rewire `services/expenses.ts`** to direct Supabase queries (same rewire pattern as `auth.ts` / `trips.ts` in Phase 1). This is the main integration debt.
- Extend `AddExpenseScreen` to include:
  - Receipt image upload to `receipts` bucket.
  - Split type selector (Equal / Unequal / Percentage / Shares / Itemized) with live preview.
  - Location tag (optional).
- Add screens:
  - `ExpenseDetailScreen` — read-only detail with edit/delete actions.
  - `EditExpenseScreen` — reuse AddExpense form pre-filled.
  - `SettleUpScreen` — record a payment; UPI/QR deep link deferred to Phase 10.
  - `SettlementHistoryScreen` — log of all settlements for a trip.
- Balances view enhancements:
  - "You owe" / "You are owed" summary already renders inside TripDetail.
  - Add simplified debt list + full matrix toggle.
- Currency conversion display: hard-code to trip's base currency for MVP; real conversion lands in Phase 7.

### 🚧 To build (Supabase)
- Tables (per PRD §13): `expenses`, `expense_splits`, `expense_categories`, `settlements`.
- Seed default categories (Food, Fuel, Hotel, Flight, Shopping, Parking, Entertainment, Emergency, Medical, Transport, Custom).
- **Postgres function `compute_balances(trip_id)`** returning net balance per member.
- **Postgres function `optimize_settlements(trip_id)`** — greedy debt simplification so N members settle in at most N-1 transactions.
- RLS: only trip members can read/write expenses.
- Trigger to prevent editing settled expenses without admin override.

### Deliverables / acceptance criteria
- Given the PRD's 5-friends example (₹5000, ₹10000, ₹200, ₹0, ₹3000), `compute_balances` returns correct net values.
- `optimize_settlements` produces a valid minimal transaction set.
- Adding an expense triggers a real-time balance update for every member.

### Estimated effort
1 mobile + 1 backend × 2–3 weeks. **Ship MVP GA at end of this phase.**

---

## Phase 4 — Shared memories (media upload + trip album)

**Objective:** every trip becomes a private album for photos, videos, and voice notes.

### ✅ Already in place (React Native)
- `TripDetailScreen` shell with tab structure ready to accept a "Photos" tab.
- `AvatarPicker` component (emoji + initials only — **no real image picking yet**; that starts this phase).

### ✅ Already in place (Supabase)
- `trip-media` storage bucket (from Phase 0).

### 🚧 To build (React Native)
- Install real media libraries: `expo-image-picker`, `expo-image-manipulator`, `expo-av` (video/voice), `expo-file-system`, `expo-media-library`.
- Retrofit `AvatarPicker` and `CompleteProfileScreen` to also allow real photo pick (currently only emoji).
- Media grid component (masonry or grid) inside trip detail Photos tab.
- Upload queue with progress + retry (persist queue to `AsyncStorage` so uploads survive app kill).
- Full-screen lightbox with swipe navigation.
- Video player + voice note player.
- Client-side thumbnail generation for videos before upload.
- Reactions and comments on media items.
- New screens: `PhotosTab`, `UploadMediaScreen`, `MediaViewerScreen`, `MediaCommentsSheet`, `AlbumsScreen`.
- Start `i18next` scaffolding (cross-cutting item due this phase — Language screen ships here).

### 🚧 To build (Supabase)
- Tables: `media`, `media_reactions`, `media_comments`.
- Storage policies: only trip members can read/write in that trip's folder (`trip-media/{trip_id}/...`).
- Edge Function `generate-thumbnail` (optional: run in background for HEIC/videos on upload).
- Realtime on `media`, `media_reactions`, `media_comments`.

### Deliverables / acceptance criteria
- Multi-select upload from gallery works on iOS, Android, web.
- Uploads resume after network interruption.
- Non-members return 403 when hitting the storage URL directly.
- New photo appears in all members' albums in real time.

### Estimated effort
1 mobile + 1 backend × 2 weeks.

---

## Phase 5 — Chat, notifications, invitations

**Objective:** in-trip chat and push notifications for every important event.

### ✅ Already in place (React Native)
- `Snackbar` for in-app toasts.
- Trip invitations UI stubbed in Phase 2.

### ✅ Already in place (Supabase)
- (Schema added this phase.)

### 🚧 To build (React Native)
- Install `expo-notifications` and register for push tokens; store on `profiles.push_token`.
- Chat tab inside `TripDetailScreen`:
  - Message list (virtualized), input, image/voice message support, reactions, replies, pinned messages, announcements.
  - Typing indicator via Realtime Presence.
- Notifications inbox screen.
- Deep-link handling: notification → open trip → jump to relevant tab (chat/expense/photo).

### 🚧 To build (Supabase)
- Tables: `messages`, `message_reactions`, `notifications`.
- Realtime on `messages` + Presence channel per trip.
- Edge Function `send-push` triggered by DB triggers on `messages`, `expenses`, `trip_invitations`, etc. Uses Expo Push API.
- pg_cron job `send-daily-summary` for trip digest emails (Phase 5.5 nice-to-have).

### Deliverables / acceptance criteria
- Two devices in the same trip see messages live.
- Push notification delivered within 5 seconds of a new expense, message, or invite.
- User can mute a trip's notifications individually.

### Estimated effort
1 mobile + 1 backend × 2 weeks.

---

## Phase 6 — Timeline, documents, analytics, settings, support

**Objective:** users can see a trip as a day-by-day story, store travel documents, view spending analytics, and manage every app preference from a proper settings surface. This is the "app becomes production-shaped" phase — it ships ~21 new screens, more than any other phase.

### ✅ Already in place (React Native)
- `StatsCard` on dashboard shows summary counts.
- `DatePicker` primitive.

### ✅ Already in place (Supabase)
- Trip start/end dates + expenses/media/messages already tied to timestamps — timeline is a query, not new data.

### 🚧 To build (React Native)
- **Timeline module**: `TimelineTab`, `AddNoteScreen`, `NoteDetailScreen`.
- **Documents module**: `DocumentsTab`, `UploadDocumentScreen`, `DocumentDetailScreen`, `PersonalDocumentsScreen`.
- **Analytics module**: `AnalyticsDashboardScreen`, `CategoryBreakdownScreen` (heatmap deferred to Phase 7).
  - Charts via `victory-native` or `react-native-svg-charts`.
- **Settings hub** (10 screens): `SettingsScreen`, `AccountSettingsScreen`, `AppearanceScreen`, `CurrencyScreen`, `LanguageScreen` (extend Phase 4 i18n), `AboutScreen`, `EmergencyContactsScreen`, `TravelPreferencesScreen`, `NotificationPreferencesScreen` (from Phase 5 backlog), `MemberDetailScreen`.
- **Support**: `HelpCenterScreen`, `ContactSupportScreen`, `FeedbackScreen`.
- **Dashboard extensions**: `AllTripsScreen`, `GlobalSearchScreen`, `GlobalExpensesScreen` (Expenses bottom-nav tab).

### 🚧 To build (Supabase)
- Table: `documents` with `expiry_date`, `category`, `trip_id` nullable (for user-level docs like passport).
- Table: `trip_notes` (day-level notes attached to timeline).
- Materialized view `user_analytics` refreshed nightly by pg_cron.
- Postgres function `get_trip_timeline(trip_id)` unioning all timeline sources sorted by timestamp.
- pg_cron `notify-document-expiry` job runs daily, fires notification 30/7/1 days before expiry.

### Deliverables / acceptance criteria
- Timeline shows a mixed feed of photo, expense, note events in correct order.
- Uploading a passport with expiry date schedules three reminders.
- Analytics numbers match hand-calculated totals for a seeded trip.

### Estimated effort
1 mobile + 1 backend × 2 weeks.

---

## Phase 7 — Maps + AI travel assistant + recommendations

**Objective:** turn TripWise into a smart companion — recommend places, generate itineraries, show maps.

### ✅ Already in place (React Native)
- Trip destination field already collected.
- Currency + language fields on profile (for future translation).

### ✅ Already in place (Supabase)
- `vector` extension enabled in Phase 0 (ready for embeddings).

### 🚧 To build (React Native)
- Install `react-native-maps` (native) + `@vis.gl/react-google-maps` or `mapbox-gl` (web).
- Maps tab inside `TripDetailScreen`: pinned places, visited places, nearby recommendations.
- "AI Assistant" tab or floating button:
  - Chat-style UI backed by an Edge Function that calls OpenAI/Anthropic.
  - Actions: "Generate itinerary", "Suggest hotels", "Packing list", "Translate", "Currency convert", "Visa info".
- Nearby places carousel on trip detail (hotels, restaurants, attractions).

### 🚧 To build (Supabase)
- Table: `destinations` with `pg_trgm` full-text search and `embedding vector(1536)`.
- Table: `ai_conversations`, `ai_messages` (persist assistant history per trip).
- Edge Function `ai-chat` — streams responses from LLM provider.
- Edge Function `recommend-places` — hybrid search: PostGIS radius filter + pgvector similarity.
- Edge Function `fetch-nearby` — proxies Google Places / Foursquare with rate limiting.
- pg_cron `refresh-destination-embeddings` — nightly job to embed new destinations.

### Deliverables / acceptance criteria
- Creating a "Ujjain trip" surfaces Mahakaleshwar, Omkareshwar, and nearby hotels within 5 seconds.
- AI assistant generates a 3-day Goa itinerary in under 15 seconds.
- Map pins render on iOS, Android, and web.

### Estimated effort
1 mobile + 1 backend + 1 AI engineer × 3 weeks.

---

## Phase 8 — Cloud storage integrations (Drive / OneDrive / iCloud)

**Objective:** shift media storage burden from Supabase to the user's own cloud, keeping only references.

### ✅ Already in place (React Native)
- Nothing yet.

### ✅ Already in place (Supabase)
- Media table already stores URLs, so it can point at external providers with minimal change.

### 🚧 To build (React Native)
- OAuth flows for Google Drive, OneDrive, Dropbox using `expo-auth-session`.
- Cloud connection settings screen.
- Media picker "Upload from Drive/OneDrive" option.

### 🚧 To build (Supabase)
- Table: `cloud_connections` (per PRD reference in `SUPABASE_FEASIBILITY.md`).
- Edge Function `cloud-upload` — receives file, uses stored refresh token to push to the user's Drive, returns file ID + shareable link.
- Edge Function `cloud-refresh-token` — refresh OAuth tokens on schedule.
- Update `media` table with `provider` enum (`supabase | google_drive | onedrive | dropbox | icloud`) and `external_id`.

### Deliverables / acceptance criteria
- User connects Google Drive; uploads land in a `TripWise` folder inside their Drive.
- Removing cloud connection revokes tokens server-side.
- Members can still view shared media (temporary shareable URLs generated on demand).

### Estimated effort
1 mobile + 1 backend × 2 weeks.

---

## Phase 9 — Offline mode, hardening, security & compliance

**Objective:** production-ready quality bar.

### ✅ Already in place (React Native)
- `AsyncStorage` used for session persistence — foundation for local cache.
- SSL pinning package already installed (`react-native-ssl-pinning`) but not configured.

### ✅ Already in place (Supabase)
- RLS across all core tables from earlier phases.

### 🚧 To build (React Native)
- Offline write queue: expenses, notes, photos queued in `AsyncStorage`/SQLite and flushed on reconnect (use `@react-native-community/netinfo` + `expo-sqlite`).
- Optimistic UI updates for expense add + chat message send.
- Configure `react-native-ssl-pinning` against Supabase's cert pins.
- Biometric app lock (Face ID / fingerprint) via `expo-local-authentication`.
- "Delete my data" flow (GDPR/DPDP) — actual UI in `PrivacySecurityScreen`.
- Crash reporting: Sentry (`sentry-expo`).
- Analytics: PostHog or Amplitude.
- **Error and utility screens:**
  - `NoInternetScreen`, `ServerErrorScreen`, `MaintenanceScreen`, `UpdateRequiredScreen`, `NotFoundScreen`.
  - `AccountLockedScreen` (from Phase 2 backlog — abuse detection).
  - `PrivacySecurityScreen`, `OfflineDataScreen`, `DeveloperMenuScreen` (hidden long-press).
- Global error boundary that routes to the right error screen based on error type.

### 🚧 To build (Supabase)
- Audit log table + trigger on sensitive tables (`profiles`, `trip_members`, `settlements`).
- Edge Function `delete-user-data` — cascades removal across all schemas + storage.
- Backup policy verified (Supabase daily backups) + a documented restore drill.
- Penetration test on RLS policies.
- Enable Supabase's rate limiting and abuse protection features.

### Deliverables / acceptance criteria
- Kill Wi-Fi, add 3 expenses + a photo → reconnect → everything syncs.
- Requesting account deletion wipes all rows and storage objects tied to the user within 30 days.
- Sentry captures a forced crash from a hidden debug menu.

### Estimated effort
1 mobile + 1 backend + security review × 2 weeks.

---

## Phase 10 — Growth: bookings, premium, community, marketplace  *(v3 and beyond)*

**Objective:** monetize and expand.

Not a single phase — a portfolio of parallel workstreams once the platform is stable:

- **Payments & settlements:** UPI deep links, QR codes, Stripe for international.
- **Premium subscription tier:** `subscriptions` table, RevenueCat integration, gated features (unlimited trips, higher member cap, AI budget).
- **Bookings:** flight, hotel, train, bus via affiliate APIs (Skyscanner, Booking.com, MakeMyTrip).
- **Community + public itineraries:** `public_itineraries` table, discover feed, follow users.
- **Corporate & family plans:** organization accounts, admin dashboards, expense export to CSV/QuickBooks.
- **Travel journal / blog:** long-form posts from a trip.
- **Marketplace:** paid itineraries from creators.

Each item is scoped as its own 2–4 week initiative.

---

## Cross-cutting concerns (run in parallel through every phase)

| Concern | What it means in practice |
|---------|---------------------------|
| Design system | Consolidate colors/spacing/typography into `src/theme` and audit every screen against it before phase exit. |
| Testing | Add Jest + React Native Testing Library from Phase 1. Add a Supabase local dev + `pg_prove` for DB tests from Phase 0. |
| CI/CD | GitHub Actions: lint + typecheck on every PR, Supabase migration linting, EAS build on merge to `main`, Expo web deploy to Vercel/Netlify. |
| Docs | Keep `PRD.md`, `PROJECT_OVERVIEW.md`, and this file in sync as scope evolves. |
| Analytics events | Instrument the funnel from day one so we can measure activation and retention (see PRD §2 KPIs). |
| Accessibility | Screen reader labels, contrast checks, touch target sizes on every new screen. |
| Localization | Wrap all user-facing strings with `i18next` from Phase 4 onward. |

---

## Immediate next actions (this week — Phase 0 kickoff)

Ordered. Do them top-to-bottom; each unblocks the next.

1. **Move secrets out of the client bundle.** Create `.env` + `.env.example`, add `.env` to `.gitignore`, refactor `src/lib/supabase.ts` to read from `expo-constants`. Delete the service-role key from client code entirely.
2. **Bump AsyncStorage** to 2.2.0: `npx expo install @react-native-async-storage/async-storage`.
3. **Init Supabase CLI**: `npx supabase init` (creates `supabase/config.toml` and `supabase/migrations/`).
4. **Author and run Phase 0 migrations** (`001_extensions.sql`, `002_schema.sql`, `003_rls.sql`, `004_storage.sql`) in Supabase Studio.
5. **Enable Email OTP** in Supabase Dashboard → Authentication → Providers.
6. **Create the five storage buckets** listed in Phase 0 (avatars, trip-covers, trip-media, documents, receipts).
7. **Rewrite `src/services/auth.ts` AND `src/services/trips.ts` (`getMyProfile` only)** to call Supabase directly — both are required to unblock `AuthContext.checkToken`. This is the Phase 1 kickoff.

Green-lighting these seven items closes the gap between the finished UI and a working backend, and puts us on track for MVP GA at the end of Phase 3.

---

## Deviations from the original plan (change log)

- **2026-07-14** — Baseline snapshot corrected: `TripDetail`, `services/expenses.ts`, and `AddExpenseScreen` re-classified from "stub" to "partial (calls missing Edge Functions)". Phase 0 gained a pre-flight section for env vars, CLI, and dependency bumps. Phase 1 gained ToS / Privacy / EditProfile screens. Phase 4 corrected the false claim about `AvatarPicker` supporting image picking. Phase 6 expanded from 3 modules to 6 (added Settings, Support, Global Search / Expenses). Phase 9 gained the five error screens. Cross-referenced [`SCREEN_INVENTORY.md`](./SCREEN_INVENTORY.md) throughout.
