import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { executeOrQueue } from '../lib/offlineQueue';
import { useNetworkStore } from './networkStore';

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

export type SettlementStatus =
  | 'pending'
  | 'initiated'
  | 'pending_confirmation'
  | 'confirmed'
  | 'rejected';

export interface Settlement {
  id: string;
  trip_id: string;
  paid_by: string;
  paid_to: string;
  amount: number;
  method: string;
  status: SettlementStatus;
  transaction_ref: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  dispute_reason: string | null;
  dispute_screenshot: string | null;
  paid_by_name?: string;
  paid_to_name?: string;
}

interface ExpenseState {
  expenses: Expense[];
  balances: Balance[];
  settlements: Settlement[];
  pendingConfirmations: Settlement[];
  isLoading: boolean;

  fetchExpenses: (tripId: string) => Promise<void>;
  fetchBalances: (tripId: string) => Promise<void>;
  fetchSettlements: (tripId: string) => Promise<void>;
  fetchMyPendingConfirmations: (userId: string) => Promise<void>;
  addExpense: (data: AddExpenseInput) => Promise<void>;
  deleteExpense: (expenseId: string, tripId: string) => Promise<void>;
  // Legacy manual settlement (goes straight to pending_confirmation)
  addSettlement: (data: AddSettlementInput) => Promise<void>;
  // UPI flow actions
  initiateUpiSettlement: (data: InitiateSettlementInput) => Promise<string>;
  markAsPaid: (settlementId: string, transactionRef?: string) => Promise<void>;
  confirmSettlement: (settlementId: string) => Promise<void>;
  disputeSettlement: (settlementId: string, reason: string, screenshotUrl?: string) => Promise<void>;
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
  transaction_ref?: string;
}

interface InitiateSettlementInput {
  trip_id: string;
  paid_by: string;
  paid_to: string;
  amount: number;
  notes?: string;
}

const enrichWithNames = async (data: any[]) => {
  const userIds = [...new Set([...data.map((s) => s.paid_by), ...data.map((s) => s.paid_to)])];
  const { data: profiles } = await supabase.rpc('get_profiles_by_ids', { user_ids: userIds });
  return data.map((s) => ({
    ...s,
    paid_by_name: (Array.isArray(profiles) ? profiles.find((p: any) => p.id === s.paid_by)?.display_name : null) || 'Unknown',
    paid_to_name: (Array.isArray(profiles) ? profiles.find((p: any) => p.id === s.paid_to)?.display_name : null) || 'Unknown',
  }));
};

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  balances: [],
  settlements: [],
  pendingConfirmations: [],
  isLoading: false,

  fetchExpenses: async (tripId) => {
    set({ isLoading: true });
    try {
      const { data } = await supabase
        .from('expenses')
        .select('*')
        .eq('trip_id', tripId)
        .order('expense_date', { ascending: false });

      if (data) {
        const userIds = [...new Set(data.map((e) => e.paid_by))];
        const { data: profiles } = await supabase.rpc('get_profiles_by_ids', { user_ids: userIds });
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

  fetchBalances: async (tripId) => {
    const { data } = await supabase.rpc('compute_trip_balances', { p_trip_id: tripId });
    if (data && Array.isArray(data)) set({ balances: data });
  },

  fetchSettlements: async (tripId) => {
    const { data } = await supabase
      .from('settlements')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (data) {
      const enriched = await enrichWithNames(data);
      set({ settlements: enriched });
    }
  },

  fetchMyPendingConfirmations: async (userId) => {
    const { data } = await supabase
      .from('settlements')
      .select('*')
      .eq('paid_to', userId)
      .eq('status', 'pending_confirmation')
      .order('updated_at', { ascending: false });

    if (data) {
      const enriched = await enrichWithNames(data);
      set({ pendingConfirmations: enriched });
    }
  },

  addExpense: async (input) => {
    const { splits, ...expenseData } = input;

    const onlineExecutor = async () => {
      const { data: expense, error } = await supabase
        .from('expenses')
        .insert({
          trip_id: expenseData.trip_id,
          title: expenseData.title,
          amount: expenseData.amount,
          category: expenseData.category,
          paid_by: expenseData.paid_by,
          notes: expenseData.notes || null,
          split_method: expenseData.split_method,
          created_by: expenseData.created_by,
        })
        .select('id')
        .single();

      if (error) throw new Error(error.message);
      if (!expense) throw new Error('Failed to add expense');

      const { error: splitError } = await supabase.from('expense_splits').insert(
        splits.map((s) => ({ expense_id: expense.id, user_id: s.user_id, amount: s.amount }))
      );
      if (splitError) throw new Error(splitError.message);
    };

    const { queued } = await executeOrQueue('add_expense', input, onlineExecutor);

    if (queued) {
      // Update pending count in network store
      useNetworkStore.getState().refreshPendingCount();
    } else {
      await get().fetchExpenses(input.trip_id);
      await get().fetchBalances(input.trip_id);
    }
  },

  deleteExpense: async (expenseId, tripId) => {
    const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
    if (error) throw new Error(error.message);
    await get().fetchExpenses(tripId);
    await get().fetchBalances(tripId);
  },

  // Manual settlement — goes directly to pending_confirmation
  addSettlement: async (input) => {
    const { error } = await supabase.from('settlements').insert({
      ...input,
      status: 'pending_confirmation',
    });
    if (error) throw new Error(error.message);
    await get().fetchBalances(input.trip_id);
    await get().fetchSettlements(input.trip_id);
  },

  // UPI Step 1: create record with status=initiated, returns the new settlement id
  initiateUpiSettlement: async (input) => {
    const { data, error } = await supabase
      .from('settlements')
      .insert({
        trip_id: input.trip_id,
        paid_by: input.paid_by,
        paid_to: input.paid_to,
        amount: input.amount,
        method: 'upi',
        notes: input.notes || null,
        status: 'initiated',
      })
      .select('id')
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Failed to initiate settlement');
    return data.id as string;
  },

  // UPI Step 2: payer tapped "I Have Paid" → pending_confirmation
  markAsPaid: async (settlementId, transactionRef) => {
    const { error } = await supabase
      .from('settlements')
      .update({
        status: 'pending_confirmation',
        transaction_ref: transactionRef || null,
      })
      .eq('id', settlementId)
      .eq('status', 'initiated'); // guard: only move forward from initiated

    if (error) throw new Error(error.message);
  },

  // Recipient confirms
  confirmSettlement: async (settlementId) => {
    const { error } = await supabase
      .from('settlements')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', settlementId)
      .eq('status', 'pending_confirmation');

    if (error) throw new Error(error.message);
  },

  // Recipient disputes
  disputeSettlement: async (settlementId, reason, screenshotUrl) => {
    const { error } = await supabase
      .from('settlements')
      .update({
        status: 'rejected',
        dispute_reason: reason,
        dispute_screenshot: screenshotUrl || null,
      })
      .eq('id', settlementId)
      .eq('status', 'pending_confirmation');

    if (error) throw new Error(error.message);
  },

  subscribeToExpenses: (tripId) => {
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
