import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Animated, Dimensions, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../stores/authStore';
import { useTripStore } from '../../stores/tripStore';
import { supabase } from '../../lib/supabase';
import { CreateTripScreen } from './CreateTripScreen';
import { TripDetailScreen } from './TripDetailScreen';
import { AddExpenseScreen } from '../expenses/AddExpenseScreen';
import { ChatScreen } from '../chat/ChatScreen';
import { Plus, MapPin, Calendar, Zap, MessageCircle } from 'lucide-react-native';
import { format } from 'date-fns';

const TRIP_TYPE_EMOJI: Record<string, string> = {
  Friends: '👫', Family: '👨‍👩‍👧', Couple: '💑', Solo: '🧳',
  Office: '💼', Adventure: '🏔️', Pilgrimage: '🛕',
};

export function TripDashboardScreen() {
  const { profile } = useAuthStore();
  const { trips, invitations, fetchTrips, fetchInvitations, subscribeToRealtime } = useTripStore();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [quickExpenseTripId, setQuickExpenseTripId] = useState<string | null>(null);
  const [quickChatTripId, setQuickChatTripId] = useState<string | null>(null);
  const [quickChatTripName, setQuickChatTripName] = useState('');
  const [tripExpenses, setTripExpenses] = useState<Record<string, number>>({});
  const [myShares, setMyShares] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchTrips(); fetchInvitations();
    const unsub = subscribeToRealtime();

    // Subscribe to expense changes for real-time totals
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
      .subscribe();

    return () => { unsub(); supabase.removeChannel(expenseChannel); };
  }, []);

  useEffect(() => {
    if (trips.length > 0) fetchExpenseTotals();
  }, [trips]);

  const fetchExpenseTotals = async () => {
    // Get fresh trip list from store (avoid stale closure)
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

    // Map expense_id → trip_id for quick lookup
    const expToTrip: Record<string, string> = {};
    for (const e of expenses) expToTrip[e.id] = e.trip_id;

    const shares: Record<string, number> = {};
    for (const s of splits || []) {
      const tid = expToTrip[s.expense_id];
      if (tid) shares[tid] = (shares[tid] || 0) + Number(s.amount);
    }
    setMyShares(shares);
  };

  const totalSpent = Object.values(myShares).reduce((a, b) => a + b, 0);

  const renderTripCard = ({ item, index }: { item: typeof trips[0]; index: number }) => (
    <TouchableOpacity style={styles.tripCard} activeOpacity={0.85} onPress={() => setSelectedTripId(item.id)}>
      <LinearGradient
        colors={index % 3 === 0 ? ['#0D3B2E', '#0A2A20'] : index % 3 === 1 ? ['#1A2744', '#0F1A30'] : ['#2A1A3E', '#1A0F2E']}
        style={styles.tripCardGrad}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        {/* Top row */}
        <View style={styles.tripCardTop}>
          <View style={styles.tripTypeEmoji}>
            <Text style={{ fontSize: 20 }}>{TRIP_TYPE_EMOJI[item.trip_type || ''] || '✈️'}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: item.status === 'Active' ? 'rgba(0,200,150,0.2)' : 'rgba(255,255,255,0.1)' }]}>
            <View style={[styles.statusDot, { backgroundColor: item.status === 'Active' ? '#00C896' : 'rgba(255,255,255,0.4)' }]} />
            <Text style={[styles.statusTxt, { color: item.status === 'Active' ? '#00C896' : 'rgba(255,255,255,0.6)' }]}>{item.status}</Text>
          </View>
        </View>

        {/* Name */}
        <Text style={styles.tripName} numberOfLines={1}>{item.trip_name}</Text>

        {/* Meta */}
        <View style={styles.tripMeta}>
          {item.destination && (
            <View style={styles.metaRow}>
              <MapPin size={12} color="rgba(255,255,255,0.5)" />
              <Text style={styles.metaTxt} numberOfLines={1}>{item.destination}</Text>
            </View>
          )}
          <View style={styles.metaRow}>
            <Calendar size={12} color="rgba(255,255,255,0.5)" />
            <Text style={styles.metaTxt}>{format(new Date(item.start_date), 'MMM d')} – {format(new Date(item.end_date), 'MMM d')}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.tripCardFooter}>
          <View>
            <Text style={styles.spentLabel}>Trip Total</Text>
            <Text style={styles.spentAmtMuted}>₹{(tripExpenses[item.id] || 0).toLocaleString()}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.spentLabel}>My Cut</Text>
            <Text style={styles.spentAmt}>₹{(myShares[item.id] || 0).toLocaleString()}</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.addExpenseBtn}
            onPress={(e) => { e.stopPropagation(); setQuickExpenseTripId(item.id); }}
            activeOpacity={0.8}
            accessibilityLabel="Add expense to this trip"
          >
            <Plus size={14} color="#00C896" />
            <Text style={styles.addExpenseTxt}>Add Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.chatBtn}
            onPress={(e) => { e.stopPropagation(); setQuickChatTripId(item.id); setQuickChatTripName(item.trip_name); }}
            activeOpacity={0.8}
            accessibilityLabel="Open trip chat"
          >
            <MessageCircle size={14} color="#F59E0B" />
            <Text style={styles.chatBtnTxt}>Chat</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const ListHeader = () => (
    <View>
      {/* Greeting */}
      <View style={styles.greeting}>
        <View>
          <Text style={styles.greetingName}>Hey, {profile?.first_name || 'Traveler'} 👋</Text>
          <Text style={styles.greetingSub}>Ready for your next adventure?</Text>
        </View>
        {invitations.length > 0 && (
          <View style={styles.notifBadge}>
            <Text style={styles.notifTxt}>{invitations.length}</Text>
          </View>
        )}
      </View>

      {/* Stats banner */}
      <LinearGradient colors={['#00C896', '#0EA5E9']} style={styles.statsBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{trips.length}</Text>
          <Text style={styles.statLbl}>Trips</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{trips.filter((t) => t.status === 'Planning').length}</Text>
          <Text style={styles.statLbl}>Upcoming</Text>
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
            <Zap size={16} color="#F59E0B" />
            <Text style={styles.sectionTitle}>Trip Invitations</Text>
          </View>
          {invitations.map((item) => <InvitationCard key={item.id} item={item} />)}
        </View>
      )}

      {trips.length > 0 && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Trips</Text>
        </View>
      )}
    </View>
  );

  return (
    <LinearGradient colors={['#0A0F1E', '#0F172A']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <FlatList
          data={trips}
          keyExtractor={(item) => item.id}
          renderItem={renderTripCard}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 56 }}>🗺️</Text>
              <Text style={styles.emptyTitle}>No trips yet</Text>
              <Text style={styles.emptySub}>Tap + to create your first trip{'\n'}and invite your friends!</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {/* FAB */}
        <TouchableOpacity style={styles.fab} onPress={() => setShowCreate(true)} activeOpacity={0.85}>
          <LinearGradient colors={['#00C896', '#00A87E']} style={styles.fabGrad}>
            <Plus color="#fff" size={26} />
          </LinearGradient>
        </TouchableOpacity>

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
      </SafeAreaView>
    </LinearGradient>
  );
}

const { height: SCREEN_H } = Dimensions.get('window');

function OverlayScreen({ visible, children }: { visible: boolean; children: React.ReactNode }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.poly(5)),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(anim, {
        toValue: 0,
        duration: 280,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => setMounted(false));
    }
  }, [visible]);

  if (!mounted) return null;

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [SCREEN_H, 0] });
  const scale = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.9, 0.97, 1] });
  const opacity = anim.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 0.9, 1] });

  return (
    <Animated.View style={[styles.overlay, { opacity, transform: [{ translateY }, { scale }] }]}>
      {children}
    </Animated.View>
  );
}

function InvitationCard({ item }: { item: any }) {
  const { acceptInvitation, declineInvitation } = useTripStore();
  const [loading, setLoading] = useState(false);

  const handle = async (fn: () => Promise<void>) => {
    setLoading(true);
    try { await fn(); } finally { setLoading(false); }
  };

  return (
    <View style={styles.inviteCard}>
      <View style={styles.inviteIcon}><Text style={{ fontSize: 22 }}>✈️</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.inviteName}>{item.trip_name}</Text>
        {item.destination && <Text style={styles.inviteDest}>📍 {item.destination}</Text>}
        <Text style={styles.inviteBy}>Invited by {item.invited_by_name}</Text>
      </View>
      <View style={styles.inviteBtns}>
        <TouchableOpacity style={styles.acceptBtn} onPress={() => handle(() => acceptInvitation(item.trip_id))} disabled={loading}>
          <LinearGradient colors={['#00C896', '#00A87E']} style={styles.acceptGrad}>
            <Text style={styles.acceptTxt}>Accept</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.declineBtn} onPress={() => handle(() => declineInvitation(item.trip_id))} disabled={loading}>
          <Text style={styles.declineTxt}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 },
  greeting: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greetingName: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5, marginBottom: 4 },
  greetingSub: { fontSize: 14, color: 'rgba(255,255,255,0.45)', fontWeight: '400' },
  notifBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center' },
  notifTxt: { fontSize: 12, fontWeight: '800', color: '#fff' },
  statsBanner: { borderRadius: 20, padding: 20, flexDirection: 'row', marginBottom: 24, shadowColor: '#00C896', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 2 },
  statLbl: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  inviteSection: { marginBottom: 24 },
  inviteCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: 18, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)', gap: 12 },
  inviteIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(245,158,11,0.15)', justifyContent: 'center', alignItems: 'center' },
  inviteName: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 },
  inviteDest: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 2 },
  inviteBy: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  inviteBtns: { gap: 6 },
  acceptBtn: { borderRadius: 10, overflow: 'hidden' },
  acceptGrad: { paddingHorizontal: 14, paddingVertical: 7 },
  acceptTxt: { fontSize: 13, fontWeight: '700', color: '#fff' },
  declineBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  declineTxt: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
  tripCard: { marginBottom: 14, borderRadius: 22, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  tripCardGrad: { padding: 16, paddingBottom: 14 },
  tripCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tripTypeEmoji: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusTxt: { fontSize: 12, fontWeight: '600' },
  tripName: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3, marginBottom: 10 },
  tripMeta: { gap: 5, marginBottom: 14 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaTxt: { fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: '500' },
  tripCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  spentLabel: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
  spentAmt: { fontSize: 18, fontWeight: '800', color: '#00C896' },
  spentAmtMuted: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.4)' },
  addExpenseBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 200, 150, 0.12)', borderWidth: 1, borderColor: 'rgba(0, 200, 150, 0.3)', paddingVertical: 7, borderRadius: 16, gap: 4 },
  addExpenseTxt: { fontSize: 12, fontWeight: '700', color: '#00C896' },
  quickActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  chatBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(245, 158, 11, 0.12)', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)', paddingVertical: 7, borderRadius: 16, gap: 4 },
  chatBtnTxt: { fontSize: 12, fontWeight: '700', color: '#F59E0B' },
  empty: { paddingTop: 80, alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 15, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 22 },
  fab: { position: 'absolute', right: 20, bottom: 24, borderRadius: 30, overflow: 'hidden', shadowColor: '#00C896', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
  fabGrad: { width: 60, height: 60, justifyContent: 'center', alignItems: 'center' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 },
});
