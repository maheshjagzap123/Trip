import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useThemeStore } from './src/stores/themeStore';
import { useNetworkStore } from './src/stores/networkStore';
import { useAuthStore } from './src/stores/authStore';
import { ToastContainer } from './src/components/Toast';
import { OfflineBanner } from './src/components/OfflineBanner';
import { registerForPushNotifications, addNotificationListeners } from './src/lib/notifications';

export default function App() {
  const { initialize: initTheme, resolvedScheme } = useThemeStore();
  const { initialize: initNetwork } = useNetworkStore();
  const { session } = useAuthStore();

  useEffect(() => {
    initTheme();
    const unsubNetwork = initNetwork();
    return () => { unsubNetwork(); };
  }, []);

  // Register push notifications when user is logged in
  useEffect(() => {
    if (!session) return;

    registerForPushNotifications();
    const cleanup = addNotificationListeners();
    return cleanup;
  }, [session]);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.root}>
        <KeyboardAvoidingView
          style={styles.root}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <StatusBar style={resolvedScheme === 'dark' ? 'light' : 'dark'} />
          <AppNavigator />
          <OfflineBanner />
          <ToastContainer />
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
