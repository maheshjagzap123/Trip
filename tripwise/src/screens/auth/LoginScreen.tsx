import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { AuthStackParamList } from '../../navigation/types';
import { useThemeColors, typography, spacing, borderRadius } from '../../theme';
import { supabase } from '../../lib/supabase';
import { ArrowLeft } from 'lucide-react-native';

type NavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;
type AuthMethod = 'email' | 'phone';

export function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  const colors = useThemeColors();
  const [method, setMethod] = useState<AuthMethod>('email');
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async () => {
    const value = identifier.trim();
    if (!value) {
      Alert.alert('Error', `Please enter your ${method === 'email' ? 'email address' : 'phone number'}.`);
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp(
        method === 'email' ? { email: value } : { phone: value }
      );

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      navigation.navigate('OtpVerification', {
        identifier: value,
        method,
      });
    } catch (err) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft color={colors.textPrimary} size={24} />
        </TouchableOpacity>

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[typography.displayMedium, { color: colors.textPrimary }]}>
              Sign in
            </Text>
            <Text style={[typography.bodyLarge, { color: colors.textSecondary, marginTop: spacing.xs }]}>
              We'll send you a verification code
            </Text>
          </View>

          {/* Method Toggle */}
          <View style={[styles.toggle, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                method === 'email' && { backgroundColor: colors.primary },
              ]}
              onPress={() => { setMethod('email'); setIdentifier(''); }}
              accessibilityRole="tab"
              accessibilityState={{ selected: method === 'email' }}
            >
              <Text style={[
                typography.labelMedium,
                { color: method === 'email' ? colors.textInverse : colors.textSecondary },
              ]}>
                Email
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                method === 'phone' && { backgroundColor: colors.primary },
              ]}
              onPress={() => { setMethod('phone'); setIdentifier(''); }}
              accessibilityRole="tab"
              accessibilityState={{ selected: method === 'phone' }}
            >
              <Text style={[
                typography.labelMedium,
                { color: method === 'phone' ? colors.textInverse : colors.textSecondary },
              ]}>
                Phone
              </Text>
            </TouchableOpacity>
          </View>

          {/* Input */}
          <View style={styles.form}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
              placeholder={method === 'email' ? 'you@example.com' : '+91 98765 43210'}
              placeholderTextColor={colors.textTertiary}
              value={identifier}
              onChangeText={setIdentifier}
              keyboardType={method === 'email' ? 'email-address' : 'phone-pad'}
              autoCapitalize="none"
              autoComplete={method === 'email' ? 'email' : 'tel'}
              autoFocus
              editable={!isLoading}
              accessibilityLabel={method === 'email' ? 'Email address' : 'Phone number'}
            />

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: colors.primary, opacity: isLoading ? 0.6 : 1 },
              ]}
              onPress={handleSendOtp}
              disabled={isLoading}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Send verification code"
            >
              <Text style={[typography.labelLarge, { color: colors.textInverse }]}>
                {isLoading ? 'Sending...' : 'Send Code'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={[typography.bodySmall, styles.footer, { color: colors.textTertiary }]}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
      </KeyboardAvoidingView>
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
  backButton: {
    padding: spacing.md,
    marginLeft: spacing.sm,
    alignSelf: 'flex-start',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing.xl,
  },
  toggle: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: 4,
    marginBottom: spacing.lg,
  },
  toggleButton: {
    flex: 1,
    height: 40,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    gap: spacing.md,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  button: {
    height: 52,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
