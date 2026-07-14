import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { CompleteProfileScreen } from '../screens/auth/CompleteProfileScreen';
import { useAuthStore } from '../stores/authStore';
import { useThemeColors } from '../theme';
import type { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { session, profile, isLoading, isInitialized, initialize } = useAuthStore();
  const colors = useThemeColors();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Show loading screen while checking auth state
  if (!isInitialized || isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Determine routing:
  // - No session → Auth screens
  // - Session but profile not loaded yet → show loading (wait for fetch)
  // - Session + profile not completed → CompleteProfile screen
  // - Session + profile completed → Dashboard
  const isLoggedIn = !!session;
  const profileLoaded = profile !== null;
  const profileComplete = profile?.profile_completed === true;

  // If logged in but profile hasn't loaded yet, keep showing loader
  if (isLoggedIn && !profileLoaded) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isLoggedIn ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : !profileComplete ? (
          <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
