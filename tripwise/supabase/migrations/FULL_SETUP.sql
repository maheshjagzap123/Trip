-- ============================================================
-- TripWise — COMPLETE DATABASE SETUP (Phases 0–4)
-- Run this ENTIRE script in Supabase Dashboard → SQL Editor
-- This creates everything from scratch in a single run.
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

-- Profiles
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

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  paid_by UUID NOT NULL REFERENCES public.profiles(id),
  title VARCHAR(200) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  category VARCHAR(50) DEFAULT 'Miscellaneous',
  split_type VARCHAR(20) DEFAULT 'equal',
  split_method VARCHAR(20) DEFAULT 'equal',
  notes TEXT,
  receipt_url TEXT,
  expense_date DATE DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT positive_amount CHECK (amount > 0)
);

-- Expense Splits
CREATE TABLE IF NOT EXISTS public.expense_splits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  amount DECIMAL(12,2) NOT NULL,
  is_settled BOOLEAN DEFAULT false,
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(expense_id, user_id),
  CONSTRAINT non_negative_split CHECK (amount >= 0)
);

-- Settlements
CREATE TABLE IF NOT EXISTS public.settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  paid_by UUID NOT NULL REFERENCES public.profiles(id),
  paid_to UUID NOT NULL REFERENCES public.profiles(id),
  amount DECIMAL(12,2) NOT NULL,
  method VARCHAR(50) DEFAULT 'cash',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT positive_settlement CHECK (amount > 0)
);

-- Media
CREATE TABLE IF NOT EXISTS public.media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  storage_path TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
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
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_expenses_trip ON public.expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by ON public.expenses(paid_by);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_expense_splits_expense ON public.expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_user ON public.expense_splits(user_id);
CREATE INDEX IF NOT EXISTS idx_settlements_trip ON public.settlements(trip_id);
CREATE INDEX IF NOT EXISTS idx_media_trip ON public.media(trip_id);
CREATE INDEX IF NOT EXISTS idx_media_user ON public.media(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_date ON public.media(created_at DESC);

-- ============================================================
-- 4. FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
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

DROP TRIGGER IF EXISTS expenses_updated_at ON public.expenses;
CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone)
  VALUES (NEW.id, NEW.email, NEW.phone);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Notification trigger: invite
CREATE OR REPLACE FUNCTION public.notify_trip_invite()
RETURNS TRIGGER AS $$
DECLARE
  trip_record RECORD;
  inviter_record RECORD;
BEGIN
  IF NEW.status = 'pending' AND NEW.invited_by IS NOT NULL THEN
    SELECT trip_name, destination INTO trip_record FROM public.trips WHERE id = NEW.trip_id;
    SELECT display_name INTO inviter_record FROM public.profiles WHERE id = NEW.invited_by;
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      NEW.user_id, 'trip_invite', 'Trip Invitation',
      COALESCE(inviter_record.display_name, 'Someone') || ' invited you to "' || trip_record.trip_name || '"',
      jsonb_build_object('trip_id', NEW.trip_id, 'trip_name', trip_record.trip_name, 'destination', trip_record.destination, 'invited_by', NEW.invited_by, 'invited_by_name', COALESCE(inviter_record.display_name, 'A friend'))
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_trip_member_invited ON public.trip_members;
CREATE TRIGGER on_trip_member_invited
  AFTER INSERT ON public.trip_members
  FOR EACH ROW EXECUTE FUNCTION public.notify_trip_invite();

-- Notification trigger: accept
CREATE OR REPLACE FUNCTION public.notify_invite_accepted()
RETURNS TRIGGER AS $$
DECLARE
  trip_record RECORD;
  accepter_record RECORD;
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'active' THEN
    SELECT trip_name, created_by INTO trip_record FROM public.trips WHERE id = NEW.trip_id;
    SELECT display_name INTO accepter_record FROM public.profiles WHERE id = NEW.user_id;
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      trip_record.created_by, 'trip_accepted', 'Invitation Accepted',
      COALESCE(accepter_record.display_name, 'Someone') || ' joined "' || trip_record.trip_name || '"',
      jsonb_build_object('trip_id', NEW.trip_id, 'trip_name', trip_record.trip_name, 'user_id', NEW.user_id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_invite_accepted ON public.trip_members;
CREATE TRIGGER on_invite_accepted
  AFTER UPDATE ON public.trip_members
  FOR EACH ROW EXECUTE FUNCTION public.notify_invite_accepted();

-- Compute trip balances
CREATE OR REPLACE FUNCTION public.compute_trip_balances(p_trip_id UUID)
RETURNS TABLE(user_id UUID, display_name TEXT, total_paid DECIMAL, total_owed DECIMAL, net_balance DECIMAL)
AS $$
BEGIN
  RETURN QUERY
  WITH member_list AS (
    SELECT tm.user_id, p.display_name
    FROM public.trip_members tm
    JOIN public.profiles p ON p.id = tm.user_id
    WHERE tm.trip_id = p_trip_id AND tm.status = 'active'
  ),
  paid AS (
    SELECT e.paid_by AS user_id, COALESCE(SUM(e.amount), 0) AS total_paid
    FROM public.expenses e WHERE e.trip_id = p_trip_id GROUP BY e.paid_by
  ),
  owed AS (
    SELECT es.user_id, COALESCE(SUM(es.amount), 0) AS total_owed
    FROM public.expense_splits es
    JOIN public.expenses e ON e.id = es.expense_id
    WHERE e.trip_id = p_trip_id GROUP BY es.user_id
  ),
  settled_paid AS (
    SELECT s.paid_by AS user_id, COALESCE(SUM(s.amount), 0) AS amount
    FROM public.settlements s WHERE s.trip_id = p_trip_id GROUP BY s.paid_by
  ),
  settled_received AS (
    SELECT s.paid_to AS user_id, COALESCE(SUM(s.amount), 0) AS amount
    FROM public.settlements s WHERE s.trip_id = p_trip_id GROUP BY s.paid_to
  )
  SELECT ml.user_id, ml.display_name::TEXT,
    COALESCE(p.total_paid, 0)::DECIMAL AS total_paid,
    COALESCE(o.total_owed, 0)::DECIMAL AS total_owed,
    (COALESCE(p.total_paid, 0) - COALESCE(o.total_owed, 0) + COALESCE(sp.amount, 0) - COALESCE(sr.amount, 0))::DECIMAL AS net_balance
  FROM member_list ml
  LEFT JOIN paid p ON p.user_id = ml.user_id
  LEFT JOIN owed o ON o.user_id = ml.user_id
  LEFT JOIN settled_paid sp ON sp.user_id = ml.user_id
  LEFT JOIN settled_received sr ON sr.user_id = ml.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get trip members (bypass RLS)
CREATE OR REPLACE FUNCTION public.get_trip_members(p_trip_id UUID)
RETURNS SETOF public.trip_members AS $$
  SELECT * FROM public.trip_members WHERE trip_id = p_trip_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Find profile by email (bypass RLS)
CREATE OR REPLACE FUNCTION public.find_profile_by_email(lookup_email TEXT)
RETURNS TABLE(id UUID) AS $$
  SELECT id FROM public.profiles WHERE email = lookup_email;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get profiles by IDs (bypass RLS)
CREATE OR REPLACE FUNCTION public.get_profiles_by_ids(user_ids UUID[])
RETURNS TABLE(id UUID, display_name TEXT, email TEXT, avatar_url TEXT) AS $$
  SELECT p.id, p.display_name::TEXT, p.email::TEXT, p.avatar_url::TEXT
  FROM public.profiles p WHERE p.id = ANY(user_ids);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- TRIPS
CREATE POLICY "Members can read their trips" ON public.trips FOR SELECT
  USING (created_by = auth.uid() OR id IN (SELECT trip_id FROM public.trip_members WHERE user_id = auth.uid() AND status IN ('active', 'pending')));
CREATE POLICY "Authenticated users can create trips" ON public.trips FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Admins can update trips" ON public.trips FOR UPDATE
  USING (id IN (SELECT trip_id FROM public.trip_members WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can delete trips" ON public.trips FOR DELETE
  USING (id IN (SELECT trip_id FROM public.trip_members WHERE user_id = auth.uid() AND role = 'admin'));

-- TRIP MEMBERS (simple, non-recursive)
CREATE POLICY "select_own_memberships" ON public.trip_members FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "insert_trip_members" ON public.trip_members FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "update_own_membership" ON public.trip_members FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "delete_own_membership" ON public.trip_members FOR DELETE USING (user_id = auth.uid());

-- NOTIFICATIONS
CREATE POLICY "Users can read own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- EXPENSES (simple — app logic controls trip-level access)
CREATE POLICY "Can read expenses" ON public.expenses FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Can add expenses" ON public.expenses FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Can update own expenses" ON public.expenses FOR UPDATE USING (paid_by = auth.uid() OR created_by = auth.uid());
CREATE POLICY "Can delete own expenses" ON public.expenses FOR DELETE USING (paid_by = auth.uid() OR created_by = auth.uid());

-- EXPENSE SPLITS
CREATE POLICY "Can read splits" ON public.expense_splits FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Can insert splits" ON public.expense_splits FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Can update splits" ON public.expense_splits FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Can delete splits" ON public.expense_splits FOR DELETE USING (auth.uid() IS NOT NULL);

-- SETTLEMENTS
CREATE POLICY "Can read settlements" ON public.settlements FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Can add settlements" ON public.settlements FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- MEDIA
CREATE POLICY "Can read media" ON public.media FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Can insert media" ON public.media FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Can delete own media" ON public.media FOR DELETE USING (uploaded_by = auth.uid());

-- ============================================================
-- 6. STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES
  ('avatars', 'avatars', true, 5242880),
  ('trip-covers', 'trip-covers', true, 10485760),
  ('trip-media', 'trip-media', true, 52428800),
  ('documents', 'documents', false, 20971520),
  ('receipts', 'receipts', false, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: avatars
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage policies: trip-covers (public read)
CREATE POLICY "Anyone can view trip covers" ON storage.objects FOR SELECT USING (bucket_id = 'trip-covers');
CREATE POLICY "Auth users can upload covers" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'trip-covers' AND auth.uid() IS NOT NULL);

-- Storage policies: trip-media (public read for simplicity, auth write)
CREATE POLICY "Anyone can view trip media" ON storage.objects FOR SELECT USING (bucket_id = 'trip-media');
CREATE POLICY "Auth users can upload media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'trip-media' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own media files" ON storage.objects FOR DELETE USING (bucket_id = 'trip-media' AND auth.uid() IS NOT NULL);

-- Storage policies: documents (private)
CREATE POLICY "Auth users can view documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents' AND auth.uid() IS NOT NULL);
CREATE POLICY "Auth users can upload documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

-- Storage policies: receipts (private)
CREATE POLICY "Auth users can view receipts" ON storage.objects FOR SELECT USING (bucket_id = 'receipts' AND auth.uid() IS NOT NULL);
CREATE POLICY "Auth users can upload receipts" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'receipts' AND auth.uid() IS NOT NULL);

-- ============================================================
-- 7. REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expense_splits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.settlements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.media;

-- ============================================================
-- DONE! After running this:
-- 1. Enable Email OTP in Auth → Providers
-- 2. Configure Custom SMTP in Auth → SMTP Settings
-- 3. Update .env with new SUPABASE_URL and SUPABASE_ANON_KEY
-- ============================================================
