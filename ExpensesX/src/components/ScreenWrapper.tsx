import React from 'react';
import { View, ViewStyle, StyleSheet, StatusBar, Platform, BackHandler } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../theme';
import { useThemeStore } from '../stores/themeStore';

interface ScreenWrapperProps {
  children: React.ReactNode;
  /** Safe area edges to respect */
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  /** Custom background color override */
  backgroundColor?: string;
  /** Remove safe area (for modals/overlays that handle their own) */
  noSafeArea?: boolean;
  /** Make StatusBar translucent (for gradient headers) */
  statusBarTranslucent?: boolean;
  style?: ViewStyle;
}

/**
 * Standard screen wrapper that handles:
 * - Safe area insets (notch, home indicator)
 * - Theme-aware background color
 * - StatusBar style and translucency
 * - Consistent layout structure
 */
export function ScreenWrapper({
  children,
  edges = ['top', 'bottom'],
  backgroundColor,
  noSafeArea = false,
  statusBarTranslucent = false,
  style,
}: ScreenWrapperProps) {
  const colors = useThemeColors();
  const { resolvedScheme } = useThemeStore();
  const bg = backgroundColor || colors.background;

  const statusBarContent = resolvedScheme === 'dark' ? 'light-content' : 'dark-content';

  if (noSafeArea) {
    return (
      <View style={[styles.container, { backgroundColor: bg }, style]}>
        <StatusBar
          barStyle={statusBarContent}
          backgroundColor="transparent"
          translucent={statusBarTranslucent || Platform.OS === 'android'}
        />
        {children}
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: bg }, style]}
      edges={edges}
    >
      <StatusBar
        barStyle={statusBarContent}
        backgroundColor="transparent"
        translucent={statusBarTranslucent || Platform.OS === 'android'}
      />
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

/**
 * Hook for handling Android hardware back button in modal screens.
 * Call with the close/back function to automatically handle it.
 */
export function useBackHandler(handler: () => void) {
  React.useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handler();
      return true;
    });
    return () => subscription.remove();
  }, [handler]);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
