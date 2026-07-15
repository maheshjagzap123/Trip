-- ============================================================
-- Phase 2: Send invite email via database trigger + pg_net
-- 
-- This uses Supabase's pg_net extension to make HTTP calls
-- to the Supabase Auth API which uses your configured SMTP.
--
-- Since Supabase Auth handles SMTP, we'll use a workaround:
-- We create a trigger that calls a Supabase Edge Function
-- which sends the email using your SMTP settings.
--
-- FOR NOW: The in-app notification is the primary invite channel.
-- To enable email sending, deploy the Edge Function:
--   npx supabase functions deploy send-invite-email
--
-- Then uncomment the trigger below and update the URL.
-- ============================================================

-- Placeholder: Email sending will be done via Edge Function deployment.
-- The in-app notification system (notifications table + trigger) is fully working.
-- Users see invitations on their dashboard in real-time.

-- When ready to deploy email sending:
-- 1. Deploy: npx supabase functions deploy send-invite-email
-- 2. The Edge Function will use Resend/SendGrid/nodemailer to send emails
-- 3. The notify_trip_invite trigger already creates the notification
-- 4. Add a second trigger or modify the existing one to also call the Edge Function

SELECT 1; -- No-op migration, placeholder for email setup
