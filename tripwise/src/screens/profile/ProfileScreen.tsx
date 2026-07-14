import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, ScrollView } from 'react-native';
import { useThemeColors, typography, spacing, borderRadius } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { LogOut, Mail, MapPin, Heart } from 'lucide-react-native';

export function ProfileScreen() {
  const colors = useThemeColors();
  const { profile, user, signOut } = useAuthStore();

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      // Web: use confirm dialog
      if (window.confirm('Are you sure you want to sign out?')) {
        signOut();
      }
    } else {
      // Native: use Alert
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar + Name */}
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
            <Text style={styles.avatarText}>
              {profile?.first_name?.[0]?.toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={[typography.h1, { color: colors.textPrimary, marginTop: spacing.md }]}>
            {profile?.display_name || 'Traveler'}
          </Text>
        </View>

        {/* Info Card */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          {user?.email && (
            <View style={styles.infoRow}>
              <Mail color={colors.textTertiary} size={18} />
              <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginLeft: spacing.sm }]}>
                {user.email}
              </Text>
            </View>
          )}
          {profile?.home_city && (
            <View style={styles.infoRow}>
              <MapPin color={colors.textTertiary} size={18} />
              <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginLeft: spacing.sm }]}>
                {profile.home_city}
              </Text>
            </View>
          )}
        </View>

        {/* Interests */}
        {profile?.travel_interests && profile.travel_interests.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={styles.infoRow}>
              <Heart color={colors.textTertiary} size={18} />
              <Text style={[typography.labelMedium, { color: colors.textPrimary, marginLeft: spacing.sm }]}>
                Interests
              </Text>
            </View>
            <View style={styles.chipRow}>
              {profile.travel_interests.map((interest: string) => (
                <View
                  key={interest}
                  style={[styles.chip, { backgroundColor: colors.primaryLight }]}
                >
                  <Text style={[typography.labelSmall, { color: colors.primary }]}>
                    {interest}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Sign Out */}
        <TouchableOpacity
          style={[styles.signOutButton, { borderColor: colors.error }]}
          onPress={handleSignOut}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <LogOut color={colors.error} size={18} />
          <Text style={[typography.labelMedium, { color: colors.error, marginLeft: spacing.sm }]}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#00C896',
  },
  card: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
    marginLeft: spacing.lg + spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  signOutButton: {
    height: 48,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
});
