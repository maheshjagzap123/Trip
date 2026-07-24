-- ============================================================
-- Create feedback table for ExpenseX Admin Panel
-- Run this in Supabase SQL Editor
-- ============================================================

-- Create the feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'feedback',  -- 'feedback', 'bug_report', 'contact'
  rating INTEGER,                          -- 1-5 stars (null for contact/bug)
  subject TEXT,                            -- subject line (for contact messages)
  message TEXT NOT NULL,                   -- the actual feedback text
  user_email TEXT,                         -- email of the user who submitted
  user_name TEXT,                          -- display name at time of submission
  status TEXT DEFAULT 'new',              -- 'new', 'read', 'resolved', 'archived'
  admin_reply TEXT,                        -- admin can reply
  app_version TEXT,                        -- which version of the app
  platform TEXT,                           -- 'android', 'ios', 'web'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow any authenticated user to INSERT their own feedback
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own feedback"
  ON public.feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own feedback (to see admin replies)
CREATE POLICY "Users can read their own feedback"
  ON public.feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role (admin panel) can do everything
CREATE POLICY "Service role full access"
  ON public.feedback
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);

-- Enable realtime so admin panel gets live updates
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================
-- DONE! Now the mobile app should insert into this table
-- and the admin panel will read from it.
-- ============================================================
