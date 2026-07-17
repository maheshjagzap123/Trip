-- ============================================================
-- Auto-delete notifications older than 24 hours
-- Uses pg_cron to run hourly cleanup
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable pg_cron if not already
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule hourly cleanup
SELECT cron.schedule(
  'cleanup-notifications',
  '0 * * * *',  -- every hour
  $$SELECT public.cleanup_old_notifications()$$
);
