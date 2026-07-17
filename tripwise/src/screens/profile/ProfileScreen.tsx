import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import type { ThemeMode } from '../../stores/themeStore';
import { EditProfileScreen } from './EditProfileScreen';
import { PersonalDocumentsScreen } from '../documents/PersonalDocumentsScreen';
import { SupportScreen } from '../support/SupportScreen';
import { ConnectDriveScreen } from '../cloud/ConnectDriveScreen';
import { Mail, MapPin, Settings, Moon, Sun, Monitor, ChevronRight, LogOut, Info, Bell, Shield, ArrowLeft, UserPen, FileText, HelpCircle, Cloud } from 'lucide-react-native';

function useProfileTheme() {
  const { resolvedScheme } = useThemeStore();
  const isDark = resolvedScheme === 'dark';
  return {
    isDark,
    bgGradient: (isDark ? ['#0F172A', '#1E3A5F'] : ['#F0FDF9', '#E6FAF5']) as [string, string],
    textColor: isDark ? '#FFFFFF' : '#111827',
    subTextColor: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)',
    cardBg: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    cardBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
    labelColor: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)',
    infoTextColor: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.7)',
    dividerColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    iconColor: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.35)',
    valueColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
    headerBorder: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    themeOptionBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    themeOptionBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    themeInactiveIcon: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',
    themeInactiveTxt: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)',
    sectionDescColor: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)',
    avatarInnerBg: isDark ? '#0F172A' : '#FFFFFF',
  };
}

export function ProfileScreen() {
  const { profile, user } = useAuthStore();
  const t = useProfileTheme();
  const [showSettings, setShowSettings] = useState(false);

  const initials = `${profile?.first_name?.[0] || ''}${profile?.last_name?.[0] || ''}`.toUpperCase() || '?';

  return (
    <LinearGradient colors={t.bgGradient} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <LinearGradient colors={['#00C896', '#0EA5E9']} style={styles.avatarRing}>
              <View style={[styles.avatarInner, { backgroundColor: t.avatarInnerBg }]}>
                <Text style={styles.avatarTxt}>{initials}</Text>
              </View>
            </LinearGradient>
            <Text style={[styles.name, { color: t.textColor }]}>{profile?.display_name || 'Traveler'}</Text>
            {profile?.home_city && <Text style={[styles.city, { color: t.subTextColor }]}>📍 {profile.home_city}</Text>}
          </View>

          {/* Info card */}
          <View style={[styles.card, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
            {user?.email && (
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}><Mail size={16} color="#00C896" /></View>
                <Text style={[styles.infoTxt, { color: t.infoTextColor }]}>{user.email}</Text>
              </View>
            )}
            {profile?.home_city && (
              <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: t.dividerColor }]}>
                <View style={styles.infoIcon}><MapPin size={16} color="#00C896" /></View>
                <Text style={[styles.infoTxt, { color: t.infoTextColor }]}>{profile.home_city}</Text>
              </View>
            )}
          </View>

          {/* Interests */}
          {(profile?.travel_interests?.length ?? 0) > 0 && (
            <View style={[styles.card, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
              <Text style={[styles.cardLabel, { color: t.labelColor }]}>TRAVEL INTERESTS</Text>
              <View style={styles.chipRow}>
                {(profile?.travel_interests || []).map((i: string) => (
                  <View key={i} style={styles.chip}>
                    <Text style={styles.chipTxt}>{i}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Settings Button */}
          <TouchableOpacity style={[styles.settingsBtn, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]} onPress={() => setShowSettings(true)} activeOpacity={0.8}>
            <View style={styles.settingsBtnLeft}>
              <Settings size={20} color="#00C896" />
              <Text style={[styles.settingsBtnTxt, { color: t.textColor }]}>Settings</Text>
            </View>
            <ChevronRight size={18} color={t.subTextColor} />
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      {/* Settings Modal */}
      <Modal visible={showSettings} animationType="slide" presentationStyle="fullScreen">
        <SettingsPage onClose={() => setShowSettings(false)} />
      </Modal>
    </LinearGradient>
  );
}

// ============================================================
// Settings Page
// ============================================================

function SettingsPage({ onClose }: { onClose: () => void }) {
  const { signOut } = useAuthStore();
  const { mode: theme, setTheme } = useThemeStore();
  const t = useProfileTheme();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showCloud, setShowCloud] = useState(false);

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
  };

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      if (window.confirm('Are you sure you want to sign out?')) { signOut(); onClose(); }
    } else {
      Alert.alert('Sign Out', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => { signOut(); onClose(); } },
      ]);
    }
  };

  return (
    <LinearGradient colors={t.bgGradient} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={[styles.settingsHeader, { borderBottomColor: t.headerBorder }]}>
          <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
            <ArrowLeft size={22} color={t.textColor} />
          </TouchableOpacity>
          <Text style={[styles.settingsTitle, { color: t.textColor }]}>Settings</Text>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView contentContainerStyle={styles.settingsContent}>
          {/* Theme Section */}
          <View style={[styles.card, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
            <Text style={[styles.cardLabel, { color: t.labelColor }]}>APPEARANCE</Text>
            <Text style={[styles.sectionDesc, { color: t.sectionDescColor }]}>Choose your preferred theme</Text>
            <View style={styles.themeRow}>
              <TouchableOpacity
                style={[styles.themeOption, { backgroundColor: t.themeOptionBg, borderColor: t.themeOptionBorder }, theme === 'light' && styles.themeOptionActive]}
                onPress={() => handleThemeChange('light')}
              >
                <Sun size={20} color={theme === 'light' ? '#00C896' : t.themeInactiveIcon} />
                <Text style={[styles.themeOptionTxt, { color: t.themeInactiveTxt }, theme === 'light' && styles.themeOptionTxtActive]}>Light</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.themeOption, { backgroundColor: t.themeOptionBg, borderColor: t.themeOptionBorder }, theme === 'dark' && styles.themeOptionActive]}
                onPress={() => handleThemeChange('dark')}
              >
                <Moon size={20} color={theme === 'dark' ? '#00C896' : t.themeInactiveIcon} />
                <Text style={[styles.themeOptionTxt, { color: t.themeInactiveTxt }, theme === 'dark' && styles.themeOptionTxtActive]}>Dark</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.themeOption, { backgroundColor: t.themeOptionBg, borderColor: t.themeOptionBorder }, theme === 'system' && styles.themeOptionActive]}
                onPress={() => handleThemeChange('system')}
              >
                <Monitor size={20} color={theme === 'system' ? '#00C896' : t.themeInactiveIcon} />
                <Text style={[styles.themeOptionTxt, { color: t.themeInactiveTxt }, theme === 'system' && styles.themeOptionTxtActive]}>System</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* General */}
          <View style={[styles.card, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
            <Text style={[styles.cardLabel, { color: t.labelColor }]}>ACCOUNT</Text>
            <TouchableOpacity style={styles.settingRow} onPress={() => setShowEditProfile(true)}>
              <UserPen size={18} color={t.iconColor} />
              <Text style={[styles.settingRowTxt, { color: t.infoTextColor }]}>Edit Profile</Text>
              <ChevronRight size={16} color={t.valueColor} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.settingRow, { borderTopWidth: 1, borderTopColor: t.dividerColor }]} onPress={() => setShowDocuments(true)}>
              <FileText size={18} color={t.iconColor} />
              <Text style={[styles.settingRowTxt, { color: t.infoTextColor }]}>My Documents</Text>
              <ChevronRight size={16} color={t.valueColor} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.settingRow, { borderTopWidth: 1, borderTopColor: t.dividerColor }]} onPress={() => setShowCloud(true)}>
              <Cloud size={18} color={t.iconColor} />
              <Text style={[styles.settingRowTxt, { color: t.infoTextColor }]}>Cloud Storage</Text>
              <ChevronRight size={16} color={t.valueColor} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.settingRow, { borderTopWidth: 1, borderTopColor: t.dividerColor }]}>
              <Bell size={18} color={t.iconColor} />
              <Text style={[styles.settingRowTxt, { color: t.infoTextColor }]}>Notifications</Text>
              <Text style={[styles.settingRowValue, { color: t.valueColor }]}>Coming soon</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.settingRow, { borderTopWidth: 1, borderTopColor: t.dividerColor }]}>
              <Shield size={18} color={t.iconColor} />
              <Text style={[styles.settingRowTxt, { color: t.infoTextColor }]}>Privacy & Security</Text>
              <Text style={[styles.settingRowValue, { color: t.valueColor }]}>Coming soon</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.settingRow, { borderTopWidth: 1, borderTopColor: t.dividerColor }]} onPress={() => setShowSupport(true)}>
              <HelpCircle size={18} color={t.iconColor} />
              <Text style={[styles.settingRowTxt, { color: t.infoTextColor }]}>Help & Support</Text>
              <ChevronRight size={16} color={t.valueColor} />
            </TouchableOpacity>
          </View>

          {/* About */}
          <View style={[styles.card, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
            <Text style={[styles.cardLabel, { color: t.labelColor }]}>ABOUT</Text>
            <View style={styles.settingRow}>
              <Info size={18} color={t.iconColor} />
              <Text style={[styles.settingRowTxt, { color: t.infoTextColor }]}>App Version</Text>
              <Text style={[styles.settingRowValue, { color: t.valueColor }]}>1.0.0</Text>
            </View>
            <View style={[styles.settingRow, { borderTopWidth: 1, borderTopColor: t.dividerColor }]}>
              <Text style={[styles.settingRowTxt, { marginLeft: 30, color: t.infoTextColor }]}>Made with ❤️ by TripWise</Text>
            </View>
          </View>

          {/* Sign Out */}
          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
            <LogOut size={18} color="#F87171" />
            <Text style={styles.signOutTxt}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Modals */}
        <Modal visible={showEditProfile} animationType="slide" presentationStyle="fullScreen">
          <EditProfileScreen onClose={() => setShowEditProfile(false)} />
        </Modal>
        <Modal visible={showDocuments} animationType="slide" presentationStyle="fullScreen">
          <PersonalDocumentsScreen onClose={() => setShowDocuments(false)} />
        </Modal>
        <Modal visible={showSupport} animationType="slide" presentationStyle="fullScreen">
          <SupportScreen onClose={() => setShowSupport(false)} />
        </Modal>
        <Modal visible={showCloud} animationType="slide" presentationStyle="fullScreen">
          <ConnectDriveScreen onClose={() => setShowCloud(false)} />
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 48 },
  avatarSection: { alignItems: 'center', marginBottom: 32 },
  avatarRing: { width: 100, height: 100, borderRadius: 50, padding: 3, marginBottom: 16, shadowColor: '#00C896', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
  avatarInner: { flex: 1, borderRadius: 47, justifyContent: 'center', alignItems: 'center' },
  avatarTxt: { fontSize: 32, fontWeight: '800', color: '#00C896' },
  name: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: 6 },
  city: { fontSize: 14, fontWeight: '500' },
  card: { borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1 },
  cardLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  infoIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(0,200,150,0.12)', justifyContent: 'center', alignItems: 'center' },
  infoTxt: { fontSize: 15, fontWeight: '500', flex: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100, backgroundColor: 'rgba(0,200,150,0.12)', borderWidth: 1, borderColor: 'rgba(0,200,150,0.25)' },
  chipTxt: { fontSize: 13, color: '#00C896', fontWeight: '600' },
  settingsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 16 },
  settingsBtnLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingsBtnTxt: { fontSize: 16, fontWeight: '600' },
  settingsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  settingsTitle: { fontSize: 20, fontWeight: '700' },
  settingsContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 48 },
  sectionDesc: { fontSize: 13, marginBottom: 14 },
  themeRow: { flexDirection: 'row', gap: 10 },
  themeOption: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, gap: 6 },
  themeOptionActive: { borderColor: '#00C896', backgroundColor: 'rgba(0,200,150,0.08)' },
  themeOptionTxt: { fontSize: 12, fontWeight: '600' },
  themeOptionTxtActive: { color: '#00C896' },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  settingRowTxt: { fontSize: 15, fontWeight: '500', flex: 1 },
  settingRowValue: { fontSize: 13, fontWeight: '500' },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 52, borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(248,113,113,0.4)', backgroundColor: 'rgba(248,113,113,0.06)', marginTop: 8 },
  signOutTxt: { fontSize: 16, fontWeight: '700', color: '#F87171' },
});
