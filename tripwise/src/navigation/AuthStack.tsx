import React from 'react';
import { Animated, Easing } from 'react-native';
import { createStackNavigator, CardStyleInterpolators, TransitionSpecs } from '@react-navigation/stack';
import type { AuthStackParamList } from './types';
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { OtpVerificationScreen } from '../screens/auth/OtpVerificationScreen';

const Stack = createStackNavigator<AuthStackParamList>();

// Cinematic: incoming slides up + fades in, outgoing scales down + fades out
const forSlideUpFade = ({ current, next, layouts }: any) => {
  const translateY = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [layouts.screen.height * 0.08, 0],
  });
  const opacity = current.progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.6, 1],
  });
  const scale = next
    ? next.progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.93] })
    : 1;
  return {
    cardStyle: { transform: [{ translateY }, { scale }], opacity },
  };
};

const smoothSpec = {
  animation: 'timing' as const,
  config: { duration: 380, easing: Easing.out(Easing.poly(4)) },
};

export function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#0A0F1E', flex: 1 },
        cardStyleInterpolator: forSlideUpFade,
        transitionSpec: { open: smoothSpec, close: smoothSpec },
        gestureEnabled: true,
        gestureDirection: 'vertical',
        gestureResponseDistance: 200,
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
    </Stack.Navigator>
  );
}
