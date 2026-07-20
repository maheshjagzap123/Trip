import React from 'react';
import { View, ViewStyle, StyleSheet, StatusBar, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../theme';

interface ScreenWrapperProps {
  children: React.ReactNode;
  /** Use gradient background instead of solid */
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  /** Custom background color override */
  backgroundColor?: string;
  /** Remove safe area (for modals/overlays that handle their own) */
  noSafeArea?: boolean;
  style?: ViewStyle;
}

/**
 * Standard screen wrapper that handles:
 * - Safe area insets (notch, home indicator)
 * - Theme-aware background color
 * - Consistent padding
 * - StatusBar handling
 */
export function ScreenWrapper({
  children,
  edges = ['top', 'bottom'],
  backgroundColor,
  noSafeArea = false,
  style,
}: ScreenWrapperProps) {
  const colors = useThemeColors();
  const bg = backgroundColor || colors.background;

  if (noSafeArea) {
    return (
      <View style={[styles.container, { backgroundColor: bg }, style]}>
        {children}
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: bg }, style]}
      edges={edges}
    >
      {children}
    </SafeAreaView>
  );
}

/**
 * Hook for getting safe area insets with platform-aware defaults.
 */
export function useScreenInsets() {
  const insets = useSafeAreaInsets();
  return {
    top: Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0),
    bottom: Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 0),
    left: insets.left,
    right: insets.right,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
