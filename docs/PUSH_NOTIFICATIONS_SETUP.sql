-- ============================================================
-- Push Notifications Setup for ExpenseX
-- Run this in Supabase SQL Editor
-- ============================================================

-- Step 1: Remove broken trigger (if it was applied earlier)
DROP TRIGGER IF EXISTS trigger_push_notification ON public.notifications;
DROP FUNCTION IF EXISTS public.notify_push_on_insert();

-- Step 2: Add push_token column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Step 3: Verify it works
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'push_token';

-- ============================================================
-- PUSH NOTIFICATION SETUP (via Dashboard - NO SQL trigger needed)
-- ============================================================
--
-- 1. Deploy Edge Function:
--    cd ExpensesX
--    npx supabase functions deploy send-push-notification
--
-- 2. Go to: Supabase Dashboard → Database → Webhooks → Create New
--    - Name: send-push-notification
--    - Table: notifications
--    - Events: INSERT
--    - Type: Supabase Edge Function
--    - Function: send-push-notification
--    - Save
--
-- That's it! Every INSERT into notifications table will trigger
-- the Edge Function which sends a push via Expo Push API.
-- ============================================================
