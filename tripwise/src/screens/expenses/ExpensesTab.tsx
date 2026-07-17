import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal } from 'react-native';
import { useThemeColors, typography, spacing, borderRadius } from '../../theme';
import { useExpenseStore } from '../../stores/expenseStore';
import { useAuthStore } from '../../stores/authStore';
import { AddExpenseScreen } from './AddExpenseScreen';
import { SettleUpScreen } from './SettleUpScreen';
import { Plus, Trash2 } from 'lucide-react-native';
import { format } from 'date-fns';
import type { Expense } from '../../stores/expenseStore';

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
    <View style={[styles.expenseRow, { borderColor: colors.border }]}>
      <View style={[styles.categoryDot, { backgroundColor: colors.primary }]} />
      <View style={{ flex: 1, marginLeft: spacing.sm }}>
        <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>{item.title}</Text>
        <Text style={[typography.caption, { color: colors.textTertiary }]}>
          {item.paid_by_name} • {item.category} • {format(new Date(item.expense_date), 'MMM d')}
        </Text>
      </View>
      <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>₹{item.amount.toLocaleString()}</Text>
      {(item.created_by === user?.id || item.paid_by === user?.id) && (
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ marginLeft: spacing.sm }}>
          <Trash2 color={colors.textTertiary} size={14} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Summary Card */}
      <View style={[styles.summaryCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <View style={styles.summaryRow}>
          <View>
            <Text style={[typography.caption, { color: colors.textTertiary }]}>Total Spent</Text>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>₹{totalSpent.toLocaleString()}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[typography.caption, { color: colors.textTertiary }]}>Your balance</Text>
            <Text style={[typography.h3, { color: myNet >= 0 ? colors.success : colors.error }]}>
              {myNet >= 0 ? `+₹${myNet.toFixed(0)}` : `-₹${Math.abs(myNet).toFixed(0)}`}
            </Text>
          </View>
        </View>
      </View>

      {/* Tab Toggle */}
      <View style={[styles.tabToggle, { backgroundColor: colors.inputBackground }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'expenses' && { backgroundColor: colors.primary }]}
          onPress={() => setActiveTab('expenses')}
        >
          <Text style={[typography.labelSmall, { color: activeTab === 'expenses' ? colors.textInverse : colors.textSecondary }]}>Expenses</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'balances' && { backgroundColor: colors.primary }]}
          onPress={() => setActiveTab('balances')}
        >
          <Text style={[typography.labelSmall, { color: activeTab === 'balances' ? colors.textInverse : colors.textSecondary }]}>Balances</Text>
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
          />
        ) : (
          <View style={styles.empty}>
            <Text style={{ fontSize: 36 }}>💰</Text>
            <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: spacing.sm }]}>No expenses yet</Text>
          </View>
        )
      ) : (
        <View style={{ flex: 1 }}>
          {balances.map((b) => (
            <View key={b.user_id} style={[styles.balanceRow, { borderColor: colors.border }]}>
              <Text style={[typography.bodyMedium, { color: colors.textPrimary, flex: 1 }]}>
                {b.user_id === user?.id ? `${b.display_name} (You)` : b.display_name}
              </Text>
              <Text style={[typography.labelMedium, { color: b.net_balance >= 0 ? colors.success : colors.error }]}>
                {b.net_balance >= 0 ? `gets ₹${b.net_balance.toFixed(0)}` : `owes ₹${Math.abs(b.net_balance).toFixed(0)}`}
              </Text>
            </View>
          ))}
          <TouchableOpacity
            style={[styles.settleBtn, { backgroundColor: colors.primary }]}
            onPress={() => setShowSettleUp(true)}
          >
            <Text style={[typography.labelMedium, { color: colors.textInverse }]}>Settle Up</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setShowAddExpense(true)}
      >
        <Plus color={colors.textInverse} size={24} />
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
  summaryCard: { padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, marginBottom: spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tabToggle: { flexDirection: 'row', borderRadius: borderRadius.md, padding: 3, marginBottom: spacing.md },
  tab: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.sm, alignItems: 'center' },
  expenseRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 0.5 },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 0.5 },
  settleBtn: { height: 44, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center', marginTop: spacing.lg },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fab: { position: 'absolute', right: spacing.md, bottom: spacing.md, width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
});
