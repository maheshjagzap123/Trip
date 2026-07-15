import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../stores/authStore';
import { LogOut, Mail, MapPin } from 'lucide-react-native';

export function ProfileScreen() {
  const { profile, user, signOut } = useAuthStore();

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      if (window.confirm('Are you sure you want to sign out?')) signOut();
    } else {
      Alert.alert('Sign Out', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]);
    }
  };

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

          {/* Sign out */}
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
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 52, borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(248,113,113,0.4)', backgroundColor: 'rgba(248,113,113,0.06)', marginTop: 8 },
  signOutTxt: { fontSize: 16, fontWeight: '700', color: '#F87171' },
});
