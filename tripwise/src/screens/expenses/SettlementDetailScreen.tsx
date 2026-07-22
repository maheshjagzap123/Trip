import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, ActivityIndicator, Alert, Platform, BackHandler,
} from 'react-native';
import { useThemeColors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useExpenseStore, Settlement } from '../../stores/expenseStore';
import { useAuthStore } from '../../stores/authStore';
import { PaymentStatusBadge } from '../../components/PaymentStatusBadge';
import { DisputeBottomSheet } from '../../components/DisputeBottomSheet';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, CheckCircle, XCircle, Clock, Hash } from 'lucide-react-native';
import { format } from 'date-fns';

interface Props {
  settlementId: string;
  onClose: () => void;
  onSettled?: () => void;
}

export function SettlementDetailScreen({ settlementId, onClose, onSettled }: Props) {
  const colors = useThemeColors();
  const { user } = useAuthStore();
  const { confirmSettlement, disputeSettlement } = useExpenseStore();

  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const [showDispute, setShowDispute] = useState(false);

  useEffect(() => {
    fetchSettlement();
    // Realtime: refresh if status changes
    const channel = supabase
      .channel(`settlement-detail-${settlementId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'settlements',
        filter: `id=eq.${settlementId}`,
      }, () => fetchSettlement())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [settlementId]);

  useEffect(() => {
    const bh = BackHandler.addEventListener('hardwareBackPress', () => { onClose(); return true; });
    return () => bh.remove();
  }, [onClose]);

  const fetchSettlement = async () => {
    const { data } = await supabase
      .from('settlements')
      .select('*')
      .eq('id', settlementId)
      .single();

    if (data) {
      const { data: profiles } = await supabase.rpc('get_profiles_by_ids', {
        user_ids: [data.paid_by, data.paid_to],
      });
      setSettlement({
        ...data,
        paid_by_name: (Array.isArray(profiles) ? profiles.find((p: any) => p.id === data.paid_by)?.display_name : null) || 'Unknown',
        paid_to_name: (Array.isArray(profiles) ? profiles.find((p: any) => p.id === data.paid_to)?.display_name : null) || 'Unknown',
      });
    }
    setIsLoading(false);
  };

  const showAlert = (title: string, msg: string) =>
    Platform.OS === 'web' ? window.alert(`${title}: ${msg}`) : Alert.alert(title, msg);

  const handleConfirm = async () => {
    if (!settlement) return;
    setIsActing(true);
    try {
      await confirmSettlement(settlement.id);
      await fetchSettlement();
      onSettled?.();
      showAlert('Confirmed', 'Payment confirmed. Balance has been updated.');
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to confirm');
    } finally {
      setIsActing(false);
    }
  };

  const handleDispute = async (reason: string, screenshotUrl?: string) => {
    if (!settlement) return;
    await disputeSettlement(settlement.id, reason, screenshotUrl);
    await fetchSettlement();
    setShowDispute(false);
    onSettled?.();
    showAlert('Dispute submitted', 'The payer has been notified.');
  };

  const isRecipient = settlement?.paid_to === user?.id;
  const canAct = isRecipient && settlement?.status === 'pending_confirmation';

  const fmt = (iso: string | null) =>
    iso ? format(new Date(iso), 'dd MMM yyyy, h:mm a') : '—';

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!settlement) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>Settlement not found.</Text>
          <TouchableOpacity onPress={onClose} style={{ marginTop: spacing.md }}>
            <Text style={[typography.labelMedium, { color: colors.primary }]}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <ArrowLeft color={colors.textPrimary} size={22} />
        </TouchableOpacity>
        <Text style={[typography.h3, { color: colors.textPrimary }]}>Settlement Details</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Amount card */}
        <View style={[styles.amountCard, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }, shadows.card]}>
          <Text style={[typography.caption, { color: colors.textTertiary, marginBottom: spacing.xs }]}>
            {settlement.paid_by_name} → {settlement.paid_to_name}
          </Text>
          <Text style={[styles.amountText, { color: colors.textPrimary }]}>
            ₹{settlement.amount.toLocaleString()}
          </Text>
          <View style={{ marginTop: spacing.sm }}>
            <PaymentStatusBadge status={settlement.status} />
          </View>
        </View>

        {/* Details */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }, shadows.card]}>
          <Text style={[typography.overline, { color: colors.textTertiary, marginBottom: spacing.sm }]}>DETAILS</Text>

          <DetailRow
            icon={<Text style={{ fontSize: 14 }}>💳</Text>}
            label="Method"
            value={settlement.method.toUpperCase()}
            colors={colors}
          />
          {settlement.transaction_ref && (
            <DetailRow
              icon={<Hash size={14} color={colors.textTertiary} />}
              label="Transaction Ref"
              value={settlement.transaction_ref}
              colors={colors}
            />
          )}
          {settlement.notes && (
            <DetailRow
              icon={<Text style={{ fontSize: 14 }}>📝</Text>}
              label="Notes"
              value={settlement.notes}
              colors={colors}
            />
          )}
        </View>

        {/* Timestamp trail */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }, shadows.card]}>
          <Text style={[typography.overline, { color: colors.textTertiary, marginBottom: spacing.sm }]}>TIMELINE</Text>

          <TimelineRow
            icon={<Clock size={14} color={colors.primary} />}
            label="Initiated"
            value={fmt(settlement.created_at)}
            colors={colors}
          />
          {settlement.status !== 'pending' && settlement.status !== 'initiated' && (
            <TimelineRow
              icon={<Clock size={14} color="#D97706" />}
              label="Paid claimed"
              value={fmt(settlement.updated_at)}
              colors={colors}
            />
          )}
          {settlement.confirmed_at && (
            <TimelineRow
              icon={<CheckCircle size={14} color={colors.success} />}
              label="Confirmed"
              value={fmt(settlement.confirmed_at)}
              colors={colors}
              last
            />
          )}
          {settlement.status === 'rejected' && (
            <TimelineRow
              icon={<XCircle size={14} color={colors.error} />}
              label="Disputed"
              value={fmt(settlement.updated_at)}
              colors={colors}
              last
            />
          )}
        </View>

        {/* Dispute reason (if rejected) */}
        {settlement.status === 'rejected' && settlement.dispute_reason && (
          <View style={[styles.card, { backgroundColor: colors.errorBackground, borderColor: colors.error + '30' }, shadows.card]}>
            <Text style={[typography.overline, { color: colors.error, marginBottom: spacing.xs }]}>DISPUTE REASON</Text>
            <Text style={[typography.bodySmall, { color: colors.textPrimary }]}>{settlement.dispute_reason}</Text>
          </View>
        )}

        {/* Action buttons — only for recipient when pending_confirmation */}
        {canAct && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: colors.success, opacity: isActing ? 0.6 : 1 }]}
              onPress={handleConfirm}
              disabled={isActing}
            >
              {isActing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <CheckCircle size={18} color="#fff" />
                  <Text style={[typography.labelLarge, { color: '#fff', marginLeft: spacing.xs }]}>
                    Yes, I received it
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.disputeBtn, { borderColor: colors.error, backgroundColor: colors.errorBackground }]}
              onPress={() => setShowDispute(true)}
              disabled={isActing}
            >
              <XCircle size={18} color={colors.error} />
              <Text style={[typography.labelLarge, { color: colors.error, marginLeft: spacing.xs }]}>
                I didn't receive it
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Info for payer waiting */}
        {!isRecipient && settlement.status === 'pending_confirmation' && (
          <View style={[styles.waitingCard, { backgroundColor: colors.warningBackground, borderColor: colors.warning + '40' }]}>
            <Text style={[typography.bodySmall, { color: colors.textPrimary, textAlign: 'center' }]}>
              ⏳ Waiting for {settlement.paid_to_name} to confirm this payment.
            </Text>
          </View>
        )}
      </ScrollView>

      <DisputeBottomSheet
        visible={showDispute}
        settlementId={settlement.id}
        amount={settlement.amount}
        payerName={settlement.paid_by_name || 'Payer'}
        onSubmit={handleDispute}
        onClose={() => setShowDispute(false)}
      />
    </SafeAreaView>
  );
}

function DetailRow({ icon, label, value, colors }: any) {
  return (
    <View style={[detailStyles.row, { borderBottomColor: colors.borderLight }]}>
      <View style={detailStyles.iconWrap}>{icon}</View>
      <Text style={[typography.bodySmall, { color: colors.textSecondary, width: 110 }]}>{label}</Text>
      <Text style={[typography.bodySmall, { color: colors.textPrimary, flex: 1 }]}>{value}</Text>
    </View>
  );
}

function TimelineRow({ icon, label, value, colors, last }: any) {
  return (
    <View style={[detailStyles.row, !last && { borderBottomColor: colors.borderLight, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <View style={detailStyles.iconWrap}>{icon}</View>
      <Text style={[typography.bodySmall, { color: colors.textSecondary, width: 110 }]}>{label}</Text>
      <Text style={[typography.bodySmall, { color: colors.textPrimary, flex: 1 }]}>{value}</Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  iconWrap: { width: 24, alignItems: 'center', marginRight: spacing.xs },
});

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1,
  },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  amountCard: {
    alignItems: 'center', padding: spacing.xl,
    borderRadius: borderRadius.xl, borderWidth: 1, marginBottom: spacing.md,
  },
  amountText: { fontSize: 40, fontWeight: '800', letterSpacing: -1 },
  card: { borderRadius: borderRadius.xl, padding: spacing.md, borderWidth: 1, marginBottom: spacing.md },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 54, borderRadius: borderRadius.md,
  },
  disputeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 54, borderRadius: borderRadius.md, borderWidth: 1.5,
  },
  waitingCard: {
    padding: spacing.md, borderRadius: borderRadius.md,
    borderWidth: 1, marginTop: spacing.sm,
  },
});
