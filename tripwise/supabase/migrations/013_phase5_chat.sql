-- ============================================================
-- Phase 5: Chat & Notifications
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Messages table (trip chat)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text', -- text, image, system
  media_url TEXT,
  reply_to UUID REFERENCES public.messages(id),
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_messages_trip ON public.messages(trip_id);
CREATE INDEX IF NOT EXISTS idx_messages_user ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_date ON public.messages(trip_id, created_at DESC);

-- RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Can read messages" ON public.messages FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Can update own messages" ON public.messages FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Can delete own messages" ON public.messages FOR DELETE USING (user_id = auth.uid());

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ============================================================
-- Notification: new message in trip (notify other members)
-- Only fires for non-sender members
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  trip_record RECORD;
  sender_record RECORD;
  member RECORD;
BEGIN
  -- Get trip name
  SELECT trip_name INTO trip_record FROM public.trips WHERE id = NEW.trip_id;
  -- Get sender name
  SELECT display_name INTO sender_record FROM public.profiles WHERE id = NEW.user_id;

  -- Notify all active members except the sender
  FOR member IN
    SELECT user_id FROM public.trip_members
    WHERE trip_id = NEW.trip_id AND status = 'active' AND user_id != NEW.user_id
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      member.user_id,
      'new_message',
      trip_record.trip_name,
      COALESCE(sender_record.display_name, 'Someone') || ': ' || LEFT(NEW.content, 100),
      jsonb_build_object('trip_id', NEW.trip_id, 'message_id', NEW.id, 'sender_id', NEW.user_id)
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_message ON public.messages;
CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();
