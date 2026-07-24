import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, ScrollView, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useExpenseStore } from '../../stores/expenseStore';
import { useAuthStore } from '../../stores/authStore';
import { AddExpenseScreen } from './AddExpenseScreen';
import { SettleUpScreen } from './SettleUpScreen';
import { SettlementDetailScreen } from './SettlementDetailScreen';
import { PaymentStatusBadge } from '../../components/PaymentStatusBadge';
import { Plus, Trash2, TrendingUp, TrendingDown, Clock } from 'lucide-react-native';
import { format } from 'date-fns';
import type { Expense } from '../../stores/expenseStore';

const CATEGORY_EMOJI: Record<string, string> = {
  Food: '🍽️', Grocery: '🛒', Rent: '🏠', Internet: '🌐',
  Electricity: '⚡', Water: '💧', Fuel: '⛽', Entertainment: '🎬',
  Shopping: '🛍️', Medical: '💊', Travel: '✈️', Hotel: '🏨',
  Flight: '🛫', Subscription: '📱', Salary: '💼', Business: '🏢',
  Transport: '🚗', Other: '📦', Parking: '🅿️', Miscellaneous: '📦',
};

interface Props {
  tripId: string;
}

export function ExpensesTab({ tripId }: Props) {
  const colors = useThemeColors();
  const { user, profile } = useAuthStore();
  const { expenses, balances, settlements, isLoading, fetchExpenses, fetchBalances, fetchSettlements, deleteExpense, subscribeToExpenses } = useExpenseStore();
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showSettleUp, setShowSettleUp] = useState(false);
  const [settleWithMember, setSettleWithMember] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances'>('expenses');
  const [detailSettlementId, setDetailSettlementId] = useState<string | null>(null);

  // Compute simplified pairwise debts.
  // net_balance > 0 means this person is owed money (creditor).
  // net_balance < 0 means this person owes money (debtor).
  // Only balances with |net_balance| >= 1 rupee are shown (avoids floating point noise).
  const computeSimplifiedDebts = () => {
    const THRESHOLD = 0.5; // ignore sub-rupee rounding noise
    const debtors  = balances
      .filter((b) => b.net_balance < -THRESHOLD)
      .map((b) => ({ ...b, remaining: Math.abs(b.net_balance) }));
    const creditors = balances
      .filter((b) => b.net_balance > THRESHOLD)
      .map((b) => ({ ...b, remaining: b.net_balance }));

    const debts: { from: string; fromName: string; to: string; toName: string; amount: number }[] = [];
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const payment = Math.min(debtors[i].remaining, creditors[j].remaining);
      if (payment > THRESHOLD) {
        debts.push({
          from: debtors[i].user_id,
          fromName: debtors[i].display_name,
          to: creditors[j].user_id,
          toName: creditors[j].display_name,
          amount: Math.round(payment), // round to whole rupees for display
        });
      }
      debtors[i].remaining  -= payment;
      creditors[j].remaining -= payment;
      if (debtors[i].remaining  <= THRESHOLD) i++;
      if (creditors[j].remaining <= THRESHOLD) j++;
    }
    return debts;
  };

  const simplifiedDebts = computeSimplifiedDebts();
  const youOwe     = simplifiedDebts.filter((d) => d.from === user?.id);
  const youReceive = simplifiedDebts.filter((d) => d.to   === user?.id);

  useEffect(() => {
    fetchExpenses(tripId);
    fetchBalances(tripId);
    fetchSettlements(tripId);
    const unsub = subscribeToExpenses(tripId);
    return unsub;
  }, [tripId]);

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  const myBalance = balances.find((b) => b.user_id === user?.id);
  const myNet = myBalance?.net_balance || 0;

  const handleDelete = (expenseId: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this expense? This cannot be undone.')) {
        deleteExpense(expenseId, tripId);
      }
    } else {
      Alert.alert(
        'Delete Expense',
        'Are you sure you want to delete this expense? This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => deleteExpense(expenseId, tripId) },
        ]
      );
    }
  };

  const renderExpense = ({ item }: { item: Expense }) => {
    const youPaid = item.paid_by === user?.id;
    // Assuming equal split: your share is total / number of members
    const memberCount = balances.length || 1;
    const yourShare = item.amount / memberCount;
    // If you paid: you're owed (total - yourShare). If someone else paid: you owe yourShare.
    const yourImpact = youPaid ? item.amount - yourShare : -yourShare;

    return (
      <View style={[styles.expenseRow, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }, shadows.card]}>
        <View style={[styles.categoryIcon, { backgroundColor: colors.primaryLight }]}>
          <Text style={{ fontSize: 18 }}>{CATEGORY_EMOJI[item.category] || '💰'}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text style={[typography.labelMedium, { color: colors.textPrimary }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]} numberOfLines={1}>
            {youPaid ? 'You paid' : `${item.paid_by_name} paid`} • {format(new Date(item.expense_date), 'MMM d')}
          </Text>
          <Text style={[typography.caption, { color: yourImpact >= 0 ? colors.success : colors.error, marginTop: 2 }]}>
            {yourImpact >= 0
              ? `You'll receive ₹${Math.round(yourImpact)} from others`
              : `You need to pay ₹${Math.round(Math.abs(yourImpact))} to ${item.paid_by_name}`}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[typography.numberSmall, { color: colors.textPrimary }]}>₹{item.amount.toLocaleString()}</Text>
          <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>{item.category}</Text>
        </View>
        {(item.created_by === user?.id || item.paid_by === user?.id) && (
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Trash2 color={colors.textTertiary} size={14} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Summary Card */}
      <LinearGradient
        colors={[colors.primary, '#7B61FF']}
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
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>

          {/* ── Your Summary ── */}
          <View style={[styles.yourSummaryCard, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}>
            <View style={[styles.balanceAvatar, { backgroundColor: colors.primaryLight }]}>
              <Text style={[typography.labelSmall, { color: colors.primary }]}>
                {(profile?.display_name || '?')[0].toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>
                {profile?.display_name || 'You'}
              </Text>
              <View style={{ flexDirection: 'row', marginTop: 4, gap: spacing.md }}>
                {youReceive.length > 0 && (
                  <Text style={[typography.caption, { color: colors.success }]}>
                    Will receive: ₹{youReceive.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}
                  </Text>
                )}
                {youOwe.length > 0 && (
                  <Text style={[typography.caption, { color: colors.error }]}>
                    Need to pay: ₹{youOwe.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}
                  </Text>
                )}
                {youOwe.length === 0 && youReceive.length === 0 && (
                  <Text style={[typography.caption, { color: colors.textTertiary }]}>All settled up!</Text>
                )}
              </View>
            </View>
          </View>

          {/* ── You need to pay ── */}
          {youOwe.length > 0 && (
            <View style={styles.balanceSection}>
              <Text style={[typography.overline, { color: colors.error, marginBottom: spacing.sm }]}>YOU NEED TO PAY</Text>
              {youOwe.map((d) => (
                <View key={d.to} style={[styles.balanceRow, { borderBottomColor: colors.borderLight }]}>
                  <View style={[styles.balanceAvatar, { backgroundColor: '#FFF1F2' }]}>
                    <Text style={[typography.labelSmall, { color: colors.error }]}>
                      {(d.toName || '?')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>{d.toName}</Text>
                    <Text style={[typography.caption, { color: colors.error }]}>You need to pay ₹{d.amount.toLocaleString()}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.settleRowBtn, { backgroundColor: colors.primary }]}
                    onPress={() => { setSettleWithMember(d.to); setShowSettleUp(true); }}
                  >
                    <Text style={[typography.caption, { color: '#fff', fontWeight: '700' }]}>Settle Up</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* ── You will receive ── */}
          {youReceive.length > 0 && (
            <View style={styles.balanceSection}>
              <Text style={[typography.overline, { color: colors.success, marginBottom: spacing.sm }]}>YOU WILL RECEIVE</Text>
              {youReceive.map((d) => (
                <View key={d.from} style={[styles.balanceRow, { borderBottomColor: colors.borderLight }]}>
                  <View style={[styles.balanceAvatar, { backgroundColor: colors.successBackground }]}>
                    <Text style={[typography.labelSmall, { color: colors.success }]}>
                      {(d.fromName || '?')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>{d.fromName}</Text>
                    <Text style={[typography.caption, { color: colors.success }]}>{d.fromName} needs to pay you ₹{d.amount.toLocaleString()}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ── All settled ── */}
          {youOwe.length === 0 && youReceive.length === 0 && (
            <View style={styles.allSettled}>
              <Text style={{ fontSize: 32 }}>🎉</Text>
              <Text style={[typography.labelLarge, { color: colors.success, marginTop: spacing.sm }]}>All settled up!</Text>
              <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' }]}>
                No pending balances in this group.
              </Text>
            </View>
          )}

          {/* ── In-flight settlements (pending confirmation) ── */}
          {settlements.filter((s) => s.status !== 'confirmed' && s.status !== 'rejected').length > 0 && (
            <View style={styles.balanceSection}>
              <Text style={[typography.overline, { color: colors.textTertiary, marginBottom: spacing.sm }]}>IN PROGRESS</Text>
              {settlements
                .filter((s) => s.status !== 'confirmed' && s.status !== 'rejected')
                .map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.inFlightRow, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }, shadows.card]}
                    onPress={() => setDetailSettlementId(s.id)}
                    activeOpacity={0.75}
                  >
                    <Clock size={14} color={colors.textTertiary} style={{ marginTop: 2 }} />
                    <View style={{ flex: 1, marginLeft: spacing.sm }}>
                      <Text style={[typography.labelSmall, { color: colors.textPrimary }]}>
                        {s.paid_by_name} → {s.paid_to_name}  ₹{s.amount.toLocaleString()}
                      </Text>
                      <Text style={[typography.caption, { color: colors.textTertiary }]}>
                        {format(new Date(s.created_at), 'dd MMM, h:mm a')}
                      </Text>
                    </View>
                    <PaymentStatusBadge status={s.status} size="sm" />
                  </TouchableOpacity>
                ))}
            </View>
          )}


        </ScrollView>
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
      <Modal visible={showAddExpense} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setShowAddExpense(false)}>
        <AddExpenseScreen tripId={tripId} onClose={() => setShowAddExpense(false)} />
      </Modal>
      <Modal visible={showSettleUp} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => { setShowSettleUp(false); setSettleWithMember(undefined); }}>
        <SettleUpScreen
          tripId={tripId}
          onClose={() => { setShowSettleUp(false); setSettleWithMember(undefined); }}
          preSelectedMemberId={settleWithMember}
          preSelectedAmount={settleWithMember ? simplifiedDebts.find((d) => d.from === user?.id && d.to === settleWithMember)?.amount : undefined}
        />
      </Modal>
      <Modal visible={!!detailSettlementId} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setDetailSettlementId(null)}>
        {detailSettlementId && (
          <SettlementDetailScreen
            settlementId={detailSettlementId}
            onClose={() => setDetailSettlementId(null)}
            onSettled={() => { fetchBalances(tripId); fetchSettlements(tripId); setDetailSettlementId(null); }}
          />
        )}
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
  settleRowBtn: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.sm,
  },
  balanceSection: { marginBottom: spacing.lg },
  yourSummaryCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md, borderRadius: borderRadius.lg,
    borderWidth: 1, marginBottom: spacing.lg,
  },
  allSettled: { alignItems: 'center', paddingVertical: spacing.xl },
  inFlightRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: spacing.sm, borderRadius: borderRadius.md,
    borderWidth: 1, marginBottom: spacing.xs,
  },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center' },
  fab: {
    position: 'absolute', right: spacing.md, bottom: spacing.md,
    width: 54, height: 54, borderRadius: 27,
    justifyContent: 'center', alignItems: 'center',
  },
});
