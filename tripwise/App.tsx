import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useThemeStore } from './src/stores/themeStore';

export default function App() {
  const { initialize, resolvedScheme } = useThemeStore();

  useEffect(() => {
    initialize();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style={resolvedScheme === 'dark' ? 'light' : 'dark'} />
      <AppNavigator />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
