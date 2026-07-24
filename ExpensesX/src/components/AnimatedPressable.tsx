import React, { useCallback } from 'react';
import { TouchableOpacity, TouchableOpacityProps, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { springs, feedback } from '../theme/animations';

interface AnimatedPressableProps extends TouchableOpacityProps {
  children: React.ReactNode;
  scaleConfig?: { min: number; max: number };
  style?: ViewStyle | ViewStyle[];
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

/**
 * Premium pressable component with smooth spring-based scale animation.
 * Uses Reanimated for 60fps native-thread animations.
 */
export function AnimatedPressable({
  children,
  onPress,
  onPressIn,
  onPressOut,
  scaleConfig = feedback.pressScale,
  style,
  disabled,
  ...rest
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(
    (e: any) => {
      scale.value = withSpring(scaleConfig.min, springs.button);
      onPressIn?.(e);
    },
    [onPressIn, scaleConfig.min],
  );

  const handlePressOut = useCallback(
    (e: any) => {
      scale.value = withSpring(scaleConfig.max, springs.button);
      onPressOut?.(e);
    },
    [onPressOut, scaleConfig.max],
  );

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
      disabled={disabled}
      style={[animatedStyle, style]}
      {...rest}
    >
      {children}
    </AnimatedTouchable>
  );
}
