-- ============================================================
-- TripWise — COMPLETE DATABASE SETUP
-- Run this ENTIRE script in Supabase Dashboard → SQL Editor
-- This creates everything from scratch in a single run.
-- Last updated: July 2026
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

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
  preferences JSONB DEFAULT '{}',
  phone_number VARCHAR(15),
  upi_id VARCHAR(100),
  upi_display_name VARCHAR(100),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_upi_id CHECK (
    upi_id IS NULL OR upi_id ~* '^[a-zA-Z0-9._\-]+@[a-zA-Z0-9]+$'
  )
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
  title VARCHAR(200) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  category VARCHAR(50) DEFAULT 'Miscellaneous',
  paid_by UUID NOT NULL REFERENCES public.profiles(id),
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  expense_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  split_method VARCHAR(20) DEFAULT 'equal',
  created_by UUID NOT NULL REFERENCES public.profiles(id),
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
  status VARCHAR(30) DEFAULT 'pending',
  transaction_ref VARCHAR(100),
  notes TEXT,
  confirmed_at TIMESTAMPTZ,
  dispute_reason TEXT,
  dispute_screenshot TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT positive_settlement CHECK (amount > 0),
  CONSTRAINT valid_settlement_status CHECK (
    status IN ('pending', 'initiated', 'pending_confirmation', 'confirmed', 'rejected')
  )
);

-- Media (photos/videos)
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

-- Messages (trip chat)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text',
  media_url TEXT,
  reply_to UUID REFERENCES public.messages(id),
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Trip Notes (timeline)
CREATE TABLE IF NOT EXISTS public.trip_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  title VARCHAR(200),
  content TEXT NOT NULL,
  note_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  title VARCHAR(200) NOT NULL,
  category VARCHAR(50) DEFAULT 'Other',
  file_name VARCHAR(255) NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type VARCHAR(100),
  file_size BIGINT,
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cloud Connections
CREATE TABLE IF NOT EXISTS public.cloud_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  provider_email VARCHAR(255),
  folder_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Expense Categories
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  emoji TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

INSERT INTO public.expense_categories (name, emoji, sort_order) VALUES
  ('Food', '🍽️', 1), ('Transport', '🚗', 2), ('Accommodation', '🏨', 3),
  ('Flight', '✈️', 4), ('Activities', '🎯', 5), ('Shopping', '🛍️', 6),
  ('Fuel', '⛽', 7), ('Parking', '🅿️', 8), ('Entertainment', '🎬', 9),
  ('Medical', '💊', 10), ('Miscellaneous', '📦', 11)
ON CONFLICT (name) DO NOTHING;


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
CREATE INDEX IF NOT EXISTS idx_settlements_paid_to_status ON public.settlements(paid_to, status);
CREATE INDEX IF NOT EXISTS idx_media_trip ON public.media(trip_id);
CREATE INDEX IF NOT EXISTS idx_media_user ON public.media(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_date ON public.media(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_trip ON public.messages(trip_id);
CREATE INDEX IF NOT EXISTS idx_messages_user ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_date ON public.messages(trip_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trip_notes_trip ON public.trip_notes(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_notes_date ON public.trip_notes(trip_id, note_date DESC);
CREATE INDEX IF NOT EXISTS idx_documents_trip ON public.documents(trip_id);
CREATE INDEX IF NOT EXISTS idx_documents_user ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_expiry ON public.documents(expiry_date);
CREATE INDEX IF NOT EXISTS idx_cloud_connections_user ON public.cloud_connections(user_id);

-- ============================================================
-- 4. FUNCTIONS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- Auto-create profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone)
  VALUES (NEW.id, NEW.email, NEW.phone);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Compute trip balances (only confirmed settlements reduce balance)
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
    FROM public.settlements s
    WHERE s.trip_id = p_trip_id AND s.status = 'confirmed' GROUP BY s.paid_by
  ),
  settled_received AS (
    SELECT s.paid_to AS user_id, COALESCE(SUM(s.amount), 0) AS amount
    FROM public.settlements s
    WHERE s.trip_id = p_trip_id AND s.status = 'confirmed' GROUP BY s.paid_to
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

-- User analytics (only counts data from existing trips)
CREATE OR REPLACE FUNCTION public.get_user_analytics(p_user_id UUID)
RETURNS TABLE(total_trips BIGINT, total_spent DECIMAL, total_owed DECIMAL, top_category TEXT, top_category_amount DECIMAL)
AS $$
BEGIN
  RETURN QUERY
  WITH trip_count AS (
    SELECT COUNT(*)::BIGINT AS cnt
    FROM public.trip_members tm JOIN public.trips t ON t.id = tm.trip_id
    WHERE tm.user_id = p_user_id AND tm.status = 'active'
  ),
  spending AS (
    SELECT COALESCE(SUM(es.amount), 0) AS total
    FROM public.expense_splits es
    JOIN public.expenses e ON e.id = es.expense_id
    JOIN public.trips t ON t.id = e.trip_id
    WHERE es.user_id = p_user_id
  ),
  paid AS (
    SELECT COALESCE(SUM(e.amount), 0) AS total
    FROM public.expenses e JOIN public.trips t ON t.id = e.trip_id
    WHERE e.paid_by = p_user_id
  ),
  categories AS (
    SELECT e.category, SUM(es.amount) AS cat_total
    FROM public.expense_splits es
    JOIN public.expenses e ON e.id = es.expense_id
    JOIN public.trips t ON t.id = e.trip_id
    WHERE es.user_id = p_user_id
    GROUP BY e.category ORDER BY cat_total DESC LIMIT 1
  )
  SELECT tc.cnt, s.total, p.total,
    COALESCE(c.category, 'None')::TEXT, COALESCE(c.cat_total, 0)::DECIMAL
  FROM trip_count tc, spending s, paid p
  LEFT JOIN categories c ON true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Trip timeline
CREATE OR REPLACE FUNCTION public.get_trip_timeline(p_trip_id UUID)
RETURNS TABLE(id UUID, type TEXT, title TEXT, subtitle TEXT, user_id UUID, user_name TEXT, event_date DATE, created_at TIMESTAMPTZ, data JSONB)
AS $$
BEGIN
  RETURN QUERY
  SELECT e.id, 'expense'::TEXT, e.title,
    ('₹' || e.amount::TEXT || ' • ' || e.category)::TEXT,
    e.paid_by, COALESCE(p.display_name, 'Member')::TEXT,
    e.expense_date, e.created_at,
    jsonb_build_object('amount', e.amount, 'category', e.category)
  FROM public.expenses e JOIN public.profiles p ON p.id = e.paid_by
  WHERE e.trip_id = p_trip_id
  UNION ALL
  SELECT n.id, 'note'::TEXT, COALESCE(n.title, 'Note')::TEXT,
    LEFT(n.content, 100)::TEXT, n.user_id,
    COALESCE(p.display_name, 'Member')::TEXT, n.note_date, n.created_at,
    jsonb_build_object('content', n.content)
  FROM public.trip_notes n JOIN public.profiles p ON p.id = n.user_id
  WHERE n.trip_id = p_trip_id
  UNION ALL
  SELECT m.id, 'photo'::TEXT, m.file_name::TEXT,
    'Photo uploaded'::TEXT, m.uploaded_by,
    COALESCE(p.display_name, 'Member')::TEXT, m.created_at::DATE, m.created_at,
    jsonb_build_object('storage_path', m.storage_path)
  FROM public.media m JOIN public.profiles p ON p.id = m.uploaded_by
  WHERE m.trip_id = p_trip_id
  ORDER BY event_date DESC, created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Cleanup old notifications (>24h)
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM public.notifications WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-delete notifications when trip is deleted
CREATE OR REPLACE FUNCTION public.cleanup_trip_notifications()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.notifications WHERE data->>'trip_id' = OLD.id::TEXT;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 5. TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trips_updated_at ON public.trips;
CREATE TRIGGER trips_updated_at BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS expenses_updated_at ON public.expenses;
CREATE TRIGGER expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS settlements_updated_at ON public.settlements;
CREATE TRIGGER settlements_updated_at BEFORE UPDATE ON public.settlements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_trip_deleted_cleanup_notifications ON public.trips;
CREATE TRIGGER on_trip_deleted_cleanup_notifications BEFORE DELETE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.cleanup_trip_notifications();

-- ============================================================
-- 6. NOTIFICATION TRIGGERS
-- ============================================================

-- Notify on trip invitation
CREATE OR REPLACE FUNCTION public.notify_trip_invite()
RETURNS TRIGGER AS $$
DECLARE trip_record RECORD; inviter_record RECORD;
BEGIN
  IF NEW.status = 'pending' AND NEW.invited_by IS NOT NULL THEN
    SELECT trip_name, destination INTO trip_record FROM public.trips WHERE id = NEW.trip_id;
    SELECT display_name INTO inviter_record FROM public.profiles WHERE id = NEW.invited_by;
    INSERT INTO public.notifications (user_id, type, title, body, data) VALUES (
      NEW.user_id, 'trip_invite', 'Trip Invitation',
      COALESCE(inviter_record.display_name, 'Someone') || ' invited you to "' || trip_record.trip_name || '"',
      jsonb_build_object('trip_id', NEW.trip_id, 'trip_name', trip_record.trip_name, 'destination', trip_record.destination, 'invited_by', NEW.invited_by, 'invited_by_name', COALESCE(inviter_record.display_name, 'A friend'))
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_trip_member_invited ON public.trip_members;
CREATE TRIGGER on_trip_member_invited AFTER INSERT ON public.trip_members FOR EACH ROW EXECUTE FUNCTION public.notify_trip_invite();

-- Notify on invite accepted
CREATE OR REPLACE FUNCTION public.notify_invite_accepted()
RETURNS TRIGGER AS $$
DECLARE trip_record RECORD; accepter_record RECORD;
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'active' THEN
    SELECT trip_name, created_by INTO trip_record FROM public.trips WHERE id = NEW.trip_id;
    SELECT display_name INTO accepter_record FROM public.profiles WHERE id = NEW.user_id;
    INSERT INTO public.notifications (user_id, type, title, body, data) VALUES (
      trip_record.created_by, 'trip_accepted', 'Invitation Accepted',
      COALESCE(accepter_record.display_name, 'Someone') || ' joined "' || trip_record.trip_name || '"',
      jsonb_build_object('trip_id', NEW.trip_id, 'trip_name', trip_record.trip_name, 'user_id', NEW.user_id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_invite_accepted ON public.trip_members;
CREATE TRIGGER on_invite_accepted AFTER UPDATE ON public.trip_members FOR EACH ROW EXECUTE FUNCTION public.notify_invite_accepted();

-- Notify on new expense
CREATE OR REPLACE FUNCTION public.notify_new_expense()
RETURNS TRIGGER AS $$
DECLARE trip_record RECORD; payer_record RECORD; member RECORD;
BEGIN
  SELECT trip_name INTO trip_record FROM public.trips WHERE id = NEW.trip_id;
  SELECT display_name INTO payer_record FROM public.profiles WHERE id = NEW.paid_by;
  FOR member IN SELECT user_id FROM public.trip_members WHERE trip_id = NEW.trip_id AND status = 'active' AND user_id != NEW.paid_by
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, data) VALUES (
      member.user_id, 'expense_added', trip_record.trip_name,
      COALESCE(payer_record.display_name, 'Someone') || ' added "' || NEW.title || '" (₹' || NEW.amount || ')',
      jsonb_build_object('trip_id', NEW.trip_id, 'expense_id', NEW.id)
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_expense ON public.expenses;
CREATE TRIGGER on_new_expense AFTER INSERT ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.notify_new_expense();

-- Notify on new chat message
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER AS $$
DECLARE trip_record RECORD; sender_record RECORD; member RECORD;
BEGIN
  SELECT trip_name INTO trip_record FROM public.trips WHERE id = NEW.trip_id;
  SELECT display_name INTO sender_record FROM public.profiles WHERE id = NEW.user_id;
  FOR member IN SELECT user_id FROM public.trip_members WHERE trip_id = NEW.trip_id AND status = 'active' AND user_id != NEW.user_id
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, data) VALUES (
      member.user_id, 'new_message', trip_record.trip_name,
      COALESCE(sender_record.display_name, 'Someone') || ': ' || LEFT(NEW.content, 100),
      jsonb_build_object('trip_id', NEW.trip_id, 'message_id', NEW.id, 'sender_id', NEW.user_id)
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_message ON public.messages;
CREATE TRIGGER on_new_message AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();

-- Notify on settlement status changes (UPI flow)
CREATE OR REPLACE FUNCTION public.notify_settlement_status_change()
RETURNS TRIGGER AS $$
DECLARE trip_record RECORD; payer_record RECORD; payee_record RECORD;
BEGIN
  SELECT trip_name INTO trip_record FROM public.trips WHERE id = NEW.trip_id;
  SELECT display_name INTO payer_record FROM public.profiles WHERE id = NEW.paid_by;
  SELECT display_name INTO payee_record FROM public.profiles WHERE id = NEW.paid_to;

  IF NEW.status = 'pending_confirmation' AND (OLD.status = 'initiated' OR OLD.status = 'pending') THEN
    INSERT INTO public.notifications (user_id, type, title, body, data) VALUES (
      NEW.paid_to, 'settlement_confirm_request', 'Payment confirmation needed',
      COALESCE(payer_record.display_name, 'Someone') || ' says they paid you Rs.' || NEW.amount || '. Confirm or dispute?',
      jsonb_build_object('trip_id', NEW.trip_id, 'settlement_id', NEW.id, 'amount', NEW.amount)
    );
  END IF;

  IF NEW.status = 'confirmed' AND OLD.status = 'pending_confirmation' THEN
    INSERT INTO public.notifications (user_id, type, title, body, data) VALUES (
      NEW.paid_by, 'settlement_confirmed', 'Payment confirmed',
      COALESCE(payee_record.display_name, 'Recipient') || ' confirmed your Rs.' || NEW.amount || ' payment.',
      jsonb_build_object('trip_id', NEW.trip_id, 'settlement_id', NEW.id, 'amount', NEW.amount)
    );
  END IF;

  IF NEW.status = 'rejected' AND OLD.status = 'pending_confirmation' THEN
    INSERT INTO public.notifications (user_id, type, title, body, data) VALUES (
      NEW.paid_by, 'settlement_disputed', 'Payment disputed',
      COALESCE(payee_record.display_name, 'Recipient') || ' disputed your Rs.' || NEW.amount || ' payment.',
      jsonb_build_object('trip_id', NEW.trip_id, 'settlement_id', NEW.id, 'amount', NEW.amount)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_settlement_status_change ON public.settlements;
CREATE TRIGGER on_settlement_status_change AFTER UPDATE OF status ON public.settlements FOR EACH ROW EXECUTE FUNCTION public.notify_settlement_status_change();

-- ============================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

-- PROFILES
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT
  USING (auth.uid() = id OR id IN (
    SELECT tm.user_id FROM public.trip_members tm WHERE tm.trip_id IN (
      SELECT tm2.trip_id FROM public.trip_members tm2 WHERE tm2.user_id = auth.uid()
    )
  ));
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- TRIPS
DROP POLICY IF EXISTS "Members can read their trips" ON public.trips;
CREATE POLICY "Members can read their trips" ON public.trips FOR SELECT
  USING (id IN (SELECT trip_id FROM public.trip_members WHERE user_id = auth.uid() AND status IN ('active', 'pending')));
DROP POLICY IF EXISTS "Authenticated users can create trips" ON public.trips;
CREATE POLICY "Authenticated users can create trips" ON public.trips FOR INSERT WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "Admins can update trips" ON public.trips;
CREATE POLICY "Admins can update trips" ON public.trips FOR UPDATE
  USING (id IN (SELECT trip_id FROM public.trip_members WHERE user_id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Admins can delete trips" ON public.trips;
CREATE POLICY "Admins can delete trips" ON public.trips FOR DELETE
  USING (id IN (SELECT trip_id FROM public.trip_members WHERE user_id = auth.uid() AND role = 'admin'));

-- TRIP MEMBERS
DROP POLICY IF EXISTS "Members can read trip members" ON public.trip_members;
CREATE POLICY "Members can read trip members" ON public.trip_members FOR SELECT
  USING (trip_id IN (SELECT trip_id FROM public.trip_members WHERE user_id = auth.uid() AND status = 'active'));
DROP POLICY IF EXISTS "Admins can add trip members" ON public.trip_members;
CREATE POLICY "Admins can add trip members" ON public.trip_members FOR INSERT
  WITH CHECK (trip_id IN (SELECT trip_id FROM public.trip_members WHERE user_id = auth.uid() AND role = 'admin') OR user_id = auth.uid());
DROP POLICY IF EXISTS "Admins can update trip members" ON public.trip_members;
CREATE POLICY "Admins can update trip members" ON public.trip_members FOR UPDATE
  USING (trip_id IN (SELECT trip_id FROM public.trip_members WHERE user_id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Admins can remove trip members" ON public.trip_members;
CREATE POLICY "Admins can remove trip members" ON public.trip_members FOR DELETE
  USING (trip_id IN (SELECT trip_id FROM public.trip_members WHERE user_id = auth.uid() AND role = 'admin') OR user_id = auth.uid());

-- NOTIFICATIONS
CREATE POLICY "Users can read own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- EXPENSES
CREATE POLICY "Trip members can read expenses" ON public.expenses FOR SELECT
  USING (trip_id IN (SELECT trip_id FROM public.trip_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "Trip members can add expenses" ON public.expenses FOR INSERT
  WITH CHECK (trip_id IN (SELECT trip_id FROM public.trip_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "Expense creator can update" ON public.expenses FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Expense creator can delete" ON public.expenses FOR DELETE USING (created_by = auth.uid());

-- EXPENSE SPLITS
CREATE POLICY "Trip members can read splits" ON public.expense_splits FOR SELECT
  USING (expense_id IN (SELECT id FROM public.expenses WHERE trip_id IN (SELECT trip_id FROM public.trip_members WHERE user_id = auth.uid() AND status = 'active')));
CREATE POLICY "Can insert splits" ON public.expense_splits FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Can update splits" ON public.expense_splits FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Can delete splits" ON public.expense_splits FOR DELETE USING (auth.uid() IS NOT NULL);

-- SETTLEMENTS
CREATE POLICY "Trip members can read settlements" ON public.settlements FOR SELECT
  USING (trip_id IN (SELECT trip_id FROM public.trip_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "Trip members can add settlements" ON public.settlements FOR INSERT
  WITH CHECK (trip_id IN (SELECT trip_id FROM public.trip_members WHERE user_id = auth.uid() AND status = 'active'));
DROP POLICY IF EXISTS "Settlement parties can update" ON public.settlements;
CREATE POLICY "Settlement parties can update" ON public.settlements FOR UPDATE USING (paid_by = auth.uid() OR paid_to = auth.uid());

-- MEDIA
CREATE POLICY "Can read media" ON public.media FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Can insert media" ON public.media FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Can delete own media" ON public.media FOR DELETE USING (uploaded_by = auth.uid());

-- MESSAGES
CREATE POLICY "Can read messages" ON public.messages FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Can update own messages" ON public.messages FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Can delete own messages" ON public.messages FOR DELETE USING (user_id = auth.uid());

-- TRIP NOTES
CREATE POLICY "Can read notes" ON public.trip_notes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Can add notes" ON public.trip_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Can update own notes" ON public.trip_notes FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Can delete own notes" ON public.trip_notes FOR DELETE USING (user_id = auth.uid());

-- DOCUMENTS
CREATE POLICY "Can read documents" ON public.documents FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Can add documents" ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Can delete own documents" ON public.documents FOR DELETE USING (user_id = auth.uid());

-- CLOUD CONNECTIONS
CREATE POLICY "Users can read own connections" ON public.cloud_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own connections" ON public.cloud_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own connections" ON public.cloud_connections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own connections" ON public.cloud_connections FOR DELETE USING (auth.uid() = user_id);

-- EXPENSE CATEGORIES
CREATE POLICY "Anyone can read categories" ON public.expense_categories FOR SELECT USING (true);

-- ============================================================
-- 8. STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit) VALUES
  ('avatars', 'avatars', true, 5242880),
  ('trip-covers', 'trip-covers', true, 10485760),
  ('trip-media', 'trip-media', false, 52428800),
  ('documents', 'documents', false, 20971520),
  ('receipts', 'receipts', false, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Anyone can view trip covers" ON storage.objects;
CREATE POLICY "Anyone can view trip covers" ON storage.objects FOR SELECT USING (bucket_id = 'trip-covers');
DROP POLICY IF EXISTS "Trip admins can upload covers" ON storage.objects;
CREATE POLICY "Trip admins can upload covers" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'trip-covers' AND (storage.foldername(name))[1]::uuid IN (
    SELECT trip_id FROM public.trip_members WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Trip members can view media" ON storage.objects;
CREATE POLICY "Trip members can view media" ON storage.objects FOR SELECT
  USING (bucket_id = 'trip-media' AND (storage.foldername(name))[1]::uuid IN (
    SELECT trip_id FROM public.trip_members WHERE user_id = auth.uid() AND status = 'active'));
DROP POLICY IF EXISTS "Trip members can upload media" ON storage.objects;
CREATE POLICY "Trip members can upload media" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'trip-media' AND (storage.foldername(name))[1]::uuid IN (
    SELECT trip_id FROM public.trip_members WHERE user_id = auth.uid() AND status = 'active'));
DROP POLICY IF EXISTS "Users can delete their own media" ON storage.objects;
CREATE POLICY "Users can delete their own media" ON storage.objects FOR DELETE
  USING (bucket_id = 'trip-media' AND owner_id = auth.uid()::text);

DROP POLICY IF EXISTS "Trip members can view documents" ON storage.objects;
CREATE POLICY "Trip members can view documents" ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1]::uuid IN (
    SELECT trip_id FROM public.trip_members WHERE user_id = auth.uid() AND status = 'active'));
DROP POLICY IF EXISTS "Trip members can upload documents" ON storage.objects;
CREATE POLICY "Trip members can upload documents" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1]::uuid IN (
    SELECT trip_id FROM public.trip_members WHERE user_id = auth.uid() AND status = 'active'));

DROP POLICY IF EXISTS "Trip members can view receipts" ON storage.objects;
CREATE POLICY "Trip members can view receipts" ON storage.objects FOR SELECT
  USING (bucket_id = 'receipts' AND (storage.foldername(name))[1]::uuid IN (
    SELECT trip_id FROM public.trip_members WHERE user_id = auth.uid() AND status = 'active'));
DROP POLICY IF EXISTS "Trip members can upload receipts" ON storage.objects;
CREATE POLICY "Trip members can upload receipts" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'receipts' AND (storage.foldername(name))[1]::uuid IN (
    SELECT trip_id FROM public.trip_members WHERE user_id = auth.uid() AND status = 'active'));

-- ============================================================
-- 9. REALTIME
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'expenses') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'settlements') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.settlements;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'media') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.media;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'trip_notes') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_notes;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- ============================================================
-- 10. CRON JOB: Auto-delete old notifications
-- ============================================================

SELECT cron.schedule('cleanup-notifications', '0 * * * *', $$SELECT public.cleanup_old_notifications()$$);

-- ============================================================
-- DONE! Your TripWise database is fully set up.
-- ============================================================
