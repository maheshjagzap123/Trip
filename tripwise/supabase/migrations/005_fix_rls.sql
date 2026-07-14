-- ============================================================
-- FIX: Profile RLS policies
-- Problem: The "trip member profiles" SELECT policy was interfering
-- with users reading/updating their own profile.
-- Solution: Drop and recreate with cleaner logic.
-- 
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Drop existing profile policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read trip member profiles" ON public.profiles;

-- Recreate: Users can ALWAYS read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR
    id IN (
      SELECT tm.user_id FROM public.trip_members tm
      WHERE tm.trip_id IN (
        SELECT tm2.trip_id FROM public.trip_members tm2
        WHERE tm2.user_id = auth.uid()
      )
    )
  );

-- Users can update ONLY their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (for trigger / edge cases)
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
