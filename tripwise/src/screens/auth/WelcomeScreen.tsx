import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { AuthStackParamList } from '../../navigation/types';
import { useThemeColors, typography, spacing } from '../../theme';

type NavigationProp = StackNavigationProp<AuthStackParamList, 'Welcome'>;

export function WelcomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Hero area */}
      <View style={styles.hero}>
        <Text style={[styles.emoji]}>✈️</Text>
        <Text style={[typography.displayLarge, { color: colors.textPrimary }]}>
          TripWise
        </Text>
        <Text style={[typography.bodyLarge, styles.subtitle, { color: colors.textSecondary }]}>
          Travel smarter, together.
        </Text>
      </View>

      {/* CTAs */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Get Started"
        >
          <Text style={[typography.labelLarge, { color: colors.textInverse }]}>
            Get Started
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xl,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 72,
    marginBottom: spacing.md,
  },
  subtitle: {
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  actions: {
    gap: spacing.md,
  },
  primaryButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
