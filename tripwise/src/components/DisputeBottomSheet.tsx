import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Modal, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { useThemeColors, typography, spacing, borderRadius } from '../theme';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { X, Image as ImageIcon } from 'lucide-react-native';

interface Props {
  visible: boolean;
  settlementId: string;
  amount: number;
  payerName: string;
  onSubmit: (reason: string, screenshotUrl?: string) => Promise<void>;
  onClose: () => void;
}

export function DisputeBottomSheet({ visible, settlementId, amount, payerName, onSubmit, onClose }: Props) {
  const colors = useThemeColors();
  const { user } = useAuthStore();
  const [reason, setReason] = useState('');
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reasonError, setReasonError] = useState('');

  const handlePickScreenshot = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to attach a screenshot.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (result.canceled || !result.assets.length) return;
    setScreenshotUri(result.assets[0].uri);
  };

  const uploadScreenshot = async (): Promise<string | undefined> => {
    if (!screenshotUri || !user) return undefined;
    setIsUploading(true);
    try {
      const ext = screenshotUri.split('.').pop() || 'jpg';
      const path = `disputes/${settlementId}.${ext}`;
      let fileData: ArrayBuffer;
      if (Platform.OS === 'web') {
        const res = await fetch(screenshotUri);
        fileData = await res.arrayBuffer();
      } else {
        const base64 = await FileSystem.readAsStringAsync(screenshotUri, { encoding: 'base64' });
        fileData = decode(base64);
      }
      const { error } = await supabase.storage
        .from('dispute-screenshots')
        .upload(path, fileData, { contentType: 'image/jpeg', upsert: true });
      if (error) throw new Error(error.message);
      const { data } = supabase.storage.from('dispute-screenshots').getPublicUrl(path);
      return data.publicUrl;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    const trimmed = reason.trim();
    if (trimmed.length < 10) {
      setReasonError('Please describe the issue (min 10 characters)');
      return;
    }
    setReasonError('');
    setIsSubmitting(true);
    try {
      const screenshotUrl = await uploadScreenshot();
      await onSubmit(trimmed, screenshotUrl);
      setReason('');
      setScreenshotUri(null);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit dispute');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.cardBackground }]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[typography.h3, { color: colors.textPrimary }]}>Dispute Payment</Text>
              <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>
                {payerName} claims they paid you ₹{amount}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Reason */}
          <Text style={[typography.labelMedium, { color: colors.textPrimary, marginBottom: spacing.xs }]}>
            Reason <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.reasonInput,
              {
                backgroundColor: colors.inputBackground,
                borderColor: reasonError ? colors.error : colors.border,
                color: colors.textPrimary,
              },
            ]}
            placeholder="Describe why you didn't receive this payment..."
            placeholderTextColor={colors.textTertiary}
            value={reason}
            onChangeText={(t) => { setReason(t); if (reasonError) setReasonError(''); }}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          {reasonError ? (
            <Text style={[typography.caption, { color: colors.error, marginTop: spacing.xs }]}>
              {reasonError}
            </Text>
          ) : null}

          {/* Screenshot */}
          <TouchableOpacity
            style={[styles.screenshotBtn, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}
            onPress={handlePickScreenshot}
            disabled={isUploading}
          >
            <ImageIcon size={16} color={colors.textSecondary} />
            <Text style={[typography.bodySmall, { color: colors.textSecondary, marginLeft: spacing.xs }]}>
              {screenshotUri ? '✓ Screenshot attached' : 'Attach screenshot (optional)'}
            </Text>
          </TouchableOpacity>

          {/* Submit */}
          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: colors.error, opacity: isSubmitting || isUploading ? 0.6 : 1 },
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting || isUploading}
          >
            {isSubmitting || isUploading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={[typography.labelLarge, { color: '#fff' }]}>Submit Dispute</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  reasonInput: {
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 15,
    minHeight: 100,
    marginBottom: spacing.sm,
  },
  screenshotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  submitBtn: {
    height: 52,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
