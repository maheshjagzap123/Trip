import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WifiOff, RefreshCw } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStore } from '../stores/networkStore';
import { useThemeColors, spacing, borderRadius } from '../theme';

/**
 * Shows a banner at the top when device is offline or has pending syncs.
 * Place this in App.tsx after the AppNavigator.
 */
export function OfflineBanner() {
  const { isOnline, pendingCount, isSyncing, syncNow } = useNetworkStore();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  // Don't show anything if online and no pending items
  if (isOnline && pendingCount === 0) return null;

  const isOffline = !isOnline;

  return (
    <View style={[
      styles.container,
      {
        top: insets.top,
        backgroundColor: isOffline ? 'rgba(255, 107, 122, 0.95)' : 'rgba(255, 182, 72, 0.95)',
      },
    ]}>
      <View style={styles.content}>
        {isOffline ? (
          <>
            <WifiOff size={16} color="#fff" />
            <Text style={styles.text}>
              You're offline. Changes will sync when you reconnect.
            </Text>
          </>
        ) : (
          <>
            {isSyncing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <RefreshCw size={16} color="#fff" />
            )}
            <Text style={styles.text}>
              {isSyncing ? 'Syncing...' : `${pendingCount} pending ${pendingCount === 1 ? 'change' : 'changes'}`}
            </Text>
            {!isSyncing && (
              <TouchableOpacity onPress={syncNow} style={styles.syncBtn}>
                <Text style={styles.syncBtnText}>Sync Now</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
      {pendingCount > 0 && isOffline && (
        <Text style={styles.subtext}>
          {pendingCount} {pendingCount === 1 ? 'action' : 'actions'} queued
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  text: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  subtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    marginTop: 4,
    marginLeft: 26,
  },
  syncBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  syncBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
