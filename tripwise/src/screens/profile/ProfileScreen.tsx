import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Modal, Appearance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import type { ThemeMode } from '../../stores/themeStore';
import { Mail, MapPin, Settings, Moon, Sun, Monitor, ChevronRight, LogOut, Info, Bell, Shield, ArrowLeft } from 'lucide-react-native';

export function ProfileScreen() {
  const { profile, user, signOut } = useAuthStore();
  const [showSettings, setShowSettings] = useState(false);

  const initials = `${profile?.first_name?.[0] || ''}${profile?.last_name?.[0] || ''}`.toUpperCase() || '?';

  return (
    <LinearGradient colors={['#0F172A', '#1E3A5F']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <LinearGradient colors={['#00C896', '#0EA5E9']} style={styles.avatarRing}>
              <View style={styles.avatarInner}>
                <Text style={styles.avatarTxt}>{initials}</Text>
              </View>
            </LinearGradient>
            <Text style={styles.name}>{profile?.display_name || 'Traveler'}</Text>
            {profile?.home_city && <Text style={styles.city}>📍 {profile.home_city}</Text>}
          </View>

          {/* Info card */}
          <View style={styles.card}>
            {user?.email && (
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}><Mail size={16} color="#00C896" /></View>
                <Text style={styles.infoTxt}>{user.email}</Text>
              </View>
            )}
            {profile?.home_city && (
              <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }]}>
                <View style={styles.infoIcon}><MapPin size={16} color="#00C896" /></View>
                <Text style={styles.infoTxt}>{profile.home_city}</Text>
              </View>
            )}
          </View>

          {/* Interests */}
          {(profile?.travel_interests?.length ?? 0) > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>TRAVEL INTERESTS</Text>
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
          <TouchableOpacity style={styles.settingsBtn} onPress={() => setShowSettings(true)} activeOpacity={0.8}>
            <View style={styles.settingsBtnLeft}>
              <Settings size={20} color="#00C896" />
              <Text style={styles.settingsBtnTxt}>Settings</Text>
            </View>
            <ChevronRight size={18} color="rgba(255,255,255,0.4)" />
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
    <LinearGradient colors={['#0F172A', '#1E3A5F']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.settingsHeader}>
          <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
            <ArrowLeft size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.settingsTitle}>Settings</Text>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView contentContainerStyle={styles.settingsContent}>
          {/* Theme Section */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>APPEARANCE</Text>
            <Text style={styles.sectionDesc}>Choose your preferred theme</Text>
            <View style={styles.themeRow}>
              <TouchableOpacity
                style={[styles.themeOption, theme === 'light' && styles.themeOptionActive]}
                onPress={() => handleThemeChange('light')}
              >
                <Sun size={20} color={theme === 'light' ? '#00C896' : 'rgba(255,255,255,0.4)'} />
                <Text style={[styles.themeOptionTxt, theme === 'light' && styles.themeOptionTxtActive]}>Light</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.themeOption, theme === 'dark' && styles.themeOptionActive]}
                onPress={() => handleThemeChange('dark')}
              >
                <Moon size={20} color={theme === 'dark' ? '#00C896' : 'rgba(255,255,255,0.4)'} />
                <Text style={[styles.themeOptionTxt, theme === 'dark' && styles.themeOptionTxtActive]}>Dark</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.themeOption, theme === 'system' && styles.themeOptionActive]}
                onPress={() => handleThemeChange('system')}
              >
                <Monitor size={20} color={theme === 'system' ? '#00C896' : 'rgba(255,255,255,0.4)'} />
                <Text style={[styles.themeOptionTxt, theme === 'system' && styles.themeOptionTxtActive]}>System</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Other Settings (placeholders for future) */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>GENERAL</Text>
            <TouchableOpacity style={styles.settingRow}>
              <Bell size={18} color="rgba(255,255,255,0.5)" />
              <Text style={styles.settingRowTxt}>Notifications</Text>
              <Text style={styles.settingRowValue}>Coming soon</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.settingRow, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }]}>
              <Shield size={18} color="rgba(255,255,255,0.5)" />
              <Text style={styles.settingRowTxt}>Privacy & Security</Text>
              <Text style={styles.settingRowValue}>Coming soon</Text>
            </TouchableOpacity>
          </View>

          {/* About */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>ABOUT</Text>
            <View style={styles.settingRow}>
              <Info size={18} color="rgba(255,255,255,0.5)" />
              <Text style={styles.settingRowTxt}>App Version</Text>
              <Text style={styles.settingRowValue}>1.0.0</Text>
            </View>
            <View style={[styles.settingRow, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }]}>
              <Text style={[styles.settingRowTxt, { marginLeft: 30 }]}>Made with ❤️ by TripWise</Text>
            </View>
          </View>

          {/* Sign Out */}
          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
            <LogOut size={18} color="#F87171" />
            <Text style={styles.signOutTxt}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
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
  avatarInner: { flex: 1, borderRadius: 47, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' },
  avatarTxt: { fontSize: 32, fontWeight: '800', color: '#00C896' },
  name: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5, marginBottom: 6 },
  city: { fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  card: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cardLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  infoIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(0,200,150,0.12)', justifyContent: 'center', alignItems: 'center' },
  infoTxt: { fontSize: 15, color: 'rgba(255,255,255,0.75)', fontWeight: '500', flex: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100, backgroundColor: 'rgba(0,200,150,0.12)', borderWidth: 1, borderColor: 'rgba(0,200,150,0.25)' },
  chipTxt: { fontSize: 13, color: '#00C896', fontWeight: '600' },

  // Settings button on profile
  settingsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 16 },
  settingsBtnLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingsBtnTxt: { fontSize: 16, fontWeight: '600', color: '#fff' },

  // Settings page
  settingsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  settingsTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  settingsContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 48 },
  sectionDesc: { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 14 },
  themeRow: { flexDirection: 'row', gap: 10 },
  themeOption: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', gap: 6 },
  themeOptionActive: { borderColor: '#00C896', backgroundColor: 'rgba(0,200,150,0.08)' },
  themeOptionTxt: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.4)' },
  themeOptionTxtActive: { color: '#00C896' },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  settingRowTxt: { fontSize: 15, color: 'rgba(255,255,255,0.75)', fontWeight: '500', flex: 1 },
  settingRowValue: { fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: '500' },

  // Sign out
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 52, borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(248,113,113,0.4)', backgroundColor: 'rgba(248,113,113,0.06)', marginTop: 8 },
  signOutTxt: { fontSize: 16, fontWeight: '700', color: '#F87171' },
});
