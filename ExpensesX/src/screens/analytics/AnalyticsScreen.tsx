import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useThemeColors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { TrendingUp, Wallet, Tag, Map, BarChart3 } from 'lucide-react-native';

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
  const [refreshing, setRefreshing] = useState(false);

  // Re-fetch analytics every time the tab gains focus
  useFocusEffect(
    useCallback(() => {
      if (user) fetchAnalytics();
    }, [user])
  );

  const fetchAnalytics = async () => {
    if (!user) return;
    const { data } = await supabase.rpc('get_user_analytics', { p_user_id: user.id });
    if (data && Array.isArray(data) && data.length > 0) {
      setAnalytics(data[0]);
    } else {
      setAnalytics(null);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  const stats = [
    {
      icon: <Map size={22} color={colors.success} />,
      value: String(analytics?.total_trips || 0),
      label: 'Total Groups',
      gradient: [colors.success + '20', colors.success + '08'] as [string, string],
    },
    {
      icon: <Wallet size={22} color={colors.warning} />,
      value: `₹${(analytics?.total_spent || 0).toLocaleString()}`,
      label: 'Total Spent',
      gradient: [colors.warning + '20', colors.warning + '08'] as [string, string],
    },
    {
      icon: <TrendingUp size={22} color={colors.primary} />,
      value: `₹${(analytics?.total_owed || 0).toLocaleString()}`,
      label: 'Total Paid',
      gradient: [colors.primary + '20', colors.primary + '08'] as [string, string],
    },
    {
      icon: <Tag size={22} color="#EC4899" />,
      value: analytics?.top_category || 'N/A',
      label: 'Top Category',
      gradient: ['rgba(236,72,153,0.2)', 'rgba(236,72,153,0.08)'] as [string, string],
    },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={[styles.headerIcon, { backgroundColor: colors.primaryLight }]}>
            <BarChart3 size={24} color={colors.primary} />
          </View>
          <Text style={[typography.h1, { color: colors.textPrimary, marginTop: spacing.md }]}>
            Spending Analytics
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: spacing.xs }]}>
            Insights from all your groups
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.grid}>
          {stats.map((stat, i) => (
            <View
              key={i}
              style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }, shadows.card]}
            >
              <LinearGradient
                colors={stat.gradient}
                style={styles.statIconBg}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {stat.icon}
              </LinearGradient>
              <Text
                style={[typography.numberMedium, { color: colors.textPrimary, marginTop: spacing.sm }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {stat.value}
              </Text>
              <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Coming Soon Card */}
        <View style={[styles.comingSoonCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }, shadows.card]}>
          <LinearGradient
            colors={[colors.primary + '15', colors.secondary + '10']}
            style={styles.comingSoonBg}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.comingSoonInner}>
              <Text style={{ fontSize: 36 }}>📊</Text>
              <Text style={[typography.h3, { color: colors.textPrimary, marginTop: spacing.md, textAlign: 'center' }]}>
                More Insights Coming
              </Text>
              <Text style={[typography.bodySmall, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, maxWidth: 260 }]}>
                Interactive charts, spending trends, monthly comparisons, and trip summaries are on the way.
              </Text>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: 100 },
  headerSection: { alignItems: 'center', marginBottom: spacing.xl },
  headerIcon: {
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  statCard: {
    width: '48%',
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statIconBg: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center',
  },
  comingSoonCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  comingSoonBg: {
    padding: spacing.xl,
  },
  comingSoonInner: {
    alignItems: 'center',
  },
});
