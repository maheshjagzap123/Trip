-- ============================================================
-- Phase 4: Shared Memories (Media)
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Media table (photos/videos for trips)
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

CREATE INDEX IF NOT EXISTS idx_media_trip ON public.media(trip_id);
CREATE INDEX IF NOT EXISTS idx_media_user ON public.media(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_date ON public.media(created_at DESC);

-- RLS: keep it simple (authenticated users only, app logic controls access)
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Can read media" ON public.media FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Can insert media" ON public.media FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Can delete own media" ON public.media FOR DELETE USING (uploaded_by = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.media;
