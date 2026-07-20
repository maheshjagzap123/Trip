import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useExpenseStore } from '../../stores/expenseStore';
import { useAuthStore } from '../../stores/authStore';
import { AddExpenseScreen } from './AddExpenseScreen';
import { SettleUpScreen } from './SettleUpScreen';
import { Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react-native';
import { format } from 'date-fns';
import type { Expense } from '../../stores/expenseStore';

const CATEGORY_EMOJI: Record<string, string> = {
  Food: '🍽️', Fuel: '⛽', Hotel: '🏨', Flight: '✈️',
  Shopping: '🛍️', Transport: '🚗', Entertainment: '🎬',
  Parking: '🅿️', Medical: '💊', Miscellaneous: '📦',
};

interface Props {
  tripId: string;
}

export function ExpensesTab({ tripId }: Props) {
  const colors = useThemeColors();
  const { user } = useAuthStore();
  const { expenses, balances, isLoading, fetchExpenses, fetchBalances, deleteExpense, subscribeToExpenses } = useExpenseStore();
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showSettleUp, setShowSettleUp] = useState(false);
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances'>('expenses');

  useEffect(() => {
    fetchExpenses(tripId);
    fetchBalances(tripId);
    const unsub = subscribeToExpenses(tripId);
    return unsub;
  }, [tripId]);

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  const myBalance = balances.find((b) => b.user_id === user?.id);
  const myNet = myBalance?.net_balance || 0;

  const handleDelete = (expenseId: string) => {
    deleteExpense(expenseId, tripId);
  };

  const renderExpense = ({ item }: { item: Expense }) => (
    <View style={[styles.expenseRow, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }, shadows.card]}>
      <View style={[styles.categoryIcon, { backgroundColor: colors.primaryLight }]}>
        <Text style={{ fontSize: 18 }}>{CATEGORY_EMOJI[item.category] || '💰'}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: spacing.sm }}>
        <Text style={[typography.labelMedium, { color: colors.textPrimary }]} numberOfLines={1}>{item.title}</Text>
        <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]} numberOfLines={1}>
          {item.paid_by_name} • {format(new Date(item.expense_date), 'MMM d')}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[typography.numberSmall, { color: colors.textPrimary }]}>₹{item.amount.toLocaleString()}</Text>
        <Text style={[typography.caption, { color: colors.textTertiary }]}>{item.category}</Text>
      </View>
      {(item.created_by === user?.id || item.paid_by === user?.id) && (
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Trash2 color={colors.textTertiary} size={14} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Summary Card */}
      <LinearGradient
        colors={[colors.primary, '#6366F1']}
        style={[styles.summaryCard, shadows.brand]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryLabel}>Total Spent</Text>
            <Text style={styles.summaryAmount}>₹{totalSpent.toLocaleString()}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.summaryLabel}>Your Balance</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              {myNet >= 0
                ? <TrendingUp size={14} color="rgba(255,255,255,0.8)" />
                : <TrendingDown size={14} color="rgba(255,255,255,0.8)" />
              }
              <Text style={[styles.summaryBalance, { color: myNet >= 0 ? '#86EFAC' : '#FCA5A5' }]}>
                {myNet >= 0 ? `+₹${myNet.toFixed(0)}` : `-₹${Math.abs(myNet).toFixed(0)}`}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Tab Toggle */}
      <View style={[styles.tabToggle, { backgroundColor: colors.inputBackground }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'expenses' && { backgroundColor: colors.primary }]}
          onPress={() => setActiveTab('expenses')}
        >
          <Text style={[typography.labelSmall, { color: activeTab === 'expenses' ? '#fff' : colors.textSecondary }]}>
            Expenses ({expenses.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'balances' && { backgroundColor: colors.primary }]}
          onPress={() => setActiveTab('balances')}
        >
          <Text style={[typography.labelSmall, { color: activeTab === 'balances' ? '#fff' : colors.textSecondary }]}>
            Balances
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'expenses' ? (
        expenses.length > 0 ? (
          <FlatList
            data={expenses}
            renderItem={renderExpense}
            keyExtractor={(item) => item.id}
            style={{ flex: 1 }}
            contentContainerStyle={{ gap: spacing.sm, paddingBottom: 80 }}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primaryLight }]}>
              <Text style={{ fontSize: 32 }}>💰</Text>
            </View>
            <Text style={[typography.h3, { color: colors.textPrimary, marginTop: spacing.md }]}>No expenses yet</Text>
            <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' }]}>
              Tap + to add your first expense
            </Text>
          </View>
        )
      ) : (
        <View style={{ flex: 1 }}>
          {balances.map((b) => (
            <View key={b.user_id} style={[styles.balanceRow, { borderBottomColor: colors.borderLight }]}>
              <View style={[styles.balanceAvatar, { backgroundColor: colors.primaryLight }]}>
                <Text style={[typography.labelSmall, { color: colors.primary }]}>
                  {(b.display_name || '?')[0].toUpperCase()}
                </Text>
              </View>
              <Text style={[typography.bodyMedium, { color: colors.textPrimary, flex: 1, marginLeft: spacing.sm }]}>
                {b.user_id === user?.id ? `${b.display_name} (You)` : b.display_name}
              </Text>
              <Text style={[typography.labelMedium, { color: b.net_balance >= 0 ? colors.success : colors.error }]}>
                {b.net_balance >= 0 ? `gets ₹${b.net_balance.toFixed(0)}` : `owes ₹${Math.abs(b.net_balance).toFixed(0)}`}
              </Text>
            </View>
          ))}
          <TouchableOpacity
            style={[styles.settleBtn, { backgroundColor: colors.primary }, shadows.brand]}
            onPress={() => setShowSettleUp(true)}
          >
            <Text style={[typography.buttonMedium, { color: '#fff' }]}>Settle Up</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }, shadows.brand]}
        onPress={() => setShowAddExpense(true)}
        accessibilityLabel="Add expense"
      >
        <Plus color="#fff" size={24} />
      </TouchableOpacity>

      {/* Modals */}
      <Modal visible={showAddExpense} animationType="slide" presentationStyle="fullScreen">
        <AddExpenseScreen tripId={tripId} onClose={() => setShowAddExpense(false)} />
      </Modal>
      <Modal visible={showSettleUp} animationType="slide" presentationStyle="fullScreen">
        <SettleUpScreen tripId={tripId} onClose={() => setShowSettleUp(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.md, paddingTop: spacing.md },
  summaryCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 4 },
  summaryAmount: { fontSize: 24, fontWeight: '800', color: '#fff' },
  summaryBalance: { fontSize: 18, fontWeight: '800' },
  tabToggle: { flexDirection: 'row', borderRadius: borderRadius.md, padding: 3, marginBottom: spacing.md },
  tab: { flex: 1, paddingVertical: spacing.sm + 2, borderRadius: borderRadius.sm, alignItems: 'center' },
  expenseRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1,
  },
  categoryIcon: {
    width: 42, height: 42, borderRadius: borderRadius.md,
    justifyContent: 'center', alignItems: 'center',
  },
  deleteBtn: { marginLeft: spacing.sm, padding: spacing.xs },
  balanceRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  balanceAvatar: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  settleBtn: {
    height: 48, borderRadius: borderRadius.md,
    justifyContent: 'center', alignItems: 'center', marginTop: spacing.lg,
  },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center' },
  fab: {
    position: 'absolute', right: spacing.md, bottom: spacing.md,
    width: 54, height: 54, borderRadius: 27,
    justifyContent: 'center', alignItems: 'center',
  },
});
