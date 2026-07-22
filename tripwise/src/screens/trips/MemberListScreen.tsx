import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList,
  Alert, Platform, RefreshControl, BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, UserPlus, Shield, ShieldCheck, X, Crown,
  MoreVertical, UserMinus, ChevronUp,
} from 'lucide-react-native';
import { useThemeColors, typography, spacing, borderRadius, shadows } from '../../theme';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

interface TripMember {
  id: string;
  user_id: string;
  role: 'admin' | 'member';
  status: 'active' | 'pending';
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  joined_at: string | null;
}

interface MemberListScreenProps {
  tripId: string;
  tripName: string;
  onClose: () => void;
}

export function MemberListScreen({ tripId, tripName, onClose }: MemberListScreenProps) {
  const colors = useThemeColors();
  const { user } = useAuthStore();
  const [members, setMembers] = useState<TripMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  const currentUserMember = members.find((m) => m.user_id === user?.id);
  const isAdmin = currentUserMember?.role === 'admin';

  useEffect(() => {
    fetchMembers();
  }, [tripId]);

  // Handle Android hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => backHandler.remove();
  }, [onClose]);

  const fetchMembers = async () => {
    try {
      const { data: memberData } = await supabase
        .rpc('get_trip_members', { p_trip_id: tripId });

      if (memberData && Array.isArray(memberData)) {
        const userIds = memberData.map((m: any) => m.user_id);
        const { data: profiles } = await supabase
          .rpc('get_profiles_by_ids', { user_ids: userIds });

        const enriched: TripMember[] = memberData.map((m: any) => {
          const profile = Array.isArray(profiles)
            ? profiles.find((p: any) => p.id === m.user_id)
            : null;
          return {
            id: m.id,
            user_id: m.user_id,
            role: m.role,
            status: m.status,
            joined_at: m.joined_at,
            display_name: profile?.display_name || null,
            email: profile?.email || null,
            avatar_url: profile?.avatar_url || null,
          };
        });

        // Sort: admins first, then active, then pending
        enriched.sort((a, b) => {
          if (a.role === 'admin' && b.role !== 'admin') return -1;
          if (b.role === 'admin' && a.role !== 'admin') return 1;
          if (a.status === 'active' && b.status !== 'active') return -1;
          if (b.status === 'active' && a.status !== 'active') return 1;
          return (a.display_name || '').localeCompare(b.display_name || '');
        });

        setMembers(enriched);
      }
    } catch (err) {
      console.warn('Failed to fetch members:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMembers();
    setRefreshing(false);
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
        showAlertMsg('Not Found', 'This user is not on TripWise yet.');
        return;
      }

      if (members.some((m) => m.user_id === foundUser.id)) {
        showAlertMsg('Already Added', 'This user is already a member of this trip.');
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
        showAlertMsg('Error', error.message);
      } else {
        setInviteEmail('');
        setShowInvite(false);
        await fetchMembers();
        showAlertMsg('Invited', `Invitation sent to ${email}`);
      }
    } finally {
      setInviting(false);
    }
  };

  const handlePromoteToAdmin = async (memberId: string) => {
    const confirmed = await confirmAction(
      'Promote to Admin',
      'This member will be able to edit the trip, manage members, and delete the trip.'
    );
    if (!confirmed) return;

    const { error } = await supabase
      .from('trip_members')
      .update({ role: 'admin' })
      .eq('trip_id', tripId)
      .eq('user_id', memberId);

    if (error) {
      showAlertMsg('Error', error.message);
    } else {
      setExpandedMemberId(null);
      await fetchMembers();
    }
  };

  const handleDemoteToMember = async (memberId: string) => {
    const confirmed = await confirmAction(
      'Remove Admin',
      'This user will become a regular member and lose admin privileges.'
    );
    if (!confirmed) return;

    const { error } = await supabase
      .from('trip_members')
      .update({ role: 'member' })
      .eq('trip_id', tripId)
      .eq('user_id', memberId);

    if (error) {
      showAlertMsg('Error', error.message);
    } else {
      setExpandedMemberId(null);
      await fetchMembers();
    }
  };

  const handleRemoveMember = async (memberId: string, name: string) => {
    const confirmed = await confirmAction(
      'Remove Member',
      `Remove ${name || 'this member'} from the trip? They will lose access to all trip data.`
    );
    if (!confirmed) return;

    const { error } = await supabase
      .from('trip_members')
      .delete()
      .eq('trip_id', tripId)
      .eq('user_id', memberId);

    if (error) {
      showAlertMsg('Error', error.message);
    } else {
      setExpandedMemberId(null);
      await fetchMembers();
    }
  };

  const confirmAction = (title: string, message: string): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return Promise.resolve(window.confirm(`${title}\n\n${message}`));
    }
    return new Promise((resolve) => {
      Alert.alert(title, message, [
        { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
        { text: 'Confirm', onPress: () => resolve(true) },
      ]);
    });
  };

  const showAlertMsg = (title: string, msg: string) => {
    Platform.OS === 'web' ? window.alert(`${title}: ${msg}`) : Alert.alert(title, msg);
  };

  const activeCount = members.filter((m) => m.status === 'active').length;
  const pendingCount = members.filter((m) => m.status === 'pending').length;

  const renderMember = ({ item }: { item: TripMember }) => {
    const isMe = item.user_id === user?.id;
    const isExpanded = expandedMemberId === item.user_id;
    const initial = (item.display_name || item.email || '?')[0].toUpperCase();

    return (
      <View style={[styles.memberCard, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}>
        <View style={styles.memberMain}>
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: item.role === 'admin' ? colors.warningBackground : colors.primaryLight }]}>
            <Text style={[styles.avatarTxt, { color: item.role === 'admin' ? colors.warning : colors.primary }]}>
              {initial}
            </Text>
          </View>

          {/* Info */}
          <View style={styles.memberInfo}>
            <View style={styles.nameRow}>
              <Text style={[typography.labelMedium, { color: colors.textPrimary }]} numberOfLines={1}>
                {item.display_name || item.email || 'Unknown'}
                {isMe ? ' (You)' : ''}
              </Text>
              {item.role === 'admin' && (
                <View style={[styles.roleBadge, { backgroundColor: colors.warningBackground }]}>
                  <Crown size={10} color={colors.warning} />
                  <Text style={[styles.roleBadgeTxt, { color: colors.warning }]}>Admin</Text>
                </View>
              )}
            </View>
            <Text style={[typography.caption, { color: colors.textTertiary }]}>
              {item.status === 'pending' ? '⏳ Invitation pending' : item.email || ''}
            </Text>
          </View>

          {/* Action button (admin only, not self) */}
          {isAdmin && !isMe && item.status === 'active' && (
            <TouchableOpacity
              onPress={() => setExpandedMemberId(isExpanded ? null : item.user_id)}
              style={styles.moreBtn}
              accessibilityLabel="Member actions"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MoreVertical size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}

          {/* Remove pending invite */}
          {isAdmin && !isMe && item.status === 'pending' && (
            <TouchableOpacity
              onPress={() => handleRemoveMember(item.user_id, item.display_name || '')}
              style={styles.moreBtn}
              accessibilityLabel="Cancel invitation"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Expanded actions */}
        {isExpanded && isAdmin && !isMe && (
          <View style={[styles.actionRow, { borderTopColor: colors.borderLight }]}>
            {item.role === 'member' ? (
              <TouchableOpacity
                style={[styles.actionChip, { backgroundColor: colors.warningBackground }]}
                onPress={() => handlePromoteToAdmin(item.user_id)}
              >
                <ChevronUp size={14} color={colors.warning} />
                <Text style={[styles.actionChipTxt, { color: colors.warning }]}>Make Admin</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionChip, { backgroundColor: colors.inputBackground }]}
                onPress={() => handleDemoteToMember(item.user_id)}
              >
                <Shield size={14} color={colors.textSecondary} />
                <Text style={[styles.actionChipTxt, { color: colors.textSecondary }]}>Remove Admin</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionChip, { backgroundColor: 'rgba(239,68,68,0.1)' }]}
              onPress={() => handleRemoveMember(item.user_id, item.display_name || '')}
            >
              <UserMinus size={14} color={colors.error} />
              <Text style={[styles.actionChipTxt, { color: colors.error }]}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={onClose}
          accessibilityLabel="Back"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft color={colors.textPrimary} size={22} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={[typography.h3, { color: colors.textPrimary }]} numberOfLines={1}>
            Members
          </Text>
          <Text style={[typography.caption, { color: colors.textTertiary }]}>
            {tripName}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowInvite(!showInvite)}
          style={[styles.inviteHeaderBtn, { backgroundColor: colors.primaryLight }]}
          accessibilityLabel="Invite member"
        >
          <UserPlus size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats bar */}
      <View style={[styles.statsBar, { backgroundColor: colors.cardBackground, borderBottomColor: colors.borderLight }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: colors.textPrimary }]}>{activeCount}</Text>
          <Text style={[typography.caption, { color: colors.textTertiary }]}>Active</Text>
        </View>
        {pendingCount > 0 && (
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: colors.warning }]}>{pendingCount}</Text>
            <Text style={[typography.caption, { color: colors.textTertiary }]}>Pending</Text>
          </View>
        )}
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: colors.textPrimary }]}>
            {members.filter((m) => m.role === 'admin').length}
          </Text>
          <Text style={[typography.caption, { color: colors.textTertiary }]}>Admins</Text>
        </View>
      </View>

      {/* Invite input */}
      {showInvite && (
        <View style={[styles.inviteSection, { backgroundColor: colors.cardBackground, borderBottomColor: colors.borderLight }]}>
          <Text style={[typography.labelMedium, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
            Invite by email
          </Text>
          <View style={styles.inviteRow}>
            <TextInput
              style={[styles.inviteInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="friend@email.com"
              placeholderTextColor={colors.textTertiary}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
              editable={!inviting}
            />
            <TouchableOpacity
              style={[styles.inviteBtn, { backgroundColor: colors.primary, opacity: inviting ? 0.6 : 1 }]}
              onPress={handleInvite}
              disabled={inviting || !inviteEmail.trim()}
            >
              <Text style={styles.inviteBtnTxt}>{inviting ? '...' : 'Invite'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Member list */}
      <FlatList
        data={members}
        keyExtractor={(item) => item.user_id}
        renderItem={renderMember}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={[typography.bodyMedium, { color: colors.textTertiary, textAlign: 'center' }]}>
                No members found.
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  inviteHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsBar: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '800' },
  inviteSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  inviteRow: { flexDirection: 'row', gap: spacing.sm },
  inviteInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    fontSize: 14,
  },
  inviteBtn: {
    height: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  memberCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  memberMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTxt: { fontSize: 16, fontWeight: '800' },
  memberInfo: { flex: 1, marginLeft: spacing.md },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  roleBadgeTxt: { fontSize: 10, fontWeight: '700' },
  moreBtn: { padding: spacing.xs },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
  },
  actionChipTxt: { fontSize: 12, fontWeight: '600' },
  empty: { paddingTop: 60, alignItems: 'center' },
});
