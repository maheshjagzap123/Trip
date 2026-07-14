import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabsParamList } from './types';
import { TripDashboardScreen } from '../screens/trips/TripDashboardScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { useThemeColors } from '../theme';
import { Map, User } from 'lucide-react-native';

const Tab = createBottomTabNavigator<MainTabsParamList>();

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
        },
      }}
    >
      <Tab.Screen
        name="TripsTab"
        component={TripDashboardScreen}
        options={{
          tabBarLabel: 'Trips',
          tabBarIcon: ({ color, size }) => <Map color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
