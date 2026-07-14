import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useThemeColors, typography, spacing, borderRadius } from '../../theme';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

const TRAVEL_INTERESTS = [
  'Adventure', 'Beach', 'Mountains', 'Food', 'Culture',
  'Wildlife', 'Roadtrip', 'Pilgrimage', 'Shopping', 'Nightlife',
];

const TRIP_STYLES = ['Solo', 'Friends', 'Family', 'Couple', 'Office'];

export function CompleteProfileScreen() {
  const colors = useThemeColors();
  const { user, fetchProfile } = useAuthStore();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [homeCity, setHomeCity] = useState('');
  const [gender, setGender] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSave = async () => {
    if (!firstName.trim()) {
      Alert.alert('Error', 'Please enter your first name.');
      return;
    }

    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          display_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
          home_city: homeCity.trim() || null,
          gender: gender || null,
          travel_interests: selectedInterests,
          profile_completed: true,
        })
        .eq('id', user.id);

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      await fetchProfile();
    } catch (err) {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={[typography.displayMedium, { color: colors.textPrimary }]}>
          Tell us about you
        </Text>
        <Text style={[typography.bodyLarge, { color: colors.textSecondary, marginTop: spacing.xs }]}>
          This helps us personalize your experience
        </Text>

        {/* Name Row */}
        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={[typography.labelMedium, { color: colors.textPrimary, marginBottom: spacing.xs }]}>
              First name *
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="First name"
              placeholderTextColor={colors.textTertiary}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              accessibilityLabel="First name"
            />
          </View>
          <View style={styles.halfField}>
            <Text style={[typography.labelMedium, { color: colors.textPrimary, marginBottom: spacing.xs }]}>
              Last name
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Last name"
              placeholderTextColor={colors.textTertiary}
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              accessibilityLabel="Last name"
            />
          </View>
        </View>

        {/* City */}
        <View style={styles.field}>
          <Text style={[typography.labelMedium, { color: colors.textPrimary, marginBottom: spacing.xs }]}>
            Home city
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.textPrimary }]}
            placeholder="Where are you based?"
            placeholderTextColor={colors.textTertiary}
            value={homeCity}
            onChangeText={setHomeCity}
            autoCapitalize="words"
            accessibilityLabel="Home city"
          />
        </View>

        {/* Gender */}
        <View style={styles.field}>
          <Text style={[typography.labelMedium, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
            Gender
          </Text>
          <View style={styles.chipRow}>
            {['Male', 'Female', 'Other'].map((g) => (
              <TouchableOpacity
                key={g}
                style={[
                  styles.chip,
                  {
                    backgroundColor: gender === g ? colors.primary : colors.inputBackground,
                    borderColor: gender === g ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setGender(g)}
                accessibilityRole="radio"
                accessibilityState={{ selected: gender === g }}
              >
                <Text style={[
                  typography.labelSmall,
                  { color: gender === g ? colors.textInverse : colors.textPrimary },
                ]}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Travel Interests */}
        <View style={styles.field}>
          <Text style={[typography.labelMedium, { color: colors.textPrimary, marginBottom: spacing.xs }]}>
            Travel interests
          </Text>
          <Text style={[typography.bodySmall, { color: colors.textTertiary, marginBottom: spacing.sm }]}>
            Pick what excites you (select any)
          </Text>
          <View style={styles.chipRow}>
            {TRAVEL_INTERESTS.map((interest) => {
              const selected = selectedInterests.includes(interest);
              return (
                <TouchableOpacity
                  key={interest}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selected ? colors.primary : colors.inputBackground,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => toggleInterest(interest)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                >
                  <Text style={[
                    typography.labelSmall,
                    { color: selected ? colors.textInverse : colors.textPrimary },
                  ]}>
                    {interest}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary, opacity: isLoading ? 0.6 : 1 }]}
          onPress={handleSave}
          disabled={isLoading}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Save and continue"
        >
          <Text style={[typography.labelLarge, { color: colors.textInverse }]}>
            {isLoading ? 'Saving...' : 'Save & Continue'}
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
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  halfField: {
    flex: 1,
  },
  field: {
    marginTop: spacing.lg,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  button: {
    height: 52,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
});
