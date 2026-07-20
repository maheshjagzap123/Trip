import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet,
  Animated, ActivityIndicator, ViewStyle, TextStyle,
  TextInputProps, TouchableOpacityProps, Dimensions, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '../theme';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows, hitSlop } from '../theme/spacing';
import { ArrowLeft } from 'lucide-react-native';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── PressableScale ──────────────────────────────────────────────────────────
export function PressableScale({
  children, onPress, style, disabled, activeOpacity = 0.82,
}: TouchableOpacityProps & { children: React.ReactNode }) {
  const scale = useRef(new Animated.Value(1)).current;
  const press = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  const release = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={press}
      onPressOut={release}
      activeOpacity={activeOpacity}
      disabled={disabled}
      style={style}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── PrimaryButton ───────────────────────────────────────────────────────────
interface ButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function Button({
  label, onPress, loading, disabled, variant = 'primary',
  size = 'md', icon, style, fullWidth = true,
}: ButtonProps) {
  const colors = useThemeColors();
  const scale = useRef(new Animated.Value(1)).current;

  const press = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  const release = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();

  const heights = { sm: 40, md: 52, lg: 58 };
  const textStyles = { sm: typography.buttonSmall, md: typography.buttonMedium, lg: typography.buttonLarge };
  const h = heights[size];
  const txtStyle = textStyles[size];

  const isDisabled = disabled || loading;

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={press}
        onPressOut={release}
        disabled={isDisabled}
        activeOpacity={0.88}
        style={[fullWidth && { width: '100%' }, style]}
      >
        <Animated.View style={[{ transform: [{ scale }] }, isDisabled && { opacity: 0.55 }]}>
          <LinearGradient
            colors={['#3B82F6', '#6366F1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[btnStyles.base, { height: h, borderRadius: borderRadius.lg }, shadows.brand]}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
                  <Text style={[txtStyle, { color: '#fff' }]}>{label}</Text>
                </>
            }
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  if (variant === 'secondary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={press}
        onPressOut={release}
        disabled={isDisabled}
        activeOpacity={0.88}
        style={[fullWidth && { width: '100%' }, style]}
      >
        <Animated.View style={[
          btnStyles.base,
          { height: h, borderRadius: borderRadius.lg, backgroundColor: colors.primaryLight, borderWidth: 1.5, borderColor: colors.primary },
          isDisabled && { opacity: 0.55 },
          { transform: [{ scale }] },
        ]}>
          {loading
            ? <ActivityIndicator color={colors.primary} size="small" />
            : <>
                {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
                <Text style={[txtStyle, { color: colors.primary }]}>{label}</Text>
              </>
          }
        </Animated.View>
      </TouchableOpacity>
    );
  }

  if (variant === 'danger') {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={press}
        onPressOut={release}
        disabled={isDisabled}
        activeOpacity={0.88}
        style={[fullWidth && { width: '100%' }, style]}
      >
        <Animated.View style={[
          btnStyles.base,
          { height: h, borderRadius: borderRadius.lg, borderWidth: 1.5, borderColor: colors.error, backgroundColor: colors.errorBackground },
          isDisabled && { opacity: 0.55 },
          { transform: [{ scale }] },
        ]}>
          {loading
            ? <ActivityIndicator color={colors.error} size="small" />
            : <>
                {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
                <Text style={[txtStyle, { color: colors.error }]}>{label}</Text>
              </>
          }
        </Animated.View>
      </TouchableOpacity>
    );
  }

  // ghost
  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={press}
      onPressOut={release}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[fullWidth && { width: '100%' }, style]}
    >
      <Animated.View style={[
        btnStyles.base,
        { height: h, borderRadius: borderRadius.lg },
        isDisabled && { opacity: 0.55 },
        { transform: [{ scale }] },
      ]}>
        {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
        <Text style={[txtStyle, { color: colors.primary }]}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const btnStyles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

// ─── Input ───────────────────────────────────────────────────────────────────
interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export function Input({ label, error, leftIcon, rightIcon, containerStyle, style, ...rest }: InputProps) {
  const colors = useThemeColors();
  const borderAnim = useRef(new Animated.Value(0)).current;

  const onFocus = () => {
    Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
    rest.onFocus?.({} as any);
  };
  const onBlur = () => {
    Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
    rest.onBlur?.({} as any);
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? colors.error : colors.border, error ? colors.error : colors.primary],
  });

  return (
    <View style={[{ marginBottom: spacing.md }, containerStyle]}>
      {label && (
        <Text style={[typography.labelSmall, { color: colors.textSecondary, marginBottom: spacing.xs }]}>
          {label}
        </Text>
      )}
      <Animated.View style={[
        inputStyles.wrap,
        { backgroundColor: colors.inputBackground, borderColor },
        shadows.xs,
      ]}>
        {leftIcon && <View style={inputStyles.iconLeft}>{leftIcon}</View>}
        <TextInput
          style={[
            inputStyles.input,
            { color: colors.textPrimary },
            leftIcon ? { paddingLeft: 0 } : {},
            rightIcon ? { paddingRight: 0 } : {},
            style as TextStyle,
          ]}
          placeholderTextColor={colors.textTertiary}
          onFocus={onFocus}
          onBlur={onBlur}
          {...rest}
        />
        {rightIcon && <View style={inputStyles.iconRight}>{rightIcon}</View>}
      </Animated.View>
      {error && (
        <Text style={[typography.caption, { color: colors.error, marginTop: spacing.xs }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const inputStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    ...typography.bodyLarge,
    paddingVertical: spacing.sm,
  },
  iconLeft: { marginRight: spacing.sm },
  iconRight: { marginLeft: spacing.sm },
});

// ─── Card ────────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  padding?: number;
}

export function Card({ children, style, onPress, variant = 'default', padding = spacing.md }: CardProps) {
  const colors = useThemeColors();

  const baseStyle: ViewStyle = {
    borderRadius: borderRadius.xl,
    padding,
    overflow: 'hidden',
  };

  const variantStyle: ViewStyle = variant === 'elevated'
    ? { backgroundColor: colors.surface, ...shadows.md }
    : variant === 'outlined'
    ? { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }
    : variant === 'glass'
    ? { backgroundColor: colors.surfaceOverlay, borderWidth: 1, borderColor: colors.borderLight }
    : { backgroundColor: colors.cardBackground, ...shadows.sm };

  if (onPress) {
    return (
      <PressableScale onPress={onPress} style={[baseStyle, variantStyle, style]}>
        {children}
      </PressableScale>
    );
  }

  return <View style={[baseStyle, variantStyle, style]}>{children}</View>;
}

// ─── Badge ───────────────────────────────────────────────────────────────────
interface BadgeProps {
  label: string;
  color?: string;
  bgColor?: string;
  size?: 'sm' | 'md';
  dot?: boolean;
}

export function Badge({ label, color, bgColor, size = 'md', dot }: BadgeProps) {
  const colors = useThemeColors();
  const c = color || colors.primary;
  const bg = bgColor || colors.primaryLight;
  const px = size === 'sm' ? 8 : 10;
  const py = size === 'sm' ? 3 : 5;
  const fs = size === 'sm' ? 10 : 11;

  return (
    <View style={[badgeStyles.wrap, { backgroundColor: bg, paddingHorizontal: px, paddingVertical: py }]}>
      {dot && <View style={[badgeStyles.dot, { backgroundColor: c }]} />}
      <Text style={[badgeStyles.txt, { color: c, fontSize: fs }]}>{label}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.full, gap: 4 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  txt: { fontWeight: '700', letterSpacing: 0.2 },
});

// ─── Avatar ──────────────────────────────────────────────────────────────────
interface AvatarProps {
  name?: string;
  size?: number;
  uri?: string;
  color?: string;
}

export function Avatar({ name, size = 40, uri, color }: AvatarProps) {
  const colors = useThemeColors();
  const initials = name
    ? name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';
  const bg = color || colors.primary;
  const fontSize = size * 0.38;

  return (
    <LinearGradient
      colors={[bg, bg + 'CC']}
      style={[avatarStyles.wrap, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Text style={[avatarStyles.txt, { fontSize, color: '#fff' }]}>{initials}</Text>
    </LinearGradient>
  );
}

const avatarStyles = StyleSheet.create({
  wrap: { justifyContent: 'center', alignItems: 'center' },
  txt: { fontWeight: '800' },
});

// ─── SkeletonLoader ──────────────────────────────────────────────────────────
interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius: br = 8, style }: SkeletonProps) {
  const colors = useThemeColors();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });

  return (
    <Animated.View
      style={[
        { width: width as any, height, borderRadius: br, backgroundColor: colors.skeletonBase, opacity },
        style,
      ]}
    />
  );
}

// ─── EmptyState ──────────────────────────────────────────────────────────────
interface EmptyStateProps {
  emoji: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ emoji, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  const colors = useThemeColors();
  return (
    <View style={emptyStyles.wrap}>
      <View style={[emptyStyles.emojiWrap, { backgroundColor: colors.primaryLight }]}>
        <Text style={emptyStyles.emoji}>{emoji}</Text>
      </View>
      <Text style={[typography.h2, { color: colors.textPrimary, textAlign: 'center', marginTop: spacing.lg }]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={[typography.bodyMedium, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, lineHeight: 22 }]}>
          {subtitle}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} size="md" style={{ marginTop: spacing.xl, width: 200 }} fullWidth={false} />
      )}
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.xxl },
  emojiWrap: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center' },
  emoji: { fontSize: 40 },
});

// ─── ScreenHeader ────────────────────────────────────────────────────────────
interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  transparent?: boolean;
}

export function ScreenHeader({ title, subtitle, onBack, right, transparent }: ScreenHeaderProps) {
  const colors = useThemeColors();
  return (
    <View style={[
      headerStyles.wrap,
      !transparent && { backgroundColor: colors.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderLight, ...shadows.xs },
    ]}>
      {onBack ? (
        <TouchableOpacity
          onPress={onBack}
          style={headerStyles.backBtn}
          hitSlop={hitSlop.large}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <View style={[headerStyles.backCircle, { backgroundColor: colors.inputBackground }]}>
            <ArrowLeft color={colors.textPrimary} size={18} />
          </View>
        </TouchableOpacity>
      ) : (
        <View style={{ width: 44 }} />
      )}
      <View style={headerStyles.center}>
        <Text style={[typography.h3, { color: colors.textPrimary }]} numberOfLines={1}>{title}</Text>
        {subtitle && <Text style={[typography.caption, { color: colors.textTertiary }]} numberOfLines={1}>{subtitle}</Text>}
      </View>
      <View style={headerStyles.right}>{right || <View style={{ width: 44 }} />}</View>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 56,
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  backCircle: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  center: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.xs },
  right: { width: 44, alignItems: 'flex-end' },
});

// ─── StatCard ────────────────────────────────────────────────────────────────
interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  color?: string;
  style?: ViewStyle;
}

export function StatCard({ icon, value, label, color, style }: StatCardProps) {
  const colors = useThemeColors();
  return (
    <View style={[statStyles.wrap, { backgroundColor: colors.cardBackground, ...shadows.sm }, style]}>
      <View style={[statStyles.iconWrap, { backgroundColor: (color || colors.primary) + '18' }]}>
        {icon}
      </View>
      <Text style={[typography.h2, { color: colors.textPrimary, marginTop: spacing.sm }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  wrap: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    minWidth: (SCREEN_W - spacing.lg * 2 - spacing.sm * 3) / 2,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
});

// ─── Chip ────────────────────────────────────────────────────────────────────
interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
  style?: ViewStyle;
}

export function Chip({ label, selected, onPress, color, style }: ChipProps) {
  const colors = useThemeColors();
  const c = color || colors.primary;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        chipStyles.wrap,
        selected
          ? { backgroundColor: c + '20', borderColor: c }
          : { backgroundColor: colors.inputBackground, borderColor: colors.border },
        style,
      ]}
    >
      <Text style={[typography.labelSmall, { color: selected ? c : colors.textSecondary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const chipStyles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
  },
});

// ─── FAB ─────────────────────────────────────────────────────────────────────
interface FABProps {
  onPress: () => void;
  icon: React.ReactNode;
  style?: ViewStyle;
}

export function FAB({ onPress, icon, style }: FABProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const press = () => Animated.spring(scale, { toValue: 0.92, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  const release = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }).start();

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={press}
      onPressOut={release}
      activeOpacity={0.9}
      style={[fabStyles.wrap, style]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient
          colors={['#3B82F6', '#6366F1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[fabStyles.inner, shadows.brand]}
        >
          {icon}
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const fabStyles = StyleSheet.create({
  wrap: { position: 'absolute', right: spacing.md, bottom: spacing.lg },
  inner: { width: 58, height: 58, borderRadius: 29, justifyContent: 'center', alignItems: 'center' },
});

// ─── SectionLabel ────────────────────────────────────────────────────────────
export function SectionLabel({ label, style }: { label: string; style?: TextStyle }) {
  const colors = useThemeColors();
  return (
    <Text style={[typography.overline, { color: colors.textTertiary, marginBottom: spacing.sm }, style]}>
      {label}
    </Text>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────
export function Divider({ style }: { style?: ViewStyle }) {
  const colors = useThemeColors();
  return <View style={[{ height: 1, backgroundColor: colors.borderLight }, style]} />;
}
