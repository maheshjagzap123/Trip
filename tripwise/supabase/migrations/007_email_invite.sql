-- ============================================================
-- Phase 2: Email notification via database webhook
-- We'll use Supabase's built-in pg_net extension to send HTTP 
-- requests (to call an email-sending Edge Function).
-- 
-- For now, the in-app notification is the primary invite channel.
-- Email sending requires deploying an Edge Function (done separately).
-- ============================================================

-- Enable pg_net for HTTP calls from database (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- The email will be sent via an Edge Function that we'll deploy.
-- For now, the in-app notification system handles invitations.
-- Email sending Edge Function will be deployed in a future update.
