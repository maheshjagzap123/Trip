# TripWise

Intelligent travel collaboration platform. Plan trips, split expenses, save memories — all in one app.

## Tech Stack

- **Frontend:** React Native 0.86 + Expo SDK 57 + TypeScript
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **State:** Zustand
- **Navigation:** React Navigation 7

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Fill in your Supabase URL and anon key

# Start development
npx expo start
# Press 'w' for web, 'i' for iOS, 'a' for Android
```

## Project Structure

```
src/
├── lib/          # Supabase client, env config
├── navigation/   # App navigator, stacks, tabs
├── screens/      # Screen components by module
├── stores/       # Zustand state stores
├── theme/        # Colors, typography, spacing
└── types/        # TypeScript type definitions
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run web` | Start web version |
| `npm run typecheck` | Run TypeScript checks |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## Supabase

Database migrations are in `supabase/migrations/`. To apply:
1. Go to Supabase Dashboard → SQL Editor
2. Run `supabase/migrations/full_migration.sql`

## Current Status

- ✅ Phase 0: Project scaffold, Supabase schema, RLS, storage
- 🚧 Phase 1: Authentication + profile (in progress)
