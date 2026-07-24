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
  '🍽️ Food', '💼 Business', '👨‍👩‍👧 Family', '✈️ Travel',
  '🛍️ Shopping', '💡 Bills', '🎬 Entertainment', '🏠 Rent',
  '⛽ Fuel', '💊 Medical',
];
const GENDERS = ['Male', 'Female', 'Other'];
const { width: W } = Dimensions.get('window');

export function CompleteProfileScreen() {
  const { user, fetchProfile } = useAuthStore();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [homeCity, setHomeCity] = useState('');
  const [gender, setGender] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
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

  const validatePhone = (p: string) => {
    const digits = p.replace(/\D/g, '');
    if (!digits) return 'Mobile number is required';
    if (digits.length !== 10) return 'Enter a valid 10-digit mobile number';
    if (!/^[6-9]/.test(digits)) return 'Enter a valid Indian mobile number';
    return '';
  };

  const handleSave = async () => {
    if (!firstName.trim()) { Alert.alert('Required', 'Please enter your first name.'); return; }
    const pErr = validatePhone(phoneNumber);
    if (pErr) { setPhoneError(pErr); return; }
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
        phone_number: phoneNumber.replace(/\D/g, ''),
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
    <LinearGradient colors={['#080C16', '#0D1320', '#111827']} style={styles.gradient} start={{ x: 0, y: 0 }} end={{ x: 0.3, y: 1 }}>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* Header */}
            <View style={styles.header}>
              <LinearGradient colors={['#5B8CFF', '#7B61FF']} style={styles.headerIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={{ fontSize: 30 }}>👤</Text>
              </LinearGradient>
              <Text style={styles.title}>Tell us about you</Text>
              <Text style={styles.subtitle}>Personalize your ExpenseX experience</Text>
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

            {/* Phone */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>MOBILE NUMBER *</Text>
              <View style={[inputStyle('phone'), { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }]}>
                <Text style={{ color: 'rgba(255,255,255,0.5)', marginRight: 6, fontSize: 15 }}>+91</Text>
                <TextInput
                  style={{ flex: 1, height: 52, fontSize: 15, color: '#FFFFFF', fontWeight: '500' }}
                  placeholder="9876543210"
                  placeholderTextColor="rgba(255,255,255,0.28)"
                  value={phoneNumber}
                  onChangeText={(t) => { setPhoneNumber(t); if (phoneError) setPhoneError(''); }}
                  keyboardType="phone-pad"
                  maxLength={10}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField('')}
                />
              </View>
              {phoneError ? (
                <Text style={{ color: '#FB7185', fontSize: 12, marginTop: 6 }}>{phoneError}</Text>
              ) : null}
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
              <Text style={styles.sectionLabel}>PREFERRED CATEGORIES</Text>
              <Text style={styles.sectionHint}>Pick what you spend on most</Text>
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
              <LinearGradient colors={['#5B8CFF', '#7B61FF']} style={styles.saveBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
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
    shadowColor: '#5B8CFF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 18, elevation: 12,
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
  inputFocused: { borderColor: '#5B8CFF', backgroundColor: 'rgba(91,140,255,0.08)' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)',
  },
  chipActive: { backgroundColor: 'rgba(91,140,255,0.15)', borderColor: '#5B8CFF' },
  chipTxt: { fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },
  chipTxtActive: { color: '#5B8CFF' },
  saveBtnWrap: {
    marginTop: 8, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#5B8CFF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 8,
  },
  saveBtn: { height: 58, justifyContent: 'center', alignItems: 'center' },
  saveTxt: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3 },
});
