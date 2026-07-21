import { Platform } from 'react-native';

export const palette = {
  // Primary — Premium Blue
  blue50:  '#EBF3FF',
  blue100: '#D6E8FF',
  blue200: '#B0D4FF',
  blue300: '#7BB8FF',
  blue400: '#5B8CFF',
  blue500: '#4A7AFF',
  blue600: '#3B6AEF',
  blue700: '#2D52D9',
  blue800: '#1E3CB0',
  blue900: '#152D8A',

  // Secondary — Accent Purple
  violet50:  '#F3EEFF',
  violet100: '#E8DEFF',
  violet200: '#CDB8FF',
  violet300: '#A78BFF',
  violet400: '#7B61FF',
  violet500: '#6B4FEE',
  violet600: '#5A3DD9',

  // Accent — Success Emerald
  emerald50:  '#E8FFF5',
  emerald100: '#C4FFEA',
  emerald400: '#35D07F',
  emerald500: '#2AB870',
  emerald600: '#1FA060',

  // Amber / Warning
  amber400: '#FFB648',
  amber500: '#F5A623',

  // Rose / Error
  rose400: '#FF6B7A',
  rose500: '#F44C5E',

  // Neutral — Rich Dark
  gray50:  '#F8FAFC',
  gray100: '#F1F5F9',
  gray150: '#EEF2F7',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1E293B',
  gray850: '#182235',
  gray900: '#111827',
  gray950: '#080C16',

  // Base
  white: '#FFFFFF',
  black: '#000000',

  // Brand gradient stops
  brandStart: '#5B8CFF',
  brandEnd:   '#7B61FF',
} as const;

export const lightColors = {
  // Backgrounds
  background:       palette.gray50,
  backgroundAlt:    palette.white,
  surface:          palette.white,
  surfaceElevated:  palette.white,
  surfaceOverlay:   'rgba(255,255,255,0.88)',

  // Text
  textPrimary:   palette.gray900,
  textSecondary: palette.gray600,
  textTertiary:  palette.gray400,
  textInverse:   palette.white,
  textOnBrand:   palette.white,

  // Brand
  primary:      palette.blue500,
  primaryDark:  palette.blue700,
  primaryLight: palette.blue50,
  secondary:    palette.violet400,
  accent:       palette.emerald400,

  // Gradients (stored as string tuples for LinearGradient)
  gradientPrimary:   '#5B8CFF',
  gradientSecondary: '#7B61FF',

  // Borders
  border:        palette.gray200,
  borderLight:   palette.gray100,
  borderFocused: palette.blue500,

  // Status
  error:             palette.rose400,
  errorBackground:   'rgba(255,107,122,0.08)',
  success:           palette.emerald400,
  successBackground: 'rgba(53,208,127,0.08)',
  warning:           palette.amber400,
  warningBackground: 'rgba(255,182,72,0.08)',
  info:              palette.blue400,
  infoBackground:    palette.blue50,

  // Components
  inputBackground:    palette.gray50,
  cardBackground:     palette.white,
  cardBackgroundAlt:  palette.gray50,
  skeletonBase:       palette.gray200,
  skeletonHighlight:  palette.gray100,
  overlay:            'rgba(8,12,22,0.6)',
  tabBarBackground:   palette.white,
  tabBarBorder:       palette.gray100,
  shimmer:            'rgba(255,255,255,0.6)',
} as const;

export const darkColors = {
  // Backgrounds — Rich dark, not flat black
  background:       '#080C16',
  backgroundAlt:    '#0D1320',
  surface:          '#111827',
  surfaceElevated:  '#182235',
  surfaceOverlay:   'rgba(8,12,22,0.92)',

  // Text
  textPrimary:   '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary:  '#64748B',
  textInverse:   '#080C16',
  textOnBrand:   palette.white,

  // Brand
  primary:      '#5B8CFF',
  primaryDark:  '#7BB8FF',
  primaryLight: 'rgba(91,140,255,0.12)',
  secondary:    '#7B61FF',
  accent:       '#35D07F',

  // Gradients
  gradientPrimary:   '#5B8CFF',
  gradientSecondary: '#7B61FF',

  // Borders — Subtle translucent
  border:        'rgba(255,255,255,0.08)',
  borderLight:   'rgba(255,255,255,0.05)',
  borderFocused: '#5B8CFF',

  // Status
  error:             '#FF6B7A',
  errorBackground:   'rgba(255,107,122,0.10)',
  success:           '#35D07F',
  successBackground: 'rgba(53,208,127,0.10)',
  warning:           '#FFB648',
  warningBackground: 'rgba(255,182,72,0.10)',
  info:              '#5B8CFF',
  infoBackground:    'rgba(91,140,255,0.10)',

  // Components
  inputBackground:    '#111827',
  cardBackground:     '#111827',
  cardBackgroundAlt:  '#182235',
  skeletonBase:       '#182235',
  skeletonHighlight:  '#1E293B',
  overlay:            'rgba(0,0,0,0.75)',
  tabBarBackground:   '#080C16',
  tabBarBorder:       'rgba(255,255,255,0.05)',
  shimmer:            'rgba(255,255,255,0.06)',
} as const;

export type Colors = typeof lightColors;
