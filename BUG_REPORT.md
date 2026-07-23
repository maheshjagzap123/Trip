# TripWise Mobile QA Report

## Summary
- **Total Bugs Found:** 42
- **Critical:** 5
- **High:** 12
- **Medium:** 16
- **Low:** 9

---

## Bug #1

### Title
Google OAuth token stored in database without encryption

### Severity
Critical

### Module
Cloud Storage / Google Drive Integration

### Screen
ConnectDriveScreen

### Platform
Both

### Steps to Reproduce
1. Navigate to Settings → Cloud Storage
2. Connect Google Drive
3. Observe that `access_token` is stored as plain text in `cloud_connections` table

### Expected Result
Access tokens should be encrypted at rest or use a server-side token vault.

### Actual Result
Raw OAuth access token stored in plain text in the Supabase `cloud_connections` table, accessible via RLS policies.

### Root Cause
`saveConnection` in ConnectDriveScreen stores `access_token` directly without encryption.

### Recommended Fix
Use Supabase Vault or encrypt tokens before storage. Alternatively, handle OAuth server-side via Edge Functions.

### Status
Open

---

## Bug #2

### Title
Google Client ID hardcoded in client-side code

### Severity
Critical

### Module
Cloud Storage / Google Drive Integration

### Screen
ConnectDriveScreen

### Platform
Both

### Steps to Reproduce
1. Open `ConnectDriveScreen.tsx`
2. Observe `GOOGLE_CLIENT_ID` constant at line 12

### Expected Result
Client ID should be in environment variables or a config service.

### Actual Result
`GOOGLE_CLIENT_ID = '596689950582-...'` is hardcoded, making it visible in the JS bundle.

### Root Cause
Developer convenience during development.

### Recommended Fix
Move to environment variable `EXPO_PUBLIC_GOOGLE_CLIENT_ID`.

### Status
Open

---

## Bug #3

### Title
Chat input bar has excessive bottom padding causing input to float above keyboard area

### Severity
Critical

### Module
Chat

### Screen
ChatScreen

### Platform
Both

### Steps to Reproduce
1. Open any trip chat
2. Observe the message input area
3. Note `paddingBottom: 80` on the inputBar style

### Expected Result
Input bar should sit at the bottom with appropriate safe area padding.

### Actual Result
Input bar has 80px bottom padding, creating a large dead zone between keyboard and input. On devices without home indicator, this is wasted space.

### Root Cause
Hardcoded `paddingBottom: 80` in inputBar style (line in ChatScreen styles) — likely intended to account for tab bar but chat is rendered in a full-screen modal without tab bar.

### Recommended Fix
Use safe area insets for bottom padding: `paddingBottom: insets.bottom + 8` or remove the excessive padding since ChatScreen is a full-screen overlay.

### Status
Open

---

## Bug #4

### Title
No token refresh mechanism for Google Drive — uploads will silently fail

### Severity
Critical

### Module
Media Upload / Cloud Storage

### Screen
PhotosScreen

### Platform
Both

### Steps to Reproduce
1. Connect Google Drive
2. Wait for implicit OAuth token to expire (~1 hour)
3. Try to upload a photo
4. Upload fails with token error

### Expected Result
Token should be refreshed automatically or user should be prompted to re-authenticate gracefully.

### Actual Result
`getValidAccessToken` in mediaStore returns the stored token without checking expiry. `isTokenValid` is checked but the error message `DRIVE_TOKEN_EXPIRED` just shows a dialog — the token is never refreshed.

### Root Cause
Using implicit OAuth flow (response_type=token) which doesn't provide refresh tokens. Comment in code says "far-future expiry so token persists" but Google tokens expire in ~1 hour.

### Recommended Fix
Switch to authorization code flow via a backend Edge Function that stores refresh tokens securely and issues new access tokens on demand.

### Status
Open

---

## Bug #5

### Title
Delete account only soft-deletes profile but does not revoke auth session server-side

### Severity
Critical

### Module
Profile / Settings

### Screen
ProfileScreen (Settings)

### Platform
Both

### Steps to Reproduce
1. Go to Settings → Delete Account → Confirm
2. The profile is marked as deleted
3. User is signed out locally
4. But the Supabase Auth user record still exists

### Expected Result
Account deletion should also call `supabase.auth.admin.deleteUser()` via an Edge Function to fully remove the auth record.

### Actual Result
Only `profiles.deleted_at` is set and `display_name` changed. The auth user still exists and could potentially sign back in and create a new profile row.

### Root Cause
No server-side Edge Function to handle full account deletion.

### Recommended Fix
Create a `delete-account` Edge Function that deletes the auth user, cascades to related data, and returns confirmation.

### Status
Open

---

## Bug #6

### Title
Deprecated `Clipboard` import from React Native core

### Severity
High

### Module
Chat

### Screen
ChatScreen

### Platform
Both

### Steps to Reproduce
1. Long-press a message → Copy
2. On newer React Native versions, `Clipboard` from 'react-native' is removed

### Expected Result
Should use `@react-native-clipboard/clipboard` community package.

### Actual Result
Uses deprecated `Clipboard` import from 'react-native' which may not work on newer RN versions (0.81+).

### Root Cause
Legacy import not updated.

### Recommended Fix
Install and use `@react-native-clipboard/clipboard` or `expo-clipboard`.

### Status
Open

---

## Bug #7

### Title
No email validation on OTP login — user can submit empty or invalid input

### Severity
High

### Module
Authentication

### Screen
LoginScreen

### Platform
Both

### Steps to Reproduce
1. Go to Login screen
2. Enter spaces or invalid characters
3. Tap "Send Code"
4. API call is made with invalid data

### Expected Result
Client-side validation should catch invalid emails/phone numbers before API call.

### Actual Result
Only checks if `value` is truthy (non-empty after trim). No regex validation for email format or phone number format. Invalid inputs waste API calls and show cryptic Supabase errors.

### Root Cause
Missing input validation in `handleSendOtp`.

### Recommended Fix
Add email regex validation and phone number format validation before calling Supabase.

### Status
Open

---

## Bug #8

### Title
Expense deletion has no confirmation on ExpensesTab — immediate delete on tap

### Severity
High

### Module
Expenses

### Screen
ExpensesTab

### Platform
Both

### Steps to Reproduce
1. Open Expenses tab
2. Tap the trash icon on any expense
3. Expense is immediately deleted without confirmation

### Expected Result
Should show a confirmation dialog before deleting.

### Actual Result
`handleDelete` in ExpensesTab directly calls `deleteExpense(item.id, tripId)` without any Alert/confirmation.

### Root Cause
Missing confirmation dialog in `handleDelete` function.

### Recommended Fix
Add `Alert.alert` confirmation before calling `deleteExpense`.

### Status
Open

---

## Bug #9

### Title
useMemo in TripDashboardScreen includes component state in dependency array causing stale closures

### Severity
High

### Module
Trips Dashboard

### Screen
TripDashboardScreen

### Platform
Both

### Steps to Reproduce
1. Open dashboard
2. Change search query or filter
3. ListHeader may not re-render properly due to stale closure in useMemo

### Expected Result
ListHeader should update reactively when any of its dependencies change.

### Actual Result
`ListHeader` is wrapped in `useMemo` with `[colors, profile, unreadCount, trips, invitations, totalSpent, statusFilter, searchQuery]` — but `setSearchQuery` and `setStatusFilter` are called inside the memoized component. The TextInput `onChangeText` captures closure correctly but FlatList may not re-render the header.

### Root Cause
Memoizing a component that contains interactive state (TextInput) is fragile.

### Recommended Fix
Extract ListHeader into a proper component or remove useMemo to ensure reactivity.

### Status
Open

---

## Bug #10

### Title
WelcomeScreen uses useRef inside a map — violates React hooks rules

### Severity
High

### Module
Authentication

### Screen
WelcomeScreen

### Platform
Both

### Steps to Reproduce
1. Open the app (unauthenticated)
2. Welcome screen renders
3. `const cardAnims = FEATURES.map(() => useRef(new Animated.Value(0)).current)` — called conditionally

### Expected Result
Hooks should not be called inside loops/maps.

### Actual Result
`useRef` is called inside `FEATURES.map()` which violates hooks rules. This works only because FEATURES array length is constant, but it's technically invalid and could cause issues with React strict mode or future React versions.

### Root Cause
Hooks called in a loop.

### Recommended Fix
Use `useRef` with an array: `const cardAnims = useRef(FEATURES.map(() => new Animated.Value(0))).current`.

### Status
Open

---

## Bug #11

### Title
Chat messages FlatList has no inverted prop — new messages require manual scroll

### Severity
High

### Module
Chat

### Screen
ChatScreen

### Platform
Both

### Steps to Reproduce
1. Open chat with many messages
2. Messages are fetched in ascending order
3. User sees oldest messages first
4. Auto-scroll to bottom via setTimeout is unreliable

### Expected Result
Chat should use `inverted` FlatList so newest messages are always visible without manual scrolling.

### Actual Result
Uses `setTimeout(() => flatListRef.current?.scrollToEnd(), 100)` which is a race condition — may fire before layout is complete. First load shows top of list briefly before scrolling.

### Root Cause
Non-inverted FlatList with async scroll-to-end.

### Recommended Fix
Use `inverted` FlatList with data reversed, or use `initialScrollIndex` / `onContentSizeChange` for reliable scroll.

### Status
Open

---

## Bug #12

### Title
Trip deletion does not clean up messages, media, and trip_notes tables

### Severity
High

### Module
Trips

### Screen
TripDetailScreen

### Platform
Both

### Steps to Reproduce
1. Open a trip with messages, photos, and notes
2. Delete the trip as admin
3. Messages, media records, and trip_notes remain as orphaned records

### Expected Result
All related data should be cleaned up.

### Actual Result
`handleDeleteTrip` only deletes: expense_splits, expenses, settlements, trip_members, notifications, and trips. Missing: messages, media, trip_notes, documents (trip-specific).

### Root Cause
Incomplete cascade deletion logic.

### Recommended Fix
Add deletion of `messages`, `media`, `trip_notes`, and trip-specific `documents` before deleting the trip.

### Status
Open

---

## Bug #13

### Title
Settlement confirmation does not refresh balances in parent component

### Severity
High

### Module
Expenses / Settlement

### Screen
SettlementDetailScreen

### Platform
Both

### Steps to Reproduce
1. Receive a settlement confirmation request
2. Confirm the payment
3. Go back to Expenses → Balances tab
4. Balance may still show old value until manual refresh

### Expected Result
Confirming a settlement should update balances immediately.

### Actual Result
`confirmSettlement` in expenseStore updates the settlement status but only refreshes when `onSettled` callback is called. If the parent doesn't call `fetchBalances`, the balance display is stale.

### Root Cause
Real-time subscription exists but relies on Supabase postgres_changes which may have latency.

### Recommended Fix
Explicitly call `fetchBalances` after `confirmSettlement` completes in the store action.

### Status
Open

---

## Bug #14

### Title
No network error handling in auth initialization

### Severity
High

### Module
Authentication

### Screen
SplashScreen / AppNavigator

### Platform
Both

### Steps to Reproduce
1. Launch app with no network connectivity
2. `initialize()` in authStore fails silently
3. App shows splash screen indefinitely or navigates to auth without proper state

### Expected Result
Should show a "No internet connection" message or retry mechanism.

### Actual Result
`initialize` has a try/catch that sets `isLoading: false, isInitialized: true` in `finally`, but if `getSession` fails due to network, session is null and user is forced to auth screen even if they have a valid cached session.

### Root Cause
No offline-first session checking. AsyncStorage session is not checked independently.

### Recommended Fix
Check AsyncStorage for cached session first, then validate with network. Show offline indicator if network is unavailable.

### Status
Open

---

## Bug #15

### Title
Phone number validation is India-specific but no country code picker exists

### Severity
High

### Module
Authentication / Profile

### Screen
CompleteProfileScreen, EditProfileScreen

### Platform
Both

### Steps to Reproduce
1. Try to enter a non-Indian phone number
2. Validation rejects any number not starting with 6-9 and not 10 digits

### Expected Result
Either support international numbers or clearly indicate India-only.

### Actual Result
Hardcoded validation: `if (!/^[6-9]/.test(digits)) return 'Enter a valid Indian mobile number'`. No country selector. The +91 prefix is hardcoded in UI.

### Root Cause
App designed for Indian market only but doesn't communicate this limitation.

### Recommended Fix
Either add a country code picker or clearly label the field as "Indian mobile number only".

### Status
Open

---

## Bug #16

### Title
EditExpenseScreen does not update splits when amount changes

### Severity
High

### Module
Expenses

### Screen
EditExpenseScreen

### Platform
Both

### Steps to Reproduce
1. Add an expense for ₹1000 split equally among 4 members
2. Edit the expense and change amount to ₹2000
3. Save

### Expected Result
Expense splits should be recalculated with new amount.

### Actual Result
Only `title`, `amount`, `category`, and `notes` are updated. The `expense_splits` table still has the old split amounts, causing balance calculation errors.

### Root Cause
`handleSave` in EditExpenseScreen only updates the `expenses` table, not `expense_splits`.

### Recommended Fix
Recalculate and update splits when amount changes, or show split editor in edit mode.

### Status
Open

---

## Bug #17

### Title
ExpensesTab per-person calculation assumes equal split regardless of actual split method

### Severity
High

### Module
Expenses

### Screen
ExpensesTab

### Platform
Both

### Steps to Reproduce
1. Add an expense with unequal split
2. View the expense in ExpensesTab list
3. "Your impact" amount shown is incorrect

### Expected Result
Should show actual split amount from expense_splits table.

### Actual Result
`const yourShare = item.amount / memberCount` — hardcoded equal division regardless of whether the expense used equal, unequal, or percentage split.

### Root Cause
`renderExpense` does not fetch actual split data; it approximates using total members count.

### Recommended Fix
Fetch user's actual split amount from expense_splits or include it in the expense fetch query.

### Status
Open

---

## Bug #18

### Title
No loading state shown while fetching trip members in AddExpenseScreen

### Severity
Medium

### Module
Expenses

### Screen
AddExpenseScreen

### Platform
Both

### Steps to Reproduce
1. Open Add Expense from a trip
2. On slow network, member list is empty while loading
3. User may submit expense without selecting members

### Expected Result
Show loading spinner or skeleton while members load.

### Actual Result
Members array starts empty and "Split with" section shows nothing until fetch completes. No visual loading indicator.

### Root Cause
No loading state variable for member fetch.

### Recommended Fix
Add `isFetchingMembers` state and show ActivityIndicator in the split section.

### Status
Open

---

## Bug #19

### Title
SettleUpScreen pre-fills amount from own negative balance even when settling for someone else

### Severity
Medium

### Module
Expenses / Settlement

### Screen
SettleUpScreen

### Platform
Both

### Steps to Reproduce
1. Open Settle Up without pre-selected member
2. Amount is pre-filled from user's net negative balance
3. Select a different member than who you owe the most

### Expected Result
Amount should update based on selected recipient.

### Actual Result
Amount stays pre-filled from overall net balance, not the specific debt to the selected recipient.

### Root Cause
Second `useEffect` sets amount from `myBalance.net_balance` independently of recipient selection.

### Recommended Fix
Update amount when `paidTo` changes based on the specific debt to that person from simplified debts.

### Status
Open

---

## Bug #20

### Title
Toast component uses `pointerEvents="none"` — cannot be dismissed by tapping

### Severity
Medium

### Module
UI Components

### Screen
Global (ToastContainer)

### Platform
Both

### Steps to Reproduce
1. Trigger any toast notification
2. Try to tap on it to dismiss
3. Tap passes through to underlying content

### Expected Result
Tapping toast should dismiss it immediately.

### Actual Result
`pointerEvents="none"` on container means all touches pass through. Toast can only be auto-dismissed after 3 seconds.

### Root Cause
Intentional design to not block interactions, but limits user control.

### Recommended Fix
Use `pointerEvents="box-none"` and add a Pressable wrapper to allow manual dismissal.

### Status
Open

---

## Bug #21

### Title
CreateTripScreen allows end date equal to start date — zero-duration trip

### Severity
Medium

### Module
Trips

### Screen
CreateTripScreen

### Platform
Both

### Steps to Reproduce
1. Create trip with same start and end date
2. Trip is created successfully with 0-day duration

### Expected Result
End date should be at least 1 day after start date, or same-day trips should be explicitly supported.

### Actual Result
Validation only checks `new Date(endDate) < new Date(startDate)` — equal dates pass. The progress bar on dashboard will show 100% immediately.

### Root Cause
Off-by-one in date validation.

### Recommended Fix
Either validate `endDate > startDate` or handle same-day trips gracefully in progress calculations.

### Status
Open

---

## Bug #22

### Title
Notifications real-time subscription listens to ALL notification changes — not filtered by user

### Severity
Medium

### Module
Notifications

### Screen
NotificationsScreen

### Platform
Both

### Steps to Reproduce
1. Open notifications screen
2. Another user receives a notification
3. Current user's notification list refreshes unnecessarily

### Expected Result
Should only subscribe to own notifications.

### Actual Result
Channel subscribes to `table: 'notifications'` without a filter. Every notification insert/update for ANY user triggers a refetch.

### Root Cause
Missing `filter` parameter in postgres_changes subscription.

### Recommended Fix
Add `filter: \`user_id=eq.${userId}\`` to the subscription.

### Status
Open

---

## Bug #23

### Title
KeyboardAvoidingView behavior is `undefined` on Android in App.tsx

### Severity
Medium

### Module
App Shell

### Screen
Global

### Platform
Android

### Steps to Reproduce
1. Open any screen with text input on Android
2. Keyboard may overlap input fields in some screens

### Expected Result
Keyboard should not cover input fields.

### Actual Result
`behavior={Platform.OS === 'ios' ? 'padding' : undefined}` in App.tsx means no keyboard avoidance on Android at the root level. Individual screens handle it inconsistently — some use 'height', some use 'padding', some don't handle it at all.

### Root Cause
Inconsistent keyboard handling strategy across screens.

### Recommended Fix
Set `behavior="height"` for Android at root level, or ensure every input screen handles keyboard avoidance independently.

### Status
Open

---

## Bug #24

### Title
App has `android.softwareKeyboardLayoutMode: "pan"` which conflicts with KeyboardAvoidingView

### Severity
Medium

### Module
App Configuration

### Screen
Global

### Platform
Android

### Steps to Reproduce
1. Open any screen with text input on Android
2. Keyboard behavior may be unpredictable

### Expected Result
Consistent keyboard behavior.

### Actual Result
`app.json` sets `softwareKeyboardLayoutMode: "pan"` which causes Android to pan the whole view. Combined with `KeyboardAvoidingView` using `behavior="height"` in some screens, this can cause double-adjustment or conflict.

### Root Cause
Conflicting keyboard management approaches.

### Recommended Fix
Choose one approach: either use `adjustResize` (default) with KeyboardAvoidingView, or use `pan` without KeyboardAvoidingView.

### Status
Open

---

## Bug #25

### Title
Profile phone_number and upi_id fields not typed in authStore Profile interface

### Severity
Medium

### Module
Profile

### Screen
EditProfileScreen

### Platform
Both

### Steps to Reproduce
1. Edit profile and save phone/UPI
2. Access `profile?.phone_number` or `profile?.upi_id` — TypeScript shows as undefined

### Expected Result
Profile type should include all fields used in the app.

### Actual Result
`Profile` interface in authStore only has: `id, display_name, first_name, last_name, avatar_url, home_city, travel_interests, profile_completed`. Missing: `phone_number`, `upi_id`, `upi_display_name`, `gender`, `email`.

### Root Cause
Profile interface not updated when new fields were added.

### Recommended Fix
Add missing fields to the Profile interface and the select query in `fetchProfile`.

### Status
Open

---

## Bug #26

### Title
TripDashboardScreen fetchExpenseTotals accesses store outside React lifecycle

### Severity
Medium

### Module
Trips Dashboard

### Screen
TripDashboardScreen

### Platform
Both

### Steps to Reproduce
1. Open dashboard
2. `fetchExpenseTotals` calls `useTripStore.getState().trips` directly

### Expected Result
Should use the local `trips` variable from the component.

### Actual Result
Uses `useTripStore.getState().trips` which bypasses React's reactivity. If trips haven't been set in the store yet when this runs, it gets stale data.

### Root Cause
Direct store access instead of using component state.

### Recommended Fix
Pass `trips` as parameter or use the component-level `trips` variable.

### Status
Open

---

## Bug #27

### Title
Chat message menu position calculation may place menu off-screen on small devices

### Severity
Medium

### Module
Chat

### Screen
ChatScreen

### Platform
Both

### Steps to Reproduce
1. Open chat on a small screen device (iPhone SE)
2. Long-press a message near the bottom of screen
3. Menu may appear partially off-screen

### Expected Result
Menu should always be fully visible within screen bounds.

### Actual Result
Position calculation uses `pageY + 5` for top, and only checks `if (y + 250 > height - 100)` — the 250 constant may not match actual menu height for messages with fewer options.

### Root Cause
Hardcoded menu height estimate (250px) in positioning logic.

### Recommended Fix
Use `onLayout` to measure actual menu height, or use a proper positioning library.

### Status
Open

---

## Bug #28

### Title
createTrip sends invite emails in a fire-and-forget loop — no batch processing

### Severity
Medium

### Module
Trips

### Screen
CreateTripScreen

### Platform
Both

### Steps to Reproduce
1. Create a trip and invite 5+ members
2. Each invite triggers a sequential Supabase RPC call and email function

### Expected Result
Invites should be batched or handled in parallel.

### Actual Result
`for (const email of memberEmails)` loop processes invites sequentially. If one fails, subsequent ones still run but there's no aggregated error reporting to the user.

### Root Cause
Sequential loop with individual API calls.

### Recommended Fix
Use `Promise.allSettled` for parallel invites, or create a single Edge Function that handles bulk invites.

### Status
Open

---

## Bug #29

### Title
TimelineScreen has no pull-to-refresh

### Severity
Medium

### Module
Timeline

### Screen
TimelineScreen

### Platform
Both

### Steps to Reproduce
1. Open Timeline
2. Add a new expense from another device
3. No way to refresh timeline without closing and reopening

### Expected Result
Should have pull-to-refresh or real-time subscription.

### Actual Result
No `RefreshControl` on FlatList and no real-time subscription for timeline events.

### Root Cause
Missing refresh mechanism.

### Recommended Fix
Add RefreshControl or subscribe to changes on relevant tables.

### Status
Open

---

## Bug #30

### Title
Document expiry date field accepts free-text instead of date picker

### Severity
Medium

### Module
Documents

### Screen
PersonalDocumentsScreen (AddDocModal)

### Platform
Both

### Steps to Reproduce
1. Go to My Documents → Upload
2. Try to enter expiry date
3. Field accepts any text input (e.g., "tomorrow")

### Expected Result
Should use a date picker or validate YYYY-MM-DD format.

### Actual Result
TextInput with placeholder "YYYY-MM-DD, optional" but no format validation.

### Root Cause
Missing date picker component or input validation.

### Recommended Fix
Use the same DatePickerField component used in CreateTripScreen/EditTripScreen.

### Status
Open

---

## Bug #31

### Title
AnalyticsScreen shows no data state without helpful guidance

### Severity
Medium

### Module
Analytics

### Screen
AnalyticsScreen

### Platform
Both

### Steps to Reproduce
1. New user with no trips opens Analytics tab
2. All stats show 0 or N/A
3. "Coming Soon" card is shown but no guidance on how to get data

### Expected Result
Should show an empty state with a CTA to create a trip or add expenses.

### Actual Result
Stats show "0" and "N/A" with no explanation that data requires trips/expenses.

### Root Cause
No empty state handling for zero-data scenario.

### Recommended Fix
Add an empty state with guidance: "Start by creating a trip and adding expenses to see your travel stats here."

### Status
Open

---

## Bug #32

### Title
Chat presence channel doesn't handle subscription errors

### Severity
Medium

### Module
Chat

### Screen
ChatScreen

### Platform
Both

### Steps to Reproduce
1. Open chat on spotty network
2. Presence channel may fail to subscribe
3. No error feedback to user

### Expected Result
Should gracefully handle presence subscription failures.

### Actual Result
Presence channel subscribe callback only handles 'SUBSCRIBED' status. No handling for 'TIMED_OUT', 'CHANNEL_ERROR', or 'CLOSED' states.

### Root Cause
Missing error handling for real-time subscription states.

### Recommended Fix
Add error handling and retry logic for presence channel.

### Status
Open

---

## Bug #33

### Title
Theme store initialization races with auth store — may fetch profile before auth is ready

### Severity
Medium

### Module
Theme / Auth

### Screen
Global

### Platform
Both

### Steps to Reproduce
1. Cold start the app
2. ThemeStore `initialize()` and AuthStore `initialize()` run in parallel from App.tsx and AppNavigator
3. ThemeStore tries to fetch profile preferences before auth session is established

### Expected Result
Theme initialization should wait for or not depend on auth state.

### Actual Result
`useThemeStore.initialize()` is called in App.tsx useEffect, and it calls `supabase.auth.getUser()` which may return null if auth hasn't initialized yet.

### Root Cause
Race condition between two independent store initializations.

### Recommended Fix
Initialize theme from local storage only in App.tsx, then sync with DB after auth is confirmed ready.

### Status
Open

---

## Bug #34

### Title
SplashScreen animations never stop — looping indefinitely even when screen unmounts

### Severity
Low

### Module
Authentication

### Screen
SplashScreen

### Platform
Both

### Steps to Reproduce
1. Open app
2. Splash screen shows with looping animations
3. After auth check completes, navigator switches away
4. Looping Animated.loop() calls are never stopped

### Expected Result
Animations should be cleaned up on unmount.

### Actual Result
No cleanup in useEffect return. `Animated.loop` keeps running in background memory until GC.

### Root Cause
Missing animation cleanup.

### Recommended Fix
Store animation references and call `.stop()` in useEffect cleanup.

### Status
Open

---

## Bug #35

### Title
ConnectDriveScreen OAuth flow has no deep link handling for native platforms

### Severity
Low

### Module
Cloud Storage

### Screen
ConnectDriveScreen

### Platform
iOS / Android (native)

### Steps to Reproduce
1. On native device, tap "Connect Google Drive"
2. Browser opens for OAuth
3. After authorization, redirect to `tripwise://oauth-callback` — but no handler exists

### Expected Result
App should handle the deep link callback and extract the access token.

### Actual Result
`Linking.openURL(authUrl)` opens the browser but there's no `Linking.addEventListener` or deep link handler to capture the redirect with the token.

### Root Cause
Deep link callback not implemented for native platforms.

### Recommended Fix
Implement deep link handling using `expo-linking` or `expo-auth-session` for the OAuth callback.

### Status
Open

---

## Bug #36

### Title
BottomSheet component doesn't re-hide properly when visibility toggles quickly

### Severity
Low

### Module
UI Components

### Screen
Any screen using BottomSheet

### Platform
Both

### Steps to Reproduce
1. Open a bottom sheet
2. Quickly toggle visibility (close + open rapidly)
3. Animation state may be inconsistent

### Expected Result
Smooth open/close regardless of toggle speed.

### Actual Result
`if (!visible) return null;` returns null immediately, but the closing animation (withTiming to sheetHeight) hasn't completed. This causes a visual jump.

### Root Cause
Component unmounts before closing animation completes.

### Recommended Fix
Use a mounted state similar to the OverlayScreen pattern — keep mounted until animation completes.

### Status
Open

---

## Bug #37

### Title
Support screen feedback goes to hardcoded UUID — not a real admin notification system

### Severity
Low

### Module
Support

### Screen
SupportScreen

### Platform
Both

### Steps to Reproduce
1. Go to Help & Support → Feedback
2. Submit feedback
3. Inserts a notification for user_id `00000000-0000-0000-0000-000000000001`

### Expected Result
Feedback should go to an admin dashboard or email.

### Actual Result
Feedback is stored as a notification for a hardcoded UUID. If this user doesn't exist or doesn't have a dashboard, feedback is lost.

### Root Cause
Placeholder implementation for feedback collection.

### Recommended Fix
Use a proper support ticketing Edge Function or email notification system.

### Status
Open

---

## Bug #38

### Title
AddExpenseScreen amount input accepts non-numeric characters on some keyboards

### Severity
Low

### Module
Expenses

### Screen
AddExpenseScreen

### Platform
Android

### Steps to Reproduce
1. Open Add Expense
2. Tap amount field
3. Some Android keyboards with `keyboardType="decimal-pad"` still allow comma, dash, or space

### Expected Result
Should only accept digits and one decimal point.

### Actual Result
No `onChangeText` filtering — whatever the keyboard allows is accepted. `parseFloat` at submission time handles most cases but shows NaN error for inputs like "1,000".

### Root Cause
No input sanitization on the amount field.

### Recommended Fix
Add `onChangeText` filter: `setAmount(text.replace(/[^0-9.]/g, ''))`.

### Status
Open

---

## Bug #39

### Title
Tab bar overlaps content on screens without proper bottom padding

### Severity
Low

### Module
Navigation

### Screen
TripDashboardScreen, AnalyticsScreen, ProfileScreen

### Platform
Both

### Steps to Reproduce
1. Open any tab screen
2. Scroll to the bottom of content
3. Last items may be partially hidden behind the tab bar

### Expected Result
Content should have enough bottom padding to clear the tab bar.

### Actual Result
TripDashboardScreen has `paddingBottom: 100` which works, but AnalyticsScreen has `paddingBottom: 100` and ProfileScreen has `paddingBottom: 100` — these are hardcoded and may not match actual tab bar height on all devices.

### Root Cause
Hardcoded padding instead of using safe area insets + tab bar height.

### Recommended Fix
Use `useSafeAreaInsets().bottom + layout.tabBarHeight` for dynamic bottom padding.

### Status
Open

---

## Bug #40

### Title
No max length validation on expense title and trip name fields

### Severity
Low

### Module
Expenses / Trips

### Screen
AddExpenseScreen, CreateTripScreen

### Platform
Both

### Steps to Reproduce
1. Enter a very long expense title (200+ characters)
2. Save the expense
3. Title overflows in list views

### Expected Result
Should have maxLength prop or server-side validation.

### Actual Result
No `maxLength` on title inputs. Extremely long strings could break layouts or exceed database column limits.

### Root Cause
Missing input length constraints.

### Recommended Fix
Add `maxLength={100}` on title inputs and `maxLength={200}` on description fields.

### Status
Open

---

## Bug #41

### Title
Photo lightbox has no pinch-to-zoom support

### Severity
Low

### Module
Media

### Screen
PhotosScreen (Lightbox)

### Platform
Both

### Steps to Reproduce
1. Open a trip photo in lightbox
2. Try to pinch-to-zoom

### Expected Result
Should be able to zoom into photos.

### Actual Result
Image uses `contentFit="contain"` in a static View — no gesture handling for zoom.

### Root Cause
No zoom gesture handler implemented.

### Recommended Fix
Use `react-native-gesture-handler` PinchGestureHandler or a library like `react-native-image-zoom-viewer`.

### Status
Open

---

## Bug #42

### Title
OverlayScreen in TripDashboardScreen doesn't prevent interaction with background

### Severity
Low

### Module
Navigation

### Screen
TripDashboardScreen

### Platform
Both

### Steps to Reproduce
1. Open a trip detail (overlay)
2. Swipe or interact near the edges
3. Background FlatList may receive touches during animation

### Expected Result
Background should be non-interactive when overlay is shown.

### Actual Result
OverlayScreen uses `backgroundColor: 'transparent'` and the Animated.View doesn't have a touchable backdrop. During the opening animation (opacity going 0→1), underlying content can receive touches.

### Root Cause
Missing touch-blocking backdrop on overlay.

### Recommended Fix
Add `pointerEvents={visible ? 'auto' : 'none'}` and a full-screen Pressable backdrop.

### Status
Open

---

## UI Improvements

1. **Chat Screen**: Add message read receipts (double tick) for better communication feedback
2. **Trip Cards**: Add cover image support — currently only shows emoji type indicator
3. **Expense Category Icons**: Use actual SVG icons instead of emoji for consistent sizing across platforms
4. **Profile Screen**: Add avatar edit button directly on the profile page (currently requires going to Settings → Edit Profile)
5. **Settlement Flow**: Add a visual stepper showing the settlement status progression (Initiated → Pending → Confirmed)
6. **Dark Mode**: The auth screens use hardcoded dark colors (`#080C16`) — they won't adapt if user switches to light mode before completing auth
7. **Empty States**: Several empty states lack illustrations — add Lottie animations or SVG illustrations for polish
8. **Tab Bar**: Add haptic feedback on tab switch (using `expo-haptics`)
9. **Expense List**: Add swipe-to-delete gesture instead of small trash icon
10. **Trip Detail**: Add a trip cover photo/banner section at the top
11. **Search**: Add debouncing to search inputs (TripDashboardScreen, ChatScreen) — currently fires on every keystroke
12. **Loading States**: Replace plain ActivityIndicator with skeleton loaders on all list screens for a smoother perceived loading experience
13. **Date Display**: Use relative dates ("2 days ago") for recent items instead of absolute dates
14. **Notifications**: Add notification grouping by trip to reduce clutter
15. **Settlement History**: Add filter by status (pending, confirmed, disputed)

---

## Performance Improvements

1. **FlatList Optimization**: Add `getItemLayout` to FlatLists with fixed-height items (notifications, expenses) to avoid measurement cost
2. **Image Caching**: expo-image handles caching, but pre-load trip card images with `Image.prefetch` for smoother scrolling
3. **Realtime Subscriptions**: TripDashboardScreen subscribes to `trips`, `trip_members`, `notifications`, `expenses`, `expense_splits`, and `settlements` simultaneously — consolidate into fewer channels
4. **Memoization**: Add `React.memo` to pure list item components (`renderTripCard`, `renderExpense`, `renderMessage`) to prevent unnecessary re-renders
5. **Bundle Size**: Remove `react-native-web` and `react-dom` from production if not targeting web, or use tree-shaking
6. **Splash Screen**: Replace JS-animated splash with native `expo-splash-screen` for faster perceived cold start
7. **Store Subscriptions**: Components subscribe to entire store slices — use selectors to minimize re-renders (e.g., `useExpenseStore(s => s.expenses)` instead of destructuring everything)
8. **Batch API Calls**: `fetchExpenseTotals` makes 2 parallel queries for all trips — use a single RPC function to reduce round-trips
9. **Lazy Loading**: Load Timeline, Chat, and Photos screens lazily since they're in modals — use `React.lazy` + Suspense
10. **Debounce Real-time Handlers**: Real-time subscription handlers immediately call `fetchTrips()` / `fetchExpenses()` on every change — add debouncing to avoid rapid consecutive fetches

---

## Security Recommendations

1. **OAuth Tokens**: Move Google Drive OAuth to server-side (Edge Function) using authorization code flow with PKCE. Never store raw access tokens in a client-readable database table.
2. **Client ID Exposure**: Move `GOOGLE_CLIENT_ID` to environment variables.
3. **Rate Limiting**: No client-side rate limiting on OTP requests — user can spam "Resend" after cooldown expires. Add server-side rate limiting via Supabase Edge Function.
4. **Input Sanitization**: Chat messages and notes have no XSS sanitization — if rendered in a WebView or on web, malicious content could execute. Sanitize on display.
5. **Secure Storage**: Auth tokens are in AsyncStorage which is not encrypted on Android. Use `expo-secure-store` for sensitive tokens.
6. **Console Logging**: Multiple `console.log` statements in production code (tripStore, chatStore) expose internal data. Remove or gate behind `__DEV__`.
7. **Drive File Permissions**: Uploaded Drive files are made publicly readable (`type: 'anyone'`). This means anyone with the file link can view it. Consider using `type: 'domain'` or shared links with expiry.
8. **Delete Confirmation**: The "Delete for Everyone" chat feature permanently deletes from DB — no soft-delete or audit trail for potential abuse cases.
9. **RLS Bypass**: Multiple RPC functions (`get_profiles_by_ids`, `find_profile_by_email`, `get_trip_members`) bypass RLS — ensure these have proper security definer/invoker settings.
10. **Session Fixation**: `onAuthStateChange` listener doesn't validate that the new session belongs to the expected user — in multi-device scenarios this could cause confusion.

---

## Accessibility Improvements

1. **Missing accessibilityRole**: Most TouchableOpacity buttons lack `accessibilityRole="button"` — screen readers won't announce them as buttons
2. **Missing accessibilityLabel**: Many icon-only buttons (trash, edit, close) lack descriptive labels
3. **Color Contrast**: Some text colors in dark mode (`rgba(255,255,255,0.22)` placeholder, `rgba(255,255,255,0.35)` tagline) don't meet WCAG AA 4.5:1 contrast ratio
4. **Focus Management**: After modal close, focus doesn't return to the triggering element
5. **Animated Content**: No `accessibilityLiveRegion` on Toast component — screen readers won't announce toast messages
6. **Touch Targets**: Some action buttons (trash icon in ExpensesTab at 14px) are below the 44x44pt minimum touch target size
7. **Form Labels**: Input fields use visual labels but lack `accessibilityLabel` prop matching the label text
8. **Loading States**: ActivityIndicators don't have `accessibilityLabel="Loading"` for screen reader context
9. **Semantic Grouping**: Card components lack `accessibilityRole="group"` or descriptive headings for screen reader navigation
10. **Reduce Motion**: Animations don't respect `AccessibilityInfo.isReduceMotionEnabled()` — users with vestibular disorders may be affected by frequent animations

---

## Production Readiness Checklist

| Feature | Status | Notes |
|---------|--------|-------|
| Authentication (OTP) | ⚠️ Needs Fixes | Missing input validation, no offline handling |
| Profile Completion | ✅ Ready | Works as expected |
| Trip Creation | ✅ Ready | Minor: date validation edge case |
| Trip Dashboard | ✅ Ready | Minor: useMemo reactivity concern |
| Trip Detail | ⚠️ Needs Fixes | Incomplete cascade deletion |
| Member Management | ✅ Ready | Works well |
| Add Expense | ✅ Ready | Minor: no loading for members |
| Edit Expense | ❌ Not Ready | Does not update splits |
| Expense List | ⚠️ Needs Fixes | Incorrect per-person calculation, no delete confirmation |
| Balance Calculation | ✅ Ready | Server-side RPC handles correctly |
| Settlement (Manual) | ✅ Ready | Works as expected |
| Settlement (UPI) | ⚠️ Needs Fixes | Deep link not handled on native |
| Settlement Confirmation | ✅ Ready | Minor: stale balance display |
| Chat | ⚠️ Needs Fixes | Input padding, clipboard import, scroll issues |
| Notifications | ⚠️ Needs Fixes | Unfiltered real-time subscription |
| Media Upload | ❌ Not Ready | Token refresh broken, Drive flow incomplete on native |
| Google Drive Integration | ❌ Not Ready | No refresh tokens, no native deep link, security issues |
| Documents | ✅ Ready | Minor: expiry date validation |
| Analytics | ✅ Ready | Limited data but functional |
| Profile/Settings | ✅ Ready | Minor: incomplete profile type |
| Theme/Dark Mode | ✅ Ready | Works well |
| Offline Support | ❌ Not Ready | No offline detection, no cached data, no retry mechanisms |
| Push Notifications | ❌ Not Ready | Not implemented (no expo-notifications setup) |
| Deep Linking | ❌ Not Ready | Scheme defined but no route handling |
| Error Boundaries | ❌ Not Ready | No React Error Boundary wrapping the app |
| Crash Reporting | ❌ Not Ready | No Sentry/Bugsnag/Crashlytics integration |
