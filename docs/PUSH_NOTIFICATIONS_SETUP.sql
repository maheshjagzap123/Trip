-- ============================================================
-- Push Notifications Setup for ExpenseX
-- Run this in Supabase SQL Editor
-- ============================================================

-- Step 1: Add push_token column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Step 2: Create a function that calls the Edge Function when notification is inserted
CREATE OR REPLACE FUNCTION public.notify_push_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  payload JSONB;
BEGIN
  -- Build the payload
  payload := jsonb_build_object(
    'record', row_to_json(NEW)
  );

  -- Call the Edge Function via pg_net (HTTP extension)
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := payload
  );

  RETURN NEW;
END;
$$;

-- Step 3: Create trigger on notifications table
DROP TRIGGER IF EXISTS trigger_push_notification ON public.notifications;
CREATE TRIGGER trigger_push_notification
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_push_on_insert();

-- ============================================================
-- ALTERNATIVE (simpler): Use Supabase Database Webhooks UI
-- ============================================================
-- If the above pg_net approach doesn't work (pg_net extension might 
-- not be enabled), use the Supabase Dashboard instead:
--
-- 1. Go to: Database → Webhooks → Create New
-- 2. Name: send-push-notification
-- 3. Table: notifications
-- 4. Events: INSERT
-- 5. Type: Supabase Edge Function
-- 6. Edge Function: send-push-notification
-- 7. Save
--
-- This is the EASIEST approach and doesn't require any SQL trigger.
-- ============================================================

-- Step 4: Verify push_token column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'push_token';
