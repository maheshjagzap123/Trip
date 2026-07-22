import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  SafeAreaView,
  Platform,
  BackHandler,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors, typography, spacing, borderRadius, shadows } from '../../theme';
import { Calendar } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { useTripStore } from '../../stores/tripStore';
import { ArrowLeft, Plus, X, UserPlus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const TRIP_TYPES = ['Friends', 'Family', 'Couple', 'Solo', 'Office', 'Adventure', 'Pilgrimage'];

export function CreateTripScreen({ onClose }: { onClose: () => void }) {
  const colors = useThemeColors();
  const { user } = useAuthStore();
  const { createTrip } = useTripStore();

  const [tripName, setTripName] = useState('');
  const [destination, setDestination] = useState('');
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(tomorrow);
  const [tripType, setTripType] = useState('Friends');
  const [description, setDescription] = useState('');
  const [memberEmails, setMemberEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => backHandler.remove();
  }, [onClose]);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const addMember = () => {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showAlert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    // Don't add yourself
    if (email === user?.email) {
      showAlert('Error', "You'll be added automatically as the trip admin.");
      return;
    }

    // Don't add duplicates
    if (memberEmails.includes(email)) {
      showAlert('Error', 'This email is already added.');
      return;
    }

    setMemberEmails([...memberEmails, email]);
    setEmailInput('');
  };

  const removeMember = (email: string) => {
    setMemberEmails(memberEmails.filter((e) => e !== email));
  };

  const handleCreate = async () => {
    if (!tripName.trim()) {
      showAlert('Error', 'Please enter a trip name.');
      return;
    }
    if (!startDate.trim() || !endDate.trim()) {
      showAlert('Error', 'Please select start and end dates.');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      showAlert('Error', 'End date must be after start date.');
      return;
    }
    if (!user) return;

    setIsLoading(true);
    try {
      await createTrip({
        trip_name: tripName.trim(),
        destination: destination.trim() || null,
        description: description.trim() || null,
        start_date: startDate.trim(),
        end_date: endDate.trim(),
        trip_type: tripType,
        budget_amount: null,
        budget_currency: 'INR',
        created_by: user.id,
      }, memberEmails);

      onClose();
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to create trip.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onClose} accessibilityLabel="Close" hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <ArrowLeft color={colors.textPrimary} size={22} />
        </TouchableOpacity>
        <Text style={[typography.h3, { color: colors.textPrimary }]}>Create Trip</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Trip Name */}
        <View style={styles.field}>
          <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>Trip name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.textPrimary }]}
            placeholder="e.g. Goa with friends"
            placeholderTextColor={colors.textTertiary}
            value={tripName}
            onChangeText={setTripName}
            accessibilityLabel="Trip name"
          />
        </View>

        {/* Destination */}
        <View style={styles.field}>
          <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>Destination</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.textPrimary }]}
            placeholder="e.g. Goa, India"
            placeholderTextColor={colors.textTertiary}
            value={destination}
            onChangeText={setDestination}
            accessibilityLabel="Destination"
          />
        </View>

        {/* Dates Row */}
        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>Start date *</Text>
            <DatePickerInput
              value={startDate}
              onChange={setStartDate}
              placeholder="Select start date"
              colors={colors}
              minDate={new Date().toISOString().split('T')[0]}
            />
          </View>
          <View style={styles.halfField}>
            <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>End date *</Text>
            <DatePickerInput
              value={endDate}
              onChange={setEndDate}
              placeholder="Select end date"
              colors={colors}
              minDate={startDate || new Date().toISOString().split('T')[0]}
            />
          </View>
        </View>

        {/* Trip Type */}
        <View style={styles.field}>
          <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>Trip type</Text>
          <View style={styles.chipRow}>
            {TRIP_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.chip,
                  {
                    backgroundColor: tripType === type ? colors.primary : colors.inputBackground,
                    borderColor: tripType === type ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setTripType(type)}
              >
                <Text style={[typography.labelSmall, { color: tripType === type ? colors.textInverse : colors.textPrimary }]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>Description</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.textPrimary }]}
            placeholder="What's the trip about?"
            placeholderTextColor={colors.textTertiary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            accessibilityLabel="Description"
          />
        </View>

        {/* Invite Members */}
        <View style={styles.field}>
          <View style={styles.sectionHeader}>
            <UserPlus color={colors.primary} size={18} />
            <Text style={[typography.labelMedium, { color: colors.textPrimary, marginLeft: spacing.xs }]}>
              Invite members
            </Text>
          </View>
          <Text style={[typography.bodySmall, { color: colors.textTertiary, marginBottom: spacing.sm }]}>
            They'll receive an invitation to join this trip
          </Text>

          {/* Email Input Row */}
          <View style={styles.emailRow}>
            <TextInput
              style={[styles.emailInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="friend@email.com"
              placeholderTextColor={colors.textTertiary}
              value={emailInput}
              onChangeText={setEmailInput}
              keyboardType="email-address"
              autoCapitalize="none"
              onSubmitEditing={addMember}
              accessibilityLabel="Member email"
            />
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={addMember}
              accessibilityLabel="Add member"
            >
              <Plus color={colors.textInverse} size={20} />
            </TouchableOpacity>
          </View>

          {/* Added Members */}
          {memberEmails.length > 0 && (
            <View style={styles.memberList}>
              {memberEmails.map((email) => (
                <View key={email} style={[styles.memberChip, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                  <Text style={[typography.bodySmall, { color: colors.textPrimary, flex: 1 }]}>
                    {email}
                  </Text>
                  <TouchableOpacity onPress={() => removeMember(email)} accessibilityLabel={`Remove ${email}`}>
                    <X color={colors.textTertiary} size={16} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, { opacity: isLoading ? 0.6 : 1 }]}
          onPress={handleCreate}
          disabled={isLoading}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Create trip"
        >
          <LinearGradient
            colors={['#5B8CFF', '#7B61FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.createButtonGradient}
          >
            <Text style={[typography.buttonLarge, { color: '#fff' }]}>
              {isLoading ? 'Creating...' : 'Create Trip →'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── DatePickerInput Component ────────────────────────────────────────────────
function DatePickerInput({ value, onChange, placeholder, colors, minDate }: {
  value: string;
  onChange: (date: string) => void;
  placeholder: string;
  colors: any;
  minDate?: string;
}) {
  if (Platform.OS === 'web') {
    return (
      <View style={[dateStyles.wrap, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
        <Calendar size={16} color={colors.textTertiary} />
        <input
          type="date"
          value={value}
          min={minDate}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            height: 46,
            border: 'none',
            background: 'transparent',
            color: value ? colors.textPrimary : colors.textTertiary,
            fontSize: 15,
            fontFamily: 'inherit',
            marginLeft: 10,
            outline: 'none',
            cursor: 'pointer',
          }}
        />
      </View>
    );
  }

  // Native: use TextInput with validation hint
  return (
    <View style={[dateStyles.wrap, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
      <Calendar size={16} color={colors.textTertiary} />
      <TextInput
        style={[dateStyles.input, { color: colors.textPrimary }]}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        maxLength={10}
        accessibilityLabel={placeholder}
      />
    </View>
  );
}

const dateStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: 15,
    marginLeft: spacing.xs,
    height: 46,
  },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  field: { marginBottom: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  halfField: { flex: 1 },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    marginTop: spacing.xs,
  },
  textArea: {
    minHeight: 80,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    marginTop: spacing.xs,
    textAlignVertical: 'top',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  emailRow: { flexDirection: 'row', gap: spacing.sm },
  emailInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberList: { marginTop: spacing.sm, gap: spacing.xs },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  createButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginTop: spacing.md,
    shadowColor: '#5B8CFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  createButtonGradient: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
