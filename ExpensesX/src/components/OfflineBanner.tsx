import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { WifiOff, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStore } from '../stores/networkStore';
import { spacing } from '../theme';

/**
 * Shows a simple banner:
 * - Offline: "No internet connection"
 * - Back online after being offline: "Back online! Syncing..." then auto-hides
 */
export function OfflineBanner() {
  const { isOnline, isSyncing } = useNetworkStore();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const wasOffline = useRef(false);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isOnline) {
      // Show offline banner
      wasOffline.current = true;
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 300 }).start();
    } else if (wasOffline.current) {
      // Came back online — show "synced" briefly then hide
      hideTimeout.current = setTimeout(() => {
        Animated.timing(slideAnim, { toValue: -80, duration: 300, useNativeDriver: true }).start(() => {
          wasOffline.current = false;
        });
      }, 2500);
    } else {
      // Already online, hide
      slideAnim.setValue(-80);
    }

    return () => {
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
    };
  }, [isOnline]);

  const backgroundColor = !isOnline
    ? '#FF6B7A'
    : isSyncing
    ? '#FFB648'
    : '#35D07F';

  const message = !isOnline
    ? 'No internet connection'
    : isSyncing
    ? 'Back online! Syncing your changes...'
    : 'All changes synced ✓';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 8,
          backgroundColor,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents="none"
    >
      <View style={styles.content}>
        {!isOnline ? (
          <WifiOff size={16} color="#fff" />
        ) : (
          <Check size={16} color="#fff" />
        )}
        <Text style={styles.text}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
