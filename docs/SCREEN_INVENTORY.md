# TripWise — Complete Screen Inventory

> Every screen the app will ever need, from Splash to full v3 monetized platform. Each screen includes its purpose, elements, user actions, entry/exit points, current status, and target phase.

**Last updated:** July 14, 2026
**Related docs:** [DEVELOPMENT_PHASES.md](./DEVELOPMENT_PHASES.md) · [PRD.md](./PRD.md)

---

## How to use this document

- **Purpose** — one line: what problem does this screen solve?
- **Elements** — the exact UI blocks that must appear.
- **Actions** — what the user can do here.
- **Enters from / Exits to** — navigation graph.
- **Status** — ✅ Built · 🟡 Partial · ❌ Not Started.
- **Phase** — which development phase ships it (see `DEVELOPMENT_PHASES.md`).

Legend for elements: **[C]** = requires a reusable component, **[F]** = form/input, **[A]** = action button, **[S]** = state (loading/error/empty).

---

## Global count

| Module | Screens |
|--------|---------|
| 1. Splash & Onboarding | 3 |
| 2. Authentication | 7 |
| 3. Profile & Personal | 5 |
| 4. Dashboard & Global | 5 |
| 5. Trip Management | 10 |
| 6. Expenses & Settlements | 8 |
| 7. Shared Memories (Media) | 6 |
| 8. Chat & Messaging | 4 |
| 9. Timeline | 3 |
| 10. Documents | 4 |
| 11. Maps & Places | 4 |
| 12. AI Assistant | 4 |
| 13. Analytics & Insights | 4 |
| 14. Notifications | 3 |
| 15. Settings & System | 10 |
| 16. Community (v2+) | 6 |
| 17. Bookings (v3) | 6 |
| 18. Subscription & Billing (v3) | 4 |
| 19. Support & Legal | 5 |
| 20. Error & Utility | 5 |
| **TOTAL** | **~106 screens** |


---

## 1. Splash & Onboarding

### 1.1 SplashScreen · ✅ · Phase 0
**Purpose:** boot screen while the app determines auth state and preloads fonts/theme.
**Elements:**
- App logo + wordmark, centered.
- Optional tagline "Travel smarter, together".
- Animated spinner or progress dots.
- Version number in tiny text bottom-center.
**Actions:** none (auto-transitions in ~1.5s or after session check).
**Enters from:** cold app launch.
**Exits to:** WelcomeScreen (no session) · DashboardScreen (session valid) · CompleteProfileScreen (session valid but profile incomplete).

### 1.2 WelcomeScreen · ✅ · Phase 0
**Purpose:** brand-first landing for new users, sells the app in one glance.
**Elements:**
- Hero illustration or looping video.
- Headline + one-liner subheadline.
- Primary CTA: "Get Started".
- Secondary link: "I already have an account".
- Language switcher (small, top-right).
**Actions:** tap "Get Started" → LoginScreen · switch language.
**Enters from:** Splash · logout.
**Exits to:** LoginScreen.

### 1.3 AppTourScreen · ❌ · Phase 6
**Purpose:** first-launch product tour for new signups (skippable).
**Elements:**
- 4–5 swipeable pages, each with illustration + title + 1-line description covering: plan trips, invite friends, split expenses, save memories, get AI help.
- Progress dots.
- "Skip" (top-right) and "Next / Get Started" (bottom).
**Actions:** swipe · skip · finish.
**Enters from:** after CompleteProfile on first launch (one-time).
**Exits to:** TripDashboardScreen.

---

## 2. Authentication

### 2.1 LoginScreen · ✅ · Phase 1
**Purpose:** primary sign-in surface — email or mobile via OTP, or social sign-in.
**Elements:**
- Segmented control: Email / Mobile.
- **[F]** Email or phone input (with country code picker for mobile).
- **[A]** "Send OTP" primary button.
- Divider "or continue with".
- **[A]** Google, Apple sign-in buttons.
- Footer: "By continuing you agree to Terms & Privacy" links.
- **[S]** Loading, network error snackbar.
**Actions:** submit identifier · social sign-in · open Terms/Privacy in webview.
**Enters from:** WelcomeScreen · logout.
**Exits to:** OtpVerificationScreen · CompleteProfileScreen (if social sign-in returns new user) · TripDashboardScreen (returning social user).

### 2.2 OtpVerificationScreen · ✅ · Phase 1
**Purpose:** verify the OTP sent to email/mobile.
**Elements:**
- Illustration + "Enter the 6-digit code we sent to ..." with masked identifier.
- **[F]** 6-cell OTP input (auto-advance).
- **[A]** "Verify" primary button (auto-fires on complete).
- Resend link with 60-second cooldown timer.
- "Change email/number" back action.
- **[S]** Wrong-code error, expired-code error, resend confirmation.
**Actions:** enter OTP · resend · edit identifier.
**Enters from:** LoginScreen.
**Exits to:** CompleteProfileScreen (new user) · TripDashboardScreen (existing user).

### 2.3 CompleteProfileScreen · ✅ · Phase 1
**Purpose:** capture the mandatory profile fields for a first-time user.
**Elements:**
- **[C]** AvatarPicker (upload or choose emoji).
- **[F]** First name, last name.
- **[F]** DOB picker.
- **[F]** Gender dropdown.
- **[F]** City + country dropdowns.
- **[F]** Profession (optional).
- **[F]** Preferred currency dropdown.
- **[F]** Travel style chips (Solo / Family / Friends / Couple / Office).
- **[F]** Interests multi-select chips (Adventure, Beach, Food, ...).
- **[A]** "Save & Continue" primary button.
- Progress indicator (Step 1 of 1, or 1/3 if we split by section).
**Actions:** upload avatar · fill and submit.
**Enters from:** OtpVerificationScreen (new user) · Login social (new social user).
**Exits to:** AppTourScreen (first time) → TripDashboardScreen.

### 2.4 SocialAuthCallbackScreen · ❌ · Phase 1.5
**Purpose:** invisible bridge for OAuth redirect on web / handling Apple's private relay email.
**Elements:** spinner + status text.
**Actions:** none (auto).
**Enters from:** browser redirect after Google/Apple auth.
**Exits to:** CompleteProfile or TripDashboard.

### 2.5 ForgotPasswordScreen · ❌ · Phase 1.5 (only if we add password auth)
**Purpose:** kick off password reset flow (unused if we stay OTP-only).
**Elements:** email input, submit button, back link.
**Actions:** send reset link.
**Enters from:** LoginScreen (link).
**Exits to:** confirmation state.

### 2.6 ResetPasswordScreen · ❌ · Phase 1.5
**Purpose:** set new password from email deep link.
**Elements:** new password, confirm password, strength meter, submit.
**Enters from:** deep link `tripwise://reset-password/{token}`.
**Exits to:** LoginScreen with success snackbar.

### 2.7 AccountLockedScreen · ❌ · Phase 9
**Purpose:** shown when Supabase rate-limits or account is flagged for abuse.
**Elements:** icon, message, "Contact Support" button, back to Welcome.
**Actions:** open support · logout.
**Enters from:** any auth attempt that hits abuse detection.

---

## 3. Profile & Personal

### 3.1 ProfileScreen (Profile tab) · ✅ · Phase 1
**Purpose:** user's read-only profile card + entry into account management.
**Elements:**
- Avatar, name, profession, travel-style badge.
- Contact rows: email, phone (with verified check icons).
- Location, preferred currency, DOB.
- Interests chips.
- Buttons: Edit Profile · Settings · Sign Out.
**Actions:** navigate to edit / settings · logout confirmation dialog.
**Enters from:** bottom nav Profile tab.
**Exits to:** EditProfileScreen · SettingsScreen · WelcomeScreen (after logout).

### 3.2 EditProfileScreen · 🟡 · Phase 1.5
**Purpose:** modify any profile field.
**Elements:** same form as CompleteProfile, but with delete-avatar action and Save/Cancel.
**Actions:** update avatar · save changes · discard.
**Enters from:** ProfileScreen.
**Exits to:** ProfileScreen with success snackbar.

### 3.3 EmergencyContactsScreen · ❌ · Phase 6
**Purpose:** manage travel emergency contacts (name, relation, phone).
**Elements:** list, add-new FAB, edit/delete swipe actions.
**Enters from:** SettingsScreen.

### 3.4 TravelPreferencesScreen · ❌ · Phase 6
**Purpose:** deeper travel preferences: dietary needs, accessibility, allergies, preferred airlines, seat preferences.
**Elements:** grouped checklist form.
**Enters from:** SettingsScreen.

### 3.5 ConnectedAccountsScreen · ❌ · Phase 8
**Purpose:** manage OAuth links (Google, Apple, Facebook) and cloud storage (Drive, OneDrive, Dropbox, iCloud).
**Elements:** provider rows with connect/disconnect toggles, storage-used indicator.
**Enters from:** SettingsScreen.

---

## 4. Dashboard & Global

### 4.1 TripDashboardScreen (Trips tab) · ✅ · Phase 2
**Purpose:** primary hub — see all your trips, stats, and quick actions.
**Elements:**
- **[C]** DashboardHeader (greeting, avatar with logout, notifications bell).
- **[C]** SearchBar.
- **[C]** StatsCard row: Total trips, Upcoming, Completed.
- Section header "Your Trips" with "See All" link.
- **[C]** TripCard list (destination, dates, member count, expense summary, status pill).
- **[S]** Empty state with "Create your first trip" CTA.
- **[S]** Skeleton loader.
- **[C]** FloatingButton (create trip).
- **[C]** BottomNavigation.
**Actions:** search · filter by status · tap trip · pull-to-refresh · create trip · logout · open notifications.
**Enters from:** post-auth root.
**Exits to:** TripDetailScreen · CreateTripScreen · NotificationsScreen · ProfileScreen.

### 4.2 AllTripsScreen · ❌ · Phase 2.5
**Purpose:** paginated / filterable full list of trips beyond the dashboard's 10 recent.
**Elements:** filter chips (All, Upcoming, Ongoing, Completed, Cancelled), sort dropdown (date, cost, destination), list.
**Enters from:** TripDashboard "See All".

### 4.3 GlobalSearchScreen · ❌ · Phase 6
**Purpose:** search across all trips, expenses, photos, messages, documents.
**Elements:** search bar with recent searches, tabbed results (Trips / Expenses / Photos / Chat / Docs), empty state.
**Enters from:** TripDashboard search bar tap.

### 4.4 GlobalExpensesScreen (Expenses tab) · ❌ · Phase 6
**Purpose:** cross-trip expense feed for people who want an at-a-glance spending view.
**Elements:** filter chips (all trips / this month / this year / category), list of expenses grouped by month, totals row at top.
**Enters from:** bottom nav Expenses tab.

### 4.5 QuickActionsScreen · ❌ · Phase 6 (optional)
**Purpose:** widget-style hub for common actions: add expense, upload photo, start chat, open AI.
**Elements:** grid of tile buttons.
**Enters from:** bottom nav "+" (Phase 6 nav redesign).

---

## 5. Trip Management

### 5.1 CreateTripScreen · ✅ · Phase 2
**Purpose:** create a new trip.
**Elements:**
- **[F]** Trip name.
- **[F]** Destination (with autocomplete in Phase 7).
- **[F]** Start date, end date (date range picker).
- **[F]** Trip type chips: Solo / Friends / Family / Office / Couple / Adventure / Pilgrimage.
- **[F]** Cover image picker (default fallback if none).
- **[F]** Budget + currency dropdown.
- **[F]** Privacy toggle (Private / Public in Phase 10).
- **[F]** Description (multi-line).
- **[A]** "Create Trip" primary button.
- **[S]** Validation errors inline, Snackbar for API errors.
**Enters from:** TripDashboard FAB · Empty state CTA.
**Exits to:** TripDetailScreen (of newly created trip).

### 5.2 TripDetailScreen · 🟡 · Phase 2
**Purpose:** the heart of the app — everything about one trip.
**Elements:**
- Sticky header: back arrow, trip name, dates, cover image parallax, menu (⋯).
- Overview strip: total spent, member count, days elapsed / remaining.
- Tabs: **Overview · Expenses · Photos · Chat · Timeline · Docs · Map**.
- Menu: Edit trip · Invite members · Trip settings · Leave/Delete.
- **[C]** FloatingActionButton scoped to active tab (add expense, upload photo, new message, etc.).
**Enters from:** TripDashboard trip card · Notification deep link.
**Exits to:** every tab's respective screen; EditTripScreen, InviteMembersScreen, TripSettingsScreen.

### 5.3 TripOverviewTab · ❌ · Phase 2
**Purpose:** first tab inside TripDetail — trip summary.
**Elements:** description, cover image, member avatars strip, budget vs spent progress bar, upcoming highlights, recent activity feed (mini timeline).
**Actions:** tap member avatar → MemberDetailScreen.

### 5.4 EditTripScreen · ❌ · Phase 2
**Purpose:** admin-only edit of trip metadata.
**Elements:** same form as CreateTrip pre-filled; delete-trip action at bottom (danger).
**Enters from:** TripDetail menu.
**Exits to:** TripDetail with success.

### 5.5 InviteMembersScreen · ❌ · Phase 2
**Purpose:** add people to a trip.
**Elements:**
- Tabs: Contacts · Email · Phone · QR / Shareable Link.
- Search bar over contacts (when permission granted).
- Selected chips row.
- Message textarea (optional custom invite note).
- Pending invitations list with resend / cancel actions.
- **[A]** "Send Invites" primary.
**Enters from:** TripDetail menu · empty state on Members tab.
**Exits to:** TripDetail with pending invites shown.

### 5.6 MemberListScreen · ❌ · Phase 2
**Purpose:** roster of trip members with roles.
**Elements:** list of members with avatar, name, role badge (Admin/Member), joined date; per-row menu: promote to admin, remove, transfer ownership.
**Enters from:** TripDetail overview · TripSettings.

### 5.7 MemberDetailScreen · ❌ · Phase 2.5
**Purpose:** member's contribution card inside a trip.
**Elements:** avatar, name, contact, balance owed/owed-by, expenses paid count, photos uploaded, message count.
**Enters from:** MemberListScreen · Trip overview avatar tap.

### 5.8 TripSettingsScreen · ❌ · Phase 2
**Purpose:** admin controls for the trip.
**Elements:** rename, change cover, change privacy, archive trip, delete trip, mute notifications for this trip, leave trip.
**Enters from:** TripDetail menu.

### 5.9 AcceptInviteScreen · ❌ · Phase 2
**Purpose:** deep-link landing page from invitation email/SMS.
**Elements:** trip cover preview, name, dates, inviter name + avatar, member preview strip, Accept / Decline buttons.
**Enters from:** deep link `tripwise://invite/{token}` or web `/invite/{token}`.
**Exits to:** LoginScreen (if unauthenticated) → this screen → TripDetail on accept.

### 5.10 TripTemplatesScreen · ❌ · Phase 7
**Purpose:** pick a template that pre-fills a trip (Goa 3-day, Kashmir 5-day, Bangkok 4-day...).
**Elements:** grid of templates with photo, title, duration, price estimate; "Use Template" button.
**Enters from:** CreateTripScreen "Use a template" link.

---

## 6. Expenses & Settlements

### 6.1 ExpensesListTab (inside TripDetail) · 🟡 · Phase 3
**Purpose:** show all expenses for a trip.
**Elements:**
- Segmented control: All · By Category · By Payer.
- Filter chips: category, payer, date range.
- Total spent + budget remaining bar.
- Expense list grouped by date with day totals.
- **[C]** Expense row: category icon, title, amount, payer avatar, split-count badge.
- **[S]** Empty state "No expenses yet".
- **[C]** FAB → AddExpenseScreen.
**Enters from:** TripDetail Expenses tab.

### 6.2 AddExpenseScreen · ✅ · Phase 3
**Purpose:** log a new expense on a trip.
**Elements:**
- **[F]** Amount + currency (large hero input).
- **[F]** Category grid (Food, Fuel, Hotel, Flight, Shopping, Parking, Entertainment, Emergency, Medical, Transport, Custom).
- **[F]** Title / notes.
- **[F]** Date + time.
- **[F]** Paid by dropdown (member picker).
- **[F]** Split with (member multi-select).
- **[F]** Split type: Equal / Unequal / Percentage / Shares / Itemized.
- **[F]** Receipt image (camera / gallery / OCR extract in Phase 10).
- **[F]** Location tag (optional).
- **[A]** "Save Expense" primary · "Save & add another".
- **[S]** Live split preview showing each member's share.
**Enters from:** ExpensesListTab FAB · TripOverview quick action.
**Exits to:** ExpensesListTab.

### 6.3 ExpenseDetailScreen · ❌ · Phase 3
**Purpose:** full breakdown and edit of one expense.
**Elements:** amount hero, category, payer, participants split table, receipt image (tap to zoom), notes, location on mini-map, timestamp, "Edit" / "Delete" actions (creator or admin only), activity log (who edited when).
**Enters from:** ExpensesListTab row tap · Notification deep link.

### 6.4 EditExpenseScreen · ❌ · Phase 3
**Purpose:** modify an existing expense.
**Elements:** same form as AddExpenseScreen pre-filled. Warns if expense is already settled.
**Enters from:** ExpenseDetail edit button.

### 6.5 BalancesScreen (inside TripDetail) · 🟡 · Phase 3
**Purpose:** show who owes whom.
**Elements:**
- Personal summary card: "You owe ₹X" / "You are owed ₹Y".
- Simplified debt list ("Rahul owes you ₹450 · Settle Up").
- Full matrix view toggle (grid of every pair).
- Filter: this trip / all trips (cross-trip in Phase 6).
- **[A]** "Settle Up" button per row.
**Enters from:** TripDetail Balances sub-tab / bottom sheet from Overview.

### 6.6 SettleUpScreen · ❌ · Phase 3
**Purpose:** record a payment between two members.
**Elements:** from-user / to-user, amount pre-filled from balance, method (Cash · UPI · Bank · Other), notes, date, "Mark as Settled" button. Optional UPI deep-link launcher in Phase 10.
**Enters from:** BalancesScreen "Settle Up" · notification.

### 6.7 SettlementHistoryScreen · ❌ · Phase 3.5
**Purpose:** log of all settlements for a trip.
**Elements:** list grouped by date, filter by member, export as PDF/CSV.
**Enters from:** BalancesScreen "History" link.

### 6.8 ExpenseCategoriesScreen · ❌ · Phase 3.5
**Purpose:** manage custom categories (per user or per trip).
**Elements:** list of categories with icon and color, add/edit/delete, drag to reorder.
**Enters from:** AddExpense category picker "Manage" link · Settings.

---

## 7. Shared Memories (Media)

### 7.1 PhotosTab (inside TripDetail) · ❌ · Phase 4
**Purpose:** grid of every photo/video from the trip.
**Elements:**
- Segmented control: All · Photos · Videos · Voice Notes · Highlights (auto-curated in Phase 7).
- Filter by member avatar strip.
- Masonry grid with lazy-loaded thumbnails, video-duration badge, voice-note waveform.
- Selection mode: long-press → multi-select → download / delete / add to highlight.
- Sticky date headers.
- **[C]** FAB → UploadMediaScreen.
- **[S]** Empty state with upload CTA.
**Enters from:** TripDetail Photos tab.

### 7.2 UploadMediaScreen · ❌ · Phase 4
**Purpose:** select and upload media.
**Elements:** native picker (multi-select), preview strip with per-file caption + date override, upload queue with progress bar per file, resume/retry actions, cancel-all.
**Enters from:** PhotosTab FAB.

### 7.3 MediaViewerScreen · ❌ · Phase 4
**Purpose:** full-screen viewer with pan/zoom/swipe.
**Elements:** photo/video/voice player, top bar (uploader avatar + name, timestamp, download icon, delete icon if allowed), bottom bar (caption, reactions row, comments preview, "View comments" tap → comment sheet).
**Actions:** swipe left/right between media, pinch to zoom, share externally, save to camera roll.
**Enters from:** PhotosTab tap · notification deep link.

### 7.4 MediaCommentsSheet · ❌ · Phase 4
**Purpose:** comments and reactions on a single media item.
**Elements:** bottom sheet with existing comments list, emoji reactions row, comment input at bottom.
**Enters from:** MediaViewer bottom bar.

### 7.5 AlbumsScreen · ❌ · Phase 4.5
**Purpose:** curated sub-albums within a trip (Day 1, Beach, Wedding).
**Elements:** grid of albums with cover photo + count, "Create Album" FAB.
**Enters from:** PhotosTab "Albums" tab.

### 7.6 HighlightsScreen · ❌ · Phase 7
**Purpose:** AI-curated best-of reel from the trip.
**Elements:** cinematic full-screen carousel with music, share as video, regenerate.
**Enters from:** TripOverview "View Highlights" · PhotosTab Highlights.

---

## 8. Chat & Messaging

### 8.1 ChatTab (inside TripDetail) · ❌ · Phase 5
**Purpose:** real-time trip chat.
**Elements:**
- Pinned messages banner at top.
- Announcements bar (admin posts).
- Virtualized message list, bubbles grouped by sender + minute, timestamp dividers by date.
- Typing indicator via Presence.
- Reactions long-press menu, reply-to preview, forward, copy, delete-for-me / delete-for-everyone.
- Message input: text, attach media/document, voice note recorder, emoji picker, mention (@member).
- Location share tile.
- Poll composer (Phase 5.5).
**Enters from:** TripDetail Chat tab · push notification.

### 8.2 ChatInfoScreen · ❌ · Phase 5
**Purpose:** trip chat settings.
**Elements:** members preview, media/docs/links shared summary, notifications toggle, clear chat, export chat.
**Enters from:** ChatTab header tap.

### 8.3 SharedMediaGalleryScreen · ❌ · Phase 5
**Purpose:** all media/docs/links shared inside chat.
**Elements:** tabs Media · Docs · Links, grouped by date.
**Enters from:** ChatInfoScreen.

### 8.4 PollScreen · ❌ · Phase 5.5
**Purpose:** create or view a poll ("Which restaurant tonight?").
**Elements:** question, options with vote counts + bars, member avatars per option, add-option (if allowed), close-poll (creator/admin).
**Enters from:** ChatTab attachment menu · pinned polls.

---

## 9. Timeline

### 9.1 TimelineTab (inside TripDetail) · ❌ · Phase 6
**Purpose:** day-by-day story of the trip.
**Elements:**
- Sticky day headers with date + weather icon + total spent that day.
- Chronological feed mixing: photos, expenses, notes, visited places, chat highlights.
- "Add Note" FAB per day.
- Filter chips (Photos only, Expenses only, Notes only).
**Enters from:** TripDetail Timeline tab.

### 9.2 AddNoteScreen · ❌ · Phase 6
**Purpose:** add a written note to the timeline.
**Elements:** date field, title, rich-text body (bold/italic/lists/link), attach photo, mention member, save.
**Enters from:** TimelineTab FAB.

### 9.3 NoteDetailScreen · ❌ · Phase 6
**Purpose:** read/edit a note, react and comment.
**Elements:** rendered note, edit (author only), reactions, comments thread.
**Enters from:** TimelineTab note tap.

---

## 10. Documents

### 10.1 DocumentsTab (inside TripDetail) · ❌ · Phase 6
**Purpose:** all documents attached to a trip.
**Elements:** category filter row (Passport, Visa, Flight Ticket, Hotel, Train, Bus, Insurance, License, Receipt, Other), list with thumbnail + expiry badge, search, sort.
**Actions:** upload, tap → DocumentDetail.
**Enters from:** TripDetail Docs tab.

### 10.2 UploadDocumentScreen · ❌ · Phase 6
**Purpose:** upload a document file (PDF, image).
**Elements:** category picker, title, expiry date (optional), file picker, thumbnail preview, save.
**Enters from:** DocumentsTab FAB.

### 10.3 DocumentDetailScreen · ❌ · Phase 6
**Purpose:** preview and manage a document.
**Elements:** in-app PDF/image viewer, metadata (uploader, date, expiry countdown), share/download/delete actions, "Set Reminder" for expiry.
**Enters from:** DocumentsTab tap · expiry notification.

### 10.4 PersonalDocumentsScreen · ❌ · Phase 6
**Purpose:** user-level docs (passport, license) not tied to a trip.
**Elements:** same list as DocumentsTab but scoped to the user.
**Enters from:** SettingsScreen · ProfileScreen.

---

## 11. Maps & Places

### 11.1 MapTab (inside TripDetail) · ❌ · Phase 7
**Purpose:** interactive trip map.
**Elements:** map with pinned places, visited places (path connecting them), current-location marker, nearby recommendations layer toggle (Hotels, Restaurants, ATMs, Petrol, Hospitals, Police), search bar, filter chips, "Add Pin" FAB.
**Enters from:** TripDetail Map tab.

### 11.2 PlaceDetailScreen · ❌ · Phase 7
**Purpose:** rich info about a place (bottom sheet or full screen).
**Elements:** cover photos carousel, name, rating, category, distance from current pin, phone/website, opening hours, "Directions", "Add to Trip", "Share", nearby places carousel.
**Enters from:** MapTab pin tap · Recommendations carousel · AI Assistant.

### 11.3 AddPinScreen · ❌ · Phase 7
**Purpose:** manually pin a location.
**Elements:** location picker (drag map), title, note, category, photo attach, save.
**Enters from:** MapTab FAB.

### 11.4 DirectionsScreen · ❌ · Phase 7
**Purpose:** turn-by-turn or handoff to native map.
**Elements:** route summary, "Open in Google Maps / Apple Maps" buttons, travel time, distance.
**Enters from:** PlaceDetailScreen Directions button.

---

## 12. AI Assistant

### 12.1 AIAssistantScreen · ❌ · Phase 7
**Purpose:** conversational travel assistant scoped to a trip (or global).
**Elements:** message list (streaming), quick-action chips (Itinerary, Budget, Packing List, Hotels, Restaurants, Weather, Translate, Currency, Visa, Emergency, Safety Tips), input with mic, "New Chat" reset, history drawer.
**Enters from:** TripDetail AI tab · floating "Ask AI" bubble.

### 12.2 ItineraryGeneratorScreen · ❌ · Phase 7
**Purpose:** guided wizard to generate a day-by-day itinerary.
**Elements:** trip info recap, duration, budget, interests, travel style, "Generate" button, streaming result, "Save to Trip Timeline" action.
**Enters from:** AIAssistant quick action · CreateTrip "Auto-plan" toggle.

### 12.3 ItineraryDetailScreen · ❌ · Phase 7
**Purpose:** view a saved AI itinerary.
**Elements:** day tabs, per-day list of places with time + estimated cost, per-place action (Add to Map, Book, Save Photo Idea), regenerate a single day.
**Enters from:** ItineraryGeneratorScreen · Trip timeline entry.

### 12.4 AIHistoryScreen · ❌ · Phase 7
**Purpose:** list of past AI conversations per trip / global.
**Elements:** conversation cards with snippet, timestamp, delete swipe.
**Enters from:** AIAssistant history icon.

---

## 13. Analytics & Insights

### 13.1 AnalyticsDashboardScreen · ❌ · Phase 6
**Purpose:** cross-trip spending and travel insights.
**Elements:** hero stats (Total trips, Total spent, Avg per trip), most expensive trip, cheapest trip, top categories pie, spending trend line chart (monthly / yearly toggle), destination heatmap.
**Enters from:** ProfileScreen · Dashboard menu.

### 13.2 CategoryBreakdownScreen · ❌ · Phase 6
**Purpose:** drill down into one category's spending.
**Elements:** bar chart per trip, list of expenses, share/export.
**Enters from:** AnalyticsDashboard category tap.

### 13.3 TravelHeatmapScreen · ❌ · Phase 7
**Purpose:** world map of every place you've traveled.
**Elements:** map with dots and heat clouds, timeline scrubber, "Countries: X / 195" stat, share badge.
**Enters from:** AnalyticsDashboard heatmap tap.

### 13.4 YearInReviewScreen · ❌ · Phase 10
**Purpose:** Spotify-Wrapped-style annual travel recap.
**Elements:** full-screen animated story cards, share as image/video.
**Enters from:** notification (December) · AnalyticsDashboard banner.

---

## 14. Notifications

### 14.1 NotificationsInboxScreen · ❌ · Phase 5
**Purpose:** unified in-app inbox for all notifications.
**Elements:** tabs (All · Unread · Trips · Expenses · Chat · System), list with icon + title + snippet + timestamp, swipe to mark read / delete, bulk "Mark all read".
**Enters from:** Dashboard header bell.

### 14.2 NotificationDetailScreen · ❌ · Phase 5
**Purpose:** rich content for a specific notification (rare — most deep-link straight to target).
**Enters from:** NotificationsInbox tap when no direct target.

### 14.3 NotificationPreferencesScreen · ❌ · Phase 5
**Purpose:** granular toggles per notification type.
**Elements:** master toggle, per-category toggles (Trip invites, Expense adds, Settlement reminders, Chat mentions, New photos, Document expiry, Weather alerts, Promotions), channel toggles (Push · Email · SMS).
**Enters from:** SettingsScreen.

---

## 15. Settings & System

### 15.1 SettingsScreen · ❌ · Phase 6
**Purpose:** hub for all app-level preferences.
**Elements:** grouped rows: Account · Notifications · Privacy & Security · Appearance · Language · Currency · Connected Accounts · Storage · Help · About · Sign Out.
**Enters from:** ProfileScreen gear · Dashboard menu.

### 15.2 AccountSettingsScreen · ❌ · Phase 6
**Purpose:** change email, phone, password (if any), two-factor.
**Enters from:** SettingsScreen.

### 15.3 PrivacySecurityScreen · ❌ · Phase 9
**Purpose:** biometric lock, session list, active devices, "Delete my data" (GDPR).
**Enters from:** SettingsScreen.

### 15.4 AppearanceScreen · ❌ · Phase 6
**Purpose:** theme (System / Light / Dark), font size, reduce motion, high-contrast mode.
**Enters from:** SettingsScreen.

### 15.5 LanguageScreen · ❌ · Phase 4+
**Purpose:** switch app language (i18n from Phase 4).
**Elements:** searchable list of supported locales with native names.
**Enters from:** SettingsScreen.

### 15.6 CurrencyScreen · ❌ · Phase 6
**Purpose:** default display currency and exchange-rate provider.
**Enters from:** SettingsScreen.

### 15.7 StorageScreen · ❌ · Phase 8
**Purpose:** show storage used per trip, per cloud provider; cache clear.
**Enters from:** SettingsScreen.

### 15.8 OfflineDataScreen · ❌ · Phase 9
**Purpose:** manage offline-queue and downloaded trips.
**Elements:** list of pending sync items, "Force sync" button, downloaded trips toggle.
**Enters from:** SettingsScreen.

### 15.9 DeveloperMenuScreen · ❌ · Phase 9
**Purpose:** hidden (long-press version number 7x) debug menu — force crash, clear session, toggle flags.
**Enters from:** SettingsScreen version tap.

### 15.10 AboutScreen · ❌ · Phase 6
**Purpose:** app version, build number, credits, licenses, legal links.
**Enters from:** SettingsScreen.

---

## 16. Community (v2+)

### 16.1 CommunityFeedScreen · ❌ · Phase 10
**Purpose:** discover public trips, itineraries, stories from other travelers.
**Elements:** curated feed (For You / Following / Trending), post cards with cover + author + reactions, filter chips by destination or interest.
**Enters from:** bottom nav Community tab.

### 16.2 ExploreDestinationsScreen · ❌ · Phase 10
**Purpose:** browse destinations by category (Beaches, Mountains, Pilgrimage, ...).
**Elements:** carousel of categories, popular destinations grid, seasonal picks.
**Enters from:** CommunityFeed "Explore".

### 16.3 PublicTripDetailScreen · ❌ · Phase 10
**Purpose:** read-only view of another user's public trip.
**Elements:** same layout as TripDetail but read-only, "Save Itinerary" and "Copy to My Trips" actions.
**Enters from:** CommunityFeed card tap.

### 16.4 UserProfilePublicScreen · ❌ · Phase 10
**Purpose:** other user's public profile.
**Elements:** avatar, bio, follower/following counts, list of public trips, follow button.
**Enters from:** community post author tap.

### 16.5 FollowersFollowingScreen · ❌ · Phase 10
**Purpose:** lists of who follows / is followed.
**Enters from:** UserProfilePublic counts tap.

### 16.6 CreatePostScreen · ❌ · Phase 10.5
**Purpose:** publish a trip story or blog post.
**Elements:** title, cover, rich-text editor, hashtags, choose trip to attach, privacy (Public/Followers).
**Enters from:** TripDetail menu "Publish Story".

---

## 17. Bookings (v3)

### 17.1 BookingHomeScreen · ❌ · Phase 10
**Purpose:** hub to search flights, hotels, trains, buses, cars, activities.
**Elements:** tab bar for booking type, recent searches, offers carousel.
**Enters from:** Dashboard menu · TripDetail Bookings tab.

### 17.2 FlightSearchScreen · ❌ · Phase 10
**Purpose:** search flights.
**Elements:** from/to airports, dates, cabin class, passengers, direct-only toggle, search button.

### 17.3 FlightResultsScreen · ❌ · Phase 10
**Purpose:** filter and sort flight offers.

### 17.4 HotelSearchScreen · ❌ · Phase 10
**Purpose:** search hotels near destination.

### 17.5 HotelResultsScreen · ❌ · Phase 10
**Purpose:** hotel results grid/list with filters (price, rating, amenities).

### 17.6 BookingCheckoutScreen · ❌ · Phase 10
**Purpose:** review + pay for a booking.
**Elements:** summary, traveler info, payment method, T&C, "Pay" button, receipt on success (auto-attached to trip docs).

---

## 18. Subscription & Billing (v3)

### 18.1 SubscriptionPlansScreen · ❌ · Phase 10
**Purpose:** pitch premium/family/corporate tiers.
**Elements:** plan comparison cards, monthly/annual toggle, feature checklist, "Start Free Trial" / "Subscribe" CTAs.
**Enters from:** Settings · gated-feature prompt.

### 18.2 PurchaseCheckoutScreen · ❌ · Phase 10
**Purpose:** platform-native IAP flow entry (Apple/Google/Stripe).
**Elements:** confirmation, price, terms, "Confirm" button that opens native purchase sheet.

### 18.3 ManageSubscriptionScreen · ❌ · Phase 10
**Purpose:** view current plan, next billing date, renewal toggle, upgrade/downgrade, cancel.
**Enters from:** SettingsScreen.

### 18.4 InvoicesScreen · ❌ · Phase 10.5
**Purpose:** list of past invoices with download PDF.
**Enters from:** ManageSubscriptionScreen.

---

## 19. Support & Legal

### 19.1 HelpCenterScreen · ❌ · Phase 6
**Purpose:** browseable help articles.
**Elements:** search, categories, FAQ list, "Still need help? Contact support" CTA.

### 19.2 ContactSupportScreen · ❌ · Phase 6
**Purpose:** contact form / email link / in-app chat.
**Elements:** issue category dropdown, subject, description, attachments, submit; shows past tickets below.

### 19.3 FeedbackScreen · ❌ · Phase 6
**Purpose:** collect free-form product feedback.
**Elements:** star rating, category, message, screenshot attach.

### 19.4 TermsOfServiceScreen · ❌ · Phase 1 (external webview acceptable)
**Purpose:** show ToS document.

### 19.5 PrivacyPolicyScreen · ❌ · Phase 1
**Purpose:** show privacy policy.

---

## 20. Error & Utility

### 20.1 NoInternetScreen · ❌ · Phase 9
**Purpose:** shown as a full-screen state when the app is offline and needs the network.
**Elements:** icon, message, "Retry" button, "Continue Offline" if some features allow it.

### 20.2 ServerErrorScreen · ❌ · Phase 9
**Purpose:** unexpected 500/503 fallback.
**Elements:** apology, "Try again" button, "Report Issue" link.

### 20.3 MaintenanceScreen · ❌ · Phase 9
**Purpose:** shown when Supabase / feature is under scheduled maintenance.
**Elements:** message, ETA, status page link.

### 20.4 UpdateRequiredScreen · ❌ · Phase 9
**Purpose:** shown when the client is below the min-supported version.
**Elements:** message, "Update Now" button (opens store).

### 20.5 NotFoundScreen · ❌ · Phase 9
**Purpose:** unhandled deep link, deleted resource.
**Elements:** message + "Go Home" button.

---

## Navigation Architecture

### Root stacks

```
RootNavigator
├── AuthStack (unauthenticated)
│   ├── Splash
│   ├── Welcome
│   ├── Login
│   ├── OtpVerification
│   ├── SocialAuthCallback (web)
│   ├── ForgotPassword (future)
│   ├── ResetPassword (future)
│   ├── AcceptInvite (deep link)
│   ├── TermsOfService
│   └── PrivacyPolicy
│
└── MainStack (authenticated)
    ├── CompleteProfile (blocking modal on first login)
    ├── AppTour (one-time modal)
    ├── MainTabs
    │   ├── Trips (TripDashboard)
    │   ├── Expenses (GlobalExpenses, v1.3+)
    │   ├── Community (v3+)
    │   └── Profile
    ├── TripStack
    │   ├── TripDetail (Overview / Expenses / Photos / Chat / Timeline / Docs / Map / AI)
    │   ├── CreateTrip · EditTrip · TripSettings
    │   ├── InviteMembers · MemberList · MemberDetail
    │   ├── AddExpense · ExpenseDetail · EditExpense · SettleUp · SettlementHistory
    │   ├── UploadMedia · MediaViewer · Albums · Highlights
    │   ├── AddNote · NoteDetail
    │   ├── UploadDocument · DocumentDetail
    │   ├── PlaceDetail · AddPin · Directions
    │   ├── AIAssistant · ItineraryGenerator · ItineraryDetail · AIHistory
    │   └── PollScreen · ChatInfo · SharedMediaGallery
    ├── SettingsStack (Settings, Account, Notifications, Privacy, Appearance, Language, ...)
    ├── AnalyticsStack (Dashboard, CategoryBreakdown, Heatmap, YearInReview)
    ├── CommunityStack (Feed, Explore, PublicTripDetail, UserProfile, ...)
    ├── BookingsStack (v3)
    ├── SubscriptionStack (Plans, Checkout, Manage, Invoices)
    ├── SupportStack (HelpCenter, ContactSupport, Feedback)
    └── ErrorStack (NoInternet, ServerError, Maintenance, UpdateRequired, NotFound)
```

### Deep links

| Pattern | Destination |
|---------|-------------|
| `tripwise://invite/{token}` | AcceptInviteScreen |
| `tripwise://trip/{tripId}` | TripDetailScreen |
| `tripwise://trip/{tripId}/expense/{expenseId}` | ExpenseDetailScreen |
| `tripwise://trip/{tripId}/media/{mediaId}` | MediaViewerScreen |
| `tripwise://trip/{tripId}/chat` | ChatTab |
| `tripwise://trip/{tripId}/settle` | SettleUpScreen |
| `tripwise://notifications` | NotificationsInboxScreen |
| `tripwise://reset-password/{token}` | ResetPasswordScreen |

---

## Phase-by-phase screen shipping plan

| Phase | Screens shipping | Cumulative |
|-------|------------------|-----------|
| 0 – Foundation | Splash · Welcome | 2 |
| 1 – Auth + Profile | Login · OTP · CompleteProfile · ProfileScreen · EditProfile · ToS · Privacy | 9 |
| 2 – Trip management | TripDashboard · CreateTrip · TripDetail · TripOverview · EditTrip · InviteMembers · MemberList · TripSettings · AcceptInvite | 18 |
| 3 – Expenses (MVP GA) | ExpensesListTab · AddExpense · ExpenseDetail · EditExpense · Balances · SettleUp · SettlementHistory | 25 |
| 4 – Media | PhotosTab · UploadMedia · MediaViewer · MediaCommentsSheet · Albums · Language screen (i18n starts) | 31 |
| 5 – Chat & notifications | ChatTab · ChatInfo · SharedMediaGallery · Poll · NotificationsInbox · NotificationDetail · NotificationPreferences | 38 |
| 6 – Timeline, docs, analytics, settings | TimelineTab · AddNote · NoteDetail · DocumentsTab · UploadDocument · DocumentDetail · PersonalDocuments · AnalyticsDashboard · CategoryBreakdown · Settings · AccountSettings · Appearance · Currency · About · GlobalSearch · GlobalExpenses · HelpCenter · ContactSupport · Feedback · AllTrips · MemberDetail | 59 |
| 7 – Maps & AI | MapTab · PlaceDetail · AddPin · Directions · AIAssistant · ItineraryGenerator · ItineraryDetail · AIHistory · Highlights · TravelHeatmap · TripTemplates | 70 |
| 8 – Cloud integrations | ConnectedAccounts · Storage | 72 |
| 9 – Offline, security, error screens | PrivacySecurity · OfflineData · DeveloperMenu · AccountLocked · NoInternet · ServerError · Maintenance · UpdateRequired · NotFound | 81 |
| 10 – Growth | CommunityFeed · ExploreDestinations · PublicTripDetail · UserProfilePublic · FollowersFollowing · CreatePost · BookingHome · FlightSearch · FlightResults · HotelSearch · HotelResults · BookingCheckout · SubscriptionPlans · PurchaseCheckout · ManageSubscription · Invoices · YearInReview | 98+ |

---

## Screen priority for MVP GA (end of Phase 3)

**Must ship (25 screens):**

Splash · Welcome · Login · OTP · CompleteProfile · ProfileScreen · EditProfile · ToS · Privacy · TripDashboard · CreateTrip · TripDetail · TripOverview · EditTrip · InviteMembers · MemberList · TripSettings · AcceptInvite · ExpensesListTab · AddExpense · ExpenseDetail · EditExpense · Balances · SettleUp · SettlementHistory.

**Current status: 10 built · 3 partial · 12 to build.**

---

## Reusable component checklist (screens depend on these)

- ✅ Button, TextField, Dropdown, DatePicker, OtpInput, AvatarPicker
- ✅ BottomSheet, ConfirmationDialog, SuccessDialog, Snackbar
- ✅ LoadingIndicator, ErrorMessage, ThemeToggle
- ✅ DashboardHeader, SearchBar, StatsCard, TripCard, EmptyState, FloatingButton, BottomNavigation
- ❌ ExpenseRow, SplitPreview, BalanceRow, SettleUpSheet (Phase 3)
- ❌ MediaGridItem, MediaLightbox, UploadQueueRow, ReactionBar (Phase 4)
- ❌ MessageBubble, TypingIndicator, PollCard, MentionAutocomplete (Phase 5)
- ❌ TimelineDayHeader, TimelineEventCard, NoteEditor (Phase 6)
- ❌ DocumentCard, DocumentViewer, ExpiryBadge (Phase 6)
- ❌ ChartCard (bar/pie/line), Heatmap, StatHero (Phase 6)
- ❌ MapMarker, PlaceCard, DirectionsSheet (Phase 7)
- ❌ AIMessageBubble, StreamingIndicator, QuickActionChip (Phase 7)
- ❌ PlanComparisonCard, PricePill, PaymentMethodRow (Phase 10)

---

## Notes and conventions

- Every screen uses `SafeAreaView` as the outermost layout on native.
- Every scrollable screen uses `webScrollViewStyle` + `webScrollContentStyle` from `src/utils/webStyles.ts` for web parity.
- Every FAB and fixed bottom bar uses `webFabStyle` / `webFixedStyle` so it doesn't drift with content on web.
- All destructive actions require a `ConfirmationDialog` with `isDanger`.
- All destructive network calls show a `Snackbar` on failure and roll back optimistic UI.
- Loading, empty, and error states are first-class — every list-driven screen must define all three.
- Deep-link routes must gracefully handle unauth users by redirecting through Login and returning to the target.
- Every screen with member context enforces trip-member RLS on the backend as the final gate; the UI should not be the only guard.
