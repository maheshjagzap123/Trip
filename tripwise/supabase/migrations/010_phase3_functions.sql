-- Phase 3 functions: balance computation + settlement optimization

-- compute_balances: returns net balance per member for a trip
-- positive net = that member is owed money by current user
-- negative net = current user owes that member
CREATE OR REPLACE FUNCTION public.compute_balances(p_trip_id UUID, p_user_id UUID)
RETURNS TABLE(user_id UUID, user_name TEXT, net NUMERIC)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH member_ids AS (
    SELECT tm.user_id FROM public.trip_members tm
    WHERE tm.trip_id = p_trip_id AND tm.status = 'active' AND tm.user_id <> p_user_id
  ),
  paid_by_me AS (
    -- others owe me: I paid, they are in splits
    SELECT es.user_id, SUM(es.amount) AS amt
    FROM public.expenses e
    JOIN public.expense_splits es ON es.expense_id = e.id
    WHERE e.trip_id = p_trip_id AND e.paid_by = p_user_id
      AND es.user_id <> p_user_id AND es.is_settled = FALSE
    GROUP BY es.user_id
  ),
  paid_by_others AS (
    -- I owe others: they paid, I am in splits
    SELECT e.paid_by AS user_id, SUM(es.amount) AS amt
    FROM public.expenses e
    JOIN public.expense_splits es ON es.expense_id = e.id
    WHERE e.trip_id = p_trip_id AND e.paid_by <> p_user_id
      AND es.user_id = p_user_id AND es.is_settled = FALSE
    GROUP BY e.paid_by
  ),
  settled_by_me AS (
    SELECT s.to_user AS user_id, SUM(s.amount) AS amt
    FROM public.settlements s
    WHERE s.trip_id = p_trip_id AND s.from_user = p_user_id AND s.status = 'completed'
    GROUP BY s.to_user
  ),
  settled_to_me AS (
    SELECT s.from_user AS user_id, SUM(s.amount) AS amt
    FROM public.settlements s
    WHERE s.trip_id = p_trip_id AND s.to_user = p_user_id AND s.status = 'completed'
    GROUP BY s.from_user
  )
  SELECT
    m.user_id,
    COALESCE(p.display_name, 'Unknown') AS user_name,
    COALESCE(pbm.amt, 0) - COALESCE(pbo.amt, 0) + COALESCE(sbm.amt, 0) - COALESCE(stm.amt, 0) AS net
  FROM member_ids m
  JOIN public.profiles p ON p.id = m.user_id
  LEFT JOIN paid_by_me pbm ON pbm.user_id = m.user_id
  LEFT JOIN paid_by_others pbo ON pbo.user_id = m.user_id
  LEFT JOIN settled_by_me sbm ON sbm.user_id = m.user_id
  LEFT JOIN settled_to_me stm ON stm.user_id = m.user_id
  WHERE ABS(COALESCE(pbm.amt, 0) - COALESCE(pbo.amt, 0) + COALESCE(sbm.amt, 0) - COALESCE(stm.amt, 0)) > 0.01;
END;
$$;

-- optimize_settlements: greedy debt simplification
-- returns minimal set of transactions to settle all debts in a trip
CREATE OR REPLACE FUNCTION public.optimize_settlements(p_trip_id UUID)
RETURNS TABLE(from_user UUID, from_name TEXT, to_user UUID, to_name TEXT, amount NUMERIC)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_members UUID[];
  v_net NUMERIC[];
  v_profiles RECORD;
  i INT; j INT;
  v_settle NUMERIC;
BEGIN
  -- Build net balance per member (positive = owed to them, negative = they owe)
  CREATE TEMP TABLE _nets ON COMMIT DROP AS
  SELECT
    tm.user_id,
    COALESCE(p.display_name, 'Unknown') AS name,
    COALESCE(SUM(CASE WHEN e.paid_by = tm.user_id AND es.user_id <> tm.user_id AND es.is_settled = FALSE THEN es.amount ELSE 0 END), 0)
    - COALESCE(SUM(CASE WHEN e.paid_by <> tm.user_id AND es.user_id = tm.user_id AND es.is_settled = FALSE THEN es.amount ELSE 0 END), 0) AS net
  FROM public.trip_members tm
  JOIN public.profiles p ON p.id = tm.user_id
  LEFT JOIN public.expenses e ON e.trip_id = p_trip_id
  LEFT JOIN public.expense_splits es ON es.expense_id = e.id
  WHERE tm.trip_id = p_trip_id AND tm.status = 'active'
  GROUP BY tm.user_id, p.display_name;

  -- Greedy: pair biggest debtor with biggest creditor
  RETURN QUERY
  WITH RECURSIVE settle AS (
    SELECT
      d.user_id AS from_user, d.name AS from_name,
      c.user_id AS to_user, c.name AS to_name,
      LEAST(ABS(d.net), c.net) AS amount,
      d.net + LEAST(ABS(d.net), c.net) AS d_remaining,
      c.net - LEAST(ABS(d.net), c.net) AS c_remaining
    FROM (SELECT * FROM _nets WHERE net < -0.01 ORDER BY net LIMIT 1) d
    CROSS JOIN (SELECT * FROM _nets WHERE net > 0.01 ORDER BY net DESC LIMIT 1) c
  )
  SELECT s.from_user, s.from_name, s.to_user, s.to_name, s.amount FROM settle s
  WHERE s.amount > 0.01;
END;
$$;

-- Seed default expense categories (idempotent)
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  emoji TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

INSERT INTO public.expense_categories (name, emoji, sort_order) VALUES
  ('Food', '🍽️', 1),
  ('Transport', '🚗', 2),
  ('Accommodation', '🏨', 3),
  ('Flight', '✈️', 4),
  ('Activities', '🎯', 5),
  ('Shopping', '🛍️', 6),
  ('Fuel', '⛽', 7),
  ('Parking', '🅿️', 8),
  ('Entertainment', '🎬', 9),
  ('Medical', '💊', 10),
  ('Miscellaneous', '📦', 11)
ON CONFLICT (name) DO NOTHING;

-- Allow trip members to read categories
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read categories" ON public.expense_categories FOR SELECT USING (true);
