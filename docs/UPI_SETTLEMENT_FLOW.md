# TripWise — UPI Settlement Flow
## Design Document & Implementation Plan
### Version 2.0 — Updated Requirements

---

## 1. What We Are Building

TripWise already calculates who owes whom. This feature adds a real UPI payment flow on top of that with these hard rules:

- **Mobile number is required** in every user profile — validated at signup completion and edit profile
- **UPI ID is optional at signup** but the app blocks receiving a payment if it is not set — the payer sees a clear message
- The app opens the payer's **own UPI app** via a generic deep link — no specific app is forced (GPay, PhonePe, Paytm, any UPI app works)
- After the payer returns to the app they must tap **"I Have Paid"** — the app never auto-marks anything as settled
- Status becomes `pending_confirmation` — the recipient gets a notification to **Confirm** or **Dispute**
- Both sides see the live status at all times
- Every settlement has a **timestamp trail** and an **optional transaction reference** the payer can enter

---

## 2. The 5 Settlement Statuses

```
pending  ──►  initiated  ──►  pending_confirmation  ──►  confirmed
                                        │
                                        └──►  rejected  (disputed)
```

| Status | Who Sets It | What It Means |
|---|---|---|
| `pending` | System | Split exists, no payment started yet |
| `initiated` | Payer | "Pay via UPI" tapped, UPI app opened |
| `pending_confirmation` | Payer | "I Have Paid" tapped, waiting for recipient |
| `confirmed` | Recipient | Recipient confirmed money received — balance clears |
| `rejected` | Recipient | Recipient disputed — balance stays, payer notified |

---

## 3. Profile Rules — Phone & UPI

### 3.1 Mobile Number (Required)

Mobile number is **mandatory** for every user. It must be collected and validated at:

1. `CompleteProfileScreen` — cannot proceed without it
2. `EditProfileScreen` — cannot save without it

**Validation:**
- Must be exactly 10 digits
- Must start with 6, 7, 8, or 9 (Indian mobile)
- No spaces, dashes, or country code prefix allowed in the stored value
- Display with `+91` prefix in the UI but store only the 10-digit number

**Error messages:**
- Empty → `"Mobile number is required"`
- Wrong length → `"Enter a valid 10-digit mobile number"`
- Wrong prefix → `"Enter a valid Indian mobile number"`

---

### 3.2 UPI ID (Optional at Signup, Required to Receive)

UPI ID is **not required** when completing the profile. The user can skip it.

However, when **someone tries to pay that user**, the app checks if the recipient has a UPI ID. If not:

- The "Pay via UPI" button is **not shown**
- A clear inline message is shown to the payer:

```
┌─────────────────────────────────────────────────────┐
│  ⚠️  Rahul hasn't added their UPI ID on TripWise    │
│  They need to add it in their profile before you    │
│  can pay them via UPI.                              │
│                                                     │
│  You can still record this as a manual settlement.  │
└─────────────────────────────────────────────────────┘
```

The payer can only use **"Record Manually"** in this case.

**UPI ID Validation (when the user does add it):**
- Must match pattern: `something@something` (e.g. `rahul@upi`, `9876543210@paytm`)
- No spaces allowed
- Case-insensitive, stored as lowercase
- Error: `"Enter a valid UPI ID (e.g. name@upi)"`

**UPI Display Name (required when UPI ID is set):**
- 2–50 characters
- Used as the `pn` parameter in the deep link
- Error: `"Payment display name is required with UPI ID"`

**Where stored:** `profiles` table — columns `phone_number`, `upi_id`, `upi_display_name`

---

## 4. Full User Journey

### 4.1 — Payer Flow

```
ExpensesTab → Balances tab
    │
    ▼
Balance row: "You owe Rahul ₹450"  →  [Settle Up]
    │
    ▼
SettleUpScreen
  Pre-filled:
    • Paying to: Rahul Sharma
    • Amount: ₹450 (editable)
    • Optional transaction reference field
    │
    ├── CASE A: Rahul has NO UPI ID
    │     ┌──────────────────────────────────────────────┐
    │     │ ⚠️ Rahul hasn't added their UPI ID on        │
    │     │ TripWise. Ask them to add it in their        │
    │     │ profile to enable UPI payments.              │
    │     └──────────────────────────────────────────────┘
    │     Only shows: [Record Manually]
    │
    └── CASE B: Rahul HAS UPI ID (rahul@upi)
          Shows: rahul@upi (read-only, fetched from profile)
          [Pay via UPI]       ← primary button
          [Record Manually]   ← ghost button below
```

**When payer taps "Pay via UPI":**
```
1. Validate amount > 0
2. Insert settlement row: status = 'initiated', created_at = now()
3. Build generic UPI deep link (no app specified):
   upi://pay?pa=rahul@upi&pn=Rahul+Sharma&am=450.00&cu=INR&tn=TripWise+Settlement
4. Check Linking.canOpenURL — if no UPI app found, show toast and abort
5. Call Linking.openURL → system shows UPI app picker (or opens default)
6. App goes to background
7. AppState listener fires when app returns to foreground
8. Show bottom sheet: "Did you complete the payment?"
       [I Have Paid]        [Cancel / Try Again]
```

**When payer taps "I Have Paid":**
```
1. Prompt: "Enter transaction reference (optional)" — text input in the sheet
2. Update settlement: status = 'pending_confirmation', transaction_ref = <input>
3. DB trigger fires → notification sent to Rahul
4. Show inline status card: "Waiting for Rahul to confirm"
```

**When payer taps "Cancel / Try Again":**
```
1. Update settlement: status = 'pending'
2. Sheet closes — payer can try again
```

---

### 4.2 — Recipient Flow

```
Push notification: "Priya says they paid you ₹450. Confirm or dispute?"
    │
    ▼
Tap notification → SettlementDetailScreen
    │
    Shows:
      • Payer: Priya Mehta
      • Amount: ₹450
      • Trip: Goa 2025
      • Status badge: 🟡 Pending Confirmation
      • Initiated at: 14 Jul 2025, 3:42 PM
      • Transaction ref: (if payer entered one)
    │
    ├── [Confirm — Yes, I received it]
    │       → status = 'confirmed', confirmed_at = now()
    │       → DB trigger → notify Priya: "Rahul confirmed ✓"
    │       → balance recalculates (only confirmed settlements count)
    │       → status badge turns green: ✅ Confirmed
    │
    └── [Dispute — I didn't receive it]
            → DisputeBottomSheet opens
                  • Reason text (required, min 10 chars)
                  • Screenshot upload (optional, max 5 MB)
                  [Submit Dispute]
                        → status = 'rejected'
                        → DB trigger → notify Priya: "Rahul disputed ✗"
                        → balance unchanged
                        → status badge turns red: ❌ Disputed
```

---

### 4.3 — Manual Settlement Flow

Used when: recipient has no UPI ID, or payer prefers cash/bank.

```
SettleUpScreen → [Record Manually]
    │
    ▼
Form:
  • Method: Cash / Bank Transfer / Other
  • Amount (pre-filled from balance, editable)
  • Transaction reference (optional)
  • Notes (optional)
  [Record Settlement]
        → status = 'pending_confirmation' (recipient still confirms)
        → same notification flow as UPI
```

---

## 5. Settlement History

Every settlement shows a full timestamp trail visible to both payer and recipient.

### History card shows:
```
┌──────────────────────────────────────────────────────┐
│  Priya → Rahul   ₹450                               │
│  Method: UPI  •  Ref: UPI123456789                  │
│                                                      │
│  🕐 Initiated:    14 Jul 2025, 3:42 PM              │
│  🕐 Paid claimed: 14 Jul 2025, 3:44 PM              │
│  🕐 Confirmed:    14 Jul 2025, 3:51 PM              │
│                                                      │
│  Status: ✅ Confirmed                               │
└──────────────────────────────────────────────────────┘
```

### Status badge colors:
| Status | Color | Icon |
|---|---|---|
| `pending` | Gray | ⏳ |
| `initiated` | Blue | 🔵 |
| `pending_confirmation` | Amber | 🟡 |
| `confirmed` | Green | ✅ |
| `rejected` | Red | ❌ |

---

## 6. Database Schema Changes

### 6.1 — `profiles` table

```sql
ALTER TABLE public.profiles
  ADD COLUMN phone_number     VARCHAR(15),       -- 10-digit, required
  ADD COLUMN upi_id           VARCHAR(100),      -- optional, e.g. rahul@upi
  ADD COLUMN upi_display_name VARCHAR(100);      -- required when upi_id is set

-- UPI format constraint
ALTER TABLE public.profiles
  ADD CONSTRAINT valid_upi_id CHECK (
    upi_id IS NULL OR upi_id ~* '^[a-zA-Z0-9._\-]+@[a-zA-Z0-9]+$'
  );
```

> Note: `phone_number` is required at the app level (validated in UI/store). The DB column is nullable to avoid breaking existing rows — the app enforces the requirement.

---

### 6.2 — `settlements` table

```sql
ALTER TABLE public.settlements
  ADD COLUMN status             VARCHAR(30)  DEFAULT 'pending',
  ADD COLUMN transaction_ref    VARCHAR(100),   -- optional, entered by payer
  ADD COLUMN confirmed_at       TIMESTAMPTZ,
  ADD COLUMN dispute_reason     TEXT,
  ADD COLUMN dispute_screenshot TEXT,           -- Supabase storage URL
  ADD COLUMN updated_at         TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.settlements
  ADD CONSTRAINT valid_settlement_status CHECK (
    status IN ('pending', 'initiated', 'pending_confirmation', 'confirmed', 'rejected')
  );
```

**Timestamps available per settlement:**
- `created_at` — when settlement was first created (initiated)
- `updated_at` — last status change (auto-updated by trigger)
- `confirmed_at` — when recipient confirmed (set explicitly)

---

### 6.3 — `compute_trip_balances` function — Critical fix

The existing function counts **all** settlements. It must be changed to count **only `confirmed`** settlements. Pending/disputed settlements must not affect the balance.

```sql
-- Both settled_paid and settled_received CTEs must add:
WHERE s.status = 'confirmed'
```

---

### 6.4 — Notification triggers

**Trigger 1:** `status` changes to `pending_confirmation`
- Notifies: `paid_to` (recipient)
- Message: `"{payer} says they paid you ₹{amount}. Confirm or dispute?"`
- Type: `settlement_confirm_request`

**Trigger 2:** `status` changes to `confirmed`
- Notifies: `paid_by` (payer)
- Message: `"{recipient} confirmed your ₹{amount} payment ✓"`
- Type: `settlement_confirmed`

**Trigger 3:** `status` changes to `rejected`
- Notifies: `paid_by` (payer)
- Message: `"{recipient} disputed your ₹{amount} payment"`
- Type: `settlement_disputed`

---

## 7. UPI Deep Link — Technical Detail

```
upi://pay
  ?pa=<receiver_upi_id>         ← payee address — from recipient's profile
  &pn=<receiver_display_name>   ← payee name — from recipient's upi_display_name
  &am=<amount>                  ← 2 decimal places, e.g. 450.00
  &cu=INR                       ← always INR
  &tn=TripWise+Settlement       ← transaction note shown in UPI app
```

**No `&app=` parameter is used.** The OS shows the user's installed UPI apps and lets them pick. This is intentional — we do not force GPay or any specific app.

**Fallback if no UPI app installed:**
```typescript
const canOpen = await Linking.canOpenURL(upiUrl);
if (!canOpen) {
  // Show toast: "No UPI app found. Please install GPay, PhonePe, or any UPI app."
  return;
}
```

**AppState listener for "I Have Paid" sheet:**
```typescript
// Set a flag before opening UPI link
// When AppState changes to 'active' and flag is set → show sheet
AppState.addEventListener('change', (nextState) => {
  if (nextState === 'active' && pendingUpiSettlementId) {
    setShowIHavePaidSheet(true);
  }
});
```

---

## 8. Store Changes (`expenseStore.ts`)

### Updated `Settlement` type:
```typescript
export interface Settlement {
  id: string;
  trip_id: string;
  paid_by: string;
  paid_to: string;
  amount: number;
  method: string;
  status: 'pending' | 'initiated' | 'pending_confirmation' | 'confirmed' | 'rejected';
  transaction_ref: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  dispute_reason: string | null;
  dispute_screenshot: string | null;
  paid_by_name?: string;
  paid_to_name?: string;
}
```

### New store actions:
```typescript
initiateUpiSettlement(data)              // INSERT with status='initiated'
markAsPaid(id, transactionRef?)          // UPDATE initiated → pending_confirmation
confirmSettlement(id)                    // UPDATE pending_confirmation → confirmed
disputeSettlement(id, reason, screenshot?) // UPDATE → rejected
fetchMyPendingConfirmations(userId)      // SELECT where paid_to=me AND status=pending_confirmation
```

---

## 9. Screens & Components

### Modified

| File | What Changes |
|---|---|
| `CompleteProfileScreen.tsx` | Add phone number field — required, validated before save |
| `EditProfileScreen.tsx` | Add phone number (required) + UPI ID + UPI display name section |
| `SettleUpScreen.tsx` | Full redesign — UPI blocked message, Pay via UPI, Record Manually, transaction ref |
| `ExpensesTab.tsx` | Settlement history shows status badges + timestamps |
| `NotificationsScreen.tsx` | Handle `settlement_confirm_request` type → open SettlementDetailScreen |

### New

| File | Purpose |
|---|---|
| `SettlementDetailScreen.tsx` | Recipient confirms or disputes a pending_confirmation settlement |
| `DisputeBottomSheet.tsx` | Reason input + optional screenshot upload |
| `PaymentStatusBadge.tsx` | Reusable colored badge for all 5 statuses |

---

## 10. Edge Cases & Validation Rules

| Scenario | What Happens |
|---|---|
| Recipient has no UPI ID | "Pay via UPI" hidden, blocked message shown, only manual available |
| No UPI app on payer's device | `canOpenURL` returns false → toast error, settlement not created |
| Payer cancels in UPI app and returns | "I Have Paid" sheet shown — payer taps "Cancel" → status reset to `pending` |
| Payer taps "I Have Paid" twice | Status already `pending_confirmation` — no-op, idempotent |
| Recipient ignores notification | Status stays `pending_confirmation` — visible in history for both sides |
| Amount is 0 or negative | Blocked at form level before any DB write |
| Payer = Recipient (same user) | Blocked: `paid_by !== paid_to` check |
| Invalid UPI ID format | Regex check on save — inline error shown |
| Phone number missing on save | Inline error: "Mobile number is required" — save blocked |
| Dispute screenshot > 5 MB | Compress before upload, reject if still too large |
| Network failure on status update | Show error toast, status not changed — user can retry |
| Manual settlement (no UPI) | Goes directly to `pending_confirmation`, same confirm/dispute flow |

---

## 11. What Is NOT in MVP

- ❌ UPI payment verification callback (UPI protocol does not support this)
- ❌ Auto-expire `pending_confirmation` after N days
- ❌ Payment receipt / PDF export
- ❌ Non-INR currencies
- ❌ QR code generation
- ❌ Splitting one UPI payment across multiple people

---

## 12. Complete File Change List

```
MODIFIED:
  supabase/migrations/019_upi_settlement.sql        ← all DB changes
  src/types/database.ts                             ← ProfileRow + Settlement types
  src/stores/authStore.ts                           ← Profile interface + fetchProfile select
  src/stores/expenseStore.ts                        ← Settlement type + new actions
  src/screens/auth/CompleteProfileScreen.tsx        ← phone number required
  src/screens/profile/EditProfileScreen.tsx         ← phone + UPI section
  src/screens/expenses/SettleUpScreen.tsx           ← full UPI flow redesign
  src/screens/expenses/ExpensesTab.tsx              ← status badges in history
  src/screens/notifications/NotificationsScreen.tsx ← new notification types

NEW:
  src/screens/expenses/SettlementDetailScreen.tsx   ← confirm / dispute screen
  src/components/DisputeBottomSheet.tsx             ← dispute form
  src/components/PaymentStatusBadge.tsx             ← reusable status badge
```

---

## 13. Visual Flow Diagram

```
╔══════════════════════════════════════════════════════════════════╗
║                         PAYER JOURNEY                           ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  Balances Tab: "You owe Rahul ₹450"  →  [Settle Up]            ║
║                         │                                        ║
║                  SettleUpScreen                                  ║
║                         │                                        ║
║          ┌──────────────┴──────────────┐                        ║
║   Rahul has NO UPI ID           Rahul HAS UPI ID                ║
║          │                             │                         ║
║  ┌───────────────────┐        [Pay via UPI]  [Record Manually]  ║
║  │ ⚠️ Rahul hasn't   │                │                         ║
║  │ added UPI ID on   │     DB: status = 'initiated'             ║
║  │ TripWise          │                │                         ║
║  └───────────────────┘     Generic UPI deep link opens          ║
║  [Record Manually only]    (user picks their UPI app)           ║
║                                        │                         ║
║                            App returns to foreground             ║
║                                        │                         ║
║                         "Did you complete payment?"              ║
║                      [I Have Paid]  [Cancel/Retry]              ║
║                             │              │                     ║
║                  status=pending_conf   status=pending            ║
║                  + optional txn ref    (reset, try again)        ║
║                  Notify Rahul                                    ║
╚══════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════╗
║                       RECIPIENT JOURNEY                         ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  Notification: "Priya says they paid you ₹450"                  ║
║                         │                                        ║
║               SettlementDetailScreen                             ║
║               • Amount, payer, trip                              ║
║               • 🟡 Pending Confirmation                          ║
║               • Timestamps + txn ref                             ║
║                         │                                        ║
║          ┌──────────────┴──────────────┐                        ║
║  [Confirm Received]             [Dispute]                        ║
║          │                             │                         ║
║  status=confirmed              DisputeBottomSheet                ║
║  confirmed_at=now()            • Reason (required)               ║
║  ✅ Balance clears             • Screenshot (optional)           ║
║  Notify Priya ✓                        │                         ║
║                               status=rejected                    ║
║                               ❌ Balance unchanged               ║
║                               Notify Priya ✗                    ║
╚══════════════════════════════════════════════════════════════════╝
```

---

*Document version: 2.0 | Updated requirements: phone required, UPI optional at signup, no forced UPI app, blocked pay when receiver has no UPI ID, settlement history with timestamps and transaction reference*
