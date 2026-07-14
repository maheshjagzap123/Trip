-- ============================================================
-- TripWise Phase 0 — Full Migration Script
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- 2. TABLES
-- ============================================================

-- Profiles (extends auth.users with app-specific fields)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  phone VARCHAR(20),
  display_name VARCHAR(100),
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  avatar_url TEXT,
  date_of_birth DATE,
  gender VARCHAR(20),
  home_city VARCHAR(100),
  country VARCHAR(100),
  preferred_currency VARCHAR(3) DEFAULT 'INR',
  travel_interests TEXT[] DEFAULT '{}',
  profile_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trips
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_name VARCHAR(200) NOT NULL,
  destination VARCHAR(200),
  description TEXT,
  cover_image_url TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  budget_amount DECIMAL(12,2),
  budget_currency VARCHAR(3) DEFAULT 'INR',
  trip_type VARCHAR(50) DEFAULT 'Friends',
  status VARCHAR(20) DEFAULT 'Planning',
  privacy VARCHAR(20) DEFAULT 'Private',
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_dates CHECK (end_date >= start_date),
  CONSTRAINT positive_budget CHECK (budget_amount IS NULL OR budget_amount >= 0)
);

-- Trip Members
CREATE TABLE IF NOT EXISTS public.trip_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member',
  status VARCHAR(20) DEFAULT 'active',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(trip_id, user_id)
);

-- ============================================================
-- 3. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_trips_created_by ON public.trips(created_by);
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_dates ON public.trips(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_trip_members_trip ON public.trip_members(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_members_user ON public.trip_members(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_members_status ON public.trip_members(status);

-- ============================================================
-- 4. FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trips_updated_at ON public.trips;
CREATE TRIGGER trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Auto-create profile when a new user signs up via auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can read trip member profiles" ON public.profiles;
CREATE POLICY "Users can read trip member profiles"
  ON public.profiles FOR SELECT
  USING (
    id IN (
      SELECT tm.user_id FROM public.trip_members tm
      WHERE tm.trip_id IN (
        SELECT tm2.trip_id FROM public.trip_members tm2
        WHERE tm2.user_id = auth.uid()
      )
    )
  );

-- TRIPS policies
DROP POLICY IF EXISTS "Members can read their trips" ON public.trips;
CREATE POLICY "Members can read their trips"
  ON public.trips FOR SELECT
  USING (
    id IN (
      SELECT trip_id FROM public.trip_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create trips" ON public.trips;
CREATE POLICY "Authenticated users can create trips"
  ON public.trips FOR INSERT
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Admins can update trips" ON public.trips;
CREATE POLICY "Admins can update trips"
  ON public.trips FOR UPDATE
  USING (
    id IN (
      SELECT trip_id FROM public.trip_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete trips" ON public.trips;
CREATE POLICY "Admins can delete trips"
  ON public.trips FOR DELETE
  USING (
    id IN (
      SELECT trip_id FROM public.trip_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- TRIP MEMBERS policies
DROP POLICY IF EXISTS "Members can read trip members" ON public.trip_members;
CREATE POLICY "Members can read trip members"
  ON public.trip_members FOR SELECT
  USING (
    trip_id IN (
      SELECT trip_id FROM public.trip_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Admins can add trip members" ON public.trip_members;
CREATE POLICY "Admins can add trip members"
  ON public.trip_members FOR INSERT
  WITH CHECK (
    trip_id IN (
      SELECT trip_id FROM public.trip_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Admins can update trip members" ON public.trip_members;
CREATE POLICY "Admins can update trip members"
  ON public.trip_members FOR UPDATE
  USING (
    trip_id IN (
      SELECT trip_id FROM public.trip_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can remove trip members" ON public.trip_members;
CREATE POLICY "Admins can remove trip members"
  ON public.trip_members FOR DELETE
  USING (
    trip_id IN (
      SELECT trip_id FROM public.trip_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR user_id = auth.uid()
  );

-- ============================================================
-- 6. STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES
  ('avatars', 'avatars', true, 5242880),
  ('trip-covers', 'trip-covers', true, 10485760),
  ('trip-media', 'trip-media', false, 52428800),
  ('documents', 'documents', false, 20971520),
  ('receipts', 'receipts', false, 10485760)
ON CONFLICT (id) DO NOTHING;

-- AVATARS storage policies
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- TRIP COVERS storage policies
DROP POLICY IF EXISTS "Anyone can view trip covers" ON storage.objects;
CREATE POLICY "Anyone can view trip covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'trip-covers');

DROP POLICY IF EXISTS "Trip admins can upload covers" ON storage.objects;
CREATE POLICY "Trip admins can upload covers"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'trip-covers'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT trip_id FROM public.trip_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- TRIP MEDIA storage policies
DROP POLICY IF EXISTS "Trip members can view media" ON storage.objects;
CREATE POLICY "Trip members can view media"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'trip-media'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT trip_id FROM public.trip_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Trip members can upload media" ON storage.objects;
CREATE POLICY "Trip members can upload media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'trip-media'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT trip_id FROM public.trip_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Users can delete their own media" ON storage.objects;
CREATE POLICY "Users can delete their own media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'trip-media'
    AND owner_id = auth.uid()::text
  );

-- DOCUMENTS storage policies
DROP POLICY IF EXISTS "Trip members can view documents" ON storage.objects;
CREATE POLICY "Trip members can view documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT trip_id FROM public.trip_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Trip members can upload documents" ON storage.objects;
CREATE POLICY "Trip members can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT trip_id FROM public.trip_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- RECEIPTS storage policies
DROP POLICY IF EXISTS "Trip members can view receipts" ON storage.objects;
CREATE POLICY "Trip members can view receipts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT trip_id FROM public.trip_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Trip members can upload receipts" ON storage.objects;
CREATE POLICY "Trip members can upload receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT trip_id FROM public.trip_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- ============================================================
-- DONE! Verify by checking:
-- 1. Tables: profiles, trips, trip_members should appear in Table Editor
-- 2. Storage: 5 buckets should appear in Storage tab
-- 3. Auth: Sign up a test user → profiles row auto-creates
-- ============================================================
