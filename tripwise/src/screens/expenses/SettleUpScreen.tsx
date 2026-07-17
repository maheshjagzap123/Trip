import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, Platform,
} from 'react-native';
import { useThemeColors, typography, spacing, borderRadius } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { useExpenseStore } from '../../stores/expenseStore';
import { supabase } from '../../lib/supabase';
import { ArrowLeft } from 'lucide-react-native';

interface Member { user_id: string; display_name: string | null; }

interface Props {
  tripId: string;
  onClose: () => void;
}

const METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Other'];

export function SettleUpScreen({ tripId, onClose }: Props) {
  const colors = useThemeColors();
  const { user } = useAuthStore();
  const { balances, addSettlement, fetchSettlements, settlements } = useExpenseStore();

  const [paidBy, setPaidBy] = useState(user?.id || '');
  const [paidTo, setPaidTo] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchMembers();
    fetchSettlements(tripId);
  }, []);

  const fetchMembers = async () => {
    const { data } = await supabase.rpc('get_trip_members', { p_trip_id: tripId });
    if (data && Array.isArray(data)) {
      const active = data.filter((m: any) => m.status === 'active');
      const userIds = active.map((m: any) => m.user_id);
      const { data: profiles } = await supabase.rpc('get_profiles_by_ids', { user_ids: userIds });
      setMembers(active.map((m: any) => ({
        user_id: m.user_id,
        display_name: (Array.isArray(profiles) ? profiles.find((p: any) => p.id === m.user_id)?.display_name : null) || 'Member',
      })));
    }
  };

  const showAlert = (title: string, msg: string) => {
    Platform.OS === 'web' ? window.alert(`${title}: ${msg}`) : Alert.alert(title, msg);
  };

  const handleSettle = async () => {
    if (!paidTo) { showAlert('Error', 'Select who you paid'); return; }
    if (!amount || parseFloat(amount) <= 0) { showAlert('Error', 'Enter a valid amount'); return; }
    if (paidBy === paidTo) { showAlert('Error', 'Cannot settle with yourself'); return; }

    setIsLoading(true);
    try {
      await addSettlement({
        trip_id: tripId,
        paid_by: paidBy,
        paid_to: paidTo,
        amount: parseFloat(amount),
        method: method.toLowerCase(),
        notes: notes.trim() || undefined,
      });
      showAlert('Done', 'Settlement recorded!');
      onClose();
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to record settlement');
    } finally {
      setIsLoading(false);
    }
  };

  // Suggest who to pay and how much based on balances
  const myBalance = balances.find((b) => b.user_id === user?.id);
  const iOwe = myBalance && myBalance.net_balance < 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onClose}><ArrowLeft color={colors.textPrimary} size={24} /></TouchableOpacity>
        <Text style={[typography.h3, { color: colors.textPrimary }]}>Settle Up</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Who's paying */}
        <View style={styles.field}>
          <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>Who is paying?</Text>
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

        {/* Paying to */}
        <View style={styles.field}>
          <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>Paying to?</Text>
          <View style={styles.chipRow}>
            {members.filter((m) => m.user_id !== paidBy).map((m) => (
              <TouchableOpacity
                key={m.user_id}
                style={[styles.chip, { backgroundColor: paidTo === m.user_id ? colors.primary : colors.inputBackground, borderColor: paidTo === m.user_id ? colors.primary : colors.border }]}
                onPress={() => setPaidTo(m.user_id)}
              >
                <Text style={[typography.caption, { color: paidTo === m.user_id ? colors.textInverse : colors.textPrimary }]}>
                  {m.user_id === user?.id ? `${m.display_name} (You)` : m.display_name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Amount */}
        <View style={styles.field}>
          <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>Amount (₹)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.textPrimary }]}
            placeholder="0"
            placeholderTextColor={colors.textTertiary}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Method */}
        <View style={styles.field}>
          <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>Payment method</Text>
          <View style={styles.chipRow}>
            {METHODS.map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.chip, { backgroundColor: method === m ? colors.primary : colors.inputBackground, borderColor: method === m ? colors.primary : colors.border }]}
                onPress={() => setMethod(m)}
              >
                <Text style={[typography.caption, { color: method === m ? colors.textInverse : colors.textPrimary }]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.field}>
          <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>Notes</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.textPrimary }]}
            placeholder="Optional"
            placeholderTextColor={colors.textTertiary}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Record Button */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: isLoading ? 0.6 : 1 }]}
          onPress={handleSettle}
          disabled={isLoading}
        >
          <Text style={[typography.labelLarge, { color: colors.textInverse }]}>
            {isLoading ? 'Recording...' : 'Record Settlement'}
          </Text>
        </TouchableOpacity>

        {/* Settlement History */}
        {settlements.length > 0 && (
          <View style={styles.history}>
            <Text style={[typography.labelMedium, { color: colors.textPrimary, marginBottom: spacing.sm }]}>Settlement History</Text>
            {settlements.map((s) => (
              <View key={s.id} style={[styles.historyRow, { borderColor: colors.border }]}>
                <Text style={[typography.bodySmall, { color: colors.textPrimary }]}>
                  {s.paid_by_name} paid {s.paid_to_name}
                </Text>
                <Text style={[typography.labelSmall, { color: colors.success }]}>₹{s.amount}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  field: { marginBottom: spacing.lg },
  input: { height: 48, borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, fontSize: 16, marginTop: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.full, borderWidth: 1 },
  saveBtn: { height: 52, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center', marginTop: spacing.md },
  history: { marginTop: spacing.xl },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 0.5 },
});
