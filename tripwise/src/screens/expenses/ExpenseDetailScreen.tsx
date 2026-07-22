import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, Alert, Platform, BackHandler,
} from 'react-native';
import { useThemeColors, typography, spacing, borderRadius } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { useExpenseStore } from '../../stores/expenseStore';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Trash2, Pencil, User } from 'lucide-react-native';
import { format } from 'date-fns';

interface Props {
  expenseId: string;
  tripId: string;
  onClose: () => void;
  onEdit: () => void;
}

interface SplitDetail {
  user_id: string;
  amount: number;
  display_name: string;
}

export function ExpenseDetailScreen({ expenseId, tripId, onClose, onEdit }: Props) {
  const colors = useThemeColors();
  const { user } = useAuthStore();
  const { deleteExpense } = useExpenseStore();
  const [expense, setExpense] = useState<any>(null);
  const [splits, setSplits] = useState<SplitDetail[]>([]);
  const [payerName, setPayerName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchDetail(); }, [expenseId]);

  useEffect(() => {
    const bh = BackHandler.addEventListener('hardwareBackPress', () => { onClose(); return true; });
    return () => bh.remove();
  }, [onClose]);

  const fetchDetail = async () => {
    setIsLoading(true);
    // Fetch expense
    const { data: exp } = await supabase.from('expenses').select('*').eq('id', expenseId).single();
    if (exp) setExpense(exp);

    // Fetch splits
    const { data: splitData } = await supabase.from('expense_splits').select('user_id, amount').eq('expense_id', expenseId);

    if (splitData) {
      const userIds = splitData.map((s) => s.user_id);
      if (exp?.paid_by && !userIds.includes(exp.paid_by)) userIds.push(exp.paid_by);
      const { data: profiles } = await supabase.rpc('get_profiles_by_ids', { user_ids: userIds });

      const enriched = splitData.map((s) => ({
        ...s,
        display_name: (Array.isArray(profiles) ? profiles.find((p: any) => p.id === s.user_id)?.display_name : null) || 'Member',
      }));
      setSplits(enriched);

      if (exp?.paid_by) {
        const payer = Array.isArray(profiles) ? profiles.find((p: any) => p.id === exp.paid_by) : null;
        setPayerName(payer?.display_name || 'Unknown');
      }
    }
    setIsLoading(false);
  };

  const handleDelete = () => {
    const confirm = Platform.OS === 'web'
      ? window.confirm('Delete this expense?')
      : false;

    if (Platform.OS === 'web' && confirm) {
      deleteExpense(expenseId, tripId);
      onClose();
    } else if (Platform.OS !== 'web') {
      Alert.alert('Delete', 'Delete this expense?', [
        { text: 'Cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => { deleteExpense(expenseId, tripId); onClose(); } },
      ]);
    }
  };

  if (isLoading || !expense) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.center}><Text style={{ color: colors.textSecondary }}>Loading...</Text></View>
      </SafeAreaView>
    );
  }

  const isOwner = expense.paid_by === user?.id || expense.created_by === user?.id;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onClose}><ArrowLeft color={colors.textPrimary} size={22} /></TouchableOpacity>
        <Text style={[typography.h3, { color: colors.textPrimary, flex: 1, marginLeft: spacing.sm }]}>Expense Detail</Text>
        {isOwner && (
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <TouchableOpacity onPress={onEdit}><Pencil size={18} color={colors.primary} /></TouchableOpacity>
            <TouchableOpacity onPress={handleDelete}><Trash2 size={18} color={colors.error} /></TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Amount Hero */}
        <View style={styles.amountSection}>
          <Text style={[styles.amount, { color: colors.textPrimary }]}>₹{expense.amount.toLocaleString()}</Text>
          <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>{expense.title}</Text>
        </View>

        {/* Info Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: colors.textTertiary }]}>Category</Text>
            <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>{expense.category}</Text>
          </View>
          <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.textTertiary }]}>Paid by</Text>
            <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>
              {expense.paid_by === user?.id ? `${payerName} (You)` : payerName}
            </Text>
          </View>
          <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.textTertiary }]}>Date</Text>
            <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>
              {format(new Date(expense.expense_date || expense.created_at), 'MMM d, yyyy')}
            </Text>
          </View>
          <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.textTertiary }]}>Split method</Text>
            <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>{expense.split_method || 'Equal'}</Text>
          </View>
          {expense.notes && (
            <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <Text style={[styles.label, { color: colors.textTertiary }]}>Notes</Text>
              <Text style={[typography.bodySmall, { color: colors.textPrimary, flex: 1, textAlign: 'right' }]}>{expense.notes}</Text>
            </View>
          )}
        </View>

        {/* Split Breakdown */}
        <Text style={[typography.labelLarge, { color: colors.textPrimary, marginBottom: spacing.sm }]}>Split Breakdown</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {splits.map((s) => (
            <View key={s.user_id} style={[styles.splitRow, splits.indexOf(s) > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <View style={[styles.splitAvatar, { backgroundColor: colors.primaryLight }]}>
                <User size={14} color={colors.primary} />
              </View>
              <Text style={[typography.bodyMedium, { color: colors.textPrimary, flex: 1, marginLeft: spacing.sm }]}>
                {s.user_id === user?.id ? `${s.display_name} (You)` : s.display_name}
              </Text>
              <Text style={[typography.labelMedium, { color: colors.primary }]}>₹{s.amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  amountSection: { alignItems: 'center', marginBottom: spacing.xl },
  amount: { fontSize: 40, fontWeight: '800' },
  card: { borderRadius: borderRadius.lg, borderWidth: 1, marginBottom: spacing.lg, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  label: { fontSize: 13, fontWeight: '500' },
  splitRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  splitAvatar: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
});
