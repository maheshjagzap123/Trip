import React, { useEffect, useCallback } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors, typography, spacing, borderRadius, shadows } from '../theme';
import { CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react-native';
import { create } from 'zustand';

// ─── Toast Store ─────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
  show: (message: string, type?: ToastType) => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  visible: false,
  message: '',
  type: 'success',
  show: (message, type = 'success') => set({ visible: true, message, type }),
  hide: () => set({ visible: false }),
}));

/** Convenience function to show toast from anywhere */
export const toast = {
  success: (msg: string) => useToastStore.getState().show(msg, 'success'),
  error: (msg: string) => useToastStore.getState().show(msg, 'error'),
  info: (msg: string) => useToastStore.getState().show(msg, 'info'),
  warning: (msg: string) => useToastStore.getState().show(msg, 'warning'),
};

// ─── Toast Component ─────────────────────────────────────────────────────────
export function ToastContainer() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { visible, message, type, hide } = useToastStore();

  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  const dismiss = useCallback(() => hide(), [hide]);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 18, stiffness: 300 });
      opacity.value = withTiming(1, { duration: 200 });
      // Auto-dismiss after 3 seconds
      translateY.value = withDelay(
        3000,
        withTiming(-100, { duration: 300 }, (finished) => {
          if (finished) runOnJS(dismiss)();
        }),
      );
      opacity.value = withDelay(3000, withTiming(0, { duration: 300 }));
    } else {
      translateY.value = withTiming(-100, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const iconMap = {
    success: <CheckCircle size={20} color={colors.success} />,
    error: <XCircle size={20} color={colors.error} />,
    info: <Info size={20} color={colors.info} />,
    warning: <AlertCircle size={20} color={colors.warning} />,
  };

  const bgMap = {
    success: colors.successBackground,
    error: colors.errorBackground,
    info: colors.infoBackground,
    warning: colors.warningBackground,
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + spacing.sm },
        animStyle,
      ]}
      pointerEvents="none"
    >
      <View
        style={[
          styles.toast,
          {
            backgroundColor: bgMap[type],
            borderColor: type === 'success' ? colors.success + '30' :
                         type === 'error' ? colors.error + '30' :
                         type === 'info' ? colors.info + '30' :
                         colors.warning + '30',
          },
          shadows.md,
        ]}
      >
        {iconMap[type]}
        <Text
          style={[typography.labelMedium, { color: colors.textPrimary, flex: 1, marginLeft: spacing.sm }]}
          numberOfLines={2}
        >
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    width: '100%',
    maxWidth: 400,
  },
});
