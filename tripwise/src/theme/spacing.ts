import { Platform, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** 4-point grid spacing system */
export const spacing = {
  xxs:  2,
  xs:   4,
  sm:   8,
  md:   16,
  lg:   24,
  xl:   32,
  xxl:  48,
  xxxl: 64,
} as const;

export const borderRadius = {
  xs:   6,
  sm:   10,
  md:   14,
  lg:   18,
  xl:   24,
  xxl:  32,
  full: 9999,
} as const;

/** Minimum touch target sizes per platform guidelines */
export const hitSlop = {
  /** Standard 44pt touch target */
  standard: { top: 10, bottom: 10, left: 10, right: 10 },
  /** Larger touch target for important actions */
  large: { top: 14, bottom: 14, left: 14, right: 14 },
} as const;

/** Screen-aware layout helpers */
export const layout = {
  /** Screen padding that adapts to device size */
  screenPadding: SCREEN_WIDTH < 375 ? spacing.md : spacing.lg,
  /** Maximum content width for tablets */
  maxContentWidth: 560,
  /** Bottom safe area extra padding */
  bottomInset: Platform.OS === 'ios' ? 34 : 16,
  /** Standard header height */
  headerHeight: 56,
  /** Tab bar height */
  tabBarHeight: Platform.OS === 'ios' ? 88 : 64,
  /** FAB offset from bottom */
  fabBottom: Platform.OS === 'ios' ? 32 : 24,
} as const;

/** Cross-platform shadow helper */
export const shadows = {
  none: Platform.select({
    ios:     { shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0 },
    android: { elevation: 0 },
    default: {},
  }),
  xs: Platform.select({
    ios:     { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
    android: { elevation: 1 },
    default: { boxShadow: '0 1px 2px rgba(15,23,42,0.05)' },
  }),
  sm: Platform.select({
    ios:     { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
    android: { elevation: 2 },
    default: { boxShadow: '0 2px 6px rgba(15,23,42,0.08)' },
  }),
  md: Platform.select({
    ios:     { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 12 },
    android: { elevation: 4 },
    default: { boxShadow: '0 4px 12px rgba(15,23,42,0.10)' },
  }),
  lg: Platform.select({
    ios:     { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20 },
    android: { elevation: 8 },
    default: { boxShadow: '0 8px 20px rgba(15,23,42,0.12)' },
  }),
  xl: Platform.select({
    ios:     { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.16, shadowRadius: 32 },
    android: { elevation: 12 },
    default: { boxShadow: '0 16px 32px rgba(15,23,42,0.16)' },
  }),
  brand: Platform.select({
    ios:     { shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 20 },
    android: { elevation: 10 },
    default: { boxShadow: '0 8px 20px rgba(59,130,246,0.35)' },
  }),
  /** Colored shadow for success elements */
  success: Platform.select({
    ios:     { shadowColor: '#10B981', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 16 },
    android: { elevation: 8 },
    default: { boxShadow: '0 6px 16px rgba(16,185,129,0.3)' },
  }),
  /** Soft card shadow */
  card: Platform.select({
    ios:     { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 8 },
    android: { elevation: 3 },
    default: { boxShadow: '0 3px 8px rgba(15,23,42,0.06)' },
  }),
} as const;
