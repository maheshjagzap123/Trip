# TripWise — Complete Application Flow & Feature Documentation

## Purpose

TripWise is a collaborative travel planning and expense management mobile application built for groups traveling together. It solves the common pain points of:

- **Splitting expenses fairly** among trip members with real-time balance tracking
- **Settling debts** via UPI or manual methods with a confirmation workflow
- **Coordinating trip logistics** through in-app chat, timeline, and shared media
- **Storing travel documents** securely (passports, licenses, visas)
- **Backing up trip photos** to Google Drive for free cloud storage

The app targets the Indian travel market with UPI-first payments, INR currency, and Indian phone number support.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.81 + Expo SDK 54 |
| Language | TypeScript 5.9 |
| Navigation | React Navigation (Stack + Bottom Tabs) |
| State Management | Zustand 5 |
| Backend | Supabase (Auth, Database, Storage, Realtime, Edge Functions) |
| Styling | StyleSheet + expo-linear-gradient |
| Animations | react-native-reanimated 4 + Animated API |
| Image Handling | expo-image + expo-image-picker |
| Icons | lucide-react-native |
| Date Utilities | date-fns |
| Forms | react-hook-form + zod (installed, partially used) |

---

## Application Architecture

```
App.tsx
├── SafeAreaProvider
├── GestureHandlerRootView
├── KeyboardAvoidingView
├── StatusBar
├── AppNavigator (routing logic)
│   ├── [No Session] → AuthStack
│   │   ├── WelcomeScreen
│   │   ├── LoginScreen
│   │   └── OtpVerificationScreen
│   ├── [Session + Profile Incomplete] → CompleteProfileScreen
│   └── [Session + Profile Complete] → MainTabs
│       ├── TripsTab → TripDashboardScreen
│       ├── AnalyticsTab → AnalyticsScreen
│       └── ProfileTab → ProfileScreen
└── ToastContainer (global notifications)
```

---

## Complete User Flow

### 1. Cold Start & Splash

**Screen:** `SplashScreen`

**Flow:**
1. App launches → displays animated splash with TripWise logo
2. `AuthStore.initialize()` runs in parallel with `ThemeStore.initialize()`
3. Checks Supabase session from AsyncStorage
4. If valid session found → fetches user profile
5. Routing decision made based on auth + profile state

**Features Implemented:**
- ✅ Animated logo with spring entrance
- ✅ Pulsing loading indicator
- ✅ Ambient floating orb background animations
- ✅ Version number display
- ✅ Theme-aware (always dark for splash)

---

### 2. Authentication Flow

#### 2a. Welcome Screen

**Screen:** `WelcomeScreen`

**Flow:**
1. First-time or logged-out user sees the welcome page
2. Three feature cards animate in with staggered spring
3. User taps "Get Started" → navigates to Login

**Features Implemented:**
- ✅ Animated feature cards (Plan Trips, Split Expenses, Travel Together)
- ✅ Gradient CTA button
- ✅ Ambient orb animations
- ✅ "Free to use · No credit card required" footer

#### 2b. Login Screen

**Screen:** `LoginScreen`

**Flow:**
1. User toggles between Email or Phone login method
2. Enters identifier (email address or phone number)
3. Taps "Send Code" → Supabase sends OTP
4. Navigates to OTP verification screen
5. Terms of Service and Privacy Policy links open full-screen modals

**Features Implemented:**
- ✅ Email / Phone toggle with animated state
- ✅ Animated border color on input focus
- ✅ Gradient send button
- ✅ Loading state during OTP send
- ✅ Error handling with Alert
- ✅ Terms of Service modal (full legal content)
- ✅ Privacy Policy modal (full legal content)
- ✅ Keyboard avoiding behavior
- ✅ Glass-card visual design

#### 2c. OTP Verification Screen

**Screen:** `OtpVerificationScreen`

**Flow:**
1. Displays 6 individual digit boxes for OTP entry
2. Hidden TextInput captures keyboard input
3. User enters 6-digit code → auto-submits or taps "Verify Code"
4. On success → Supabase session established → auth listener fires
5. App navigates to CompleteProfile or MainTabs based on profile state
6. Resend code with 60-second cooldown timer

**Features Implemented:**
- ✅ 6-digit OTP input with individual styled boxes
- ✅ Animated cursor indicator on active box
- ✅ Shake animation on error
- ✅ Resend cooldown timer (60s countdown)
- ✅ Auto-focus on mount
- ✅ Back button navigation
- ✅ Loading state during verification
- ✅ Error message display

---

### 3. Profile Completion (Onboarding)

**Screen:** `CompleteProfileScreen`

**Flow:**
1. First-time users after OTP verification land here
2. User fills: First Name (required), Last Name, Phone Number (required), Home City, Gender, Travel Interests
3. Taps "Save & Continue" → updates Supabase profile → sets `profile_completed: true`
4. App navigates to MainTabs dashboard

**Features Implemented:**
- ✅ First name + Last name fields
- ✅ Phone number with +91 prefix and 10-digit validation
- ✅ Home city field
- ✅ Gender chips (Male, Female, Other)
- ✅ Travel interests multi-select chips (10 options with emojis)
- ✅ Form validation with error messages
- ✅ Gradient save button with loading state
- ✅ Animated entrance (fade + slide)
- ✅ Gradient background consistent with auth theme

---

### 4. Main Dashboard (Trips Tab)

**Screen:** `TripDashboardScreen`

**Flow:**
1. Greeting header with user's first name + time-of-day greeting
2. Notification bell with unread badge
3. Stats banner showing: Total Trips, Upcoming, My Total Spend
4. Trip Invitations section (if any pending)
5. Search bar + status filter chips (Active, Planning, Completed, All)
6. Trip cards list with quick actions
7. FAB button to create new trip

**Features Implemented:**
- ✅ Dynamic greeting (Good morning/afternoon/evening)
- ✅ Notification bell with unread count badge
- ✅ Gradient stats banner (trips count, upcoming, spend)
- ✅ Trip invitation cards with Accept/Decline actions
- ✅ Search trips by name/destination
- ✅ Filter by status (Active, Planning, Completed, All)
- ✅ Trip cards showing: emoji type, status pill, name, destination, dates, trip total, my share
- ✅ Active trip progress bar (% complete, days left)
- ✅ Quick action buttons on each card (+ Expense, Chat)
- ✅ Pull-to-refresh
- ✅ FAB for creating new trip
- ✅ Real-time subscriptions (trips, trip_members, expenses, settlements)
- ✅ Empty state with illustration
- ✅ Animated overlay screens for all sub-screens

---

### 5. Trip Creation

**Screen:** `CreateTripScreen`

**Flow:**
1. User taps FAB → CreateTripScreen opens as overlay
2. Fills: Trip Name (required), Destination, Start Date, End Date, Trip Type, Description
3. Optionally invites members by email
4. Taps "Create Trip" → creates trip → adds creator as admin → invites members
5. Returns to dashboard with new trip visible

**Features Implemented:**
- ✅ Trip name input (required)
- ✅ Destination input
- ✅ Native date pickers for start/end dates (platform-specific)
- ✅ Trip type selector chips (Friends, Family, Couple, Solo, Office, Adventure, Pilgrimage)
- ✅ Description textarea
- ✅ Member email invite with add/remove
- ✅ Email validation
- ✅ Prevents adding self or duplicates
- ✅ Date validation (end must be after start)
- ✅ Gradient create button with loading state
- ✅ Keyboard avoiding layout
- ✅ Android back button handling
- ✅ Member invitations via RPC + email Edge Function (fire-and-forget)

---

### 6. Trip Detail

**Screen:** `TripDetailScreen`

**Flow:**
1. User taps a trip card → TripDetailScreen opens as overlay
2. Shows trip info card (name, destination, dates, type, creator, description)
3. Quick actions grid: Expenses, Photos, Chat, Timeline
4. Members section with invite capability
5. Admin actions: Edit Trip, Delete Trip
6. Member action: Leave Trip

**Features Implemented:**
- ✅ Trip info card with all details
- ✅ 2×2 action grid (Expenses, Photos, Chat, Timeline)
- ✅ Member list with role badges (Admin, Member)
- ✅ Inline invite by email
- ✅ Remove member (admin only)
- ✅ Edit trip button (admin only) → EditTripScreen modal
- ✅ Delete trip with cascade cleanup (admin only)
- ✅ Leave trip (non-admin)
- ✅ Skeleton loading state
- ✅ Full-screen modals for each action
- ✅ View All Members → MemberListScreen

---

### 7. Trip Editing

**Screen:** `EditTripScreen`

**Flow:**
1. Admin taps pencil icon → EditTripScreen opens
2. Pre-filled with current trip data
3. User modifies fields and saves

**Features Implemented:**
- ✅ Pre-filled form with current trip data
- ✅ All fields editable (name, destination, dates, type, description)
- ✅ Native date picker
- ✅ Validation (name required, dates required, end after start)
- ✅ Save with loading state

---

### 8. Member Management

**Screen:** `MemberListScreen`

**Flow:**
1. Shows all trip members with stats (Active, Pending, Admins count)
2. Admin can invite by email, promote/demote, remove members
3. Pull-to-refresh for updated data

**Features Implemented:**
- ✅ Member list with avatar, name, role badge, status
- ✅ Stats bar (active, pending, admins)
- ✅ Invite by email input
- ✅ Expandable action menu per member (admin only)
- ✅ Promote to admin / Demote to member
- ✅ Remove member with confirmation
- ✅ Cancel pending invitation
- ✅ Pull-to-refresh
- ✅ Sorted: admins first, then active, then pending
- ✅ "(You)" indicator for current user

---

### 9. Expense Management

#### 9a. Expenses Screen

**Screen:** `ExpensesScreen` → `ExpensesTab`

**Flow:**
1. Opens from Trip Detail → Expenses action
2. Two tabs: Expenses (list) and Balances (who owes whom)
3. Summary card shows Total Spent and Your Balance
4. FAB to add new expense

**Features Implemented:**
- ✅ Gradient summary card (total spent, your balance with trend icon)
- ✅ Tab toggle (Expenses / Balances)
- ✅ Expense list with category emoji, title, paid by, date, per-person impact
- ✅ Delete expense (creator/payer only)
- ✅ Balance view with simplified debts algorithm
- ✅ "You need to pay" section with Settle Up button per person
- ✅ "You will receive" section
- ✅ "All settled up" celebration state
- ✅ In-progress settlements with status badges
- ✅ Settlement detail modal on tap
- ✅ FAB for adding expense
- ✅ Real-time subscription for expenses + settlements
- ✅ Empty state

#### 9b. Add Expense

**Screen:** `AddExpenseScreen`

**Flow:**
1. User enters: Amount, Title, Category, Paid By, Split Type, Split With, Notes
2. Equal split auto-calculates per-person amount
3. Unequal split shows individual amount inputs with total validation
4. Saves expense + creates split records in Supabase

**Features Implemented:**
- ✅ Large amount input (centered, prominent)
- ✅ Title input (required)
- ✅ Category selector (10 categories with emojis)
- ✅ "Paid by" selector (all active trip members)
- ✅ Split type: Equal / Unequal
- ✅ Split with: checkbox list of members
- ✅ Equal split: auto-calculated per-person display
- ✅ Unequal split: individual amount inputs with total validation
- ✅ Notes field (optional)
- ✅ Validation (title, amount > 0, at least 1 split member, unequal totals match)
- ✅ Loading state on save

#### 9c. Edit Expense

**Screen:** `EditExpenseScreen`

**Flow:**
1. User edits: Amount, Title, Category, Notes
2. Saves updated fields to expenses table

**Features Implemented:**
- ✅ Pre-filled form from existing expense
- ✅ Edit amount, title, category, notes
- ✅ Loading/fetching states
- ✅ Validation

#### 9d. Expense Detail

**Screen:** `ExpenseDetailScreen`

**Flow:**
1. Shows full expense details with split breakdown

**Features Implemented:**
- ✅ Amount hero display
- ✅ Info card: category, paid by, date, split method, notes
- ✅ Split breakdown with per-person amounts
- ✅ Edit/Delete actions (owner only)
- ✅ "(You)" indicators

---

### 10. Settlement Flow

#### 10a. Settle Up Screen

**Screen:** `SettleUpScreen`

**Flow:**
1. User selects recipient (or pre-selected from balance row)
2. Amount pre-filled from debt calculation
3. Two paths: Pay via UPI or Record Manually
4. UPI: Opens UPI app → returns → "I Have Paid" sheet → pending confirmation
5. Manual: Select method (Cash, Bank Transfer, Other) → record → pending confirmation

**Features Implemented:**
- ✅ Recipient selector (trip members except self)
- ✅ Pre-selected recipient and amount from balance view
- ✅ UPI ID display when recipient has one
- ✅ "No UPI ID" warning when recipient hasn't added one
- ✅ Amount input (editable for partial payments)
- ✅ Notes field
- ✅ "Pay via UPI" button → launches UPI app with deep link
- ✅ "I Have Paid" bottom sheet (appears when returning from UPI app)
- ✅ Transaction reference input (optional)
- ✅ AppState listener for UPI app return detection
- ✅ Manual settlement: method selector, transaction ref, record button
- ✅ Settlement history with status badges
- ✅ Settlement detail modal on history card tap
- ✅ Cancel UPI flow option

#### 10b. Settlement Detail

**Screen:** `SettlementDetailScreen`

**Flow:**
1. Shows full settlement details with timeline
2. Recipient can: Confirm ("Yes, I received it") or Dispute ("I didn't receive it")
3. Payer sees waiting state

**Features Implemented:**
- ✅ Amount card with status badge
- ✅ Details card: method, transaction ref, notes
- ✅ Timeline card: initiated, paid claimed, confirmed/disputed timestamps
- ✅ Dispute reason display (if rejected)
- ✅ Confirm button (recipient only, pending_confirmation status)
- ✅ Dispute button → opens DisputeBottomSheet
- ✅ "Waiting for confirmation" card (payer view)
- ✅ Real-time subscription for status changes
- ✅ Android back button handling

#### 10c. Dispute Bottom Sheet

**Screen:** `DisputeBottomSheet`

**Flow:**
1. Recipient describes why they didn't receive payment
2. Optionally attaches a screenshot
3. Submits dispute → status changes to "rejected"

**Features Implemented:**
- ✅ Reason text input (min 10 characters validation)
- ✅ Screenshot attachment via image picker
- ✅ Screenshot upload to Supabase Storage
- ✅ Submit with loading state
- ✅ Modal with backdrop dismiss
- ✅ Keyboard avoiding behavior

---

### 11. Chat

**Screen:** `ChatScreen`

**Flow:**
1. Real-time group chat per trip
2. Send text messages with reply-to support
3. Pin/unpin messages
4. Delete for self or delete for everyone
5. Search messages
6. Typing indicators via Supabase Presence

**Features Implemented:**
- ✅ Real-time message delivery via Supabase channel
- ✅ Gradient bubbles for own messages, bordered for others
- ✅ Sender name display for group context
- ✅ Timestamp on each message
- ✅ Date separators (Today, Yesterday, date)
- ✅ Reply-to: tap reply → shows preview → sends with reference
- ✅ Reply preview in message bubble
- ✅ Pin/Unpin messages
- ✅ Pinned message banner at top
- ✅ Message context menu (Reply, Copy, Pin, Delete for Me, Delete for Everyone)
- ✅ Delete for Me (soft delete)
- ✅ Delete for Everyone (hard delete, own messages only)
- ✅ Typing indicator with animated dots
- ✅ Presence channel for typing state
- ✅ Search bar with result count
- ✅ Emoji picker (28 common emojis)
- ✅ Message count in header
- ✅ Auto-scroll on new messages
- ✅ Empty state
- ✅ 2000 character max length
- ✅ Submit on Enter (web)

---

### 12. Trip Timeline

**Screen:** `TimelineScreen`

**Flow:**
1. Shows chronological feed of trip activity (expenses, photos, notes)
2. Grouped by date
3. User can add notes via modal

**Features Implemented:**
- ✅ Timeline events grouped by date
- ✅ Event types: expense (green), note (purple), photo (amber)
- ✅ Event card: title, subtitle, time, user
- ✅ Add Note modal (title + content)
- ✅ Empty state with guidance text
- ✅ Android back button handling
- ✅ Data from `get_trip_timeline` RPC

---

### 13. Trip Photos / Media

**Screen:** `PhotosScreen`

**Flow:**
1. Displays trip photos in a grid grouped by uploader
2. Upload requires Google Drive connection
3. Lightbox for full-screen viewing with navigation
4. Delete photos (uploader only)

**Features Implemented:**
- ✅ Photo grid (3 columns) grouped by uploader
- ✅ User section headers with avatar and photo count
- ✅ Upload button → checks Drive connection → image picker
- ✅ Multi-image selection (up to 10)
- ✅ Upload progress bar
- ✅ Google Drive integration: creates TripWise/TripName folder structure
- ✅ Makes uploaded files publicly viewable for trip members
- ✅ Lightbox modal: full-screen view, prev/next navigation, metadata
- ✅ Delete photo (from Drive + DB)
- ✅ "Connect Drive" prompt if not connected
- ✅ Real-time subscription for new uploads
- ✅ Empty state with Drive connection CTA
- ✅ Fallback error handling for expired Drive tokens

---

### 14. Notifications

**Screen:** `NotificationsScreen`

**Flow:**
1. Shows all notifications for the user (invites, messages, expenses, settlements)
2. Mark as read on tap
3. Navigate to relevant trip on tap
4. Swipe to delete
5. Mark all as read / Clear all

**Features Implemented:**
- ✅ Notification list with type-specific icons
- ✅ Unread indicator (blue dot)
- ✅ Unread background highlight
- ✅ Relative timestamps ("2 hours ago")
- ✅ Swipe-to-delete with animated action
- ✅ Mark as read on tap
- ✅ Navigate to trip on tap (if trip_id in data)
- ✅ "Mark all read" button
- ✅ "Clear all" with confirmation
- ✅ Real-time subscription for new notifications
- ✅ Empty state
- ✅ Notification types: trip_invite, trip_accepted, new_message, expense_added, settlement_confirm_request, settlement_confirmed, settlement_disputed

---

### 15. Analytics

**Screen:** `AnalyticsScreen`

**Flow:**
1. Shows aggregated travel stats from RPC function
2. Pull-to-refresh
3. Re-fetches on tab focus

**Features Implemented:**
- ✅ Stats grid: Total Trips, Total Spent, Total Paid, Top Category
- ✅ Gradient icon backgrounds per stat
- ✅ Pull-to-refresh
- ✅ Re-fetch on tab focus (`useFocusEffect`)
- ✅ "More Insights Coming" placeholder card
- ✅ Data from `get_user_analytics` RPC

---

### 16. Profile & Settings

#### 16a. Profile Screen

**Screen:** `ProfileScreen`

**Flow:**
1. Shows user avatar, name, city
2. Info card with email and city
3. Travel interests chips
4. Settings button → opens Settings page

**Features Implemented:**
- ✅ Avatar with gradient ring (image or initials)
- ✅ Display name and home city
- ✅ Email info card
- ✅ Travel interests chips
- ✅ Settings button

#### 16b. Settings Page

**Screen:** `SettingsPage` (modal from ProfileScreen)

**Flow:**
1. Theme selection (Light, Dark, System)
2. Account actions: Edit Profile, My Documents, Cloud Storage, Privacy Policy, Terms, Help & Support
3. App version display
4. Sign Out
5. Delete Account

**Features Implemented:**
- ✅ Theme toggle (Light/Dark/System) with icon + label
- ✅ Theme persisted to AsyncStorage + Supabase profile preferences
- ✅ System theme listener
- ✅ Account section with navigation rows
- ✅ App version display
- ✅ Sign out with confirmation
- ✅ Delete account (soft-delete with 30-day recovery note)
- ✅ All sub-screens as full-screen modals

#### 16c. Edit Profile

**Screen:** `EditProfileScreen`

**Flow:**
1. Edit: avatar, name, city, phone, UPI ID, UPI display name, interests
2. Avatar upload to Supabase Storage
3. UPI ID validation (format: name@provider)

**Features Implemented:**
- ✅ Avatar picker with camera icon overlay
- ✅ Avatar upload to `avatars` bucket with cache-busting URL
- ✅ First name (required) + Last name
- ✅ Home city
- ✅ Phone number with +91 and validation
- ✅ UPI ID input with format validation
- ✅ UPI display name (required if UPI ID filled)
- ✅ Travel interests multi-select
- ✅ Save with loading state

---

### 17. Personal Documents

**Screen:** `PersonalDocumentsScreen`

**Flow:**
1. List of uploaded identity documents
2. Upload new document (image from gallery)
3. Delete documents

**Features Implemented:**
- ✅ Document list with icon, title, category, date, expiry
- ✅ Expiry date highlighting (red if expired)
- ✅ Upload modal: title, category selector (7 types), expiry date, file picker
- ✅ Category chips: Passport, Driving License, PAN Card, Aadhaar Card, Visa, Insurance, Other
- ✅ Upload to Supabase Storage (`documents` bucket)
- ✅ Delete with confirmation (removes from storage + DB)
- ✅ Empty state with upload CTA
- ✅ Loading state

---

### 18. Google Drive Integration

**Screen:** `ConnectDriveScreen`

**Flow:**
1. Shows connection status
2. Connect → OAuth popup/browser → save token → create TripWise folder
3. Disconnect → removes connection record

**Features Implemented:**
- ✅ Connection status display with email
- ✅ "How it works" info card
- ✅ Connect button → Google OAuth (implicit flow)
- ✅ Saves access token + provider email to `cloud_connections` table
- ✅ Creates "TripWise" root folder in Drive
- ✅ Disconnect with confirmation
- ✅ Loading states
- ✅ Web popup flow for OAuth

---

### 19. Help & Support

**Screen:** `SupportScreen`

**Flow:**
1. Three tabs: FAQ, Contact, Feedback
2. FAQ with expandable Q&A items
3. Contact form (subject + message)
4. Feedback form (star rating + text)

**Features Implemented:**
- ✅ Tab toggle (FAQ / Contact / Feedback)
- ✅ 6 FAQ items with expand/collapse
- ✅ Contact form with subject + message
- ✅ Feedback form with 5-star rating + text
- ✅ Submit to notifications table (for admin review)
- ✅ Success confirmations

---

## State Management (Zustand Stores)

| Store | Purpose |
|-------|---------|
| `authStore` | Session, user, profile, sign in/out, profile fetch |
| `themeStore` | Light/Dark/System mode, persist to AsyncStorage + DB |
| `tripStore` | Trips CRUD, invitations, real-time subscriptions |
| `expenseStore` | Expenses, balances, settlements, UPI flow, real-time |
| `chatStore` | Messages, send/delete/pin, real-time subscription |
| `mediaStore` | Photos, Google Drive upload/delete, real-time |

---

## Real-time Features (Supabase Channels)

| Channel | Tables Watched | Purpose |
|---------|---------------|---------|
| `trip-updates` | trips, trip_members, notifications | Dashboard auto-refresh |
| `dashboard-expenses` | expenses, expense_splits, settlements | Dashboard spend totals |
| `expenses-{tripId}` | expenses, settlements | Expense tab auto-refresh |
| `chat-{tripId}` | messages (INSERT, UPDATE) | Live chat messages |
| `typing-{tripId}` | Presence | Typing indicators |
| `media-{tripId}` | media | Photo gallery auto-refresh |
| `settlement-detail-{id}` | settlements | Settlement status live update |
| `my-notifications` | notifications | Notification list refresh |

---

## Component Library

| Component | Purpose |
|-----------|---------|
| `AnimatedPressable` | Spring-based scale animation on press |
| `BottomSheet` | Reanimated bottom sheet with backdrop |
| `DisputeBottomSheet` | Settlement dispute form with screenshot |
| `PaymentStatusBadge` | Color-coded settlement status pill |
| `ScreenWrapper` | Safe area + status bar + theme wrapper |
| `Toast` / `ToastContainer` | Global toast notifications (success/error/info/warning) |
| `Button` | Primary/Secondary/Ghost/Danger variants with gradient |
| `Input` | Animated border input with label and error |
| `Card` | Themed card with variant styles |
| `Badge` | Color-coded label badge |
| `Avatar` | Initials or image avatar |
| `Skeleton` | Shimmer loading placeholder |
| `EmptyState` | Centered empty illustration + CTA |
| `ScreenHeader` | Standard screen header with back button |
| `StatCard` | Stats display with icon and gradient background |
| `Chip` | Selectable filter/tag chip |
| `FAB` | Floating action button with gradient |

---

## Theme System

- **Dual theme**: Light and Dark with full color palette
- **Responsive typography**: Scales based on screen width (base 390px iPhone 14)
- **8pt spacing grid**: xxs(4) through xxxl(64)
- **Platform shadows**: iOS (shadowColor) / Android (elevation) / Web (boxShadow)
- **Animation presets**: Springs (button, card, page, bouncy, gentle), easings, entering/exiting presets

---

## Database Tables (Inferred from Code)

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles with preferences |
| `trips` | Trip records |
| `trip_members` | Membership + roles + status |
| `expenses` | Individual expense records |
| `expense_splits` | Per-user split amounts |
| `settlements` | Payment records between users |
| `messages` | Chat messages |
| `media` | Photo/video metadata |
| `trip_notes` | Timeline notes |
| `documents` | Personal document metadata |
| `notifications` | Push notification records |
| `cloud_connections` | OAuth connections (Google Drive) |

---

## RPC Functions Used

| Function | Purpose |
|----------|---------|
| `get_profiles_by_ids` | Batch fetch profiles (bypasses RLS) |
| `find_profile_by_email` | Lookup user by email for invites |
| `get_trip_members` | Fetch trip members with metadata |
| `compute_trip_balances` | Server-side balance calculation |
| `get_trip_timeline` | Aggregated timeline events |
| `get_user_analytics` | User-level spending analytics |

---

## Build & Deployment

- **Development**: `expo start` with development client
- **Preview**: APK build via EAS (`eas build --profile preview`)
- **Production**: App Bundle via EAS (`eas build --profile production`)
- **OTA Updates**: Expo Updates configured with channels (development, preview, production)
- **Runtime Version Policy**: `appVersion` — new native build needed for native changes only
