import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Platform,
  Modal,
  BackHandler,
} from 'react-native';
import { useThemeColors, typography, spacing, borderRadius } from '../../theme';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { EditTripScreen } from './EditTripScreen';
import { ExpensesScreen } from '../expenses/ExpensesScreen';
import { PhotosScreen } from '../media/PhotosScreen';
import { ChatScreen } from '../chat/ChatScreen';
import { TimelineScreen } from '../timeline/TimelineScreen';
import { MemberListScreen } from './MemberListScreen';
import { ArrowLeft, MapPin, Calendar, Users, UserPlus, Plus, X, Trash2, LogOut, Pencil, Receipt, Camera as CameraIcon, MessageCircle, Clock } from 'lucide-react-native';
import { format } from 'date-fns';

interface TripMember {
  id: string;
  user_id: string;
  role: string;
  status: string;
  display_name: string | null;
  email: string | null;
}

interface TripDetailProps {
  tripId: string;
  onClose: () => void;
}

export function TripDetailScreen({ tripId, onClose }: TripDetailProps) {
  const colors = useThemeColors();
  const { user } = useAuthStore();
  const [trip, setTrip] = useState<any>(null);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [creatorName, setCreatorName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showExpenses, setShowExpenses] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  const isAdmin = members.some((m) => m.user_id === user?.id && m.role === 'admin');

  useEffect(() => {
    fetchTripDetail();
  }, [tripId]);

  // Handle Android hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => backHandler.remove();
  }, [onClose]);

  const fetchTripDetail = async () => {
    setIsLoading(true);
    try {
      // Fetch trip
      const { data: tripData } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();

      if (tripData) setTrip(tripData);

      // Fetch members using RPC to bypass RLS
      const { data: memberData } = await supabase
        .rpc('get_trip_members', { p_trip_id: tripId });

      if (memberData && Array.isArray(memberData)) {
        // Fetch profile info for each member (bypass RLS via function)
        const userIds = memberData.map((m: any) => m.user_id);
        const { data: profiles } = await supabase
          .rpc('get_profiles_by_ids', { user_ids: userIds });

        const enrichedMembers = memberData.map((m: any) => {
          const profile = Array.isArray(profiles) ? profiles.find((p: any) => p.id === m.user_id) : null;
          return {
            ...m,
            display_name: profile?.display_name || null,
            email: profile?.email || null,
          };
        });

        setMembers(enrichedMembers);
      }

      // Fetch creator name
      if (tripData?.created_by) {
        const { data: creatorData } = await supabase
          .rpc('get_profiles_by_ids', { user_ids: [tripData.created_by] });
        const creator = Array.isArray(creatorData) ? creatorData[0] : null;
        if (creator) setCreatorName(creator.display_name || 'Unknown');
      }
    } catch (err) {
      console.warn('Failed to fetch trip detail:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !user) return;

    setInviting(true);
    try {
      const { data: rpcResult } = await supabase
        .rpc('find_profile_by_email', { lookup_email: email });

      const foundUser = Array.isArray(rpcResult) ? rpcResult[0] : rpcResult;

      if (!foundUser?.id) {
        showAlert('Not Found', 'This user is not on TripWise yet.');
        return;
      }

      if (members.some((m) => m.user_id === foundUser.id)) {
        showAlert('Already Added', 'This user is already a member of this trip.');
        return;
      }

      const { error } = await supabase.from('trip_members').insert({
        trip_id: tripId,
        user_id: foundUser.id,
        role: 'member',
        status: 'pending',
        invited_by: user.id,
      });

      if (error) {
        showAlert('Error', error.message);
      } else {
        setInviteEmail('');
        setShowInvite(false);
        fetchTripDetail();
      }
    } finally {
      setInviting(false);
    }
  };

  const handleLeaveTrip = async () => {
    const confirm = Platform.OS === 'web'
      ? window.confirm('Are you sure you want to leave this trip?')
      : await new Promise((resolve) => {
          Alert.alert('Leave Trip', 'Are you sure?', [
            { text: 'Cancel', onPress: () => resolve(false) },
            { text: 'Leave', style: 'destructive', onPress: () => resolve(true) },
          ]);
        });

    if (!confirm || !user) return;

    await supabase.from('trip_members').delete().eq('trip_id', tripId).eq('user_id', user.id);
    onClose();
  };

  const handleDeleteTrip = async () => {
    const confirm = Platform.OS === 'web'
      ? window.confirm('Delete this trip permanently? This cannot be undone.')
      : await new Promise((resolve) => {
          Alert.alert('Delete Trip', 'This cannot be undone.', [
            { text: 'Cancel', onPress: () => resolve(false) },
            { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
          ]);
        });

    if (!confirm) return;

    await supabase.from('trips').delete().eq('id', tripId);
    onClose();
  };

  const handleRemoveMember = async (memberId: string) => {
    await supabase.from('trip_members').delete().eq('trip_id', tripId).eq('user_id', memberId);
    fetchTripDetail();
  };

  const showAlert = (title: string, msg: string) => {
    Platform.OS === 'web' ? window.alert(`${title}: ${msg}`) : Alert.alert(title, msg);
  };

  if (isLoading || !trip) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} accessibilityLabel="Back" hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={{ padding: spacing.xs }}>
            <ArrowLeft color={colors.textPrimary} size={22} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <View style={{ width: 140, height: 18, backgroundColor: colors.skeletonBase, borderRadius: 6 }} />
          </View>
        </View>
        <View style={styles.content}>
          <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={{ width: '70%', height: 22, backgroundColor: colors.skeletonBase, borderRadius: 6, marginBottom: 16 }} />
            <View style={{ width: '50%', height: 14, backgroundColor: colors.skeletonBase, borderRadius: 6, marginBottom: 12 }} />
            <View style={{ width: '60%', height: 14, backgroundColor: colors.skeletonBase, borderRadius: 6, marginBottom: 12 }} />
            <View style={{ width: '40%', height: 14, backgroundColor: colors.skeletonBase, borderRadius: 6 }} />
          </View>
          <View style={styles.actionsGrid}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={[styles.actionCard, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.skeletonBase }} />
                <View style={{ width: 50, height: 12, backgroundColor: colors.skeletonBase, borderRadius: 4, marginTop: 10 }} />
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onClose} accessibilityLabel="Back" hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={{ padding: spacing.xs }}>
          <ArrowLeft color={colors.textPrimary} size={22} />
        </TouchableOpacity>
        <Text style={[typography.h3, { color: colors.textPrimary, flex: 1, marginLeft: spacing.md }]} numberOfLines={1}>
          {trip.trip_name}
        </Text>
        {isAdmin && (
          <TouchableOpacity onPress={() => setShowEdit(true)} accessibilityLabel="Edit trip" hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Pencil color={colors.primary} size={20} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Trip Info Card */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>{trip.trip_name}</Text>

          {trip.destination && (
            <View style={styles.row}>
              <MapPin color={colors.primary} size={16} />
              <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginLeft: spacing.xs }]}>{trip.destination}</Text>
            </View>
          )}

          <View style={styles.row}>
            <Calendar color={colors.primary} size={16} />
            <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginLeft: spacing.xs }]}>
              {format(new Date(trip.start_date), 'MMM d, yyyy')} — {format(new Date(trip.end_date), 'MMM d, yyyy')}
            </Text>
          </View>

          <View style={styles.row}>
            <Users color={colors.primary} size={16} />
            <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginLeft: spacing.xs }]}>
              Created by {creatorName}
            </Text>
          </View>

          {trip.description && (
            <Text style={[typography.bodyMedium, { color: colors.textTertiary, marginTop: spacing.md }]}>
              {trip.description}
            </Text>
          )}

          <View style={[styles.typeBadge, { backgroundColor: colors.primaryLight }]}>
            <Text style={[typography.labelSmall, { color: colors.primary }]}>{trip.trip_type}</Text>
          </View>
        </View>

        {/* Quick Actions — 2x2 Grid */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}
            onPress={() => setShowExpenses(true)}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(91,140,255,0.12)' }]}>
              <Receipt color={colors.primary} size={22} />
            </View>
            <Text style={[typography.labelMedium, { color: colors.textPrimary, marginTop: spacing.sm }]}>Expenses</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}
            onPress={() => setShowPhotos(true)}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(123,97,255,0.12)' }]}>
              <CameraIcon color="#7B61FF" size={22} />
            </View>
            <Text style={[typography.labelMedium, { color: colors.textPrimary, marginTop: spacing.sm }]}>Photos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}
            onPress={() => setShowChat(true)}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(255,182,72,0.12)' }]}>
              <MessageCircle color="#FFB648" size={22} />
            </View>
            <Text style={[typography.labelMedium, { color: colors.textPrimary, marginTop: spacing.sm }]}>Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}
            onPress={() => setShowTimeline(true)}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(123,97,255,0.12)' }]}>
              <Clock color="#7B61FF" size={22} />
            </View>
            <Text style={[typography.labelMedium, { color: colors.textPrimary, marginTop: spacing.sm }]}>Timeline</Text>
          </TouchableOpacity>
        </View>

        {/* Members Section */}
        <View style={styles.sectionHeader}>
          <TouchableOpacity onPress={() => setShowMembers(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[typography.labelLarge, { color: colors.textPrimary }]}>
              Members ({members.filter(m => m.status === 'active').length})
            </Text>
            <Text style={[typography.caption, { color: colors.primary, marginLeft: spacing.xs }]}>View All</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowInvite(!showInvite)}>
            <UserPlus color={colors.primary} size={20} />
          </TouchableOpacity>
        </View>

        {/* Invite Input */}
        {showInvite && (
          <View style={[styles.inviteRow, { borderColor: colors.border }]}>
            <TextInput
              style={[styles.inviteInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="friend@email.com"
              placeholderTextColor={colors.textTertiary}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[styles.inviteBtn, { backgroundColor: colors.primary }]}
              onPress={handleInvite}
              disabled={inviting}
            >
              <Plus color={colors.textInverse} size={18} />
            </TouchableOpacity>
          </View>
        )}

        {/* Member List */}
        {members.map((member) => (
          <View key={member.id} style={[styles.memberRow, { borderColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>
                {(member.display_name || member.email || '?')[0].toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>
                {member.display_name || member.email || 'Unknown'}
                {member.user_id === user?.id ? ' (You)' : ''}
              </Text>
              <Text style={[typography.caption, { color: colors.textTertiary }]}>
                {member.role}{member.status === 'pending' ? ' • Pending' : ''}
              </Text>
            </View>
            {isAdmin && member.user_id !== user?.id && member.status === 'active' && (
              <TouchableOpacity onPress={() => handleRemoveMember(member.user_id)}>
                <X color={colors.textTertiary} size={16} />
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* Actions */}
        <View style={styles.actions}>
          {!isAdmin && (
            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: colors.error }]}
              onPress={handleLeaveTrip}
            >
              <LogOut color={colors.error} size={16} />
              <Text style={[typography.labelMedium, { color: colors.error, marginLeft: spacing.xs }]}>Leave Trip</Text>
            </TouchableOpacity>
          )}
          {isAdmin && (
            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: colors.error }]}
              onPress={handleDeleteTrip}
            >
              <Trash2 color={colors.error} size={16} />
              <Text style={[typography.labelMedium, { color: colors.error, marginLeft: spacing.xs }]}>Delete Trip</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Expenses Modal */}
      <Modal visible={showExpenses} animationType="slide" presentationStyle="fullScreen">
        <ExpensesScreen tripId={tripId} tripName={trip?.trip_name || ''} onClose={() => setShowExpenses(false)} />
      </Modal>

      {/* Photos Modal */}
      <Modal visible={showPhotos} animationType="slide" presentationStyle="fullScreen">
        <PhotosScreen tripId={tripId} tripName={trip?.trip_name || ''} onClose={() => setShowPhotos(false)} />
      </Modal>

      {/* Chat Modal */}
      <Modal visible={showChat} animationType="slide" presentationStyle="fullScreen">
        <ChatScreen tripId={tripId} tripName={trip?.trip_name || ''} onClose={() => setShowChat(false)} />
      </Modal>

      {/* Timeline Modal */}
      <Modal visible={showTimeline} animationType="slide" presentationStyle="fullScreen">
        <TimelineScreen tripId={tripId} tripName={trip?.trip_name || ''} onClose={() => setShowTimeline(false)} />
      </Modal>

      {/* Edit Trip Modal */}
      <Modal visible={showEdit} animationType="slide" presentationStyle="fullScreen">
        <EditTripScreen
          trip={trip}
          onClose={() => setShowEdit(false)}
          onSaved={fetchTripDetail}
        />
      </Modal>

      {/* Members Modal */}
      <Modal visible={showMembers} animationType="slide" presentationStyle="fullScreen">
        <MemberListScreen
          tripId={tripId}
          tripName={trip?.trip_name || ''}
          onClose={() => { setShowMembers(false); fetchTripDetail(); }}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: 120 },
  card: { padding: spacing.lg, borderRadius: borderRadius.xl, borderWidth: 1, marginBottom: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.full, marginTop: spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  inviteRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  inviteInput: { flex: 1, height: 40, borderWidth: 1, borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm, fontSize: 14 },
  inviteBtn: { width: 40, height: 40, borderRadius: borderRadius.sm, justifyContent: 'center', alignItems: 'center' },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 0.5 },
  avatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  actionCard: { width: '48%', flexGrow: 1, alignItems: 'center', paddingVertical: spacing.xl, borderRadius: borderRadius.xl, borderWidth: 1 },
  actionIconWrap: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  actions: { marginTop: spacing.xl, gap: spacing.sm },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 44, borderWidth: 1, borderRadius: borderRadius.md },
});
