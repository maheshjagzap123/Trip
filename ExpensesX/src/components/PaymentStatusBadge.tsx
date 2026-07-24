import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors, borderRadius } from '../theme';
import type { SettlementStatus } from '../stores/expenseStore';

interface Props {
  status: SettlementStatus;
  size?: 'sm' | 'md';
}

const CONFIG: Record<SettlementStatus, { label: string; icon: string; color: string }> = {
  pending:              { label: 'Pending',              icon: '⏳', color: '#94A3B8' },
  initiated:            { label: 'Initiated',            icon: '🔵', color: '#5B8CFF' },
  pending_confirmation: { label: 'Awaiting Confirmation', icon: '🟡', color: '#FFB648' },
  confirmed:            { label: 'Confirmed',            icon: '✅', color: '#35D07F' },
  rejected:             { label: 'Disputed',             icon: '❌', color: '#FF6B7A' },
};

export function PaymentStatusBadge({ status, size = 'md' }: Props) {
  const colors = useThemeColors();
  const cfg = CONFIG[status] ?? CONFIG.pending;
  const isSmall = size === 'sm';

  return (
    <View style={[
      styles.wrap,
      {
        backgroundColor: cfg.color + '14',
        paddingHorizontal: isSmall ? 10 : 12,
        paddingVertical: isSmall ? 4 : 6,
      },
    ]}>
      <Text style={{ fontSize: isSmall ? 10 : 11 }}>{cfg.icon} </Text>
      <Text style={[styles.label, { color: cfg.color, fontSize: isSmall ? 10 : 11 }]}>
        {cfg.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.full },
  label: { fontWeight: '700', letterSpacing: 0.2 },
});
