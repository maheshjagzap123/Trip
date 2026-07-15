-- ============================================================
-- Phase 3: Expenses & Settlements
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  category VARCHAR(50) DEFAULT 'Miscellaneous',
  paid_by UUID NOT NULL REFERENCES public.profiles(id),
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  split_method VARCHAR(20) DEFAULT 'equal', -- equal, unequal, percentage
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT positive_amount CHECK (amount > 0)
);

-- Expense splits (who owes what)
CREATE TABLE IF NOT EXISTS public.expense_splits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  amount DECIMAL(12,2) NOT NULL,
  is_settled BOOLEAN DEFAULT false,
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(expense_id, user_id),
  CONSTRAINT non_negative_split CHECK (amount >= 0)
);

-- Settlements (records of payments between members)
CREATE TABLE IF NOT EXISTS public.settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  paid_by UUID NOT NULL REFERENCES public.profiles(id),
  paid_to UUID NOT NULL REFERENCES public.profiles(id),
  amount DECIMAL(12,2) NOT NULL,
  method VARCHAR(50) DEFAULT 'cash', -- cash, upi, bank, other
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT positive_settlement CHECK (amount > 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_expenses_trip ON public.expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by ON public.expenses(paid_by);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_expense_splits_expense ON public.expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_user ON public.expense_splits(user_id);
CREATE INDEX IF NOT EXISTS idx_settlements_trip ON public.settlements(trip_id);

-- Updated_at trigger for expenses
DROP TRIGGER IF EXISTS expenses_updated_at ON public.expenses;
CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

-- Expenses: trip members can read/write
CREATE POLICY "Trip members can read expenses"
  ON public.expenses FOR SELECT
  USING (
    trip_id IN (SELECT trip_id FROM public.trip_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Trip members can add expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (
    trip_id IN (SELECT trip_id FROM public.trip_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Expense creator can update"
  ON public.expenses FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Expense creator can delete"
  ON public.expenses FOR DELETE
  USING (created_by = auth.uid());

-- Expense splits: readable by trip members, insertable by expense creator
CREATE POLICY "Trip members can read splits"
  ON public.expense_splits FOR SELECT
  USING (
    expense_id IN (
      SELECT id FROM public.expenses WHERE trip_id IN (
        SELECT trip_id FROM public.trip_members WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

CREATE POLICY "Can insert splits"
  ON public.expense_splits FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Can update splits"
  ON public.expense_splits FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Can delete splits"
  ON public.expense_splits FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Settlements: trip members can read/write
CREATE POLICY "Trip members can read settlements"
  ON public.settlements FOR SELECT
  USING (
    trip_id IN (SELECT trip_id FROM public.trip_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Trip members can add settlements"
  ON public.settlements FOR INSERT
  WITH CHECK (
    trip_id IN (SELECT trip_id FROM public.trip_members WHERE user_id = auth.uid() AND status = 'active')
  );

-- ============================================================
-- Enable Realtime
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.settlements;

-- ============================================================
-- Helper function: compute balances for a trip
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
  settled_paid AS (
    SELECT s.paid_by AS user_id, COALESCE(SUM(s.amount), 0) AS amount
    FROM public.settlements s
    WHERE s.trip_id = p_trip_id
    GROUP BY s.paid_by
  ),
  settled_received AS (
    SELECT s.paid_to AS user_id, COALESCE(SUM(s.amount), 0) AS amount
    FROM public.settlements s
    WHERE s.trip_id = p_trip_id
    GROUP BY s.paid_to
  )
  SELECT
    ml.user_id,
    ml.display_name::TEXT,
    COALESCE(p.total_paid, 0)::DECIMAL AS total_paid,
    COALESCE(o.total_owed, 0)::DECIMAL AS total_owed,
    (COALESCE(p.total_paid, 0) - COALESCE(o.total_owed, 0) + COALESCE(sp.amount, 0) - COALESCE(sr.amount, 0))::DECIMAL AS net_balance
  FROM member_list ml
  LEFT JOIN paid p ON p.user_id = ml.user_id
  LEFT JOIN owed o ON o.user_id = ml.user_id
  LEFT JOIN settled_paid sp ON sp.user_id = ml.user_id
  LEFT JOIN settled_received sr ON sr.user_id = ml.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
