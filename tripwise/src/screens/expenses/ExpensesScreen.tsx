import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useThemeColors, typography, spacing } from '../../theme';
import { ExpensesTab } from './ExpensesTab';
import { ArrowLeft } from 'lucide-react-native';

interface Props {
  tripId: string;
  tripName: string;
  onClose: () => void;
}

export function ExpensesScreen({ tripId, tripName, onClose }: Props) {
  const colors = useThemeColors();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onClose}>
          <ArrowLeft color={colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={[typography.h3, { color: colors.textPrimary, marginLeft: spacing.md, flex: 1 }]} numberOfLines={1}>
          {tripName} — Expenses
        </Text>
      </View>
      <ExpensesTab tripId={tripId} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
});
