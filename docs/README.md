# TripWise Documentation

All long-form documentation for the TripWise project lives here.

**Project status:** Not started. No code exists yet. These documents define the full product before the first line is written.

| Document | Purpose |
|----------|---------|
| [PRD.md](./PRD.md) | Full Product Requirements Document — vision, personas, features, database & API design, roadmap. |
| [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) | Executive overview — tech stack, folder structure, conventions, and what's missing from original thinking. |
| [DEVELOPMENT_PHASES.md](./DEVELOPMENT_PHASES.md) | Phase-by-phase execution plan with deliverables, acceptance criteria, and effort estimates. |
| [SCREEN_INVENTORY.md](./SCREEN_INVENTORY.md) | Every screen (~106) with purpose, elements, actions, navigation, and target phase. |
| [SUPABASE_FEASIBILITY.md](./SUPABASE_FEASIBILITY.md) | Technical analysis proving every feature is achievable on Supabase. |

---

## Quick Start (once development begins)

```bash
# 1. Clone and install
git clone <repo-url>
cd tripwise
npm install

# 2. Set up environment
cp .env.example .env
# Fill in SUPABASE_URL and SUPABASE_ANON_KEY from your Supabase project

# 3. Start Supabase locally (optional, for backend development)
npx supabase start
npx supabase db reset  # applies all migrations + seed

# 4. Start the app
npx expo start
# Press 'i' for iOS, 'a' for Android, 'w' for web
```

---

## Key decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Framework | React Native + Expo | Single codebase for iOS, Android, Web. Expo simplifies builds and OTA updates. |
| Backend | Supabase | Auth, DB, Storage, Realtime, Edge Functions — all in one. 90% of features native. |
| State | Zustand | Simple, performant, no boilerplate. React Context only for auth session. |
| Forms | React Hook Form + Zod | Type-safe validation, minimal re-renders. |
| Navigation | React Navigation 7 | Mature, well-documented, supports all patterns (stack, tabs, drawer). |
| Styling | Custom design system | Full control over branding. No third-party UI kit dependency. |
| AI | OpenAI GPT-4o | Best quality for recommendations and OCR. Edge Functions proxy all calls. |
| Lists | FlashList | 5x faster than FlatList for large datasets. |
