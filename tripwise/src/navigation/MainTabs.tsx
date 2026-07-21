import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import type { MainTabsParamList } from './types';
import { TripDashboardScreen } from '../screens/trips/TripDashboardScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { AnalyticsScreen } from '../screens/analytics/AnalyticsScreen';
import { Map, User, BarChart3 } from 'lucide-react-native';
import { useThemeColors, spacing, borderRadius, shadows } from '../theme';
import { useThemeStore } from '../stores/themeStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

const Tab = createBottomTabNavigator<MainTabsParamList>();

function TabIcon({ icon, focused, activeColor }: { icon: React.ReactNode; focused: boolean; activeColor: string }) {
  return (
    <View style={styles.iconWrap}>
      {icon}
      {focused && (
        <View style={[styles.activeDot, { backgroundColor: activeColor }]} />
      )}
    </View>
  );
}

export function MainTabs() {
  const colors = useThemeColors();
  const { resolvedScheme } = useThemeStore();
  const insets = useSafeAreaInsets();
  const isDark = resolvedScheme === 'dark';

  const tabBarHeight = Platform.OS === 'ios' ? 56 + insets.bottom : 64;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <View style={[StyleSheet.absoluteFill, styles.tabBarBg]}>
              <BlurView
                intensity={90}
                tint={isDark ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
              />
            </View>
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.tabBarBg, { backgroundColor: isDark ? 'rgba(8,12,22,0.95)' : 'rgba(255,255,255,0.95)' }]} />
          ),
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 0 : 0,
          left: 0,
          right: 0,
          backgroundColor: 'transparent',
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: tabBarHeight,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 10,
          ...shadows.glass,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
          letterSpacing: 0.2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tab.Screen
        name="TripsTab"
        component={TripDashboardScreen}
        options={{
          tabBarLabel: 'Trips',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={<Map color={color} size={22} strokeWidth={focused ? 2.2 : 1.8} />} focused={focused} activeColor={colors.primary} />
          ),
        }}
      />
      <Tab.Screen
        name="AnalyticsTab"
        component={AnalyticsScreen}
        options={{
          tabBarLabel: 'Stats',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={<BarChart3 color={color} size={22} strokeWidth={focused ? 2.2 : 1.8} />} focused={focused} activeColor={colors.primary} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={<User color={color} size={22} strokeWidth={focused ? 2.2 : 1.8} />} focused={focused} activeColor={colors.primary} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 30,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 4,
  },
  tabBarBg: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
});
