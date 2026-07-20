import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { SettlementStatus } from '../stores/expenseStore';

interface Props {
  status: SettlementStatus;
  size?: 'sm' | 'md';
}

const CONFIG: Record<SettlementStatus, { label: string; icon: string; bg: string; color: string }> = {
  pending:              { label: 'Pending',              icon: '⏳', bg: '#F1F5F9', color: '#64748B' },
  initiated:            { label: 'Initiated',            icon: '🔵', bg: '#EFF6FF', color: '#2563EB' },
  pending_confirmation: { label: 'Awaiting Confirmation', icon: '🟡', bg: '#FFFBEB', color: '#D97706' },
  confirmed:            { label: 'Confirmed',            icon: '✅', bg: '#ECFDF5', color: '#059669' },
  rejected:             { label: 'Disputed',             icon: '❌', bg: '#FFF1F2', color: '#E11D48' },
};

export function PaymentStatusBadge({ status, size = 'md' }: Props) {
  const cfg = CONFIG[status] ?? CONFIG.pending;
  const isSmall = size === 'sm';

  return (
    <View style={[
      styles.wrap,
      { backgroundColor: cfg.bg, paddingHorizontal: isSmall ? 8 : 10, paddingVertical: isSmall ? 3 : 5 },
    ]}>
      <Text style={{ fontSize: isSmall ? 10 : 11 }}>{cfg.icon} </Text>
      <Text style={[styles.label, { color: cfg.color, fontSize: isSmall ? 10 : 11 }]}>
        {cfg.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 999 },
  label: { fontWeight: '700', letterSpacing: 0.2 },
});
