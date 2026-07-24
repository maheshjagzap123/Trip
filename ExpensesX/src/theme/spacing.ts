import { Platform, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** 8-point spacing system for premium, spacious layouts */
export const spacing = {
  xxs:  4,
  xs:   8,
  sm:   12,
  md:   16,
  lg:   24,
  xl:   32,
  xxl:  48,
  xxxl: 64,
} as const;

export const borderRadius = {
  xs:   8,
  sm:   12,
  md:   16,
  lg:   20,
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

/** Cross-platform shadow helper — soft, premium shadows */
export const shadows = {
  none: Platform.select({
    ios:     { shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0 },
    android: { elevation: 0 },
    default: {},
  }),
  xs: Platform.select({
    ios:     { shadowColor: '#000000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3 },
    android: { elevation: 1 },
    default: { boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  }),
  sm: Platform.select({
    ios:     { shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
    android: { elevation: 2 },
    default: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  }),
  md: Platform.select({
    ios:     { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16 },
    android: { elevation: 4 },
    default: { boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
  }),
  lg: Platform.select({
    ios:     { shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.10, shadowRadius: 24 },
    android: { elevation: 8 },
    default: { boxShadow: '0 8px 24px rgba(0,0,0,0.10)' },
  }),
  xl: Platform.select({
    ios:     { shadowColor: '#000000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.14, shadowRadius: 40 },
    android: { elevation: 12 },
    default: { boxShadow: '0 16px 40px rgba(0,0,0,0.14)' },
  }),
  brand: Platform.select({
    ios:     { shadowColor: '#5B8CFF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 24 },
    android: { elevation: 10 },
    default: { boxShadow: '0 8px 24px rgba(91,140,255,0.35)' },
  }),
  /** Purple brand shadow */
  brandPurple: Platform.select({
    ios:     { shadowColor: '#7B61FF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.30, shadowRadius: 20 },
    android: { elevation: 8 },
    default: { boxShadow: '0 8px 20px rgba(123,97,255,0.30)' },
  }),
  /** Colored shadow for success elements */
  success: Platform.select({
    ios:     { shadowColor: '#35D07F', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 16 },
    android: { elevation: 8 },
    default: { boxShadow: '0 6px 16px rgba(53,208,127,0.25)' },
  }),
  /** Soft card shadow — barely visible, premium depth */
  card: Platform.select({
    ios:     { shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12 },
    android: { elevation: 2 },
    default: { boxShadow: '0 2px 12px rgba(0,0,0,0.04)' },
  }),
  /** Glass card shadow for floating elements */
  glass: Platform.select({
    ios:     { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 20 },
    android: { elevation: 6 },
    default: { boxShadow: '0 4px 20px rgba(0,0,0,0.12)' },
  }),
} as const;
