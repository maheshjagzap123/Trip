import { Easing } from 'react-native';
import Animated, {
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  FadeIn,
  FadeOut,
  FadeInDown,
  FadeInUp,
  FadeOutDown,
  FadeOutUp,
  SlideInDown,
  SlideInRight,
  SlideOutDown,
  SlideOutRight,
  ZoomIn,
  ZoomOut,
  Layout,
  Easing as REasing,
} from 'react-native-reanimated';

// ─── Timing Configurations ──────────────────────────────────────────────────
export const timing = {
  fast: 150,
  normal: 250,
  slow: 400,
  page: 350,
  splash: 600,
} as const;

// ─── Spring Configurations ──────────────────────────────────────────────────
export const springs = {
  /** Snappy press feedback */
  button: { damping: 15, stiffness: 400, mass: 0.8 },
  /** Smooth card animations */
  card: { damping: 18, stiffness: 300, mass: 1 },
  /** Gentle page transitions */
  page: { damping: 20, stiffness: 200, mass: 1.2 },
  /** Bouncy enter animations */
  bouncy: { damping: 12, stiffness: 180, mass: 0.8 },
  /** Gentle floating animations */
  gentle: { damping: 25, stiffness: 120, mass: 1.5 },
} as const;

// ─── Reanimated Entering/Exiting Presets ────────────────────────────────────
export const entering = {
  fadeIn: FadeIn.duration(timing.normal),
  fadeInDown: FadeInDown.duration(timing.page).springify().damping(18),
  fadeInUp: FadeInUp.duration(timing.page).springify().damping(18),
  slideInBottom: SlideInDown.duration(timing.page).springify().damping(20),
  slideInRight: SlideInRight.duration(timing.normal),
  zoomIn: ZoomIn.duration(timing.normal).springify().damping(15),
  /** Staggered list item entrance */
  listItem: (index: number) =>
    FadeInDown.delay(index * 60)
      .duration(timing.normal)
      .springify()
      .damping(18),
  /** Card enter from bottom with slight scale */
  card: (index: number) =>
    FadeInUp.delay(index * 80)
      .duration(timing.page)
      .springify()
      .damping(16),
};

export const exiting = {
  fadeOut: FadeOut.duration(timing.fast),
  fadeOutDown: FadeOutDown.duration(timing.normal),
  fadeOutUp: FadeOutUp.duration(timing.fast),
  slideOutBottom: SlideOutDown.duration(timing.normal),
  slideOutRight: SlideOutRight.duration(timing.fast),
  zoomOut: ZoomOut.duration(timing.fast),
};

// ─── Layout Transitions ─────────────────────────────────────────────────────
export const layoutTransition = Layout.springify().damping(18).stiffness(200);

// ─── Easing Curves ──────────────────────────────────────────────────────────
export const easings = {
  /** Standard Material-style ease */
  standard: Easing.bezier(0.4, 0, 0.2, 1),
  /** Deceleration for incoming elements */
  decelerate: Easing.bezier(0, 0, 0.2, 1),
  /** Acceleration for exiting elements */
  accelerate: Easing.bezier(0.4, 0, 1, 1),
  /** Premium elastic feel */
  premium: Easing.bezier(0.25, 0.1, 0.25, 1),
  /** Smooth overshoot */
  overshoot: Easing.bezier(0.34, 1.56, 0.64, 1),
} as const;

// ─── Shared Value Helpers ───────────────────────────────────────────────────
export const animateValue = {
  /** Quick spring for press states */
  press: (value: number) => withSpring(value, springs.button),
  /** Smooth spring for transitions */
  smooth: (value: number) => withSpring(value, springs.card),
  /** Gentle timing animation */
  gentle: (value: number, duration = timing.normal) =>
    withTiming(value, { duration, easing: easings.premium }),
  /** Delayed animation */
  delayed: (value: number, delay: number, duration = timing.normal) =>
    withDelay(delay, withTiming(value, { duration, easing: easings.premium })),
};

// ─── Haptic-style feedback patterns ────────────────────────────────────────
export const feedback = {
  /** Button press scale: 1 -> 0.96 -> 1 */
  pressScale: { min: 0.96, max: 1 },
  /** Card press scale: 1 -> 0.98 -> 1 */
  cardScale: { min: 0.98, max: 1 },
  /** FAB press scale */
  fabScale: { min: 0.9, max: 1 },
} as const;
