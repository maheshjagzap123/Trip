import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  FlatList, Animated, Dimensions, Easing, Platform, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../stores/authStore';
import { useTripStore } from '../../stores/tripStore';
import { useThemeStore } from '../../stores/themeStore';
import { useThemeColors, typography, spacing, borderRadius, shadows } from '../../theme';
import { supabase } from '../../lib/supabase';
import { CreateTripScreen } from './CreateTripScreen';
import { TripDetailScreen } from './TripDetailScreen';
import { AddExpenseScreen } from '../expenses/AddExpenseScreen';
import { ChatScreen } from '../chat/ChatScreen';
import { NotificationsScreen } from '../notifications/NotificationsScreen';
import { Plus, MapPin, Calendar, Zap, MessageCircle, Bell, Search } from 'lucide-react-native';
import { format } from 'date-fns';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const TRIP_TYPE_EMOJI: Record<string, string> = {
  Friends: '👫', Family: '👨‍👩‍👧', Couple: '💑', Solo: '🧳',
  Office: '💼', Adventure: '🏔️', Pilgrimage: '🛕',
  Trip: '✈️', Flatmates: '🏠', Business: '💼',
  College: '🎓', Event: '🎉', Wedding: '💒',
  'Sports Team': '⚽', 'Monthly Household': '🏡', Custom: '📌',
};

export function TripDashboardScreen() {
  const { profile } = useAuthStore();
  const { trips, invitations, fetchTrips, fetchInvitations, subscribeToRealtime } = useTripStore();
  const colors = useThemeColors();
  const { resolvedScheme } = useThemeStore();
  const isDark = resolvedScheme === 'dark';
  const navigation = useNavigation();

  const [showCreate, setShowCreate] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [quickExpenseTripId, setQuickExpenseTripId] = useState<string | null>(null);
  const [quickChatTripId, setQuickChatTripId] = useState<string | null>(null);
  const [quickChatTripName, setQuickChatTripName] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Active');
  const [tripExpenses, setTripExpenses] = useState<Record<string, number>>({});
  const [myShares, setMyShares] = useState<Record<string, number>>({});
  const [refreshing, setRefreshing] = useState(false);

  const fetchUnreadCount = async () => {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return;
    const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', u.id).eq('read', false);
    setUnreadCount(count || 0);
  };

  useEffect(() => {
    fetchTrips(); fetchInvitations(); fetchUnreadCount();
    const unsub = subscribeToRealtime();

    const expenseChannel = supabase
      .channel('dashboard-expenses')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => {
        fetchExpenseTotals();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expense_splits' }, () => {
        fetchExpenseTotals();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settlements' }, () => {
        fetchExpenseTotals();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchUnreadCount();
      })
      .subscribe();

    return () => { unsub(); supabase.removeChannel(expenseChannel); };
  }, []);

  useEffect(() => {
    if (trips.length > 0) fetchExpenseTotals();
  }, [trips]);

  const fetchExpenseTotals = async () => {
    const currentTrips = useTripStore.getState().trips;
    if (currentTrips.length === 0) return;

    const tripIds = currentTrips.map((t) => t.id);
    const { data: { user } } = await supabase.auth.getUser();

    const [{ data: expenses }, { data: splits }] = await Promise.all([
      supabase.from('expenses').select('id, trip_id, amount').in('trip_id', tripIds),
      user ? supabase.from('expense_splits').select('expense_id, amount').eq('user_id', user.id) : { data: [] },
    ]);

    if (!expenses) return;

    const totals: Record<string, number> = {};
    for (const row of expenses) totals[row.trip_id] = (totals[row.trip_id] || 0) + Number(row.amount);
    setTripExpenses(totals);

    const expToTrip: Record<string, string> = {};
    for (const e of expenses) expToTrip[e.id] = e.trip_id;

    const shares: Record<string, number> = {};
    for (const s of splits || []) {
      const tid = expToTrip[s.expense_id];
      if (tid) shares[tid] = (shares[tid] || 0) + Number(s.amount);
    }
    setMyShares(shares);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchTrips(), fetchInvitations(), fetchUnreadCount(), fetchExpenseTotals()]);
    setRefreshing(false);
  }, []);

  // Close all overlays when Trips tab is pressed (always return to dashboard)
  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      setShowCreate(false);
      setSelectedTripId(null);
      setQuickExpenseTripId(null);
      setQuickChatTripId(null);
      setShowNotifications(false);
    });
    return unsubscribe;
  }, [navigation]);

  const totalSpent = Object.values(myShares).reduce((a, b) => a + b, 0);

  const filteredTrips = trips.filter((t) => {
    const matchesSearch = !searchQuery.trim() ||
      t.trip_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.destination || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const renderTripCard = ({ item, index }: { item: typeof trips[0]; index: number }) => {
    const statusColor = item.status === 'Active' ? colors.success : item.status === 'Planning' ? colors.primary : colors.textTertiary;

    return (
      <TouchableOpacity
        style={[styles.tripCard, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }, shadows.card]}
        activeOpacity={0.88}
        onPress={() => setSelectedTripId(item.id)}
      >
        {/* Top row: emoji + status */}
        <View style={styles.tripCardTop}>
          <View style={[styles.tripTypeEmoji, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
            <Text style={{ fontSize: 22 }}>{TRIP_TYPE_EMOJI[item.trip_type || ''] || '✈️'}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusColor + '18' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusTxt, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>

        {/* Trip Name */}
        <Text style={[typography.h2, { color: colors.textPrimary, marginTop: spacing.sm }]} numberOfLines={1}>
          {item.trip_name}
        </Text>

        {/* Meta info */}
        <View style={styles.tripMeta}>
          {item.destination && (
            <View style={styles.metaRow}>
              <MapPin size={13} color={colors.textTertiary} />
              <Text style={[typography.bodySmall, { color: colors.textSecondary, marginLeft: spacing.xs }]} numberOfLines={1}>
                {item.destination}
              </Text>
            </View>
          )}
          <View style={styles.metaRow}>
            <Calendar size={13} color={colors.textTertiary} />
            <Text style={[typography.bodySmall, { color: colors.textSecondary, marginLeft: spacing.xs }]}>
              {format(new Date(item.start_date), 'MMM d')} – {format(new Date(item.end_date), 'MMM d')}
            </Text>
          </View>
        </View>

        {/* Expense footer */}
        <View style={[styles.tripCardFooter, { borderTopColor: colors.borderLight }]}>
          <View>
            <Text style={[typography.caption, { color: colors.textTertiary }]}>Trip Total</Text>
            <Text style={[typography.numberSmall, { color: colors.textSecondary }]}>
              ₹{(tripExpenses[item.id] || 0).toLocaleString()}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[typography.caption, { color: colors.textTertiary }]}>My Share</Text>
            <Text style={[typography.numberSmall, { color: colors.success }]}>
              ₹{(myShares[item.id] || 0).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Trip Progress Bar */}
        {item.status === 'Active' && (() => {
          const start = new Date(item.start_date).getTime();
          const end = new Date(item.end_date).getTime();
          const now = Date.now();
          const progress = Math.min(1, Math.max(0, (now - start) / (end - start)));
          const daysLeft = Math.max(0, Math.ceil((end - now) / 86400000));
          return (
            <View style={{ marginTop: spacing.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={[typography.caption, { color: colors.textTertiary }]}>
                  {Math.round(progress * 100)}% complete
                </Text>
                <Text style={[typography.caption, { color: colors.primary }]}>
                  {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                </Text>
              </View>
              <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.borderLight }}>
                <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.primary, width: `${progress * 100}%` }} />
              </View>
            </View>
          );
        })()}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: colors.successBackground, borderColor: colors.success + '30' }]}
            onPress={() => setQuickExpenseTripId(item.id)}
            activeOpacity={0.8}
            accessibilityLabel="Add expense"
          >
            <Plus size={14} color={colors.success} />
            <Text style={[typography.labelSmall, { color: colors.success, marginLeft: 4 }]}>Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: colors.warningBackground, borderColor: colors.warning + '30' }]}
            onPress={() => { setQuickChatTripId(item.id); setQuickChatTripName(item.trip_name); }}
            activeOpacity={0.8}
            accessibilityLabel="Open chat"
          >
            <MessageCircle size={14} color={colors.warning} />
            <Text style={[typography.labelSmall, { color: colors.warning, marginLeft: 4 }]}>Chat</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeader = useMemo(() => (
    <View>
      {/* Greeting */}
      <View style={styles.greeting}>
        <View style={{ flex: 1 }}>
          <Text style={[typography.h1, { color: colors.textPrimary }]} numberOfLines={2}>
            {(() => {
              const hour = new Date().getHours();
              const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
              return `${greeting}, ${profile?.first_name || 'Traveler'} 👋`;
            })()}
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: spacing.xs }]}>
            Manage your shared expenses
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowNotifications(true)}
          style={[styles.notifBtn, { backgroundColor: colors.inputBackground }]}
          accessibilityLabel={`${unreadCount} notifications`}
        >
          <Bell size={20} color={colors.textSecondary} />
          {unreadCount > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifTxt}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Stats Banner */}
      <LinearGradient
        colors={[colors.primary, '#7B61FF']}
        style={[styles.statsBanner, shadows.brand]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{trips.length}</Text>
          <Text style={styles.statLbl}>Groups</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{trips.filter((t) => t.status === 'Active').length}</Text>
          <Text style={styles.statLbl}>Active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>₹{totalSpent > 999 ? `${(totalSpent / 1000).toFixed(1)}k` : totalSpent.toFixed(0)}</Text>
          <Text style={styles.statLbl}>My Spend</Text>
        </View>
      </LinearGradient>

      {/* Invitations */}
      {invitations.length > 0 && (
        <View style={styles.inviteSection}>
          <View style={styles.sectionHeader}>
            <Zap size={16} color={colors.warning} />
            <Text style={[typography.labelLarge, { color: colors.textPrimary, marginLeft: spacing.xs }]}>
              Group Invitations
            </Text>
          </View>
          {invitations.map((item) => <InvitationCard key={item.id} item={item} />)}
        </View>
      )}

      {/* Section Title + Search/Filter */}
      {trips.length > 0 && (
        <View style={{ marginTop: spacing.sm }}>
          <View style={styles.sectionHeader}>
            <Text style={[typography.labelLarge, { color: colors.textPrimary }]}>Your Groups</Text>
          </View>

          {/* Search */}
          <View style={[styles.searchBox, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
            <Search size={16} color={colors.textTertiary} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search groups..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Filter chips */}
          <View style={styles.filterRow}>
            {['Active', 'Planning', 'Completed', 'All'].map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: statusFilter === s ? colors.primary : colors.inputBackground,
                    borderColor: statusFilter === s ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setStatusFilter(s)}
              >
                <Text style={[
                  typography.labelSmall,
                  { color: statusFilter === s ? '#fff' : colors.textSecondary },
                ]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  ), [colors, profile, unreadCount, trips, invitations, totalSpent, statusFilter, searchQuery]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <FlatList
          data={filteredTrips}
          keyExtractor={(item) => item.id}
          renderItem={renderTripCard}
          ListHeaderComponent={<>{ListHeader}</>}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.primaryLight }]}>
                <Text style={{ fontSize: 48 }}>💰</Text>
              </View>
              <Text style={[typography.h1, { color: colors.textPrimary, marginTop: spacing.lg }]}>
                No groups yet
              </Text>
              <Text style={[typography.bodyMedium, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, maxWidth: 280 }]}>
                Tap + to create your first group and invite your friends!
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />

        {/* FAB */}
        <TouchableOpacity
          style={[styles.fab, shadows.brand]}
          onPress={() => setShowCreate(true)}
          activeOpacity={0.88}
          accessibilityLabel="Create new group"
        >
          <LinearGradient
            colors={[colors.primary, '#7B61FF']}
            style={styles.fabGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Plus color="#fff" size={26} />
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>

      {/* Overlay screens — outside SafeAreaView so they fill entire screen */}
      <OverlayScreen visible={showCreate}>
        <CreateTripScreen onClose={() => { setShowCreate(false); fetchTrips(); }} />
      </OverlayScreen>
      <OverlayScreen visible={!!selectedTripId}>
        {selectedTripId && (
          <TripDetailScreen tripId={selectedTripId} onClose={() => { setSelectedTripId(null); fetchTrips(); fetchExpenseTotals(); }} />
        )}
      </OverlayScreen>
      <OverlayScreen visible={!!quickExpenseTripId}>
        {quickExpenseTripId && (
          <AddExpenseScreen tripId={quickExpenseTripId} onClose={() => { setQuickExpenseTripId(null); fetchExpenseTotals(); }} />
        )}
      </OverlayScreen>
      <OverlayScreen visible={!!quickChatTripId}>
        {quickChatTripId && (
          <ChatScreen tripId={quickChatTripId} tripName={quickChatTripName} onClose={() => { setQuickChatTripId(null); }} />
        )}
      </OverlayScreen>
      <OverlayScreen visible={showNotifications}>
        <NotificationsScreen
          onClose={() => { setShowNotifications(false); fetchUnreadCount(); }}
        />
        />
      </OverlayScreen>
    </View>
  );
}

// ─── OverlayScreen (animated modal) ─────────────────────────────────────────
function OverlayScreen({ visible, children }: { visible: boolean; children: React.ReactNode }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(anim, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.poly(5)),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(anim, {
        toValue: 0,
        duration: 260,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => setMounted(false));
    }
  }, [visible]);

  if (!mounted) return null;

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [SCREEN_H * 0.04, 0] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] });
  const opacity = anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.8, 1] });

  return (
    <Animated.View style={[styles.overlay, { opacity, transform: [{ translateY }, { scale }] }]}>
      {children}
    </Animated.View>
  );
}

// ─── InvitationCard ──────────────────────────────────────────────────────────
function InvitationCard({ item }: { item: any }) {
  const colors = useThemeColors();
  const { acceptInvitation, declineInvitation } = useTripStore();
  const [loading, setLoading] = useState(false);

  const handle = async (fn: () => Promise<void>) => {
    setLoading(true);
    try { await fn(); } finally { setLoading(false); }
  };

  return (
    <View style={[styles.inviteCard, { backgroundColor: colors.warningBackground, borderColor: colors.warning + '25' }]}>
      <View style={[styles.inviteIcon, { backgroundColor: colors.warning + '20' }]}>
        <Text style={{ fontSize: 22 }}>✈️</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[typography.labelMedium, { color: colors.textPrimary }]} numberOfLines={1}>{item.trip_name}</Text>
        {item.destination && (
          <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={1}>📍 {item.destination}</Text>
        )}
        <Text style={[typography.caption, { color: colors.textTertiary }]}>From {item.invited_by_name}</Text>
      </View>
      <View style={styles.inviteBtns}>
        <TouchableOpacity
          style={[styles.acceptBtn, { backgroundColor: colors.success }]}
          onPress={() => handle(() => acceptInvitation(item.trip_id))}
          disabled={loading}
        >
          <Text style={styles.acceptTxt}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.declineBtn, { borderColor: colors.border }]}
          onPress={() => handle(() => declineInvitation(item.trip_id))}
          disabled={loading}
        >
          <Text style={[typography.caption, { color: colors.textTertiary }]}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  listContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 100 },

  // Greeting
  greeting: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  notifBtn: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    marginLeft: spacing.md,
  },
  notifBadge: {
    position: 'absolute', top: 6, right: 6,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: '#FF6B7A',
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4,
  },
  notifTxt: { fontSize: 10, fontWeight: '800', color: '#fff' },

  // Stats
  statsBanner: {
    borderRadius: borderRadius.xl, padding: spacing.lg,
    flexDirection: 'row', marginBottom: spacing.xl,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 2 },
  statLbl: { fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: spacing.sm },

  // Section
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },

  // Search & Filter
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm + 2,
    height: 42,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: 42,
    paddingVertical: 0,
  } as any,
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md, alignItems: 'center' },
  filterChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full, borderWidth: 1,
  },

  // Trip Card
  tripCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  tripCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tripTypeEmoji: {
    width: 46, height: 46, borderRadius: borderRadius.lg,
    justifyContent: 'center', alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: borderRadius.full,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusTxt: { fontSize: 11, fontWeight: '700' },
  tripMeta: { gap: 4, marginTop: spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  tripCardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: spacing.sm, marginTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  quickActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  quickBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, borderRadius: borderRadius.md, borderWidth: 1,
  },

  // Invitations
  inviteSection: { marginBottom: spacing.lg },
  inviteCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: borderRadius.lg, padding: spacing.md,
    marginBottom: spacing.sm, borderWidth: 1, gap: spacing.sm,
  },
  inviteIcon: {
    width: 44, height: 44, borderRadius: borderRadius.md,
    justifyContent: 'center', alignItems: 'center',
  },
  inviteBtns: { gap: spacing.xs },
  acceptBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: borderRadius.sm },
  acceptTxt: { fontSize: 12, fontWeight: '700', color: '#fff' },
  declineBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: borderRadius.sm, borderWidth: 1 },

  // Empty
  empty: { paddingTop: 80, alignItems: 'center', paddingHorizontal: spacing.xl },
  emptyIconWrap: {
    width: 96, height: 96, borderRadius: 48,
    justifyContent: 'center', alignItems: 'center',
  },

  // FAB
  fab: {
    position: 'absolute', right: spacing.lg, bottom: 90,
    borderRadius: 30, overflow: 'hidden',
  },
  fabGrad: { width: 58, height: 58, justifyContent: 'center', alignItems: 'center' },

  // Overlay
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 100, backgroundColor: 'transparent',
  },
});
