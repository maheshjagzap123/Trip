import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Modal, Platform, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { supabase } from '../../lib/supabase';
import { useThemeColors, typography, spacing, borderRadius, shadows } from '../../theme';
import type { ThemeMode } from '../../stores/themeStore';
import { EditProfileScreen } from './EditProfileScreen';
import { PersonalDocumentsScreen } from '../documents/PersonalDocumentsScreen';
import { SupportScreen } from '../support/SupportScreen';
import { ConnectDriveScreen } from '../cloud/ConnectDriveScreen';
import { Mail, MapPin, Settings, Moon, Sun, Monitor, ChevronRight, LogOut, Info, Shield, ArrowLeft, UserPen, FileText, HelpCircle, Cloud, Trash2 } from 'lucide-react-native';
import { TermsOfServiceScreen } from '../auth/TermsOfServiceScreen';
import { PrivacyPolicyScreen } from '../auth/PrivacyPolicyScreen';

export function ProfileScreen() {
  const { profile, user, fetchProfile } = useAuthStore();
  const colors = useThemeColors();
  const [showSettings, setShowSettings] = useState(false);

  const initials = `${profile?.first_name?.[0] || ''}${profile?.last_name?.[0] || ''}`.toUpperCase() || '?';

  // Re-fetch profile when settings modal closes to pick up avatar/profile changes
  const handleSettingsClose = useCallback(() => {
    setShowSettings(false);
    fetchProfile();
  }, [fetchProfile]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.avatarRing}
          >
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.avatarInner, { backgroundColor: colors.background }]}>
                <Text style={[styles.avatarTxt, { color: colors.primary }]}>{initials}</Text>
              </View>
            )}
          </LinearGradient>
          <Text style={[typography.h1, { color: colors.textPrimary, marginTop: spacing.md }]}>
            {profile?.display_name || 'Traveler'}
          </Text>
          {profile?.home_city && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs }}>
              <MapPin size={13} color={colors.textTertiary} />
              <Text style={[typography.bodySmall, { color: colors.textSecondary, marginLeft: spacing.xs }]}>
                {profile.home_city}
              </Text>
            </View>
          )}
        </View>

        {/* Info card */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }, shadows.card]}>
          {user?.email && (
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: colors.primaryLight }]}>
                <Mail size={16} color={colors.primary} />
              </View>
              <Text style={[typography.bodyMedium, { color: colors.textPrimary, flex: 1 }]} numberOfLines={1}>
                {user.email}
              </Text>
            </View>
          )}
          {profile?.home_city && (
            <View style={[styles.infoRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderLight }]}>
              <View style={[styles.infoIcon, { backgroundColor: colors.primaryLight }]}>
                <MapPin size={16} color={colors.primary} />
              </View>
              <Text style={[typography.bodyMedium, { color: colors.textPrimary, flex: 1 }]}>
                {profile.home_city}
              </Text>
            </View>
          )}
        </View>

        {/* Interests */}
        {(profile?.travel_interests?.length ?? 0) > 0 && (
          <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }, shadows.card]}>
            <Text style={[typography.overline, { color: colors.textTertiary, marginBottom: spacing.sm }]}>
              PREFERRED CATEGORIES
            </Text>
            <View style={styles.chipRow}>
              {(profile?.travel_interests || []).map((i: string) => (
                <View key={i} style={[styles.chip, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '30' }]}>
                  <Text style={[typography.labelSmall, { color: colors.primary }]}>{i}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Settings Button */}
        <TouchableOpacity
          style={[styles.settingsBtn, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }, shadows.card]}
          onPress={() => setShowSettings(true)}
          activeOpacity={0.8}
        >
          <View style={styles.settingsBtnLeft}>
            <View style={[styles.infoIcon, { backgroundColor: colors.primaryLight }]}>
              <Settings size={18} color={colors.primary} />
            </View>
            <Text style={[typography.labelLarge, { color: colors.textPrimary }]}>Settings</Text>
          </View>
          <ChevronRight size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      </ScrollView>

      {/* Settings Modal */}
      <Modal visible={showSettings} animationType="slide" presentationStyle="fullScreen" onRequestClose={handleSettingsClose}>
        <SettingsPage onClose={handleSettingsClose} />
      </Modal>
    </SafeAreaView>
  );
}

// ============================================================
// Settings Page
// ============================================================

function SettingsPage({ onClose }: { onClose: () => void }) {
  const { signOut } = useAuthStore();
  const { mode: theme, setTheme } = useThemeStore();
  const colors = useThemeColors();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showCloud, setShowCloud] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const bh = BackHandler.addEventListener('hardwareBackPress', () => { onClose(); return true; });
    return () => bh.remove();
  }, [onClose]);

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
  };

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) { signOut(); onClose(); }
    } else {
      Alert.alert('Sign Out', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => { signOut(); onClose(); } },
      ]);
    }
  };

  const handleDeleteAccount = () => {
    const performDelete = async () => {
      setDeleting(true);
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) return;

        // Soft delete: mark profile as deleted (retains data for recovery)
        const { error } = await supabase
          .from('profiles')
          .update({
            deleted_at: new Date().toISOString(),
            display_name: '[Deleted User]',
            profile_completed: false,
          })
          .eq('id', currentUser.id);

        if (error) {
          const msg = 'Failed to delete account. Please try again or contact support.';
          Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
          return;
        }

        // Sign out after soft delete
        await signOut();
        onClose();
      } catch {
        const msg = 'Something went wrong. Please contact support.';
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
      } finally {
        setDeleting(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'Delete your account?\n\nYour account will be deactivated and your data will be hidden. ' +
        'You can contact support within 30 days to recover your account. After that, data may be permanently removed.'
      );
      if (confirmed) performDelete();
    } else {
      Alert.alert(
        'Delete Account',
        'Your account will be deactivated and your data will be hidden. You can contact support within 30 days to recover your account. After that, data may be permanently removed.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: performDelete },
        ]
      );
    }
  };

  const themeOptions: { key: ThemeMode; icon: React.ReactNode; label: string }[] = [
    { key: 'light', icon: <Sun size={20} color={theme === 'light' ? colors.primary : colors.textTertiary} />, label: 'Light' },
    { key: 'dark', icon: <Moon size={20} color={theme === 'dark' ? colors.primary : colors.textTertiary} />, label: 'Dark' },
    { key: 'system', icon: <Monitor size={20} color={theme === 'system' ? colors.primary : colors.textTertiary} />, label: 'System' },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.settingsHeader, { borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity onPress={onClose} style={{ padding: spacing.xs }} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} accessibilityLabel="Go back">
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[typography.h3, { color: colors.textPrimary, flex: 1, textAlign: 'center' }]}>Settings</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.settingsContent} showsVerticalScrollIndicator={false}>
        {/* Theme Section */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }, shadows.card]}>
          <Text style={[typography.overline, { color: colors.textTertiary, marginBottom: spacing.xs }]}>APPEARANCE</Text>
          <Text style={[typography.bodySmall, { color: colors.textSecondary, marginBottom: spacing.md }]}>Choose your preferred theme</Text>
          <View style={styles.themeRow}>
            {themeOptions.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.themeOption,
                  { backgroundColor: colors.inputBackground, borderColor: theme === opt.key ? colors.primary : colors.border },
                  theme === opt.key && { backgroundColor: colors.primaryLight },
                ]}
                onPress={() => handleThemeChange(opt.key)}
              >
                {opt.icon}
                <Text style={[typography.labelSmall, { color: theme === opt.key ? colors.primary : colors.textSecondary, marginTop: 4 }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Account Section */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }, shadows.card]}>
          <Text style={[typography.overline, { color: colors.textTertiary, marginBottom: spacing.sm }]}>ACCOUNT</Text>
          <SettingRow icon={<UserPen size={18} color={colors.textTertiary} />} label="Edit Profile" onPress={() => setShowEditProfile(true)} colors={colors} />
          <SettingRow icon={<FileText size={18} color={colors.textTertiary} />} label="My Documents" onPress={() => setShowDocuments(true)} colors={colors} />
          <SettingRow icon={<Cloud size={18} color={colors.textTertiary} />} label="Cloud Storage" onPress={() => setShowCloud(true)} colors={colors} />
          <SettingRow icon={<Shield size={18} color={colors.textTertiary} />} label="Privacy Policy" onPress={() => setShowPrivacy(true)} colors={colors} />
          <SettingRow icon={<FileText size={18} color={colors.textTertiary} />} label="Terms of Service" onPress={() => setShowTerms(true)} colors={colors} />
          <SettingRow icon={<HelpCircle size={18} color={colors.textTertiary} />} label="Help & Support" onPress={() => setShowSupport(true)} colors={colors} last />
        </View>

        {/* About */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }, shadows.card]}>
          <Text style={[typography.overline, { color: colors.textTertiary, marginBottom: spacing.sm }]}>ABOUT</Text>
          <View style={styles.settingRow}>
            <Info size={18} color={colors.textTertiary} />
            <Text style={[typography.bodyMedium, { color: colors.textPrimary, flex: 1, marginLeft: spacing.sm }]}>App Version</Text>
            <Text style={[typography.bodySmall, { color: colors.textTertiary }]}>1.0.0</Text>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={[styles.signOutBtn, { borderColor: colors.error + '40', backgroundColor: colors.errorBackground }]} onPress={handleSignOut} activeOpacity={0.8}>
          <LogOut size={18} color={colors.error} />
          <Text style={[typography.labelLarge, { color: colors.error, marginLeft: spacing.sm }]}>Sign Out</Text>
        </TouchableOpacity>

        {/* Delete Account */}
        <TouchableOpacity
          style={[styles.deleteBtn, { borderColor: colors.error + '20' }]}
          onPress={handleDeleteAccount}
          activeOpacity={0.8}
          disabled={deleting}
        >
          <Trash2 size={16} color={colors.error} />
          <Text style={[styles.deleteBtnTxt, { color: colors.error }]}>
            {deleting ? 'Deleting...' : 'Delete Account'}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.deleteHint, { color: colors.textTertiary }]}>
          Your data will be deactivated. Contact support within 30 days to recover.
        </Text>
      </ScrollView>

      {/* Modals */}
      <Modal visible={showEditProfile} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setShowEditProfile(false)}>
        <EditProfileScreen onClose={() => setShowEditProfile(false)} />
      </Modal>
      <Modal visible={showDocuments} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setShowDocuments(false)}>
        <PersonalDocumentsScreen onClose={() => setShowDocuments(false)} />
      </Modal>
      <Modal visible={showSupport} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setShowSupport(false)}>
        <SupportScreen onClose={() => setShowSupport(false)} />
      </Modal>
      <Modal visible={showCloud} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setShowCloud(false)}>
        <ConnectDriveScreen onClose={() => setShowCloud(false)} />
      </Modal>
      <Modal visible={showTerms} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setShowTerms(false)}>
        <TermsOfServiceScreen onClose={() => setShowTerms(false)} />
      </Modal>
      <Modal visible={showPrivacy} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setShowPrivacy(false)}>
        <PrivacyPolicyScreen onClose={() => setShowPrivacy(false)} />
      </Modal>
    </SafeAreaView>
  );
}

// ─── Setting Row Component ───────────────────────────────────────────────────
function SettingRow({ icon, label, value, onPress, colors, last }: {
  icon: React.ReactNode; label: string; value?: string;
  onPress?: () => void; colors: any; last?: boolean;
}) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      style={[styles.settingRow, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderLight }]}
      {...(onPress ? { onPress, activeOpacity: 0.7 } : {})}
    >
      {icon}
      <Text style={[typography.bodyMedium, { color: colors.textPrimary, flex: 1, marginLeft: spacing.sm }]}>{label}</Text>
      {value ? (
        <Text style={[typography.bodySmall, { color: colors.textTertiary }]}>{value}</Text>
      ) : onPress ? (
        <ChevronRight size={16} color={colors.textTertiary} />
      ) : null}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: 100 },
  avatarSection: { alignItems: 'center', marginBottom: spacing.xl },
  avatarRing: {
    width: 104, height: 104, borderRadius: 52, padding: 3,
    ...shadows.brand,
  },
  avatarImage: { width: 98, height: 98, borderRadius: 49 },
  avatarInner: { flex: 1, borderRadius: 49, justifyContent: 'center', alignItems: 'center' },
  avatarTxt: { fontSize: 32, fontWeight: '800' },
  card: { borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.sm },
  infoIcon: { width: 34, height: 34, borderRadius: borderRadius.sm, justifyContent: 'center', alignItems: 'center' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: borderRadius.full, borderWidth: 1 },
  settingsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: borderRadius.xl, padding: spacing.md, borderWidth: 1 },
  settingsBtnLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  settingsHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingsContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  themeRow: { flexDirection: 'row', gap: spacing.sm },
  themeOption: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: borderRadius.lg, borderWidth: 1.5, gap: 4 },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 52, borderRadius: borderRadius.lg, borderWidth: 1.5, marginTop: spacing.sm,
  },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 44, borderRadius: borderRadius.lg, borderWidth: 1,
    marginTop: spacing.md,
  },
  deleteBtnTxt: { fontSize: 13, fontWeight: '600', marginLeft: spacing.xs },
  deleteHint: { fontSize: 11, textAlign: 'center', marginTop: spacing.xs, lineHeight: 16 },
});
