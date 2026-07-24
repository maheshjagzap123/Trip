-- ============================================================
-- Admin Auth Table for ExpenseX Admin Panel
-- Run this in Supabase SQL Editor
-- ============================================================

-- Create admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'admin',
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS (only service_role key accesses this)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on admin_users"
  ON public.admin_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Insert admin user (password: 'Mahesh' hashed with pgcrypto)
INSERT INTO public.admin_users (email, password_hash, name, role)
VALUES (
  'maheshjagzap03@gmail.com',
  crypt('Mahesh', gen_salt('bf')),
  'Mahesh Jagzap',
  'super_admin'
);

-- Create login verification function
CREATE OR REPLACE FUNCTION public.verify_admin_login(p_email TEXT, p_password TEXT)
RETURNS TABLE(id UUID, email TEXT, name TEXT, role TEXT)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.email, a.name, a.role
  FROM public.admin_users a
  WHERE a.email = p_email
  AND a.password_hash = crypt(p_password, a.password_hash);

  -- Update last_login if found
  UPDATE public.admin_users
  SET last_login = NOW()
  WHERE admin_users.email = p_email
  AND admin_users.password_hash = crypt(p_password, admin_users.password_hash);
END;
$$;

-- ============================================================
-- DONE! Admin can now login with:
-- Email: maheshjagzap03@gmail.com
-- Password: Mahesh
-- ============================================================
