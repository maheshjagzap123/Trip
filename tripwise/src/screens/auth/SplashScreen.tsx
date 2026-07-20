import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: W, height: H } = Dimensions.get('window');

export function SplashScreen() {
  const logoScale   = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textY       = useRef(new Animated.Value(12)).current;
  const tagOpacity  = useRef(new Animated.Value(0)).current;
  const dotScale    = useRef(new Animated.Value(0)).current;
  const pulse       = useRef(new Animated.Value(1)).current;
  const orb1        = useRef(new Animated.Value(0)).current;
  const orb2        = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Ambient orb animations
    Animated.loop(
      Animated.sequence([
        Animated.timing(orb1, { toValue: 1, duration: 3500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(orb1, { toValue: 0, duration: 3500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(orb2, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(orb2, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Sequenced entrance
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(textY, { toValue: 0, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.timing(tagOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(dotScale, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();

    // Pulse loading dot
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.5, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const orb1Y = orb1.interpolate({ inputRange: [0, 1], outputRange: [0, -16] });
  const orb2Y = orb2.interpolate({ inputRange: [0, 1], outputRange: [0, 12] });

  return (
    <LinearGradient
      colors={['#080E1A', '#0F172A', '#162035']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      {/* Ambient orbs */}
      <Animated.View style={[styles.orb1, { transform: [{ translateY: orb1Y }] }]} />
      <Animated.View style={[styles.orb2, { transform: [{ translateY: orb2Y }] }]} />

      {/* Logo */}
      <Animated.View style={[styles.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <LinearGradient
          colors={['#3B82F6', '#7C3AED']}
          style={styles.logoGrad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.logoEmoji}>✈️</Text>
        </LinearGradient>
        <View style={styles.glowRing} />
      </Animated.View>

      {/* App Name */}
      <Animated.Text style={[styles.appName, { opacity: textOpacity, transform: [{ translateY: textY }] }]}>
        TripWise
      </Animated.Text>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: tagOpacity }]}>
        Travel smarter, together
      </Animated.Text>

      {/* Pulsing loading dot */}
      <View style={styles.loadingWrap}>
        <Animated.View style={[styles.dotWrap, { transform: [{ scale: Animated.multiply(dotScale, pulse) }] }]}>
          <LinearGradient colors={['#3B82F6', '#7C3AED']} style={styles.dot} />
        </Animated.View>
      </View>

      {/* Version */}
      <Text style={styles.version}>v1.0.0</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  orb1: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(59,130,246,0.06)', top: H * -0.05, right: W * -0.2,
  },
  orb2: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(124,58,237,0.05)', bottom: H * 0.08, left: W * -0.15,
  },
  logoWrap: {
    marginBottom: 24,
    ...Platform.select({
      ios: { shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 28 },
      android: { elevation: 16 },
    }),
  },
  logoGrad: { width: 100, height: 100, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  logoEmoji: { fontSize: 46 },
  glowRing: {
    position: 'absolute', top: -6, left: -6, right: -6, bottom: -6,
    borderRadius: 36, borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)',
  },
  appName: { fontSize: 36, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1.2, marginBottom: 8 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: '500', letterSpacing: 0.3, marginBottom: 48 },
  loadingWrap: { height: 16, justifyContent: 'center', alignItems: 'center' },
  dotWrap: { width: 8, height: 8, borderRadius: 4, overflow: 'hidden' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  version: { position: 'absolute', bottom: 36, fontSize: 11, color: 'rgba(255,255,255,0.15)', fontWeight: '600', letterSpacing: 0.5 },
});
