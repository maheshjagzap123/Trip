import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Platform, Linking,
  AppState, AppStateStatus, Modal, ActivityIndicator, BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { useExpenseStore } from '../../stores/expenseStore';
import { supabase } from '../../lib/supabase';
import { PaymentStatusBadge } from '../../components/PaymentStatusBadge';
import { SettlementDetailScreen } from './SettlementDetailScreen';
import { ArrowLeft, AlertTriangle, Smartphone, FileText } from 'lucide-react-native';
import { format } from 'date-fns';

interface Member {
  user_id: string;
  display_name: string | null;
  upi_id: string | null;
  upi_display_name: string | null;
}

interface Props {
  tripId: string;
  onClose: () => void;
  preSelectedMemberId?: string;
  preSelectedAmount?: number;
}

const MANUAL_METHODS = ['Cash', 'Bank Transfer', 'Other'];

export function SettleUpScreen({ tripId, onClose, preSelectedMemberId, preSelectedAmount }: Props) {
  const colors = useThemeColors();
  const { user } = useAuthStore();
  const {
    balances, settlements, fetchSettlements,
    initiateUpiSettlement, markAsPaid, addSettlement,
  } = useExpenseStore();

  const [members, setMembers] = useState<Member[]>([]);
  const [paidTo, setPaidTo] = useState('');
  const [amount, setAmount] = useState('');
  const [manualMethod, setManualMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [txnRef, setTxnRef] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // UPI flow state
  const [pendingSettlementId, setPendingSettlementId] = useState<string | null>(null);
  const [showIHavePaidSheet, setShowIHavePaidSheet] = useState(false);
  const upiLaunchPending = useRef(false);

  // Settlement detail modal
  const [detailSettlementId, setDetailSettlementId] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
    fetchSettlements(tripId);
  }, []);

  // Handle Android hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => backHandler.remove();
  }, [onClose]);

  // Pre-select member and amount if passed from balances row
  useEffect(() => {
    if (preSelectedMemberId) setPaidTo(preSelectedMemberId);
    if (preSelectedAmount && preSelectedAmount > 0) setAmount(preSelectedAmount.toFixed(0));
  }, [preSelectedMemberId, preSelectedAmount]);

  // Pre-fill amount from net balance ONLY when no specific amount was passed
  useEffect(() => {
    if (preSelectedAmount && preSelectedAmount > 0) return; // already set above
    if (!user) return;
    const myBalance = balances.find((b) => b.user_id === user.id);
    if (myBalance && myBalance.net_balance < 0) {
      setAmount(Math.abs(myBalance.net_balance).toFixed(0));
    }
  }, [balances, user]);

  // AppState listener — show "I Have Paid" sheet when returning from UPI app
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active' && upiLaunchPending.current) {
        upiLaunchPending.current = false;
        setShowIHavePaidSheet(true);
      }
    });
    return () => sub.remove();
  }, []);

  const fetchMembers = async () => {
    const { data } = await supabase.rpc('get_trip_members', { p_trip_id: tripId });
    if (!data || !Array.isArray(data)) return;
    const active = data.filter((m: any) => m.status === 'active' && m.user_id !== user?.id);
    const userIds = active.map((m: any) => m.user_id);
    const { data: profiles } = await supabase.rpc('get_profiles_by_ids', { user_ids: userIds });
    setMembers(active.map((m: any) => {
      const p = Array.isArray(profiles) ? profiles.find((pr: any) => pr.id === m.user_id) : null;
      return {
        user_id: m.user_id,
        display_name: p?.display_name || 'Member',
        upi_id: p?.upi_id || null,
        upi_display_name: p?.upi_display_name || null,
      };
    }));
  };

  const showAlert = (title: string, msg: string) =>
    Platform.OS === 'web' ? window.alert(`${title}: ${msg}`) : Alert.alert(title, msg);

  const selectedMember = members.find((m) => m.user_id === paidTo);
  const receiverHasUpi = !!selectedMember?.upi_id;
  const parsedAmount = parseFloat(amount);
  const amountValid = !isNaN(parsedAmount) && parsedAmount > 0;

  // ── Pay via UPI ──────────────────────────────────────────────────────────
  const handlePayViaUpi = async () => {
    if (!paidTo || !selectedMember) { showAlert('Error', 'Select who you are paying'); return; }
    if (!amountValid) { showAlert('Error', 'Enter a valid amount'); return; }
    if (!selectedMember.upi_id) return; // guarded by UI

    setIsLoading(true);
    try {
      const upiUrl = `upi://pay?pa=${selectedMember.upi_id}&pn=${encodeURIComponent(selectedMember.upi_display_name || selectedMember.display_name || '')}&am=${parsedAmount.toFixed(2)}&cu=INR&tn=TripWise+Settlement`;

      const canOpen = await Linking.canOpenURL(upiUrl);
      if (!canOpen) {
        showAlert('No UPI app found', 'Please install a UPI app (GPay, PhonePe, Paytm, etc.) to pay via UPI.');
        return;
      }

      // Create initiated record
      const settlementId = await initiateUpiSettlement({
        trip_id: tripId,
        paid_by: user!.id,
        paid_to: paidTo,
        amount: parsedAmount,
        notes: notes.trim() || undefined,
      });

      setPendingSettlementId(settlementId);
      upiLaunchPending.current = true;
      await Linking.openURL(upiUrl);
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to open UPI app');
    } finally {
      setIsLoading(false);
    }
  };

  // ── I Have Paid ──────────────────────────────────────────────────────────
  const handleIHavePaid = async () => {
    if (!pendingSettlementId) return;
    setIsLoading(true);
    try {
      await markAsPaid(pendingSettlementId, txnRef.trim() || undefined);
      await fetchSettlements(tripId);
      setShowIHavePaidSheet(false);
      setPendingSettlementId(null);
      setTxnRef('');
      showAlert('Sent for confirmation', `${selectedMember?.display_name || 'Recipient'} will be notified to confirm.`);
      onClose();
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to update status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelUpi = async () => {
    // Reset initiated settlement back to pending
    if (pendingSettlementId) {
      await supabase.from('settlements').update({ status: 'pending' }).eq('id', pendingSettlementId);
    }
    setPendingSettlementId(null);
    setShowIHavePaidSheet(false);
    setTxnRef('');
  };

  // ── Manual settlement ────────────────────────────────────────────────────
  const handleManualSettle = async () => {
    if (!paidTo) { showAlert('Error', 'Select who you paid'); return; }
    if (!amountValid) { showAlert('Error', 'Enter a valid amount'); return; }

    setIsLoading(true);
    try {
      await addSettlement({
        trip_id: tripId,
        paid_by: user!.id,
        paid_to: paidTo,
        amount: parsedAmount,
        method: manualMethod.toLowerCase(),
        notes: notes.trim() || undefined,
        transaction_ref: txnRef.trim() || undefined,
      });
      showAlert('Recorded', `${selectedMember?.display_name || 'Recipient'} will be notified to confirm.`);
      onClose();
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to record settlement');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <ArrowLeft color={colors.textPrimary} size={22} />
        </TouchableOpacity>
        <Text style={[typography.h3, { color: colors.textPrimary }]}>Settle Up</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Paying to — hidden when pre-selected from balance row */}
        {!preSelectedMemberId && (
          <View style={styles.field}>
            <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>Paying to</Text>
            <View style={styles.chipRow}>
              {members.map((m) => (
                <TouchableOpacity
                  key={m.user_id}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: paidTo === m.user_id ? colors.primary : colors.inputBackground,
                      borderColor: paidTo === m.user_id ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setPaidTo(m.user_id)}
                >
                  <Text style={[typography.caption, { color: paidTo === m.user_id ? '#fff' : colors.textPrimary }]}>
                    {m.display_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Pre-selected recipient summary */}
        {preSelectedMemberId && selectedMember && (
          <View style={[styles.recipientCard, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}>
            <View style={[styles.recipientAvatar, { backgroundColor: colors.primaryLight }]}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.primary }}>
                {(selectedMember.display_name || '?')[0].toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={[typography.caption, { color: colors.textTertiary }]}>Paying to</Text>
              <Text style={[typography.labelLarge, { color: colors.textPrimary }]}>{selectedMember.display_name}</Text>
            </View>
            <Text style={[typography.h3, { color: colors.primary }]}>₹{amount}</Text>
          </View>
        )}

        {/* No UPI ID warning */}
        {paidTo && !receiverHasUpi && (
          <View style={[styles.noUpiCard, { backgroundColor: colors.warningBackground, borderColor: colors.warning + '50' }]}>
            <AlertTriangle size={18} color={colors.warning} style={{ marginTop: 2 }} />
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>
                {selectedMember?.display_name} hasn't added their UPI ID on TripWise
              </Text>
              <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 4 }]}>
                They need to add it in their profile before you can pay via UPI. You can still record this as a manual settlement below.
              </Text>
            </View>
          </View>
        )}

        {/* UPI ID display when available */}
        {paidTo && receiverHasUpi && (
          <View style={[styles.upiInfoCard, { backgroundColor: colors.successBackground, borderColor: colors.success + '40' }]}>
            <Smartphone size={16} color={colors.success} />
            <Text style={[typography.bodySmall, { color: colors.textPrimary, marginLeft: spacing.xs }]}>
              UPI: <Text style={{ fontWeight: '700' }}>{selectedMember?.upi_id}</Text>
            </Text>
          </View>
        )}

        {/* Amount — editable always, but pre-filled and labelled when coming from balance row */}
        <View style={styles.field}>
          <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>
            Amount (₹){preSelectedAmount ? '  — edit if partial payment' : ''}
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.textPrimary }]}
            placeholder="0"
            placeholderTextColor={colors.textTertiary}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Notes */}
        <View style={styles.field}>
          <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.textPrimary }]}
            placeholder="Add a note"
            placeholderTextColor={colors.textTertiary}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Pay via UPI — only when receiver has UPI ID */}
        {paidTo && receiverHasUpi && (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: isLoading ? 0.6 : 1 }]}
            onPress={handlePayViaUpi}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Smartphone size={18} color="#fff" />
                <Text style={[typography.labelLarge, { color: '#fff', marginLeft: spacing.xs }]}>
                  Pay via UPI
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Manual settlement section */}
        {paidTo && (
          <View style={[styles.manualSection, { borderTopColor: colors.borderLight }]}>
            <Text style={[typography.overline, { color: colors.textTertiary, marginBottom: spacing.md }]}>
              {receiverHasUpi ? 'OR RECORD MANUALLY' : 'RECORD MANUALLY'}
            </Text>

            {/* Method */}
            <View style={styles.field}>
              <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>Payment method</Text>
              <View style={styles.chipRow}>
                {MANUAL_METHODS.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: manualMethod === m ? colors.primary : colors.inputBackground,
                        borderColor: manualMethod === m ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setManualMethod(m)}
                  >
                    <Text style={[typography.caption, { color: manualMethod === m ? '#fff' : colors.textPrimary }]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Transaction ref */}
            <View style={styles.field}>
              <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>Transaction reference (optional)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="e.g. UPI123456789"
                placeholderTextColor={colors.textTertiary}
                value={txnRef}
                onChangeText={setTxnRef}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.secondaryBtn,
                { borderColor: colors.primary, backgroundColor: colors.primaryLight, opacity: isLoading ? 0.6 : 1 },
              ]}
              onPress={handleManualSettle}
              disabled={isLoading}
            >
              <FileText size={16} color={colors.primary} />
              <Text style={[typography.labelLarge, { color: colors.primary, marginLeft: spacing.xs }]}>
                Record Manually
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Settlement History */}
        {settlements.length > 0 && (
          <View style={styles.historySection}>
            <Text style={[typography.overline, { color: colors.textTertiary, marginBottom: spacing.md }]}>
              SETTLEMENT HISTORY
            </Text>
            {settlements.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.historyCard, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }, shadows.card]}
                onPress={() => setDetailSettlementId(s.id)}
                activeOpacity={0.75}
              >
                <View style={styles.historyTop}>
                  <Text style={[typography.labelMedium, { color: colors.textPrimary, flex: 1 }]} numberOfLines={1}>
                    {s.paid_by_name} → {s.paid_to_name}
                  </Text>
                  <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>
                    ₹{s.amount.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.historyBottom}>
                  <Text style={[typography.caption, { color: colors.textTertiary }]}>
                    {format(new Date(s.created_at), 'dd MMM yyyy, h:mm a')}
                    {s.transaction_ref ? `  •  Ref: ${s.transaction_ref}` : ''}
                  </Text>
                  <PaymentStatusBadge status={s.status} size="sm" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* "I Have Paid" bottom sheet */}
      <Modal visible={showIHavePaidSheet} transparent animationType="slide" onRequestClose={handleCancelUpi}>
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={handleCancelUpi} />
          <View style={[styles.sheet, { backgroundColor: colors.cardBackground }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.xs }]}>
              Did you complete the payment?
            </Text>
            <Text style={[typography.bodySmall, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
              Only tap "I Have Paid" if you completed the payment in your UPI app.
            </Text>

            {/* Optional transaction ref */}
            <Text style={[typography.labelMedium, { color: colors.textPrimary, marginBottom: spacing.xs }]}>
              Transaction reference (optional)
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.textPrimary, marginBottom: spacing.lg }]}
              placeholder="e.g. UPI123456789"
              placeholderTextColor={colors.textTertiary}
              value={txnRef}
              onChangeText={setTxnRef}
            />

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.success, opacity: isLoading ? 0.6 : 1 }]}
              onPress={handleIHavePaid}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={[typography.labelLarge, { color: '#fff' }]}>I Have Paid</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.ghostBtn, { marginTop: spacing.sm }]}
              onPress={handleCancelUpi}
              disabled={isLoading}
            >
              <Text style={[typography.labelMedium, { color: colors.textSecondary }]}>Cancel / Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Settlement detail modal */}
      <Modal visible={!!detailSettlementId} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setDetailSettlementId(null)}>
        {detailSettlementId && (
          <SettlementDetailScreen
            settlementId={detailSettlementId}
            onClose={() => setDetailSettlementId(null)}
            onSettled={() => { fetchSettlements(tripId); setDetailSettlementId(null); }}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1,
  },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  field: { marginBottom: spacing.lg },
  input: { height: 48, borderWidth: 1.5, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, fontSize: 15, marginTop: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs + 2, borderRadius: borderRadius.full, borderWidth: 1.5 },
  recipientCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1,
    marginBottom: spacing.lg,
  },
  recipientAvatar: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  noUpiCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1,
    marginBottom: spacing.lg,
  },
  upiInfoCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1,
    marginBottom: spacing.lg,
  },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 54, borderRadius: borderRadius.md, marginBottom: spacing.sm,
  },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 52, borderRadius: borderRadius.md, borderWidth: 1.5,
  },
  ghostBtn: {
    height: 44, justifyContent: 'center', alignItems: 'center',
  },
  manualSection: { borderTopWidth: 1, paddingTop: spacing.lg, marginTop: spacing.sm },
  historySection: { marginTop: spacing.xl },
  historyCard: {
    borderRadius: borderRadius.lg, borderWidth: 1,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  historyTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  historyBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  // Sheet
  sheetOverlay: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg, paddingBottom: spacing.xxl,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.lg },
});

