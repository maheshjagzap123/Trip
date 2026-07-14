import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { AuthStackParamList } from '../../navigation/types';
import { useThemeColors, typography, spacing, borderRadius } from '../../theme';
import { supabase } from '../../lib/supabase';

type RouteProps = RouteProp<AuthStackParamList, 'OtpVerification'>;

export function OtpVerificationScreen() {
  const route = useRoute<RouteProps>();
  const colors = useThemeColors();
  const { identifier, method } = route.params;
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit code.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        ...(method === 'email' ? { email: identifier } : { phone: identifier }),
        token: otp,
        type: method === 'email' ? 'email' : 'sms',
      });

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      // Auth state change listener in authStore will handle navigation
    } catch (err) {
      Alert.alert('Error', 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    const { error } = await supabase.auth.signInWithOtp({
      ...(method === 'email' ? { email: identifier } : { phone: identifier }),
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setResendCooldown(60);
      Alert.alert('Sent!', 'A new code has been sent.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[typography.h1, { color: colors.textPrimary }]}>
          Verify your {method}
        </Text>
        <Text style={[typography.bodyLarge, { color: colors.textSecondary, marginTop: spacing.xs }]}>
          Enter the 6-digit code sent to{'\n'}
          <Text style={{ fontWeight: '600' }}>{identifier}</Text>
        </Text>

        {/* OTP Input */}
        <TextInput
          style={[
            styles.otpInput,
            {
              backgroundColor: colors.inputBackground,
              borderColor: colors.border,
              color: colors.textPrimary,
            },
          ]}
          placeholder="000000"
          placeholderTextColor={colors.textTertiary}
          value={otp}
          onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
          textAlign="center"
          accessibilityLabel="OTP code input"
        />

        {/* Verify Button */}
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary, opacity: isLoading ? 0.6 : 1 },
          ]}
          onPress={handleVerify}
          disabled={isLoading}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Verify OTP"
        >
          <Text style={[typography.labelLarge, { color: colors.textInverse }]}>
            {isLoading ? 'Verifying...' : 'Verify'}
          </Text>
        </TouchableOpacity>

        {/* Resend */}
        <TouchableOpacity
          onPress={handleResend}
          disabled={resendCooldown > 0}
          style={styles.resend}
          accessibilityRole="button"
        >
          <Text style={[typography.bodyMedium, { color: resendCooldown > 0 ? colors.textTertiary : colors.primary }]}>
            {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxxl,
    justifyContent: 'center',
  },
  otpInput: {
    height: 64,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: 12,
    marginTop: spacing.xl,
  },
  button: {
    height: 52,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  resend: {
    alignItems: 'center',
    marginTop: spacing.lg,
    padding: spacing.sm,
  },
});
