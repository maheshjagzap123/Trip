import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors, spacing, borderRadius, shadows } from '../theme';
import { timing } from '../theme/animations';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Height as percentage of screen (0-1) */
  height?: number;
  /** Show drag handle indicator */
  showHandle?: boolean;
  /** Title for the sheet */
  title?: string;
}

/**
 * Premium bottom sheet with smooth spring animations.
 * Features drag handle, backdrop tap to dismiss, and
 * safe area awareness.
 */
export function BottomSheet({
  visible,
  onClose,
  children,
  height = 0.5,
  showHandle = true,
  title,
}: BottomSheetProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const sheetHeight = SCREEN_HEIGHT * height;
  const translateY = useSharedValue(sheetHeight);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 200, mass: 1 });
      backdropOpacity.value = withTiming(1, { duration: timing.normal });
    } else {
      translateY.value = withTiming(sheetHeight, { duration: timing.normal });
      backdropOpacity.value = withTiming(0, { duration: timing.fast });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View
        style={[
          styles.sheet,
          {
            height: sheetHeight + insets.bottom,
            backgroundColor: colors.surface,
            paddingBottom: insets.bottom,
          },
          shadows.xl,
          sheetStyle,
        ]}
      >
        {showHandle && (
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>
        )}
        {title && (
          <View style={styles.titleContainer}>
            <Text style={[{ fontSize: 17, fontWeight: '600', color: colors.textPrimary }]}>
              {title}
            </Text>
          </View>
        )}
        <View style={styles.content}>{children}</View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: spacing.sm + 4,
    paddingBottom: spacing.xs,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  titleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
});
