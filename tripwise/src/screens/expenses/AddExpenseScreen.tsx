import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, Alert, Platform,
} from 'react-native';
import { useThemeColors, typography, spacing, borderRadius } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { useExpenseStore } from '../../stores/expenseStore';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Check } from 'lucide-react-native';

const CATEGORIES = [
  'Food', 'Fuel', 'Hotel', 'Flight', 'Shopping',
  'Transport', 'Entertainment', 'Parking', 'Medical', 'Miscellaneous',
];

interface Member { user_id: string; display_name: string | null; }

interface Props {
  tripId: string;
  onClose: () => void;
}

export function AddExpenseScreen({ tripId, onClose }: Props) {
  const colors = useThemeColors();
  const { user } = useAuthStore();
  const { addExpense } = useExpenseStore();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [paidBy, setPaidBy] = useState(user?.id || '');
  const [splitMethod, setSplitMethod] = useState<'equal' | 'unequal' | 'percentage'>('equal');
  const [splitWith, setSplitWith] = useState<string[]>([]);
  const [unequalAmounts, setUnequalAmounts] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    const { data } = await supabase.rpc('get_trip_members', { p_trip_id: tripId });
    if (data && Array.isArray(data)) {
      const activeMembers = data.filter((m: any) => m.status === 'active');
      const userIds = activeMembers.map((m: any) => m.user_id);

      // Use service function to get profiles (bypass RLS)
      const { data: profiles } = await supabase
        .rpc('get_profiles_by_ids', { user_ids: userIds });

      const memberList = activeMembers.map((m: any) => {
        const profile = Array.isArray(profiles)
          ? profiles.find((p: any) => p.id === m.user_id)
          : null;
        return {
          user_id: m.user_id,
          display_name: profile?.display_name || profile?.email || 'Member',
        };
      });

      setMembers(memberList);
      // Default: split with everyone
      setSplitWith(memberList.map((m) => m.user_id));
    }
  };

  const toggleSplitWith = (userId: string) => {
    setSplitWith((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const calculateSplits = (): { user_id: string; amount: number }[] => {
    const amt = parseFloat(amount);
    if (!amt || splitWith.length === 0) return [];

    if (splitMethod === 'equal') {
      const perPerson = Math.round((amt / splitWith.length) * 100) / 100;
      return splitWith.map((userId) => ({ user_id: userId, amount: perPerson }));
    }

    if (splitMethod === 'unequal') {
      return splitWith.map((userId) => ({
        user_id: userId,
        amount: parseFloat(unequalAmounts[userId] || '0'),
      }));
    }

    return splitWith.map((userId) => ({
      user_id: userId,
      amount: Math.round((amt / splitWith.length) * 100) / 100,
    }));
  };

  const showAlert = (title: string, msg: string) => {
    Platform.OS === 'web' ? window.alert(`${title}: ${msg}`) : Alert.alert(title, msg);
  };

  const handleSave = async () => {
    if (!title.trim()) { showAlert('Error', 'Enter a title'); return; }
    if (!amount || parseFloat(amount) <= 0) { showAlert('Error', 'Enter a valid amount'); return; }
    if (splitWith.length === 0) { showAlert('Error', 'Select at least one person to split with'); return; }
    if (!user) return;

    const splits = calculateSplits();
    if (splitMethod === 'unequal') {
      const total = splits.reduce((sum, s) => sum + s.amount, 0);
      if (Math.abs(total - parseFloat(amount)) > 0.01) {
        showAlert('Error', `Split amounts (₹${total.toFixed(2)}) don't add up to ₹${amount}`);
        return;
      }
    }

    setIsLoading(true);
    try {
      console.log('Adding expense:', {
        trip_id: tripId,
        title: title.trim(),
        amount: parseFloat(amount),
        category,
        paid_by: paidBy,
        split_method: splitMethod,
        splits,
        created_by: user.id,
      });
      await addExpense({
        trip_id: tripId,
        title: title.trim(),
        amount: parseFloat(amount),
        category,
        paid_by: paidBy,
        notes: notes.trim() || undefined,
        split_method: splitMethod,
        splits,
        created_by: user.id,
      });
      onClose();
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to add expense');
    } finally {
      setIsLoading(false);
    }
  };

  const perPerson = splitWith.length > 0 && amount
    ? (parseFloat(amount) / splitWith.length).toFixed(2)
    : '0.00';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} accessibilityLabel="Go back"><ArrowLeft color={colors.textPrimary} size={22} /></TouchableOpacity>
        <Text style={[typography.h3, { color: colors.textPrimary }]}>Add Expense</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Amount */}
        <View style={styles.amountSection}>
          <Text style={[typography.caption, { color: colors.textTertiary }]}>Amount (₹)</Text>
          <TextInput
            style={[styles.amountInput, { color: colors.textPrimary }]}
            placeholder="0"
            placeholderTextColor={colors.textTertiary}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            autoFocus
          />
        </View>

        {/* Title */}
        <View style={styles.field}>
          <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>What for? *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.textPrimary }]}
            placeholder="e.g. Dinner, Taxi, Hotel"
            placeholderTextColor={colors.textTertiary}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Category */}
        <View style={styles.field}>
          <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>Category</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, { backgroundColor: category === cat ? colors.primary : colors.inputBackground, borderColor: category === cat ? colors.primary : colors.border }]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[typography.caption, { color: category === cat ? colors.textInverse : colors.textPrimary }]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Paid By */}
        <View style={styles.field}>
          <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>Paid by</Text>
          <View style={styles.chipRow}>
            {members.map((m) => (
              <TouchableOpacity
                key={m.user_id}
                style={[styles.chip, { backgroundColor: paidBy === m.user_id ? colors.primary : colors.inputBackground, borderColor: paidBy === m.user_id ? colors.primary : colors.border }]}
                onPress={() => setPaidBy(m.user_id)}
              >
                <Text style={[typography.caption, { color: paidBy === m.user_id ? colors.textInverse : colors.textPrimary }]}>
                  {m.user_id === user?.id ? `${m.display_name} (You)` : m.display_name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Split Method */}
        <View style={styles.field}>
          <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>Split type</Text>
          <View style={styles.chipRow}>
            {(['equal', 'unequal'] as const).map((method) => (
              <TouchableOpacity
                key={method}
                style={[styles.chip, { backgroundColor: splitMethod === method ? colors.primary : colors.inputBackground, borderColor: splitMethod === method ? colors.primary : colors.border }]}
                onPress={() => setSplitMethod(method)}
              >
                <Text style={[typography.caption, { color: splitMethod === method ? colors.textInverse : colors.textPrimary }]}>
                  {method.charAt(0).toUpperCase() + method.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Split With */}
        <View style={styles.field}>
          <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>Split with</Text>
          {members.map((m) => (
            <TouchableOpacity
              key={m.user_id}
              style={[styles.splitRow, { borderColor: colors.border }]}
              onPress={() => toggleSplitWith(m.user_id)}
            >
              <View style={[styles.checkbox, { borderColor: splitWith.includes(m.user_id) ? colors.primary : colors.border, backgroundColor: splitWith.includes(m.user_id) ? colors.primary : 'transparent' }]}>
                {splitWith.includes(m.user_id) && <Check color={colors.textInverse} size={14} />}
              </View>
              <Text style={[typography.bodyMedium, { color: colors.textPrimary, flex: 1, marginLeft: spacing.sm }]}>
                {m.user_id === user?.id ? `${m.display_name} (You)` : m.display_name}
              </Text>
              {splitMethod === 'equal' && splitWith.includes(m.user_id) && (
                <Text style={[typography.labelSmall, { color: colors.primary }]}>₹{perPerson}</Text>
              )}
              {splitMethod === 'unequal' && splitWith.includes(m.user_id) && (
                <TextInput
                  style={[styles.splitInput, { borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  value={unequalAmounts[m.user_id] || ''}
                  onChangeText={(val) => setUnequalAmounts({ ...unequalAmounts, [m.user_id]: val })}
                  keyboardType="decimal-pad"
                />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Notes */}
        <View style={styles.field}>
          <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>Notes</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.textPrimary }]}
            placeholder="Optional notes"
            placeholderTextColor={colors.textTertiary}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: isLoading ? 0.6 : 1 }]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={[typography.labelLarge, { color: colors.textInverse }]}>
            {isLoading ? 'Adding...' : 'Add Expense'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  amountSection: { alignItems: 'center', marginBottom: spacing.xl },
  amountInput: { fontSize: 48, fontWeight: '700', textAlign: 'center', minWidth: 150 },
  field: { marginBottom: spacing.lg },
  input: { height: 48, borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, fontSize: 16, marginTop: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.full, borderWidth: 1 },
  splitRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 0.5 },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  splitInput: { width: 80, height: 36, borderWidth: 1, borderRadius: borderRadius.sm, textAlign: 'center', fontSize: 14 },
  saveBtn: { height: 52, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center', marginTop: spacing.md },
});
