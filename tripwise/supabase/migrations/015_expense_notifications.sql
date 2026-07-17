-- ============================================================
-- Notify trip members when a new expense is added
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_new_expense()
RETURNS TRIGGER AS $$
DECLARE
  trip_record RECORD;
  payer_record RECORD;
  member RECORD;
BEGIN
  SELECT trip_name INTO trip_record FROM public.trips WHERE id = NEW.trip_id;
  SELECT display_name INTO payer_record FROM public.profiles WHERE id = NEW.paid_by;

  FOR member IN
    SELECT user_id FROM public.trip_members
    WHERE trip_id = NEW.trip_id AND status = 'active' AND user_id != NEW.paid_by
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      member.user_id, 'expense_added', trip_record.trip_name,
      COALESCE(payer_record.display_name, 'Someone') || ' added "' || NEW.title || '" (₹' || NEW.amount || ')',
      jsonb_build_object('trip_id', NEW.trip_id, 'expense_id', NEW.id)
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_expense ON public.expenses;
CREATE TRIGGER on_new_expense
  AFTER INSERT ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_expense();

-- ============================================================
-- Notify when a settlement is recorded
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_settlement()
RETURNS TRIGGER AS $$
DECLARE
  trip_record RECORD;
  payer_record RECORD;
BEGIN
  SELECT trip_name INTO trip_record FROM public.trips WHERE id = NEW.trip_id;
  SELECT display_name INTO payer_record FROM public.profiles WHERE id = NEW.paid_by;

  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    NEW.paid_to, 'settlement', trip_record.trip_name,
    COALESCE(payer_record.display_name, 'Someone') || ' settled ₹' || NEW.amount || ' with you',
    jsonb_build_object('trip_id', NEW.trip_id, 'settlement_id', NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_settlement ON public.settlements;
CREATE TRIGGER on_new_settlement
  AFTER INSERT ON public.settlements
  FOR EACH ROW EXECUTE FUNCTION public.notify_settlement();
