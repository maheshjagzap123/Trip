# Product Requirements Document (PRD)
# TripWise: Intelligent Travel Collaboration Platform

---

**Document Version:** 3.0  
**Date:** July 2026  
**Status:** Approved — Greenfield Build  
**Author:** Product Team  
**Stakeholders:** Engineering, Design, Marketing, Executive Leadership

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Vision & Mission](#2-vision--mission)
3. [Business Goals & Objectives](#3-business-goals--objectives)
4. [Problem Statement](#4-problem-statement)
5. [Target Audience](#5-target-audience)
6. [User Personas](#6-user-personas)
7. [Product Overview](#7-product-overview)
8. [Complete Feature Breakdown](#8-complete-feature-breakdown)
9. [User Stories](#9-user-stories)
10. [Functional Requirements](#10-functional-requirements)
11. [Non-Functional Requirements](#11-non-functional-requirements)
12. [Technical Architecture](#12-technical-architecture)
13. [Database Design](#13-database-design)
14. [API Design](#14-api-design)
15. [UI/UX Flow](#15-uiux-flow)
16. [AI Integration Plan](#16-ai-integration-plan)
17. [Third-Party Integrations](#17-third-party-integrations)
18. [Security & Privacy](#18-security--privacy)
19. [Development Roadmap](#19-development-roadmap)
20. [Success Metrics](#20-success-metrics)
21. [Risks & Mitigation](#21-risks--mitigation)
22. [Technology Stack](#22-technology-stack)
23. [Team Responsibilities](#23-team-responsibilities)
24. [Appendix](#24-appendix)

---

## 1. Executive Summary

### 1.1 Overview

TripWise is a **greenfield intelligent travel collaboration platform** being built from scratch. The application aims to be the single source of truth for every aspect of travel — before, during, and after the journey.

**Project Status:** Not started. No code exists yet. This PRD defines the full product before the first line is written.

### 1.2 Current State

**Nothing is built yet.** This is a fresh start.

- ❌ No codebase exists
- ❌ No Supabase project configured
- ❌ No screens built
- ❌ No backend schema
- ❌ No CI/CD pipeline
- ❌ No design assets

All features described in this document are **planned**, not implemented.

### 1.3 Vision

**TripWise will replace:**
- 💬 WhatsApp (for trip communication)
- 📸 Google Photos (for trip memories)
- 📁 Google Drive (for travel documents)
- 💰 Splitwise (for expense splitting)
- 🗺️ Google Maps (for location tracking)
- 📝 Notes apps (for itinerary)
- 📅 Calendar (for trip planning)
- 🏨 Booking apps (recommendations)

**Single Platform, Complete Journey**

### 1.4 Key Differentiators

1. **Memory Preservation**: Every trip becomes a permanent digital album
2. **Cloud Integration**: Connect Google Drive, OneDrive, reducing server costs
3. **Smart Expense Splitting**: Auto-calculated settlements, no manual math
4. **AI Travel Assistant**: Personalized recommendations and itinerary generation
5. **Real-Time Collaboration**: Shared timeline, chat, voting, and decision-making
6. **Offline-First**: Capture everything without internet, sync later
7. **Privacy-Focused**: End-to-end encryption, user controls their data


---

## 2. Vision & Mission

### 2.1 Product Vision

> **"To become the world's most loved intelligent travel companion where every journey is seamlessly planned, beautifully remembered, and effortlessly shared."**

TripWise envisions a world where travelers:
- Never lose precious travel memories
- Never argue about expense settlements
- Never miss hidden gems at their destinations
- Never use 8 different apps to manage one trip
- Always have their travel data organized and accessible

### 2.2 Mission Statement

**For Travelers:**
To provide an all-in-one intelligent platform that transforms chaotic travel planning into delightful experiences, preserves every memory, and makes group travel financially transparent and stress-free.

**For the Business:**
To become the leading travel collaboration platform with 10M+ active users by 2027, generating revenue through premium subscriptions, travel partnerships, and AI-powered services.

### 2.3 Core Values

1. **User Privacy First**: Your data belongs to you
2. **Simplicity**: Complex features, simple interface
3. **Collaboration**: Travel is better together
4. **Intelligence**: AI that truly helps
5. **Reliability**: Always available when you need it
6. **Innovation**: Constantly evolving with user needs


---

## 3. Business Goals & Objectives

### 3.1 Primary Business Goals

| Goal | Target | Timeline |
|------|--------|----------|
| Active Users | 1M+ | 12 months |
| Trip Creations | 500K+ | 12 months |
| Premium Subscribers | 50K+ | 18 months |
| Monthly Recurring Revenue | $100K+ | 18 months |
| App Store Rating | 4.7+ | 6 months |
| Daily Active Users | 200K+ | 12 months |
| User Retention (30-day) | 60%+ | 9 months |

### 3.2 Key Performance Indicators (KPIs)

**User Engagement:**
- Average session duration: 15+ minutes
- Trips per user: 5+ annually
- Photos uploaded per trip: 50+ average
- Expenses tracked per trip: 20+ average
- User invite rate: 3+ friends per user

**Financial Metrics:**
- Total expenses tracked: $100M+ annually
- Settlements completed: 80%+ success rate
- Premium conversion rate: 5%+
- Customer Lifetime Value (CLV): $120+
- Customer Acquisition Cost (CAC): $15

**Technical Metrics:**
- App crash rate: <0.5%
- API response time: <300ms (p95)
- Uptime: 99.9%
- Photo upload success rate: 98%+

### 3.3 Revenue Model

**Freemium Model:**

**Free Tier:**
- Up to 5 active trips
- Up to 10 members per trip
- Basic expense splitting
- 2GB cloud storage
- Standard AI recommendations
- Mobile ads (non-intrusive)


**Premium Tier ($4.99/month or $49.99/year):**
- Unlimited trips
- Unlimited members
- Advanced expense analytics
- 50GB cloud storage
- Priority AI assistant
- Custom categories
- Export capabilities
- Offline maps
- Ad-free experience
- Advanced filters
- Custom branding

**Family Plan ($9.99/month):**
- Up to 6 accounts
- All premium features
- Shared family budget tracking
- Family travel history

**Business/Corporate Tier ($29.99/month per team):**
- Expense policy enforcement
- Approval workflows
- Corporate billing
- Tax documentation
- Admin dashboard
- SSO integration
- API access

**Additional Revenue Streams:**
- Affiliate commissions (hotels, flights, activities)
- Premium AI features (GPT-4 powered itineraries)
- White-label solutions for travel agencies
- Data insights (anonymized, aggregated) for tourism boards


---

## 4. Problem Statement

### 4.1 Current Pain Points

**Problem 1: Fragmented Experience**
- Users juggle 8+ apps for a single trip
- Switching between WhatsApp, Photos, Drive, Splitwise, Maps
- Lost context, wasted time, missed information

**Problem 2: Lost Memories**
- Photos scattered across devices
- No organized trip timeline
- Difficult to share with trip members
- Years later, memories are forgotten or inaccessible

**Problem 3: Expense Nightmares**
- Manual calculation errors
- Confusing settlements
- Awkward money conversations
- Unresolved debts after trips

**Problem 4: Poor Planning**
- Generic travel recommendations
- No personalized itineraries
- Missing hidden gems
- Over-budget or under-planned trips

**Problem 5: Collaboration Chaos**
- Group decisions via endless message threads
- No centralized information
- Repeated questions and answers
- Missed updates and notifications

**Problem 6: Storage Costs**
- Cloud storage is expensive
- Users already pay for Google Drive
- Apps force their own storage solutions
- Privacy concerns with centralized storage


### 4.2 Market Opportunity

**Global Travel Market:**
- $1.7 trillion global travel industry
- 1.5 billion international tourist arrivals annually
- Post-pandemic travel boom (120% growth in 2023)
- 65% of travelers use mobile apps for planning

**Competitor Analysis:**

| Competitor | Strengths | Weaknesses |
|------------|-----------|------------|
| **Splitwise** | Excellent expense splitting | No trip planning, no memories |
| **TripIt** | Good itinerary management | No expenses, no collaboration |
| **Google Photos** | Unlimited storage, AI features | No trip context, no expenses |
| **WhatsApp** | Universal, real-time | Chaotic, no organization |
| **TravelSpend** | Expense tracking | Limited features, poor UX |

**TripWise Advantage:**
- **All-in-one** platform
- **AI-powered** recommendations
- **Cloud integration** (cost-effective)
- **Real-time collaboration**
- **Preserved memories** with context

**Target Market Size:**
- Total Addressable Market (TAM): 500M travelers globally
- Serviceable Addressable Market (SAM): 100M digital-savvy travelers
- Serviceable Obtainable Market (SOM): 10M users (Year 3)


---

## 5. Target Audience

### 5.1 Primary Audience

**Segment 1: Young Travelers (22-35 years)**
- Tech-savvy millennials and Gen Z
- Frequent group travel (3-5 trips/year)
- Budget-conscious but experience-focused
- Active on social media
- Value convenience and aesthetics
- **Volume:** 60% of user base

**Segment 2: Family Travelers (35-50 years)**
- Parents planning family vacations
- 2-3 major trips annually
- Budget planning is critical
- Need organization and safety features
- Value reliability and security
- **Volume:** 25% of user base

**Segment 3: Couples (25-45 years)**
- Planning romantic getaways
- Honeymoon and anniversary trips
- Memory preservation is priority
- Medium to high budget
- Value privacy and simplicity
- **Volume:** 10% of user base

### 5.2 Secondary Audience

**Corporate Travelers:**
- Business trip expense management
- Compliance and reporting needs
- Frequent solo travel
- **Volume:** 3% of user base

**Adventure Groups:**
- Outdoor and adventure activities
- Complex logistics and planning
- Equipment and cost sharing
- **Volume:** 2% of user base


---

## 6. User Personas

### Persona 1: "Adventure Amy" 👩‍💻

**Demographics:**
- Age: 26
- Occupation: Digital Marketing Manager
- Income: $45,000/year
- Location: Mumbai, India
- Education: Bachelor's Degree

**Behaviors:**
- Plans 4-5 weekend trips annually with friends
- Active on Instagram and shares travel photos
- Uses multiple apps frustratingly
- Budget-conscious but values experiences
- Early adopter of new technology

**Goals:**
- Easy group expense management
- Beautiful photo organization
- Discover hidden travel gems
- Quick trip planning

**Pain Points:**
- Tired of using 10 apps for one trip
- Manual expense calculations are annoying
- Photos lost across devices
- Group chat becomes messy

**TripWise Usage:**
- Creates trip, invites 4-6 friends
- Uploads 100+ photos per trip
- Uses AI for destination recommendations
- Active in trip chat and polls

**Quote:** *"I just want one app where I can plan, track expenses, and save all our memories without the hassle."*


### Persona 2: "Family-Focused Frank" 👨‍👩‍👧‍👦

**Demographics:**
- Age: 38
- Occupation: Project Manager
- Income: $75,000/year
- Location: Bangalore, India
- Education: Master's Degree
- Family: Married with 2 kids (ages 6 and 10)

**Behaviors:**
- Plans 2-3 family vacations yearly
- Meticulous about budget and safety
- Prefers reliability over fancy features
- Researches extensively before trips
- Uses both mobile and laptop

**Goals:**
- Keep family organized during travel
- Track expenses accurately
- Store important travel documents
- Create lasting family memories
- Ensure children's safety information

**Pain Points:**
- Keeping track of everyone's documents
- Budget overruns surprise them
- Kids want to see trip photos later
- Hard to settle expenses with relatives

**TripWise Usage:**
- Creates detailed itineraries
- Stores passports, tickets digitally
- Sets budget alerts
- Shares trip timeline with extended family

**Quote:** *"I need a reliable app that keeps my family organized, our documents safe, and our budget on track."*


### Persona 3: "Budget-Conscious Ben" 🎒

**Demographics:**
- Age: 23
- Occupation: Software Engineering Student
- Income: $12,000/year (part-time + allowance)
- Location: Pune, India
- Education: Bachelor's (in progress)

**Behaviors:**
- Frequent weekend backpacking trips
- Travels with college friends (5-8 people)
- Extremely price-sensitive
- Uses free apps only
- Shares everything on social media

**Goals:**
- Fair expense splitting (everyone pays equally)
- Free or very cheap solution
- Quick settlements via UPI
- Discover budget-friendly destinations

**Pain Points:**
- Friends forget to pay their share
- Awkward to ask for money
- Manual calculations lead to arguments
- Limited phone storage

**TripWise Usage:**
- Creates trips with hostels and local food
- Uses expense splitting religiously
- Sends payment reminders
- Connects Google Drive to save storage

**Quote:** *"I need fair splits and easy UPI settlements. And it better be free or I'm not using it."*

---


## 7. Product Overview

### 7.1 Product Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TripWise Platform                         │
├─────────────────────────────────────────────────────────────┤
│  Mobile Apps (iOS/Android)    │    Web Application (PWA)    │
├─────────────────────────────────────────────────────────────┤
│                      API Gateway                             │
│                    (Supabase Edge Functions)                 │
├─────────────────────────────────────────────────────────────┤
│   Auth   │  Trips  │ Expenses │ Storage │ AI │ Realtime    │
├─────────────────────────────────────────────────────────────┤
│             Supabase PostgreSQL Database                     │
├─────────────────────────────────────────────────────────────┤
│  Google Drive │ OneDrive │ OpenAI │ Maps API │ Payment     │
│               (External Integrations)                        │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Core Modules

**Module 1: Authentication & User Management**
- OTP-based login (Email/Phone)
- Social login (Google, Apple)
- Multi-device session management
- Profile management with preferences

**Module 2: Trip Management**
- Create, edit, archive trips
- Invite members via email/phone
- Trip privacy controls
- Trip types and categories


**Module 3: Shared Memories & Media**
- Photo/video uploads
- Automatic timeline organization
- Cloud storage integration (Google Drive, OneDrive)
- Shared albums per trip
- Memory highlights and stories

**Module 4: Expense Management & Splitting**
- Add expenses with categories
- Receipt scanning (OCR)
- Smart auto-split calculation
- Settlement tracking
- Multiple split methods (equal, custom, percentage, item-wise)
- Currency conversion
- UPI/Payment integration

**Module 5: Collaboration & Communication**
- Trip-specific chat
- Real-time updates (Supabase Realtime)
- Polls and voting
- Announcements
- Location sharing
- Comments and reactions

**Module 6: AI Travel Assistant**
- Destination recommendations
- Itinerary generation
- Budget estimation
- Packing list suggestions
- Weather alerts
- Local tips and translations

**Module 7: Documents & Organization**
- Secure document storage
- Passport, visa, ticket uploads
- Emergency contact management
- Shared document access
- Document expiry reminders


**Module 8: Maps & Location**
- Interactive trip maps
- Visited places tracking
- Nearby recommendations
- Route planning
- Offline maps (premium)

**Module 9: Analytics & Insights**
- Expense analytics and charts
- Travel statistics
- Budget vs actual comparison
- Spending trends
- Category-wise breakdown

**Module 10: Notifications & Alerts**
- Push notifications
- In-app notifications
- Email notifications
- Reminder system
- Real-time activity feed

---

## 8. Complete Feature Breakdown

### 8.1 Authentication & Onboarding

#### Feature 8.1.1: Multi-Method Authentication
**Priority:** P0 (Must Have)  
**Complexity:** Medium

**Description:**
Users can sign up and log in using multiple methods without requiring passwords.

**Sub-features:**
- **Email OTP Login**
  - User enters email
  - 6-digit OTP sent via email
  - OTP valid for 5 minutes
  - Resend OTP after 30 seconds
  - Auto-fill OTP support (iOS/Android)


- **Phone OTP Login**
  - User enters phone number with country code
  - 6-digit OTP sent via SMS
  - Same OTP validation rules as email
  - Support for international numbers

- **Google Login**
  - One-tap Google sign-in
  - Auto-populate name, email, profile photo
  - OAuth 2.0 implementation

- **Apple Login**
  - Sign in with Apple (iOS requirement)
  - Email privacy options
  - Secure token-based authentication

- **JWT Token Management**
  - Access tokens (15 min expiry)
  - Refresh tokens (30 days expiry)
  - Automatic token refresh
  - Secure token storage (Keychain/SecureStore)

**Acceptance Criteria:**
- User can successfully log in using any method
- OTP delivery within 30 seconds
- Login success rate > 99%
- Token refresh works seamlessly
- Multi-device login supported (max 5 devices)
- Logout from all devices option available


#### Feature 8.1.2: Comprehensive User Profile
**Priority:** P0 (Must Have)  
**Complexity:** Low

**Description:**
Rich user profile with personal information, preferences, and settings.

**Profile Fields:**
```json
{
  "userId": "uuid",
  "profilePhoto": "url",
  "firstName": "string",
  "lastName": "string",
  "displayName": "string",
  "email": "string (verified)",
  "phone": "string (verified)",
  "dateOfBirth": "date",
  "gender": "enum [Male, Female, Other, Prefer not to say]",
  "homeCity": "string",
  "country": "string",
  "emergencyContact": {
    "name": "string",
    "phone": "string",
    "relation": "string"
  },
  "preferences": {
    "currency": "string (ISO code)",
    "language": "string (ISO code)",
    "theme": "enum [light, dark, auto]",
    "units": "enum [metric, imperial]"
  },
  "travelInterests": ["array of strings"],
  "notificationSettings": {
    "push": "boolean",
    "email": "boolean",
    "sms": "boolean",
    "tripUpdates": "boolean",
    "expenseReminders": "boolean",
    "marketingEmails": "boolean"
  },
  "privacy": {
    "profileVisibility": "enum [public, friends, private]",
    "locationSharing": "boolean"
  },
  "subscription": {
    "tier": "enum [free, premium, family, corporate]",
    "expiryDate": "date"
  }
}
```


**Acceptance Criteria:**
- All fields are editable
- Profile photo upload (max 10MB)
- Email/phone verification required
- Data validation on all fields
- Changes saved instantly with feedback
- Privacy controls work correctly

---

### 8.2 Trip Management

#### Feature 8.2.1: Create & Configure Trip
**Priority:** P0 (Must Have)  
**Complexity:** Medium

**Description:**
Users can create detailed trips with all necessary information and invite members.

**Trip Data Model:**
```json
{
  "tripId": "uuid",
  "coverImage": "url",
  "tripName": "string (max 100 chars)",
  "destination": "string",
  "description": "text",
  "startDate": "date",
  "endDate": "date",
  "budget": {
    "amount": "decimal",
    "currency": "string"
  },
  "tripType": "enum [Solo, Friends, Family, Office, Couple, Adventure, Pilgrimage]",
  "status": "enum [Planning, Ongoing, Completed, Cancelled]",
  "privacy": "enum [Private, Invite-Only, Public]",
  "createdBy": "userId",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "members": [{
    "userId": "uuid",
    "role": "enum [Admin, Member, Viewer]",
    "joinedAt": "timestamp",
    "invitedBy": "userId"
  }],
  "settings": {
    "allowMemberInvites": "boolean",
    "requireExpenseApproval": "boolean",
    "autoSharePhotos": "boolean"
  }
}
```


**Features:**
- Create trip with required details
- Upload custom cover image
- Set trip type and privacy
- Invite members via email/phone
- Members receive notifications
- Role-based access control (Admin, Member, Viewer)
- Edit trip details (Admin only)
- Archive/Delete trip
- Duplicate trip for similar journeys

**Member Invitation Flow:**
1. Admin/Member clicks "Invite"
2. Enters email or phone number
3. System checks if user exists
4. Sends invitation (push + email + SMS)
5. Invitee accepts/declines
6. Auto-added to trip on acceptance

**Acceptance Criteria:**
- Trip creation completes in <10 seconds
- Cover image upload supports JPG, PNG, WEBP
- Date validation (end date after start date)
- Budget validation (positive number)
- Invitation delivery within 1 minute
- Push notification appears instantly
- Member list updates in real-time
- Admins can manage all members
- Members can only view

---


## 13. Database Design (Supabase PostgreSQL)

### 13.1 Core Tables

#### Table: `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) UNIQUE,
  display_name VARCHAR(100),
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  profile_photo_url TEXT,
  date_of_birth DATE,
  gender VARCHAR(20),
  home_city VARCHAR(100),
  country VARCHAR(100),
  emergency_contact JSONB,
  preferences JSONB DEFAULT '{}',
  travel_interests TEXT[],
  notification_settings JSONB DEFAULT '{}',
  privacy_settings JSONB DEFAULT '{}',
  subscription_tier VARCHAR(20) DEFAULT 'free',
  subscription_expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
```


#### Table: `trips`
```sql
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_name VARCHAR(200) NOT NULL,
  destination VARCHAR(200),
  description TEXT,
  cover_image_url TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  budget_amount DECIMAL(12,2),
  budget_currency VARCHAR(3) DEFAULT 'USD',
  trip_type VARCHAR(50),
  status VARCHAR(20) DEFAULT 'Planning',
  privacy VARCHAR(20) DEFAULT 'Private',
  created_by UUID REFERENCES users(id),
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  
  CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

CREATE INDEX idx_trips_created_by ON trips(created_by);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_dates ON trips(start_date, end_date);
```

#### Table: `trip_members`
```sql
CREATE TABLE trip_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  role VARCHAR(20) DEFAULT 'Member',
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'Pending',
  
  UNIQUE(trip_id, user_id)
);

CREATE INDEX idx_trip_members_trip ON trip_members(trip_id);
CREATE INDEX idx_trip_members_user ON trip_members(user_id);
```


#### Table: `expenses`
```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  category VARCHAR(50),
  paid_by UUID REFERENCES users(id),
  paid_at TIMESTAMPTZ,
  receipt_url TEXT,
  notes TEXT,
  location JSONB,
  split_method VARCHAR(20) DEFAULT 'equal',
  split_details JSONB,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT positive_amount CHECK (amount > 0)
);

CREATE INDEX idx_expenses_trip ON expenses(trip_id);
CREATE INDEX idx_expenses_paid_by ON expenses(paid_by);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_date ON expenses(paid_at);
```

#### Table: `expense_splits`
```sql
CREATE TABLE expense_splits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  amount DECIMAL(12,2) NOT NULL,
  percentage DECIMAL(5,2),
  paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMPTZ,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(100),
  
  CONSTRAINT positive_split CHECK (amount >= 0)
);

CREATE INDEX idx_expense_splits_expense ON expense_splits(expense_id);
CREATE INDEX idx_expense_splits_user ON expense_splits(user_id);
```


#### Table: `media`
```sql
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES users(id),
  media_type VARCHAR(20),
  file_name VARCHAR(255),
  file_size BIGINT,
  storage_provider VARCHAR(50),
  storage_path TEXT,
  thumbnail_url TEXT,
  original_url TEXT,
  caption TEXT,
  taken_at TIMESTAMPTZ,
  location JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_media_type CHECK (media_type IN ('photo', 'video', 'document'))
);

CREATE INDEX idx_media_trip ON media(trip_id);
CREATE INDEX idx_media_user ON media(uploaded_by);
CREATE INDEX idx_media_type ON media(media_type);
CREATE INDEX idx_media_date ON media(taken_at);
```

#### Table: `messages`
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  message_type VARCHAR(20) DEFAULT 'text',
  content TEXT,
  media_id UUID REFERENCES media(id),
  metadata JSONB,
  reply_to UUID REFERENCES messages(id),
  is_announcement BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_messages_trip ON messages(trip_id);
CREATE INDEX idx_messages_user ON messages(user_id);
CREATE INDEX idx_messages_date ON messages(created_at DESC);
```


---

## 14. API Design

### 14.1 API Architecture

**Base URL:** `https://[your-project].supabase.co/functions/v1`

**Authentication:** Bearer Token (JWT) in Authorization header

**Rate Limiting:**
- Free tier: 100 requests/minute
- Premium: 1000 requests/minute

### 14.2 Core API Endpoints

#### Authentication APIs

```
POST /auth/send-otp
POST /auth/verify-otp
POST /auth/google-login
POST /auth/apple-login
POST /auth/refresh-token
POST /auth/logout
POST /auth/logout-all
```

#### User APIs

```
GET    /users/me
PUT    /users/me
PATCH  /users/me/photo
GET    /users/{userId}
GET    /users/search?q={query}
```

#### Trip APIs

```
POST   /trips
GET    /trips
GET    /trips/{tripId}
PUT    /trips/{tripId}
DELETE /trips/{tripId}
POST   /trips/{tripId}/archive
POST   /trips/{tripId}/duplicate

GET    /trips/{tripId}/members
POST   /trips/{tripId}/invite
DELETE /trips/{tripId}/members/{userId}
PATCH  /trips/{tripId}/members/{userId}/role
```


#### Expense APIs

```
POST   /trips/{tripId}/expenses
GET    /trips/{tripId}/expenses
GET    /trips/{tripId}/expenses/{expenseId}
PUT    /trips/{tripId}/expenses/{expenseId}
DELETE /trips/{tripId}/expenses/{expenseId}

GET    /trips/{tripId}/settlements
POST   /trips/{tripId}/settlements/calculate
POST   /trips/{tripId}/settlements/mark-paid

GET    /trips/{tripId}/analytics
```

#### Media APIs

```
POST   /trips/{tripId}/media/upload
GET    /trips/{tripId}/media
GET    /trips/{tripId}/media/{mediaId}
DELETE /trips/{tripId}/media/{mediaId}
PATCH  /trips/{tripId}/media/{mediaId}/caption

POST   /cloud-integration/google-drive/connect
POST   /cloud-integration/google-drive/upload
GET    /cloud-integration/providers
```

#### Chat & Collaboration APIs

```
POST   /trips/{tripId}/messages
GET    /trips/{tripId}/messages
PATCH  /trips/{tripId}/messages/{messageId}/pin
DELETE /trips/{tripId}/messages/{messageId}

POST   /trips/{tripId}/polls
GET    /trips/{tripId}/polls
POST   /trips/{tripId}/polls/{pollId}/vote
```

#### AI Assistant APIs

```
POST   /ai/recommendations?destination={dest}&tripType={type}
POST   /ai/itinerary/generate
POST   /ai/budget/estimate
POST   /ai/packing-list
POST   /ai/translate
```


---

## 19. Development Roadmap

### Phase 1: MVP (Months 1-3) - Foundation

**Goal:** Launch core features with basic trip and expense management

**Features to build:**
- 🔲 OTP Authentication (Email/Phone)
- 🔲 Google/Apple Login
- 🔲 User Profile Management
- 🔲 Create/Edit Trips
- 🔲 Invite Members
- 🔲 Basic Expense Tracking
- 🔲 Equal Split Calculation
- 🔲 Trip Dashboard
- 🔲 Expense Analytics
- 🔲 Cross-platform (iOS, Android, Web)

**Deliverables:**
- Beta app on TestFlight & Google Play Beta
- Web app deployed
- 1000 beta testers onboarded
- Core API documentation

**Success Metrics:**
- 80% completion rate for trip creation
- Average 5 expenses per trip
- 4.5+ user satisfaction score

---

### Phase 2: Collaboration & Memories (Months 4-6)

**Goal:** Transform into collaboration platform with memory management

**Features:**
- 📸 Photo/Video Upload
- 🗂️ Shared Albums
- 💬 Trip Chat
- 🔔 Real-time Notifications
- 📍 Location Tracking
- 📊 Advanced Expense Splitting (Custom, Percentage, Item-wise)
- 💳 Payment Integration (UPI, PayPal)
- 📱 Push Notifications
- 🌙 Dark Mode


**Deliverables:**
- Public launch on app stores
- Marketing campaign
- 50K active users
- Premium tier launched

**Success Metrics:**
- 100K photos uploaded
- 60% users enable notifications
- 10K premium conversions
- 70% 30-day retention

---

### Phase 3: Intelligence & Integration (Months 7-9)

**Goal:** Add AI features and third-party integrations

**Features:**
- 🤖 AI Travel Assistant
- 🗺️ Destination Recommendations
- 📋 Auto-generated Itineraries
- ☁️ Google Drive Integration
- ☁️ OneDrive Integration
- 📄 Document Storage
- 🔍 Receipt OCR
- 📊 Advanced Analytics
- 🗺️ Interactive Maps
- 🎯 Nearby Places Recommendations

**Deliverables:**
- AI-powered features live
- Cloud storage integrations
- 200K active users
- Partnership with travel brands

**Success Metrics:**
- 50% use AI recommendations
- 30% connect cloud storage
- 20K premium users
- $50K MRR

---


### Phase 4: Scale & Enterprise (Months 10-12)

**Goal:** Scale to 1M users and launch enterprise features

**Features:**
- 🏢 Corporate Travel Management
- 👨‍👩‍👧 Family Subscription Plans
- 📱 Offline Mode
- 🌍 Multi-language Support (10 languages)
- 🎭 Custom Themes
- 🏨 Hotel/Flight Recommendations (Affiliate)
- 📊 Public Trip Marketplace
- 🎖️ Badges & Gamification
- 📈 Admin Dashboard
- 🔐 Enterprise SSO

**Deliverables:**
- 1M+ active users
- Enterprise tier launched
- API for third-party integrations
- Global expansion (5 countries)

**Success Metrics:**
- 1M users milestone
- 100K premium subscribers
- $200K MRR
- Series A funding raised

---

## 20. Success Metrics

### 20.1 Key Metrics by Phase

| Metric | MVP (Month 3) | Phase 2 (Month 6) | Phase 3 (Month 9) | Phase 4 (Month 12) |
|--------|---------------|-------------------|-------------------|---------------------|
| **Active Users** | 5K | 50K | 200K | 1M |
| **Trips Created** | 2K | 25K | 100K | 500K |
| **Photos Uploaded** | 10K | 100K | 1M | 10M |
| **Premium Users** | 100 | 2.5K | 20K | 100K |
| **MRR** | $500 | $12K | $50K | $200K |
| **App Rating** | 4.3 | 4.5 | 4.6 | 4.7 |
| **Retention (30d)** | 40% | 60% | 70% | 75% |


---

## 22. Technology Stack

### 22.1 Frontend

**Mobile Applications:**
- **Framework:** React Native 0.81 with Expo SDK 54
- **Language:** TypeScript 5.9
- **State Management:** React Context API + Zustand (for complex state)
- **Navigation:** React Navigation 7
- **Forms:** React Hook Form + Zod validation
- **UI Components:** Custom component library + React Native Paper
- **Icons:** Lucide React Native
- **Maps:** React Native Maps
- **Storage:** AsyncStorage (local) + Supabase (cloud)
- **Camera:** Expo Camera & Image Picker
- **Push Notifications:** Expo Notifications
- **Analytics:** Expo Analytics + Segment

**Web Application:**
- **Framework:** React 19.1 with Next.js 14 (future)
- **Same stack as mobile for consistency**
- **PWA:** Service Workers for offline support

### 22.2 Backend (Supabase)

**Core Services:**
- **Database:** PostgreSQL 15
- **Authentication:** Supabase Auth (supports OTP, OAuth)
- **API:** Supabase Edge Functions (Deno)
- **Real-time:** Supabase Realtime (WebSockets)
- **Storage:** Supabase Storage (S3-compatible)
- **File Processing:** Sharp (image optimization)

**Additional Backend:**
- **Serverless Functions:** Supabase Edge Functions
- **Cron Jobs:** pg_cron for scheduled tasks
- **Search:** Supabase Full-Text Search
- **Vector DB:** pgvector for AI embeddings


### 22.3 AI & Machine Learning

- **LLM:** OpenAI GPT-4 (recommendations, itineraries)
- **Vision API:** OpenAI GPT-4 Vision (receipt OCR)
- **Embeddings:** OpenAI text-embedding-3-small
- **Vector Store:** Supabase pgvector
- **ML:** TensorFlow Lite (on-device photo classification)

### 22.4 Third-Party Integrations

**Cloud Storage:**
- Google Drive API
- Microsoft OneDrive API
- Dropbox API (future)
- iCloud Drive (future)

**Maps & Location:**
- Google Maps API
- Mapbox (alternative)
- Google Places API

**Payments:**
- Stripe (international)
- Razorpay (India)
- PayPal
- UPI integration

**Communication:**
- SendGrid (Email)
- Twilio (SMS)
- Firebase Cloud Messaging (Push)

**Travel Data:**
- Amadeus Travel API
- Skyscanner API (flights)
- Booking.com API (hotels)
- TripAdvisor API (reviews)

### 22.5 DevOps & Infrastructure

**Hosting:**
- Supabase (database, auth, storage)
- Vercel (web app hosting)
- Expo EAS (mobile app building & OTA updates)

**CI/CD:**
- GitHub Actions
- Expo EAS Build
- Automated testing pipeline

**Monitoring:**
- Sentry (error tracking)
- Supabase Dashboard (database monitoring)
- Expo Analytics


**Security:**
- Supabase Row Level Security (RLS)
- SSL/TLS encryption
- JWT token management
- OAuth 2.0
- Regular security audits

---

## 23. Team Responsibilities

### 23.1 Core Team Structure

**Product Team:**
- **Product Manager (1)**: Overall product vision, roadmap, priorities
- **Product Designer (1)**: UI/UX design, user research, prototypes

**Engineering Team:**
- **Frontend Lead (1)**: React Native architecture, code quality
- **Frontend Developers (2-3)**: Feature implementation, mobile + web
- **Backend Lead (1)**: Supabase setup, API design, database
- **Backend Developers (1-2)**: Edge Functions, integrations
- **AI Engineer (1)**: AI features, ML models, recommendations
- **DevOps Engineer (0.5)**: CI/CD, monitoring, infrastructure

**Quality & Support:**
- **QA Engineer (1)**: Manual testing, automation, test plans
- **Support Lead (0.5)**: User support, documentation

**Marketing & Growth:**
- **Growth Manager (1)**: User acquisition, retention
- **Content Creator (0.5)**: Blog, social media

**Total Team Size:** 10-12 people


### 23.2 Responsibility Matrix (RACI)

| Task | PM | Designer | FE Lead | FE Dev | BE Lead | BE Dev | AI Eng | QA | DevOps |
|------|----|---------  |---------|--------|---------|--------|--------|----|---------| 
| Product Strategy | A | C | C | I | C | I | I | I | I |
| UI/UX Design | C | A | C | I | I | I | I | C | I |
| Feature Development | R | C | A | R | C | I | I | I | I |
| API Development | C | I | C | I | A | R | C | I | I |
| Database Design | C | I | C | I | A | R | I | I | I |
| AI Features | C | I | I | I | C | C | A | I | I |
| Testing | R | I | C | C | C | C | C | A | I |
| Deployment | R | I | C | I | C | I | I | C | A |

**Legend:** A=Accountable, R=Responsible, C=Consulted, I=Informed

---

## 24. Appendix

### 24.1 Glossary

- **OTP**: One-Time Password
- **JWT**: JSON Web Token
- **OCR**: Optical Character Recognition
- **RLS**: Row Level Security
- **PWA**: Progressive Web App
- **MRR**: Monthly Recurring Revenue
- **CLV**: Customer Lifetime Value
- **CAC**: Customer Acquisition Cost
- **DAU**: Daily Active Users
- **MAU**: Monthly Active Users

### 24.2 References

- Supabase Documentation: https://supabase.com/docs
- React Native Documentation: https://reactnative.dev
- Expo Documentation: https://docs.expo.dev
- OpenAI API: https://platform.openai.com/docs


### 24.3 Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 2025 | Product Team | Initial PRD draft |
| 2.0 | Jan 2025 | Product Team | Expanded to full collaboration platform vision |
| 3.0 | Jul 2026 | Product Team | Corrected to greenfield status — no prior code exists |

---

## Conclusion

TripWise represents a greenfield build of a comprehensive intelligent travel collaboration platform. By consolidating trip planning, memory preservation, expense management, and AI-powered recommendations into a single application, we aim to become the indispensable companion for every traveler.

**Key Success Factors:**
1. **User-Centric Design**: Simple, beautiful, intuitive
2. **Technical Excellence**: Scalable, reliable, fast
3. **AI Integration**: Smart recommendations that users love
4. **Privacy First**: Users control their data
5. **Community Building**: Network effects through sharing
6. **Continuous Innovation**: Regular feature updates

**Next Steps:**
1. 🔲 PRD review and approval by stakeholders
2. 🔲 Expo project scaffold + Supabase project creation
3. 🔲 UI/UX mockups and prototypes
4. 🔲 Phase 0 backend bootstrap (schema, RLS, storage buckets)
5. 🔲 Phase 1 auth screens + Supabase Auth wiring

---

**Document Status:** Ready for Review  
**Approval Required From:**
- [ ] CEO/Founder
- [ ] CTO
- [ ] Head of Product
- [ ] Engineering Lead
- [ ] Design Lead

**Contact:**
For questions or feedback about this PRD, contact the Product Team.

---

*End of Product Requirements Document*
