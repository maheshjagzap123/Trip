import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabsParamList } from './types';
import { TripDashboardScreen } from '../screens/trips/TripDashboardScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { AnalyticsScreen } from '../screens/analytics/AnalyticsScreen';
import { Map, User, BarChart3 } from 'lucide-react-native';
import { useThemeColors, spacing, shadows } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();

  const tabBarHeight = Platform.OS === 'ios' ? 52 + insets.bottom : 60;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: tabBarHeight,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
          ...shadows.sm,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
          letterSpacing: 0.1,
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
            <TabIcon icon={<Map color={color} size={size - 2} />} focused={focused} activeColor={colors.primary} />
          ),
        }}
      />
      <Tab.Screen
        name="AnalyticsTab"
        component={AnalyticsScreen}
        options={{
          tabBarLabel: 'Stats',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={<BarChart3 color={color} size={size - 2} />} focused={focused} activeColor={colors.primary} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={<User color={color} size={size - 2} />} focused={focused} activeColor={colors.primary} />
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
    height: 28,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 4,
  },
});
