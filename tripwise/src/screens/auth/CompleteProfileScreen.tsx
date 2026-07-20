import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

const INTERESTS = [
  '🏔️ Adventure', '🏖️ Beach', '⛰️ Mountains', '🍜 Food',
  '🎭 Culture', '🦁 Wildlife', '🚗 Roadtrip', '🛕 Pilgrimage',
  '🛍️ Shopping', '🎉 Nightlife',
];
const GENDERS = ['Male', 'Female', 'Other'];
const { width: W } = Dimensions.get('window');

export function CompleteProfileScreen() {
  const { user, fetchProfile } = useAuthStore();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [homeCity, setHomeCity] = useState('');
  const [gender, setGender] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState('');

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const toggleInterest = (i: string) =>
    setSelectedInterests((p) => p.includes(i) ? p.filter((x) => x !== i) : [...p, i]);

  const handleSave = async () => {
    if (!firstName.trim()) { Alert.alert('Required', 'Please enter your first name.'); return; }
    if (!user) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.from('profiles').update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        display_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        home_city: homeCity.trim() || null,
        gender: gender || null,
        travel_interests: selectedInterests,
        profile_completed: true,
      }).eq('id', user.id);
      if (error) { Alert.alert('Error', error.message); return; }
      await fetchProfile();
    } catch {
      Alert.alert('Error', 'Failed to save profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = (field: string) => [
    styles.input,
    focusedField === field && styles.inputFocused,
  ];

  return (
    <LinearGradient colors={['#080E1A', '#0F172A', '#1A2744']} style={styles.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* Header */}
            <View style={styles.header}>
              <LinearGradient colors={['#3B82F6', '#8B5CF6']} style={styles.headerIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={{ fontSize: 30 }}>👤</Text>
              </LinearGradient>
              <Text style={styles.title}>Tell us about you</Text>
              <Text style={styles.subtitle}>Personalize your TripWise experience</Text>
            </View>

            {/* Name */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>YOUR NAME</Text>
              <View style={styles.row}>
                <TextInput
                  style={[inputStyle('first'), { flex: 1 }]}
                  placeholder="First name *"
                  placeholderTextColor="rgba(255,255,255,0.28)"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  onFocus={() => setFocusedField('first')}
                  onBlur={() => setFocusedField('')}
                />
                <TextInput
                  style={[inputStyle('last'), { flex: 1 }]}
                  placeholder="Last name"
                  placeholderTextColor="rgba(255,255,255,0.28)"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  onFocus={() => setFocusedField('last')}
                  onBlur={() => setFocusedField('')}
                />
              </View>
            </View>

            {/* City */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>HOME CITY</Text>
              <TextInput
                style={inputStyle('city')}
                placeholder="Where are you based?"
                placeholderTextColor="rgba(255,255,255,0.28)"
                value={homeCity}
                onChangeText={setHomeCity}
                autoCapitalize="words"
                onFocus={() => setFocusedField('city')}
                onBlur={() => setFocusedField('')}
              />
            </View>

            {/* Gender */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>GENDER</Text>
              <View style={styles.chipRow}>
                {GENDERS.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.chip, gender === g && styles.chipActive]}
                    onPress={() => setGender(g)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipTxt, gender === g && styles.chipTxtActive]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Interests */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>TRAVEL INTERESTS</Text>
              <Text style={styles.sectionHint}>Pick what excites you</Text>
              <View style={styles.chipRow}>
                {INTERESTS.map((i) => {
                  const sel = selectedInterests.includes(i);
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[styles.chip, sel && styles.chipActive]}
                      onPress={() => toggleInterest(i)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.chipTxt, sel && styles.chipTxtActive]}>{i}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Save */}
            <TouchableOpacity onPress={handleSave} disabled={isLoading} activeOpacity={0.88} style={styles.saveBtnWrap}>
              <LinearGradient colors={['#3B82F6', '#6366F1']} style={styles.saveBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.saveTxt}>{isLoading ? 'Saving…' : 'Save & Continue →'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 48 },
  header: { alignItems: 'center', marginBottom: 36 },
  headerIcon: {
    width: 76, height: 76, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 18,
    shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 18, elevation: 12,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.8, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.45)', textAlign: 'center' },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, marginBottom: 10 },
  sectionHint: { fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 10, marginTop: -4 },
  row: { flexDirection: 'row', gap: 12 },
  input: {
    height: 52, backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14, paddingHorizontal: 16, fontSize: 15, color: '#FFFFFF',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', fontWeight: '500',
  },
  inputFocused: { borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.08)' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)',
  },
  chipActive: { backgroundColor: 'rgba(59,130,246,0.2)', borderColor: '#3B82F6' },
  chipTxt: { fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },
  chipTxtActive: { color: '#60A5FA' },
  saveBtnWrap: {
    marginTop: 8, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 8,
  },
  saveBtn: { height: 58, justifyContent: 'center', alignItems: 'center' },
  saveTxt: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3 },
});
