import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabsParamList } from './types';
import { TripDashboardScreen } from '../screens/trips/TripDashboardScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { AnalyticsScreen } from '../screens/analytics/AnalyticsScreen';
import { Map, User, BarChart3 } from 'lucide-react-native';
import { useThemeColors } from '../theme';

const Tab = createBottomTabNavigator<MainTabsParamList>();

function TabIcon({ icon, focused, activeColor }: { icon: React.ReactNode; focused: boolean; activeColor: string }) {
  return (
    <View style={styles.iconWrap}>
      {icon}
      {focused && <View style={[styles.activeDot, { backgroundColor: activeColor, shadowColor: activeColor }]} />}
    </View>
  );
}

export function MainTabs() {
  const colors = useThemeColors();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2, marginBottom: 4 },
      }}
    >
      <Tab.Screen
        name="TripsTab"
        component={TripDashboardScreen}
        options={{
          tabBarLabel: 'Trips',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={<Map color={color} size={size} />} focused={focused} activeColor={colors.primary} />
          ),
        }}
      />
      <Tab.Screen
        name="AnalyticsTab"
        component={AnalyticsScreen}
        options={{
          tabBarLabel: 'Stats',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={<BarChart3 color={color} size={size} />} focused={focused} activeColor={colors.primary} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={<User color={color} size={size} />} focused={focused} activeColor={colors.primary} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
});
