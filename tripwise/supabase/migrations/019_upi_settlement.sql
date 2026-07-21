-- ============================================================
-- Migration 019: UPI Settlement Flow
-- Run in Supabase Dashboard -> SQL Editor
-- ============================================================

-- 1. Add payment fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_number     VARCHAR(15),
  ADD COLUMN IF NOT EXISTS upi_id           VARCHAR(100),
  ADD COLUMN IF NOT EXISTS upi_display_name VARCHAR(100);

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS valid_upi_id;
ALTER TABLE public.profiles
  ADD CONSTRAINT valid_upi_id CHECK (
    upi_id IS NULL OR upi_id ~* '^[a-zA-Z0-9._\-]+@[a-zA-Z0-9]+$'
  );

-- 2. Add status + dispute + history columns to settlements
ALTER TABLE public.settlements
  ADD COLUMN IF NOT EXISTS status             VARCHAR(30) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS transaction_ref    VARCHAR(100),
  ADD COLUMN IF NOT EXISTS confirmed_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dispute_reason     TEXT,
  ADD COLUMN IF NOT EXISTS dispute_screenshot TEXT,
  ADD COLUMN IF NOT EXISTS updated_at         TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.settlements
  DROP CONSTRAINT IF EXISTS valid_settlement_status;
ALTER TABLE public.settlements
  ADD CONSTRAINT valid_settlement_status CHECK (
    status IN ('pending', 'initiated', 'pending_confirmation', 'confirmed', 'rejected')
  );

CREATE INDEX IF NOT EXISTS idx_settlements_paid_to_status
  ON public.settlements(paid_to, status);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS settlements_updated_at ON public.settlements;
CREATE TRIGGER settlements_updated_at
  BEFORE UPDATE ON public.settlements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 3. Fix compute_trip_balances: only count CONFIRMED settlements
CREATE OR REPLACE FUNCTION public.compute_trip_balances(p_trip_id UUID)
RETURNS TABLE(user_id UUID, display_name TEXT, total_paid DECIMAL, total_owed DECIMAL, net_balance DECIMAL)
AS $$
BEGIN
  RETURN QUERY
  WITH member_list AS (
    SELECT tm.user_id, p.display_name
    FROM public.trip_members tm
    JOIN public.profiles p ON p.id = tm.user_id
    WHERE tm.trip_id = p_trip_id AND tm.status = 'active'
  ),
  paid AS (
    SELECT e.paid_by AS user_id, COALESCE(SUM(e.amount), 0) AS total_paid
    FROM public.expenses e
    WHERE e.trip_id = p_trip_id
    GROUP BY e.paid_by
  ),
  owed AS (
    SELECT es.user_id, COALESCE(SUM(es.amount), 0) AS total_owed
    FROM public.expense_splits es
    JOIN public.expenses e ON e.id = es.expense_id
    WHERE e.trip_id = p_trip_id
    GROUP BY es.user_id
  ),
  settled_paid AS (
    SELECT s.paid_by AS user_id, COALESCE(SUM(s.amount), 0) AS amount
    FROM public.settlements s
    WHERE s.trip_id = p_trip_id AND s.status = 'confirmed'
    GROUP BY s.paid_by
  ),
  settled_received AS (
    SELECT s.paid_to AS user_id, COALESCE(SUM(s.amount), 0) AS amount
    FROM public.settlements s
    WHERE s.trip_id = p_trip_id AND s.status = 'confirmed'
    GROUP BY s.paid_to
  )
  SELECT
    ml.user_id,
    ml.display_name::TEXT,
    COALESCE(p.total_paid, 0)::DECIMAL AS total_paid,
    COALESCE(o.total_owed, 0)::DECIMAL AS total_owed,
    (COALESCE(p.total_paid, 0) - COALESCE(o.total_owed, 0)
      + COALESCE(sp.amount, 0) - COALESCE(sr.amount, 0))::DECIMAL AS net_balance
  FROM member_list ml
  LEFT JOIN paid p ON p.user_id = ml.user_id
  LEFT JOIN owed o ON o.user_id = ml.user_id
  LEFT JOIN settled_paid sp ON sp.user_id = ml.user_id
  LEFT JOIN settled_received sr ON sr.user_id = ml.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 4. Notification trigger on settlement status changes
CREATE OR REPLACE FUNCTION public.notify_settlement_status_change()
RETURNS TRIGGER AS $$
DECLARE
  trip_record  RECORD;
  payer_record RECORD;
  payee_record RECORD;
BEGIN
  SELECT trip_name INTO trip_record FROM public.trips WHERE id = NEW.trip_id;
  SELECT display_name INTO payer_record FROM public.profiles WHERE id = NEW.paid_by;
  SELECT display_name INTO payee_record FROM public.profiles WHERE id = NEW.paid_to;

  -- Payer tapped "I Have Paid" -> notify recipient
  IF NEW.status = 'pending_confirmation' AND OLD.status = 'initiated' THEN
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      NEW.paid_to,
      'settlement_confirm_request',
      'Payment confirmation needed',
      COALESCE(payer_record.display_name, 'Someone') || ' says they paid you Rs.' || NEW.amount || '. Confirm or dispute?',
      jsonb_build_object('trip_id', NEW.trip_id, 'settlement_id', NEW.id, 'amount', NEW.amount)
    );
  END IF;

  -- Manual settlement recorded -> notify recipient
  IF NEW.status = 'pending_confirmation' AND OLD.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      NEW.paid_to,
      'settlement_confirm_request',
      'Payment confirmation needed',
      COALESCE(payer_record.display_name, 'Someone') || ' recorded a payment of Rs.' || NEW.amount || ' to you. Confirm or dispute?',
      jsonb_build_object('trip_id', NEW.trip_id, 'settlement_id', NEW.id, 'amount', NEW.amount)
    );
  END IF;

  -- Recipient confirmed -> notify payer
  IF NEW.status = 'confirmed' AND OLD.status = 'pending_confirmation' THEN
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      NEW.paid_by,
      'settlement_confirmed',
      'Payment confirmed',
      COALESCE(payee_record.display_name, 'Recipient') || ' confirmed your Rs.' || NEW.amount || ' payment.',
      jsonb_build_object('trip_id', NEW.trip_id, 'settlement_id', NEW.id, 'amount', NEW.amount)
    );
  END IF;

  -- Recipient disputed -> notify payer
  IF NEW.status = 'rejected' AND OLD.status = 'pending_confirmation' THEN
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      NEW.paid_by,
      'settlement_disputed',
      'Payment disputed',
      COALESCE(payee_record.display_name, 'Recipient') || ' disputed your Rs.' || NEW.amount || ' payment.',
      jsonb_build_object('trip_id', NEW.trip_id, 'settlement_id', NEW.id, 'amount', NEW.amount)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_settlement_status_change ON public.settlements;
CREATE TRIGGER on_settlement_status_change
  AFTER UPDATE OF status ON public.settlements
  FOR EACH ROW EXECUTE FUNCTION public.notify_settlement_status_change();

-- 5. RLS: allow payer and recipient to update their own settlements
DROP POLICY IF EXISTS "Settlement parties can update" ON public.settlements;
CREATE POLICY "Settlement parties can update"
  ON public.settlements FOR UPDATE
  USING (paid_by = auth.uid() OR paid_to = auth.uid());

-- 6. Enable realtime for settlements (safe - skips if already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'settlements'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.settlements;
  END IF;
END;
$$;
