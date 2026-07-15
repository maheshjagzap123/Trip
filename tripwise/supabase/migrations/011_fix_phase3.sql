-- ============================================================
-- Fix Phase 3: Add missing column + profile lookup function
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Add missing created_by column to expenses
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id);
UPDATE public.expenses SET created_by = paid_by WHERE created_by IS NULL;
ALTER TABLE public.expenses ALTER COLUMN created_by SET NOT NULL;

-- 2. Function to get profiles by array of IDs (bypasses RLS)
-- Used by expense/trip screens to show member names
CREATE OR REPLACE FUNCTION public.get_profiles_by_ids(user_ids UUID[])
RETURNS TABLE(id UUID, display_name TEXT, email TEXT, avatar_url TEXT)
AS $$
  SELECT p.id, p.display_name::TEXT, p.email::TEXT, p.avatar_url::TEXT
  FROM public.profiles p
  WHERE p.id = ANY(user_ids);
$$ LANGUAGE sql SECURITY DEFINER STABLE;
