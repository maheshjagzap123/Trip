-- ============================================================
-- Migration 020: Fix balance calculation
-- Only CONFIRMED settlements reduce balances.
-- pending / initiated / pending_confirmation / rejected
-- settlements must NOT affect what anyone owes.
-- Run in Supabase Dashboard -> SQL Editor
-- ============================================================

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
  -- Only count settlements that are CONFIRMED
  settled_paid AS (
    SELECT s.paid_by AS user_id, COALESCE(SUM(s.amount), 0) AS amount
    FROM public.settlements s
    WHERE s.trip_id = p_trip_id
      AND s.status = 'confirmed'
    GROUP BY s.paid_by
  ),
  settled_received AS (
    SELECT s.paid_to AS user_id, COALESCE(SUM(s.amount), 0) AS amount
    FROM public.settlements s
    WHERE s.trip_id = p_trip_id
      AND s.status = 'confirmed'
    GROUP BY s.paid_to
  )
  SELECT
    ml.user_id,
    ml.display_name::TEXT,
    COALESCE(p.total_paid, 0)::DECIMAL                                    AS total_paid,
    COALESCE(o.total_owed, 0)::DECIMAL                                    AS total_owed,
    (
      COALESCE(p.total_paid, 0)
      - COALESCE(o.total_owed, 0)
      + COALESCE(sp.amount, 0)
      - COALESCE(sr.amount, 0)
    )::DECIMAL                                                             AS net_balance
  FROM member_list ml
  LEFT JOIN paid           p  ON p.user_id  = ml.user_id
  LEFT JOIN owed           o  ON o.user_id  = ml.user_id
  LEFT JOIN settled_paid   sp ON sp.user_id = ml.user_id
  LEFT JOIN settled_received sr ON sr.user_id = ml.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
