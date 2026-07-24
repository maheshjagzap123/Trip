
# ExpenseX — Product Transformation & Refactoring Specification

> **Purpose**
>
> This document replaces the current **TripWise** product vision with **ExpenseX**.
> It is intended to be the implementation guide for the engineering team.
>
> **IMPORTANT**
>
> This is a product-wide refactor, not just a rename.
> Every occurrence of **TripWise** must become **ExpenseX**, and every travel-specific workflow must be generalized into a group expense platform while preserving the existing architecture, code quality, UI, animations, backend, and settlement logic.

---

# 1. Global Rebranding

Replace everywhere:

- TripWise → ExpenseX
- Trip → Group
- Trips → Groups
- Create Trip → Create Group
- Trip Dashboard → Group Dashboard
- Trip Detail → Group Detail
- Trip Timeline → Activity
- Trip Photos → Media
- Travel Analytics → Spending Analytics

Update:

- App Name
- Logo
- Splash Screen
- Package Name
- App Display Name
- Google Drive folder
- Notification texts
- Email templates
- Database naming only where beneficial (avoid unnecessary migration if APIs already work).

---

# 2. New Product Vision

ExpenseX is an AI-powered collaborative expense management application for every kind of shared spending.

Supported group types:

- Trip
- Flatmates
- Family
- Friends
- Couple
- Office
- Business
- College
- Event
- Wedding
- Sports Team
- Monthly Household
- Custom

Travel is now just ONE category.

---

# 3. Existing Features To Keep

Keep all existing functionality:

- Authentication
- OTP Login
- Profile
- Group Chat
- Expense Split
- Balance Calculation
- Settlement
- UPI Payment
- Manual Settlement
- Notification
- Analytics
- Real-time Sync
- Google Drive Integration
- Animations
- Zustand
- Supabase
- Realtime
- Edge Functions

Do NOT rewrite working backend logic unnecessarily.

---

# 4. Home Screen Changes

Current:
- Trips

New:
- Groups

Header:
"Good Morning"

Statistics:

- Total Groups
- Monthly Spend
- Pending Balance
- Amount You'll Receive

Cards:

🏠 Flatmates

🎉 Goa Trip

👨‍👩‍👧 Family

💼 Office

Each group shows:

- Name
- Members
- Total Expenses
- Your Balance
- Last Activity

FAB:

+ Create Group

---

# 5. Group Creation

Instead of trip-specific fields:

Use:

Required

- Group Name
- Group Type
- Currency
- Members

Optional

- Description
- Cover Image

If Group Type = Trip

Show:

- Destination
- Start Date
- End Date

Otherwise hide travel fields.

---

# 6. Expense Categories

Replace travel categories with universal categories.

Default:

- Food
- Grocery
- Rent
- Internet
- Electricity
- Water
- Fuel
- Entertainment
- Shopping
- Medical
- Travel
- Hotel
- Flight
- Subscription
- Salary
- Business
- Other

Allow custom categories.

---

# 7. Dashboard Navigation

Current

Trips
Analytics
Profile

New

Home
Groups
Activity
Analytics
Profile

---

# 8. Timeline

Rename

Trip Timeline

to

Activity Feed

Events:

Expense Added

Settlement Completed

Member Joined

Receipt Uploaded

Payment Confirmed

Message Sent

---

# 9. Media

Rename

Trip Photos

to

Media & Receipts

Support:

- Receipts
- Bills
- Photos
- Invoices
- PDFs

Google Drive folder:

ExpenseX/

  Group Name/

     Receipts/

     Media/

---

# 10. Documents

Remove travel document concept.

Replace with:

Receipts

Bills

Warranty

Invoice

Agreement

Proof of Payment

---

# 11. Analytics

Replace travel analytics with spending analytics.

Include:

Monthly Spend

Weekly Spend

Category Breakdown

Group Spend

Top Category

Top Paying Member

Pending Settlements

AI Insights (Coming Soon)

---

# 12. Settlement

Keep existing workflow.

Improve support:

- UPI
- PhonePe
- Google Pay
- Paytm
- Bank
- Cash

Keep confirmation workflow.

Keep disputes.

Keep screenshots.

---

# 13. AI Roadmap

Future modules:

- Receipt OCR
- Voice Expense Entry
- Monthly Budget
- Recurring Bills
- Smart Reminders
- AI Spending Insights
- Auto Category Detection
- Expense Prediction

---

# 14. Database

Prefer minimal schema changes.

Rename only if needed:

trips → groups

trip_members → group_members

trip_notes → group_notes

trip_id → group_id

Keep migration compatibility where possible.

---

# 15. UI Text Changes

Replace all UI strings.

Examples:

Plan Trips → Manage Shared Expenses

Travel Together → Split Together

Trip Details → Group Details

Create Trip → Create Group

Trip Members → Group Members

Trip Expense → Group Expense

Trip Photos → Media

Trip Timeline → Activity

Upcoming Trips → Active Groups

Trip Analytics → Spending Analytics

---

# 16. Notifications

Replace wording.

Examples:

Trip Invite

↓

Group Invite

Trip Created

↓

Group Created

Trip Updated

↓

Group Updated

---

# 17. Profile

Remove:

Travel Interests

Replace with:

Preferred Categories

Examples

Food

Business

Family

Travel

Shopping

Bills

Entertainment

---

# 18. Google Drive

Replace root folder

TripWise/

with

ExpenseX/

Structure:

ExpenseX/

 Group/

  Receipts/

  Media/

---

# 19. Search

Search across

Groups

Expenses

Members

Categories

Receipts

Messages

---

# 20. Future Premium Features

- AI Assistant
- OCR Receipt Scanner
- Recurring Bills
- Budget Planner
- Net Worth
- Shared Wallet
- Split by Percentage
- Split by Shares
- Multi Currency
- Export PDF
- Excel Reports

---

# 21. Technical Instructions

Preserve:

- React Native
- Expo
- Zustand
- Supabase
- Realtime
- TypeScript
- Existing architecture
- Existing animations
- Existing backend APIs where possible

Refactor naming consistently.

---

# 22. Implementation Checklist

## Branding
- Rename TripWise → ExpenseX
- Update logo
- Update splash
- Update package display name

## Navigation
- Trips → Groups
- Trip Detail → Group Detail
- Trip Timeline → Activity
- Trip Photos → Media

## UI
- Update all text
- Replace travel wording
- Keep animations

## Database
- Rename entities where appropriate
- Maintain backward compatibility

## Features
- Add Group Type selector
- Conditional Trip fields
- Universal expense categories
- Receipt-first media
- Spending analytics

## QA
- Verify every screen
- Verify navigation
- Verify deep links
- Verify Android
- Verify iOS
- Verify Web
- Verify realtime
- Verify settlements
- Verify notifications

---

# Final Goal

ExpenseX should become a modern, AI-ready collaborative finance platform that supports every kind of shared expense—not only travel. The existing expense engine, settlement workflow, chat, realtime sync, and architecture should be preserved while the product is repositioned around universal group spending.
