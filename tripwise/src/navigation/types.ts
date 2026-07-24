/**
 * Navigation type definitions for type-safe routing.
 */

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  OtpVerification: { identifier: string; method: 'email' | 'phone' };
};

export type MainTabsParamList = {
  GroupsTab: undefined;
  AnalyticsTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  CompleteProfile: undefined;
  Main: undefined;
};
