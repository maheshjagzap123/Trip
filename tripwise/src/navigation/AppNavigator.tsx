import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, StyleSheet, Easing } from 'react-native';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { CompleteProfileScreen } from '../screens/auth/CompleteProfileScreen';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { useAuthStore } from '../stores/authStore';
import { useThemeColors } from '../theme';
import type { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

// Fade + slight zoom for root-level transitions (Auth → Main)
const forFadeScale = ({ current, next }: any) => {
  const opacity = current.progress.interpolate({
    inputRange: [0, 1], outputRange: [0, 1],
  });
  const scale = current.progress.interpolate({
    inputRange: [0, 1], outputRange: [0.96, 1],
  });
  const outScale = next
    ? next.progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] })
    : 1;
  return { cardStyle: { opacity, transform: [{ scale }, { scale: outScale }] } };
};

const rootSpec = {
  animation: 'timing' as const,
  config: { duration: 420, easing: Easing.inOut(Easing.cubic) },
};

export function AppNavigator() {
  const { session, profile, isLoading, isInitialized, initialize } = useAuthStore();
  const colors = useThemeColors();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Show splash screen while checking auth state
  if (!isInitialized || isLoading) {
    return <SplashScreen />;
  }

  // Determine routing:
  // - No session → Auth screens
  // - Session but profile not loaded yet → show loading (wait for fetch)
  // - Session + profile not completed → CompleteProfile screen
  // - Session + profile completed → Dashboard
  const isLoggedIn = !!session;
  const profileLoaded = profile !== null;
  const profileComplete = profile?.profile_completed === true;

  // If logged in but profile hasn't loaded yet, keep showing splash
  if (isLoggedIn && !profileLoaded) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: colors.background },
          cardStyleInterpolator: forFadeScale,
          transitionSpec: { open: rootSpec, close: rootSpec },
        }}
      >
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
