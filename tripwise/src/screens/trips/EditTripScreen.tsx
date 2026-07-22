import React, { useState, useEffect } from 'react';
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
import { useThemeColors, typography, spacing, borderRadius } from '../../theme';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Calendar } from 'lucide-react-native';

const TRIP_TYPES = ['Friends', 'Family', 'Couple', 'Solo', 'Office', 'Adventure', 'Pilgrimage'];

interface EditTripProps {
  trip: {
    id: string;
    trip_name: string;
    destination: string | null;
    description: string | null;
    start_date: string;
    end_date: string;
    trip_type: string | null;
    budget_amount: number | null;
    budget_currency: string;
  };
  onClose: () => void;
  onSaved: () => void;
}

export function EditTripScreen({ trip, onClose, onSaved }: EditTripProps) {
  const colors = useThemeColors();
  const [tripName, setTripName] = useState(trip.trip_name);
  const [destination, setDestination] = useState(trip.destination || '');
  const [startDate, setStartDate] = useState(trip.start_date);
  const [endDate, setEndDate] = useState(trip.end_date);
  const [tripType, setTripType] = useState(trip.trip_type || 'Friends');
  const [description, setDescription] = useState(trip.description || '');
  const [isLoading, setIsLoading] = useState(false);

  // Handle Android hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => backHandler.remove();
  }, [onClose]);

  const showAlert = (title: string, message: string) => {
    Platform.OS === 'web' ? window.alert(`${title}: ${message}`) : Alert.alert(title, message);
  };

  const handleSave = async () => {
    if (!tripName.trim()) {
      showAlert('Error', 'Trip name is required.');
      return;
    }
    if (!startDate.trim() || !endDate.trim()) {
      showAlert('Error', 'Start and end dates are required.');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      showAlert('Error', 'End date must be after start date.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('trips')
        .update({
          trip_name: tripName.trim(),
          destination: destination.trim() || null,
          description: description.trim() || null,
          start_date: startDate.trim(),
          end_date: endDate.trim(),
          trip_type: tripType,
          budget_amount: null,
        })
        .eq('id', trip.id);

      if (error) {
        showAlert('Error', error.message);
      } else {
        onSaved();
        onClose();
      }
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to update trip.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onClose} accessibilityLabel="Cancel">
          <ArrowLeft color={colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={[typography.h3, { color: colors.textPrimary }]}>Edit Trip</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Trip Name */}
        <View style={styles.field}>
          <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>Trip name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.textPrimary }]}
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
            value={destination}
            onChangeText={setDestination}
            accessibilityLabel="Destination"
          />
        </View>

        {/* Dates */}
        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>Start date *</Text>
            <DatePickerField
              value={startDate}
              onChange={setStartDate}
              colors={colors}
            />
          </View>
          <View style={styles.halfField}>
            <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>End date *</Text>
            <DatePickerField
              value={endDate}
              onChange={setEndDate}
              colors={colors}
              minDate={startDate}
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
                style={[styles.chip, { backgroundColor: tripType === type ? colors.primary : colors.inputBackground, borderColor: tripType === type ? colors.primary : colors.border }]}
                onPress={() => setTripType(type)}
              >
                <Text style={[typography.labelSmall, { color: tripType === type ? colors.textInverse : colors.textPrimary }]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>Description</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.textPrimary }]}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            accessibilityLabel="Description"
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary, opacity: isLoading ? 0.6 : 1 }]}
          onPress={handleSave}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={[typography.labelLarge, { color: colors.textInverse }]}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── DatePickerField Component ────────────────────────────────────────────────
function DatePickerField({ value, onChange, colors, minDate }: {
  value: string;
  onChange: (date: string) => void;
  colors: any;
  minDate?: string;
}) {
  if (Platform.OS === 'web') {
    return (
      <View style={[dpStyles.wrap, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
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

  return (
    <View style={[dpStyles.wrap, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
      <Calendar size={16} color={colors.textTertiary} />
      <TextInput
        style={[dpStyles.input, { color: colors.textPrimary }]}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.textTertiary}
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        maxLength={10}
      />
    </View>
  );
}

const dpStyles = StyleSheet.create({
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  field: { marginBottom: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  halfField: { flex: 1 },
  input: { height: 48, borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, fontSize: 16, marginTop: spacing.xs },
  textArea: { minHeight: 80, borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 16, marginTop: spacing.xs, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1 },
  saveButton: { height: 52, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center', marginTop: spacing.md },
});
