-- ============================================================
-- Phase 2: Trip Invitations & Notifications
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Notifications table (in-app notifications)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'trip_invite', 'trip_accepted', 'expense_added', etc.
  title VARCHAR(200) NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}', -- extra payload (trip_id, expense_id, etc.)
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);

-- RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true); -- Edge functions / triggers handle this

-- ============================================================
-- Trigger: Auto-create notification when someone is invited to a trip
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_trip_invite()
RETURNS TRIGGER AS $$
DECLARE
  trip_record RECORD;
  inviter_record RECORD;
BEGIN
  -- Only fire for pending invitations (not when creator adds themselves)
  IF NEW.status = 'pending' AND NEW.invited_by IS NOT NULL THEN
    -- Get trip info
    SELECT trip_name, destination INTO trip_record
    FROM public.trips WHERE id = NEW.trip_id;

    -- Get inviter name
    SELECT display_name INTO inviter_record
    FROM public.profiles WHERE id = NEW.invited_by;

    -- Create notification for the invited user
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      NEW.user_id,
      'trip_invite',
      'Trip Invitation',
      (COALESCE(inviter_record.display_name, 'Someone')) || ' invited you to "' || trip_record.trip_name || '"',
      jsonb_build_object(
        'trip_id', NEW.trip_id,
        'trip_name', trip_record.trip_name,
        'destination', trip_record.destination,
        'invited_by', NEW.invited_by,
        'invited_by_name', COALESCE(inviter_record.display_name, 'A friend')
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_trip_member_invited ON public.trip_members;
CREATE TRIGGER on_trip_member_invited
  AFTER INSERT ON public.trip_members
  FOR EACH ROW EXECUTE FUNCTION public.notify_trip_invite();

-- ============================================================
-- Trigger: Notify trip admin when someone accepts invitation
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_invite_accepted()
RETURNS TRIGGER AS $$
DECLARE
  trip_record RECORD;
  accepter_record RECORD;
  admin_id UUID;
BEGIN
  -- Only fire when status changes from pending to active
  IF OLD.status = 'pending' AND NEW.status = 'active' THEN
    -- Get trip info
    SELECT trip_name, created_by INTO trip_record
    FROM public.trips WHERE id = NEW.trip_id;

    -- Get the person who accepted
    SELECT display_name INTO accepter_record
    FROM public.profiles WHERE id = NEW.user_id;

    -- Notify the trip creator
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      trip_record.created_by,
      'trip_accepted',
      'Invitation Accepted',
      (COALESCE(accepter_record.display_name, 'Someone')) || ' joined "' || trip_record.trip_name || '"',
      jsonb_build_object(
        'trip_id', NEW.trip_id,
        'trip_name', trip_record.trip_name,
        'user_id', NEW.user_id
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_invite_accepted ON public.trip_members;
CREATE TRIGGER on_invite_accepted
  AFTER UPDATE ON public.trip_members
  FOR EACH ROW EXECUTE FUNCTION public.notify_invite_accepted();

-- ============================================================
-- Fix: Allow pending members to read trip info (for invitation display)
-- ============================================================

DROP POLICY IF EXISTS "Members can read their trips" ON public.trips;
CREATE POLICY "Members can read their trips"
  ON public.trips FOR SELECT
  USING (
    id IN (
      SELECT trip_id FROM public.trip_members
      WHERE user_id = auth.uid() AND status IN ('active', 'pending')
    )
  );
