import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function SplashScreen() {
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const dotScale = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Sequence: logo appears → text fades in → tagline → pulse
    Animated.sequence([
      // Logo scales up + fades in
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      // App name fades in
      Animated.timing(textOpacity, { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      // Tagline fades in
      Animated.timing(taglineOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      // Loading dot appears
      Animated.spring(dotScale, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();

    // Continuous pulse on the dot
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <LinearGradient colors={['#0A0F1E', '#0F172A', '#1E3A5F']} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      {/* Decorative circles */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      {/* Logo */}
      <Animated.View style={[styles.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <LinearGradient colors={['#00C896', '#0EA5E9']} style={styles.logoGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.logoEmoji}>✈️</Text>
        </LinearGradient>
      </Animated.View>

      {/* App Name */}
      <Animated.Text style={[styles.appName, { opacity: textOpacity }]}>
        TripWise
      </Animated.Text>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Travel smarter, together
      </Animated.Text>

      {/* Loading indicator */}
      <Animated.View style={[styles.loadingDot, { transform: [{ scale: Animated.multiply(dotScale, pulseAnim) }] }]}>
        <LinearGradient colors={['#00C896', '#0EA5E9']} style={styles.dot} />
      </Animated.View>

      {/* Version */}
      <Text style={styles.version}>v1.0.0</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bgCircle1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(0,200,150,0.03)', top: -50, right: -80 },
  bgCircle2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(14,165,233,0.04)', bottom: -30, left: -60 },
  logoWrap: { marginBottom: 24, shadowColor: '#00C896', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 15 },
  logoGrad: { width: 100, height: 100, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  logoEmoji: { fontSize: 44 },
  appName: { fontSize: 36, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1, marginBottom: 8 },
  tagline: { fontSize: 16, color: 'rgba(255,255,255,0.5)', fontWeight: '500', marginBottom: 48 },
  loadingDot: { width: 12, height: 12, borderRadius: 6, overflow: 'hidden' },
  dot: { width: 12, height: 12, borderRadius: 6 },
  version: { position: 'absolute', bottom: 32, fontSize: 12, color: 'rgba(255,255,255,0.2)', fontWeight: '500' },
});
