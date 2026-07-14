-- ============================================================
-- Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES
-- ============================================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (for the handle_new_user trigger)
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can read profiles of people in their trips (for member lists)
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

-- ============================================================
-- TRIPS
-- ============================================================

-- Members can read trips they belong to
CREATE POLICY "Members can read their trips"
  ON public.trips FOR SELECT
  USING (
    id IN (
      SELECT trip_id FROM public.trip_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Authenticated users can create trips
CREATE POLICY "Authenticated users can create trips"
  ON public.trips FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Only trip admins can update trip details
CREATE POLICY "Admins can update trips"
  ON public.trips FOR UPDATE
  USING (
    id IN (
      SELECT trip_id FROM public.trip_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Only trip admins can delete trips
CREATE POLICY "Admins can delete trips"
  ON public.trips FOR DELETE
  USING (
    id IN (
      SELECT trip_id FROM public.trip_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- TRIP MEMBERS
-- ============================================================

-- Members can see other members of their trips
CREATE POLICY "Members can read trip members"
  ON public.trip_members FOR SELECT
  USING (
    trip_id IN (
      SELECT trip_id FROM public.trip_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Admins can add members to their trips
CREATE POLICY "Admins can add trip members"
  ON public.trip_members FOR INSERT
  WITH CHECK (
    trip_id IN (
      SELECT trip_id FROM public.trip_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR user_id = auth.uid() -- Allow self-insert (for trip creators)
  );

-- Admins can update member roles
CREATE POLICY "Admins can update trip members"
  ON public.trip_members FOR UPDATE
  USING (
    trip_id IN (
      SELECT trip_id FROM public.trip_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can remove members
CREATE POLICY "Admins can remove trip members"
  ON public.trip_members FOR DELETE
  USING (
    trip_id IN (
      SELECT trip_id FROM public.trip_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR user_id = auth.uid() -- Members can leave trips themselves
  );
