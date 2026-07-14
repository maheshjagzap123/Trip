import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Modal,
  Platform,
} from 'react-native';
import { useThemeColors, typography, spacing, borderRadius } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { useTripStore } from '../../stores/tripStore';
import { CreateTripScreen } from './CreateTripScreen';
import { TripDetailScreen } from './TripDetailScreen';
import { Plus, Map, Calendar, Users, MapPin, Bell } from 'lucide-react-native';
import { format } from 'date-fns';

export function TripDashboardScreen() {
  const colors = useThemeColors();
  const { profile } = useAuthStore();
  const { trips, invitations, isLoading, fetchTrips, fetchInvitations, subscribeToRealtime } = useTripStore();
  const [showCreateTrip, setShowCreateTrip] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  useEffect(() => {
    fetchTrips();
    fetchInvitations();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToRealtime();
    return () => unsubscribe();
  }, []);

  const renderTripCard = ({ item }: { item: typeof trips[0] }) => (
    <TouchableOpacity
      style={[styles.tripCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
      activeOpacity={0.7}
      onPress={() => setSelectedTripId(item.id)}
    >
      <View style={styles.tripCardHeader}>
        <Text style={[typography.h3, { color: colors.textPrimary, flex: 1 }]} numberOfLines={1}>
          {item.trip_name}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: colors.primaryLight }]}>
          <Text style={[typography.caption, { color: colors.primary }]}>{item.status}</Text>
        </View>
      </View>

      {item.destination && (
        <View style={styles.tripRow}>
          <MapPin color={colors.textTertiary} size={14} />
          <Text style={[typography.bodySmall, { color: colors.textSecondary, marginLeft: spacing.xs }]}>
            {item.destination}
          </Text>
        </View>
      )}

      <View style={styles.tripRow}>
        <Calendar color={colors.textTertiary} size={14} />
        <Text style={[typography.bodySmall, { color: colors.textSecondary, marginLeft: spacing.xs }]}>
          {format(new Date(item.start_date), 'MMM d')} — {format(new Date(item.end_date), 'MMM d, yyyy')}
        </Text>
      </View>

      {item.budget_amount && (
        <View style={styles.tripRow}>
          <Text style={[typography.labelSmall, { color: colors.primary }]}>
            ₹{item.budget_amount.toLocaleString()} budget
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderInvitation = ({ item }: { item: typeof invitations[0] }) => (
    <InvitationCard item={item} colors={colors} />
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>
              Hello, {profile?.first_name || 'Traveler'} 👋
            </Text>
            <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: spacing.xs }]}>
              Where to next?
            </Text>
          </View>
          {invitations.length > 0 && (
            <View style={[styles.notifBadge, { backgroundColor: colors.error }]}>
              <Text style={[typography.caption, { color: '#fff', fontWeight: '700' }]}>
                {invitations.length}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Map color={colors.primary} size={20} />
            <Text style={[typography.h3, { color: colors.textPrimary, marginTop: spacing.xs }]}>{trips.length}</Text>
            <Text style={[typography.caption, { color: colors.textTertiary }]}>Trips</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Calendar color={colors.primary} size={20} />
            <Text style={[typography.h3, { color: colors.textPrimary, marginTop: spacing.xs }]}>
              {trips.filter((t) => t.status === 'Planning').length}
            </Text>
            <Text style={[typography.caption, { color: colors.textTertiary }]}>Upcoming</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Bell color={colors.primary} size={20} />
            <Text style={[typography.h3, { color: colors.textPrimary, marginTop: spacing.xs }]}>{invitations.length}</Text>
            <Text style={[typography.caption, { color: colors.textTertiary }]}>Invites</Text>
          </View>
        </View>

        {/* Invitations */}
        {invitations.length > 0 && (
          <View style={styles.section}>
            <Text style={[typography.labelLarge, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
              Trip Invitations
            </Text>
            <FlatList
              data={invitations}
              renderItem={renderInvitation}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Trips List */}
        {trips.length > 0 ? (
          <View style={styles.section}>
            <Text style={[typography.labelLarge, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
              Your Trips
            </Text>
            <FlatList
              data={trips}
              renderItem={renderTripCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48 }}>🗺️</Text>
            <Text style={[typography.h3, { color: colors.textPrimary, marginTop: spacing.md }]}>
              No trips yet
            </Text>
            <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' }]}>
              Create your first trip and invite friends!
            </Text>
          </View>
        )}

        {/* FAB */}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => setShowCreateTrip(true)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Create new trip"
        >
          <Plus color={colors.textInverse} size={28} />
        </TouchableOpacity>
      </View>

      {/* Create Trip Modal */}
      <Modal visible={showCreateTrip} animationType="slide" presentationStyle="fullScreen">
        <CreateTripScreen onClose={() => { setShowCreateTrip(false); fetchTrips(); }} />
      </Modal>

      {/* Trip Detail Modal */}
      <Modal visible={!!selectedTripId} animationType="slide" presentationStyle="fullScreen">
        {selectedTripId && (
          <TripDetailScreen
            tripId={selectedTripId}
            onClose={() => { setSelectedTripId(null); fetchTrips(); }}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
}

// Invitation Card Component
function InvitationCard({ item, colors }: { item: any; colors: any }) {
  const { acceptInvitation, declineInvitation } = useTripStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      await acceptInvitation(item.trip_id);
    } catch {
      // handle error
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = async () => {
    setIsLoading(true);
    try {
      await declineInvitation(item.trip_id);
    } catch {
      // handle error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.inviteCard, { backgroundColor: colors.cardBackground, borderColor: colors.primary }]}>
      <View style={{ flex: 1 }}>
        <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>{item.trip_name}</Text>
        {item.destination && (
          <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>{item.destination}</Text>
        )}
        <Text style={[typography.caption, { color: colors.textTertiary, marginTop: spacing.xs }]}>
          Invited by {item.invited_by_name}
        </Text>
      </View>
      <View style={styles.inviteActions}>
        <TouchableOpacity
          style={[styles.acceptBtn, { backgroundColor: colors.primary }]}
          onPress={handleAccept}
          disabled={isLoading}
        >
          <Text style={[typography.labelSmall, { color: colors.textInverse }]}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.declineBtn, { borderColor: colors.border }]}
          onPress={handleDecline}
          disabled={isLoading}
        >
          <Text style={[typography.labelSmall, { color: colors.textSecondary }]}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  notifBadge: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: { flex: 1, padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, alignItems: 'center' },
  section: { marginBottom: spacing.lg },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl },
  tripCard: { padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, marginBottom: spacing.sm },
  tripCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  tripRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  inviteCard: { flexDirection: 'row', padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, marginBottom: spacing.sm, alignItems: 'center' },
  inviteActions: { gap: spacing.xs },
  acceptBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.sm },
  declineBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.sm, borderWidth: 1 },
  fab: {
    position: 'absolute', right: spacing.lg, bottom: spacing.lg,
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4,
  },
});
