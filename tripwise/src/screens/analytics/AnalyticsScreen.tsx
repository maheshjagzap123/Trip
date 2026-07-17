import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useThemeColors, typography, spacing, borderRadius } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { TrendingUp, Wallet, Tag, Map } from 'lucide-react-native';

interface Analytics {
  total_trips: number;
  total_spent: number;
  total_owed: number;
  top_category: string;
  top_category_amount: number;
}

export function AnalyticsScreen() {
  const colors = useThemeColors();
  const { user } = useAuthStore();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    if (user) fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    if (!user) return;
    const { data } = await supabase.rpc('get_user_analytics', { p_user_id: user.id });
    if (data && Array.isArray(data) && data.length > 0) {
      setAnalytics(data[0]);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[typography.h2, { color: colors.textPrimary, marginBottom: spacing.lg }]}>
          Your Travel Stats
        </Text>

        {/* Stats Grid */}
        <View style={styles.grid}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Map size={22} color="#00C896" />
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {analytics?.total_trips || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Total Trips</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Wallet size={22} color="#F59E0B" />
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              ₹{(analytics?.total_spent || 0).toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Total Spent</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TrendingUp size={22} color="#6366F1" />
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              ₹{(analytics?.total_owed || 0).toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Total Paid</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Tag size={22} color="#EC4899" />
            <Text style={[styles.statValue, { color: colors.textPrimary }]} numberOfLines={1}>
              {analytics?.top_category || 'N/A'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Top Category</Text>
          </View>
        </View>

        {/* Info */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[typography.bodyMedium, { color: colors.textSecondary, textAlign: 'center' }]}>
            More detailed analytics (charts, trends, comparisons) coming in future updates!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statCard: { width: '48%', padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, alignItems: 'center', gap: spacing.xs },
  statValue: { fontSize: 22, fontWeight: '800', marginTop: spacing.xs },
  statLabel: { fontSize: 12, fontWeight: '600' },
  infoCard: { marginTop: spacing.xl, padding: spacing.lg, borderRadius: borderRadius.lg, borderWidth: 1 },
});
