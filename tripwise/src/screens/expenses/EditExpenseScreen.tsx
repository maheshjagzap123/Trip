import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, Alert, Platform,
} from 'react-native';
import { useThemeColors, typography, spacing, borderRadius } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { useExpenseStore } from '../../stores/expenseStore';
import { supabase } from '../../lib/supabase';
import { ArrowLeft } from 'lucide-react-native';

const CATEGORIES = [
  'Food', 'Fuel', 'Hotel', 'Flight', 'Shopping',
  'Transport', 'Entertainment', 'Parking', 'Medical', 'Miscellaneous',
];

interface Props {
  expenseId: string;
  tripId: string;
  onClose: () => void;
}

export function EditExpenseScreen({ expenseId, tripId, onClose }: Props) {
  const colors = useThemeColors();
  const { user } = useAuthStore();
  const { fetchExpenses, fetchBalances } = useExpenseStore();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => { loadExpense(); }, []);

  const loadExpense = async () => {
    const { data } = await supabase.from('expenses').select('*').eq('id', expenseId).single();
    if (data) {
      setTitle(data.title || '');
      setAmount(String(data.amount));
      setCategory(data.category || 'Food');
      setNotes(data.notes || '');
    }
    setIsFetching(false);
  };

  const showAlert = (t: string, m: string) => {
    Platform.OS === 'web' ? window.alert(`${t}: ${m}`) : Alert.alert(t, m);
  };

  const handleSave = async () => {
    if (!title.trim()) { showAlert('Error', 'Enter a title'); return; }
    if (!amount || parseFloat(amount) <= 0) { showAlert('Error', 'Enter a valid amount'); return; }

    setIsLoading(true);
    try {
      const { error } = await supabase.from('expenses').update({
        title: title.trim(),
        amount: parseFloat(amount),
        category,
        notes: notes.trim() || null,
      }).eq('id', expenseId);

      if (error) { showAlert('Error', error.message); return; }

      await fetchExpenses(tripId);
      await fetchBalances(tripId);
      onClose();
    } catch (err: any) {
      showAlert('Error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.textSecondary }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onClose}><ArrowLeft color={colors.textPrimary} size={22} /></TouchableOpacity>
        <Text style={[typography.h3, { color: colors.textPrimary }]}>Edit Expense</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.field}>
          <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>Amount (₹) *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.textPrimary }]}
            value={amount} onChangeText={setAmount} keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>Title *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.textPrimary }]}
            value={title} onChangeText={setTitle}
          />
        </View>

        <View style={styles.field}>
          <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>Category</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, { backgroundColor: category === cat ? colors.primary : colors.inputBackground, borderColor: category === cat ? colors.primary : colors.border }]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[{ fontSize: 12, fontWeight: '600', color: category === cat ? '#fff' : colors.textPrimary }]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>Notes</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.textPrimary }]}
            value={notes} onChangeText={setNotes} placeholder="Optional"
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: isLoading ? 0.6 : 1 }]}
          onPress={handleSave} disabled={isLoading}
        >
          <Text style={[typography.labelLarge, { color: '#fff' }]}>{isLoading ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  field: { marginBottom: spacing.lg },
  input: { height: 48, borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, fontSize: 16, marginTop: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.full, borderWidth: 1 },
  saveBtn: { height: 52, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center', marginTop: spacing.md },
});
