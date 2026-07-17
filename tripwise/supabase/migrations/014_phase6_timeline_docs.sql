-- ============================================================
-- Phase 6: Timeline, Documents, Analytics
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Trip Notes (day-by-day notes for timeline)
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

CREATE INDEX IF NOT EXISTS idx_trip_notes_trip ON public.trip_notes(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_notes_date ON public.trip_notes(trip_id, note_date DESC);

-- Documents (travel documents with expiry)
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL, -- nullable for personal docs
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  title VARCHAR(200) NOT NULL,
  category VARCHAR(50) DEFAULT 'Other', -- Passport, Visa, Flight, Hotel, Insurance, License, Other
  file_name VARCHAR(255) NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type VARCHAR(100),
  file_size BIGINT,
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_trip ON public.documents(trip_id);
CREATE INDEX IF NOT EXISTS idx_documents_user ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_expiry ON public.documents(expiry_date);

-- RLS
ALTER TABLE public.trip_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Can read notes" ON public.trip_notes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Can add notes" ON public.trip_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Can update own notes" ON public.trip_notes FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Can delete own notes" ON public.trip_notes FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Can read documents" ON public.documents FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Can add documents" ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Can delete own documents" ON public.documents FOR DELETE USING (user_id = auth.uid());

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_notes;

-- ============================================================
-- Timeline function: merges expenses, notes, media into one feed
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_trip_timeline(p_trip_id UUID)
RETURNS TABLE(
  id UUID,
  type TEXT,
  title TEXT,
  subtitle TEXT,
  user_id UUID,
  user_name TEXT,
  event_date DATE,
  created_at TIMESTAMPTZ,
  data JSONB
) AS $$
BEGIN
  RETURN QUERY

  -- Expenses
  SELECT
    e.id,
    'expense'::TEXT AS type,
    e.title,
    ('₹' || e.amount::TEXT || ' • ' || e.category)::TEXT AS subtitle,
    e.paid_by AS user_id,
    COALESCE(p.display_name, 'Member')::TEXT AS user_name,
    e.expense_date AS event_date,
    e.created_at,
    jsonb_build_object('amount', e.amount, 'category', e.category) AS data
  FROM public.expenses e
  JOIN public.profiles p ON p.id = e.paid_by
  WHERE e.trip_id = p_trip_id

  UNION ALL

  -- Notes
  SELECT
    n.id,
    'note'::TEXT AS type,
    COALESCE(n.title, 'Note')::TEXT AS title,
    LEFT(n.content, 100)::TEXT AS subtitle,
    n.user_id,
    COALESCE(p.display_name, 'Member')::TEXT AS user_name,
    n.note_date AS event_date,
    n.created_at,
    jsonb_build_object('content', n.content) AS data
  FROM public.trip_notes n
  JOIN public.profiles p ON p.id = n.user_id
  WHERE n.trip_id = p_trip_id

  UNION ALL

  -- Media uploads
  SELECT
    m.id,
    'photo'::TEXT AS type,
    m.file_name::TEXT AS title,
    ('Photo uploaded')::TEXT AS subtitle,
    m.uploaded_by AS user_id,
    COALESCE(p.display_name, 'Member')::TEXT AS user_name,
    m.created_at::DATE AS event_date,
    m.created_at,
    jsonb_build_object('storage_path', m.storage_path) AS data
  FROM public.media m
  JOIN public.profiles p ON p.id = m.uploaded_by
  WHERE m.trip_id = p_trip_id

  ORDER BY event_date DESC, created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- Analytics function: user spending summary across all trips
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_analytics(p_user_id UUID)
RETURNS TABLE(
  total_trips BIGINT,
  total_spent DECIMAL,
  total_owed DECIMAL,
  top_category TEXT,
  top_category_amount DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH trip_count AS (
    SELECT COUNT(*)::BIGINT AS cnt FROM public.trip_members WHERE user_id = p_user_id AND status = 'active'
  ),
  spending AS (
    SELECT COALESCE(SUM(es.amount), 0) AS total
    FROM public.expense_splits es
    JOIN public.expenses e ON e.id = es.expense_id
    WHERE es.user_id = p_user_id
  ),
  paid AS (
    SELECT COALESCE(SUM(e.amount), 0) AS total
    FROM public.expenses e WHERE e.paid_by = p_user_id
  ),
  categories AS (
    SELECT e.category, SUM(es.amount) AS cat_total
    FROM public.expense_splits es
    JOIN public.expenses e ON e.id = es.expense_id
    WHERE es.user_id = p_user_id
    GROUP BY e.category
    ORDER BY cat_total DESC
    LIMIT 1
  )
  SELECT
    tc.cnt AS total_trips,
    s.total AS total_spent,
    p.total AS total_owed,
    COALESCE(c.category, 'None')::TEXT AS top_category,
    COALESCE(c.cat_total, 0)::DECIMAL AS top_category_amount
  FROM trip_count tc, spending s, paid p
  LEFT JOIN categories c ON true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
