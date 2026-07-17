-- ============================================================
-- Phase 8: Cloud Storage Connections
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cloud_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- google_drive, onedrive
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  provider_email VARCHAR(255),
  folder_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_cloud_connections_user ON public.cloud_connections(user_id);

ALTER TABLE public.cloud_connections ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own connections
CREATE POLICY "Users can read own connections" ON public.cloud_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own connections" ON public.cloud_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own connections" ON public.cloud_connections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own connections" ON public.cloud_connections FOR DELETE USING (auth.uid() = user_id);
