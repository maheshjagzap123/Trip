-- ============================================================
-- ExpenseX Migration Script (FIXED)
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- STEP 1: Add group_type column to trips table
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.trips 
ADD COLUMN IF NOT EXISTS group_type TEXT DEFAULT 'Trip';

UPDATE public.trips 
SET group_type = COALESCE(trip_type, 'Trip') 
WHERE group_type = 'Trip' OR group_type IS NULL;

-- ────────────────────────────────────────────────────────────
-- STEP 2: Make start_date and end_date nullable
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.trips ALTER COLUMN start_date DROP NOT NULL;
ALTER TABLE public.trips ALTER COLUMN end_date DROP NOT NULL;

-- ────────────────────────────────────────────────────────────
-- STEP 3: Add fields to profiles
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS upi_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS upi_display_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ────────────────────────────────────────────────────────────
-- STEP 4: Ensure all required tables exist
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'INR',
  category TEXT DEFAULT 'Other',
  paid_by UUID NOT NULL,
  expense_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  split_method TEXT DEFAULT 'equal',
  split_type TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  is_settled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  paid_by UUID NOT NULL,
  paid_to UUID NOT NULL,
  amount NUMERIC NOT NULL,
  method TEXT DEFAULT 'cash',
  status TEXT DEFAULT 'pending',
  transaction_ref TEXT,
  notes TEXT,
  confirmed_at TIMESTAMPTZ,
  dispute_reason TEXT,
  dispute_screenshot TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  media_url TEXT,
  reply_to UUID,
  is_pinned BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  storage_path TEXT DEFAULT '',
  thumbnail_url TEXT,
  caption TEXT,
  width INTEGER,
  height INTEGER,
  drive_file_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.trip_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cloud_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  provider TEXT NOT NULL DEFAULT 'google_drive',
  access_token TEXT,
  provider_email TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- ────────────────────────────────────────────────────────────
-- STEP 5: DROP existing functions then recreate
-- (Required because return types changed)
-- ────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.get_trip_members(UUID);
DROP FUNCTION IF EXISTS public.get_profiles_by_ids(UUID[]);
DROP FUNCTION IF EXISTS public.find_profile_by_email(TEXT);
DROP FUNCTION IF EXISTS public.compute_trip_balances(UUID);
DROP FUNCTION IF EXISTS public.get_user_analytics(UUID);
DROP FUNCTION IF EXISTS public.get_trip_timeline(UUID);

-- Function: Get group members
CREATE FUNCTION public.get_trip_members(p_trip_id UUID)
RETURNS TABLE(
  id UUID,
  trip_id UUID,
  user_id UUID,
  role TEXT,
  status TEXT,
  joined_at TIMESTAMPTZ,
  invited_by UUID,
  created_at TIMESTAMPTZ
) 
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT id, trip_id, user_id, role, status, joined_at, invited_by, created_at
  FROM public.trip_members
  WHERE trip_id = p_trip_id;
$$;

-- Function: Get profiles by IDs
CREATE FUNCTION public.get_profiles_by_ids(user_ids UUID[])
RETURNS TABLE(
  id UUID,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  upi_id TEXT,
  upi_display_name TEXT
)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT id, display_name, email, avatar_url, upi_id, upi_display_name
  FROM public.profiles
  WHERE id = ANY(user_ids);
$$;

-- Function: Find profile by email
CREATE FUNCTION public.find_profile_by_email(lookup_email TEXT)
RETURNS TABLE(id UUID, display_name TEXT, email TEXT)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT id, display_name, email
  FROM public.profiles
  WHERE LOWER(email) = LOWER(lookup_email);
$$;

-- Function: Compute group balances
CREATE FUNCTION public.compute_trip_balances(p_trip_id UUID)
RETURNS TABLE(
  user_id UUID,
  display_name TEXT,
  total_paid NUMERIC,
  total_owed NUMERIC,
  net_balance NUMERIC
)
LANGUAGE sql SECURITY DEFINER
AS $$
  WITH member_ids AS (
    SELECT tm.user_id
    FROM public.trip_members tm
    WHERE tm.trip_id = p_trip_id AND tm.status = 'active'
  ),
  paid AS (
    SELECT e.paid_by AS user_id, COALESCE(SUM(e.amount), 0) AS total_paid
    FROM public.expenses e
    WHERE e.trip_id = p_trip_id
    GROUP BY e.paid_by
  ),
  owed AS (
    SELECT es.user_id, COALESCE(SUM(es.amount), 0) AS total_owed
    FROM public.expense_splits es
    JOIN public.expenses e ON e.id = es.expense_id
    WHERE e.trip_id = p_trip_id
    GROUP BY es.user_id
  ),
  confirmed_settlements_paid AS (
    SELECT s.paid_by AS user_id, COALESCE(SUM(s.amount), 0) AS settled_paid
    FROM public.settlements s
    WHERE s.trip_id = p_trip_id AND s.status = 'confirmed'
    GROUP BY s.paid_by
  ),
  confirmed_settlements_received AS (
    SELECT s.paid_to AS user_id, COALESCE(SUM(s.amount), 0) AS settled_received
    FROM public.settlements s
    WHERE s.trip_id = p_trip_id AND s.status = 'confirmed'
    GROUP BY s.paid_to
  )
  SELECT 
    m.user_id,
    COALESCE(p.display_name, 'Unknown') AS display_name,
    COALESCE(paid.total_paid, 0) AS total_paid,
    COALESCE(owed.total_owed, 0) AS total_owed,
    (COALESCE(paid.total_paid, 0) - COALESCE(owed.total_owed, 0) 
     + COALESCE(csp.settled_paid, 0) - COALESCE(csr.settled_received, 0)) AS net_balance
  FROM member_ids m
  LEFT JOIN public.profiles p ON p.id = m.user_id
  LEFT JOIN paid ON paid.user_id = m.user_id
  LEFT JOIN owed ON owed.user_id = m.user_id
  LEFT JOIN confirmed_settlements_paid csp ON csp.user_id = m.user_id
  LEFT JOIN confirmed_settlements_received csr ON csr.user_id = m.user_id;
$$;

-- Function: Get user analytics
CREATE FUNCTION public.get_user_analytics(p_user_id UUID)
RETURNS TABLE(
  total_trips BIGINT,
  total_spent NUMERIC,
  total_owed NUMERIC,
  top_category TEXT,
  top_category_amount NUMERIC
)
LANGUAGE sql SECURITY DEFINER
AS $$
  WITH user_trips AS (
    SELECT tm.trip_id
    FROM public.trip_members tm
    WHERE tm.user_id = p_user_id AND tm.status = 'active'
  ),
  spending AS (
    SELECT COALESCE(SUM(es.amount), 0) AS total_spent
    FROM public.expense_splits es
    JOIN public.expenses e ON e.id = es.expense_id
    WHERE es.user_id = p_user_id AND e.trip_id IN (SELECT trip_id FROM user_trips)
  ),
  paid_total AS (
    SELECT COALESCE(SUM(e.amount), 0) AS total_owed
    FROM public.expenses e
    WHERE e.paid_by = p_user_id AND e.trip_id IN (SELECT trip_id FROM user_trips)
  ),
  top_cat AS (
    SELECT e.category, COALESCE(SUM(es.amount), 0) AS cat_amount
    FROM public.expense_splits es
    JOIN public.expenses e ON e.id = es.expense_id
    WHERE es.user_id = p_user_id AND e.trip_id IN (SELECT trip_id FROM user_trips)
    GROUP BY e.category
    ORDER BY cat_amount DESC
    LIMIT 1
  )
  SELECT 
    (SELECT COUNT(*) FROM user_trips) AS total_trips,
    (SELECT total_spent FROM spending) AS total_spent,
    (SELECT total_owed FROM paid_total) AS total_owed,
    (SELECT category FROM top_cat) AS top_category,
    (SELECT cat_amount FROM top_cat) AS top_category_amount;
$$;

-- Function: Get group activity/timeline
CREATE FUNCTION public.get_trip_timeline(p_trip_id UUID)
RETURNS TABLE(
  id TEXT,
  type TEXT,
  title TEXT,
  subtitle TEXT,
  user_id UUID,
  user_name TEXT,
  event_date DATE,
  created_at TIMESTAMPTZ,
  data JSONB
)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT 
    e.id::TEXT,
    'expense'::TEXT AS type,
    e.title,
    '₹' || e.amount::TEXT || ' • ' || e.category AS subtitle,
    e.paid_by AS user_id,
    COALESCE(p.display_name, 'Unknown') AS user_name,
    e.expense_date AS event_date,
    e.created_at,
    jsonb_build_object('amount', e.amount, 'category', e.category) AS data
  FROM public.expenses e
  LEFT JOIN public.profiles p ON p.id = e.paid_by
  WHERE e.trip_id = p_trip_id

  UNION ALL

  SELECT 
    n.id::TEXT,
    'note'::TEXT AS type,
    COALESCE(n.title, 'Note') AS title,
    LEFT(n.content, 100) AS subtitle,
    n.user_id,
    COALESCE(p.display_name, 'Unknown') AS user_name,
    n.created_at::DATE AS event_date,
    n.created_at,
    '{}'::JSONB AS data
  FROM public.trip_notes n
  LEFT JOIN public.profiles p ON p.id = n.user_id
  WHERE n.trip_id = p_trip_id

  UNION ALL

  SELECT 
    m.id::TEXT,
    'photo'::TEXT AS type,
    m.file_name AS title,
    COALESCE(m.caption, 'Photo uploaded') AS subtitle,
    m.uploaded_by AS user_id,
    COALESCE(p.display_name, 'Unknown') AS user_name,
    m.created_at::DATE AS event_date,
    m.created_at,
    '{}'::JSONB AS data
  FROM public.media m
  LEFT JOIN public.profiles p ON p.id = m.uploaded_by
  WHERE m.trip_id = p_trip_id

  ORDER BY created_at DESC
  LIMIT 100;
$$;

-- ────────────────────────────────────────────────────────────
-- STEP 6: Enable Realtime (ignore errors if already enabled)
-- ────────────────────────────────────────────────────────────

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.settlements;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.media;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_members;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ────────────────────────────────────────────────────────────
-- STEP 7: Indexes
-- ────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_expenses_trip_id ON public.expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_expense_id ON public.expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_user_id ON public.expense_splits(user_id);
CREATE INDEX IF NOT EXISTS idx_settlements_trip_id ON public.settlements(trip_id);
CREATE INDEX IF NOT EXISTS idx_messages_trip_id ON public.messages(trip_id);
CREATE INDEX IF NOT EXISTS idx_media_trip_id ON public.media(trip_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_members_trip_id ON public.trip_members(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_members_user_id ON public.trip_members(user_id);

-- ────────────────────────────────────────────────────────────
-- DONE! Verify:
-- ────────────────────────────────────────────────────────────

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'trips' 
AND column_name IN ('group_type', 'start_date', 'end_date')
ORDER BY column_name;
