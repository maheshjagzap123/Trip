import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, Alert, Platform, ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useThemeColors, typography, spacing, borderRadius } from '../../theme';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { ArrowLeft, Camera, X } from 'lucide-react-native';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';

const TRAVEL_INTERESTS = [
  'Adventure', 'Beach', 'Mountains', 'Food', 'Culture',
  'Wildlife', 'Roadtrip', 'Pilgrimage', 'Shopping', 'Nightlife',
];

interface Props {
  onClose: () => void;
}

export function EditProfileScreen({ onClose }: Props) {
  const colors = useThemeColors();
  const { user, profile, fetchProfile } = useAuthStore();

  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [homeCity, setHomeCity] = useState(profile?.home_city || '');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(profile?.travel_interests || []);
  const [avatarUri, setAvatarUri] = useState<string | null>(profile?.avatar_url || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const showAlert = (title: string, msg: string) => {
    Platform.OS === 'web' ? window.alert(`${title}: ${msg}`) : Alert.alert(title, msg);
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission needed', 'Allow photo access to set a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets.length) return;

    const asset = result.assets[0];
    setIsUploading(true);

    try {
      if (!user) return;

      const ext = asset.uri.split('.').pop() || 'jpg';
      const path = `${user.id}/avatar.${ext}`;

      // Read and upload
      let fileData: ArrayBuffer;
      if (Platform.OS === 'web') {
        const response = await fetch(asset.uri);
        fileData = await response.arrayBuffer();
      } else {
        const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: 'base64' });
        fileData = decode(base64);
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, fileData, { contentType: asset.mimeType || 'image/jpeg', upsert: true });

      if (uploadError) { showAlert('Error', uploadError.message); return; }

      // Get public URL
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = urlData.publicUrl + '?t=' + Date.now(); // cache bust

      // Update profile
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      setAvatarUri(publicUrl);
    } catch (err: any) {
      showAlert('Error', err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!firstName.trim()) { showAlert('Error', 'First name is required'); return; }
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        display_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        home_city: homeCity.trim() || null,
        travel_interests: selectedInterests,
      }).eq('id', user.id);

      if (error) { showAlert('Error', error.message); return; }

      await fetchProfile();
      onClose();
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onClose}><ArrowLeft color={colors.textPrimary} size={22} /></TouchableOpacity>
        <Text style={[typography.h3, { color: colors.textPrimary }]}>Edit Profile</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarWrap} onPress={handlePickAvatar} disabled={isUploading}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImg} contentFit="cover" />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primaryLight }]}>
                <Text style={{ fontSize: 28, fontWeight: '800', color: colors.primary }}>{initials}</Text>
              </View>
            )}
            <View style={[styles.cameraIcon, { backgroundColor: colors.primary }]}>
              {isUploading ? <ActivityIndicator size="small" color="#fff" /> : <Camera size={14} color="#fff" />}
            </View>
          </TouchableOpacity>
          <Text style={[typography.caption, { color: colors.textTertiary, marginTop: spacing.sm }]}>Tap to change photo</Text>
        </View>

        {/* Name */}
        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>First name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.textPrimary }]}
              value={firstName} onChangeText={setFirstName} autoCapitalize="words"
            />
          </View>
          <View style={styles.halfField}>
            <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>Last name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.textPrimary }]}
              value={lastName} onChangeText={setLastName} autoCapitalize="words"
            />
          </View>
        </View>

        {/* City */}
        <View style={styles.field}>
          <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>Home city</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.textPrimary }]}
            value={homeCity} onChangeText={setHomeCity} autoCapitalize="words"
          />
        </View>

        {/* Interests */}
        <View style={styles.field}>
          <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>Travel interests</Text>
          <View style={styles.chipRow}>
            {TRAVEL_INTERESTS.map((interest) => {
              const selected = selectedInterests.includes(interest);
              return (
                <TouchableOpacity
                  key={interest}
                  style={[styles.chip, { backgroundColor: selected ? colors.primary : colors.inputBackground, borderColor: selected ? colors.primary : colors.border }]}
                  onPress={() => toggleInterest(interest)}
                >
                  <Text style={[typography.labelSmall, { color: selected ? colors.textInverse : colors.textPrimary }]}>{interest}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: isSaving ? 0.6 : 1 }]}
          onPress={handleSave} disabled={isSaving}
        >
          <Text style={[typography.labelLarge, { color: '#fff' }]}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  avatarSection: { alignItems: 'center', marginBottom: spacing.xl },
  avatarWrap: { width: 96, height: 96, borderRadius: 48, overflow: 'hidden', position: 'relative' },
  avatarImg: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center' },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  row: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  halfField: { flex: 1 },
  field: { marginBottom: spacing.lg },
  input: { height: 48, borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, fontSize: 16, marginTop: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1 },
  saveBtn: { height: 52, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center', marginTop: spacing.md },
});
