import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Expense {
  id: string;
  trip_id: string;
  title: string;
  amount: number;
  currency: string;
  category: string;
  paid_by: string;
  paid_by_name?: string;
  expense_date: string;
  notes: string | null;
  split_method: string;
  split_type: string;
  created_by: string | null;
  created_at: string;
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  user_id: string;
  amount: number;
  is_settled: boolean;
  display_name?: string;
}

export interface Balance {
  user_id: string;
  display_name: string;
  total_paid: number;
  total_owed: number;
  net_balance: number;
}

export interface Settlement {
  id: string;
  trip_id: string;
  paid_by: string;
  paid_to: string;
  amount: number;
  method: string;
  notes: string | null;
  created_at: string;
  paid_by_name?: string;
  paid_to_name?: string;
}

interface ExpenseState {
  expenses: Expense[];
  balances: Balance[];
  settlements: Settlement[];
  isLoading: boolean;

  fetchExpenses: (tripId: string) => Promise<void>;
  fetchBalances: (tripId: string) => Promise<void>;
  fetchSettlements: (tripId: string) => Promise<void>;
  addExpense: (data: AddExpenseInput) => Promise<void>;
  deleteExpense: (expenseId: string, tripId: string) => Promise<void>;
  addSettlement: (data: AddSettlementInput) => Promise<void>;
  subscribeToExpenses: (tripId: string) => () => void;
}

interface AddExpenseInput {
  trip_id: string;
  title: string;
  amount: number;
  category: string;
  paid_by: string;
  notes?: string;
  split_method: 'equal' | 'unequal' | 'percentage';
  splits: { user_id: string; amount: number }[];
  created_by: string;
}

interface AddSettlementInput {
  trip_id: string;
  paid_by: string;
  paid_to: string;
  amount: number;
  method: string;
  notes?: string;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  balances: [],
  settlements: [],
  isLoading: false,

  fetchExpenses: async (tripId: string) => {
    set({ isLoading: true });
    try {
      const { data } = await supabase
        .from('expenses')
        .select('*')
        .eq('trip_id', tripId)
        .order('expense_date', { ascending: false });

      if (data) {
        // Enrich with payer names
        const userIds = [...new Set(data.map((e) => e.paid_by))];
        const { data: profiles } = await supabase
          .rpc('get_profiles_by_ids', { user_ids: userIds });

        const enriched = data.map((e) => ({
          ...e,
          paid_by_name: (Array.isArray(profiles) ? profiles.find((p: any) => p.id === e.paid_by)?.display_name : null) || 'Unknown',
        }));

        set({ expenses: enriched });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  fetchBalances: async (tripId: string) => {
    const { data } = await supabase.rpc('compute_trip_balances', { p_trip_id: tripId });
    if (data && Array.isArray(data)) {
      set({ balances: data });
    }
  },

  fetchSettlements: async (tripId: string) => {
    const { data } = await supabase
      .from('settlements')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (data) {
      const userIds = [...new Set([...data.map((s) => s.paid_by), ...data.map((s) => s.paid_to)])];
      const { data: profiles } = await supabase
        .rpc('get_profiles_by_ids', { user_ids: userIds });

      const enriched = data.map((s) => ({
        ...s,
        paid_by_name: (Array.isArray(profiles) ? profiles.find((p: any) => p.id === s.paid_by)?.display_name : null) || 'Unknown',
        paid_to_name: (Array.isArray(profiles) ? profiles.find((p: any) => p.id === s.paid_to)?.display_name : null) || 'Unknown',
      }));

      set({ settlements: enriched });
    }
  },

  addExpense: async (input: AddExpenseInput) => {
    const { splits, ...expenseData } = input;

    // Insert expense
    const insertData: Record<string, any> = {
      trip_id: expenseData.trip_id,
      title: expenseData.title,
      amount: expenseData.amount,
      category: expenseData.category,
      paid_by: expenseData.paid_by,
      notes: expenseData.notes || null,
      split_method: expenseData.split_method,
      created_by: expenseData.created_by,
    };

    const { data: expense, error } = await supabase
      .from('expenses')
      .insert(insertData)
      .select('id')
      .single();

    if (error) {
      console.error('Expense insert error:', error);
      throw new Error(error.message);
    }
    if (!expense) throw new Error('Failed to add expense — no data returned');

    console.log('Expense saved:', expense.id);

    // Insert splits
    const splitRows = splits.map((s) => ({
      expense_id: expense.id,
      user_id: s.user_id,
      amount: s.amount,
    }));

    const { error: splitError } = await supabase.from('expense_splits').insert(splitRows);
    if (splitError) {
      console.error('Split insert error:', splitError);
      throw new Error(splitError.message);
    }

    console.log('Splits saved for expense:', expense.id);

    // Refresh
    await get().fetchExpenses(input.trip_id);
    await get().fetchBalances(input.trip_id);
  },

  deleteExpense: async (expenseId: string, tripId: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
    if (error) throw new Error(error.message);

    await get().fetchExpenses(tripId);
    await get().fetchBalances(tripId);
  },

  addSettlement: async (input: AddSettlementInput) => {
    const { error } = await supabase.from('settlements').insert(input);
    if (error) throw new Error(error.message);

    await get().fetchBalances(input.trip_id);
    await get().fetchSettlements(input.trip_id);
  },

  subscribeToExpenses: (tripId: string) => {
    const channel = supabase
      .channel(`expenses-${tripId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `trip_id=eq.${tripId}` }, () => {
        get().fetchExpenses(tripId);
        get().fetchBalances(tripId);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settlements', filter: `trip_id=eq.${tripId}` }, () => {
        get().fetchBalances(tripId);
        get().fetchSettlements(tripId);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  },
}));
