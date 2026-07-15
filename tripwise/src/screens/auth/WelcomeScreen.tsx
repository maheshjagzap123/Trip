import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { AuthStackParamList } from '../../navigation/types';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '../../theme';

type NavigationProp = StackNavigationProp<AuthStackParamList, 'Welcome'>;
const { width, height } = Dimensions.get('window');

const FEATURES = [
  { icon: '✈️', label: 'Plan Trips' },
  { icon: '💸', label: 'Split Expenses' },
  { icon: '👥', label: 'Invite Friends' },
];

export function WelcomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const colors = useThemeColors();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const btnAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
      Animated.timing(btnAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <LinearGradient colors={['#0F172A', '#1E3A5F', '#0F4C75']} style={styles.container}>
      {/* Decorative circles */}
      <View style={[styles.circle, styles.circle1]} />
      <View style={[styles.circle, styles.circle2]} />
      <View style={[styles.circle, styles.circle3]} />

      {/* Hero */}
      <Animated.View style={[styles.hero, { opacity: fadeAnim, transform: [{ scale: scaleAnim }, { translateY: slideAnim }] }]}>
        <View style={styles.logoContainer}>
          <LinearGradient colors={['#00C896', '#0EA5E9']} style={styles.logoGradient}>
            <Text style={styles.logoEmoji}>✈️</Text>
          </LinearGradient>
        </View>
        <Text style={styles.appName}>TripWise</Text>
        <Text style={styles.tagline}>Travel smarter, together.</Text>

        {/* Feature pills */}
        <View style={styles.features}>
          {FEATURES.map((f, i) => (
            <Animated.View
              key={f.label}
              style={[styles.featurePill, { opacity: fadeAnim, transform: [{ translateY: Animated.multiply(slideAnim, new Animated.Value(0.5 + i * 0.3)) }] }]}
            >
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </Animated.View>
          ))}
        </View>
      </Animated.View>

      {/* CTA */}
      <Animated.View style={[styles.actions, { opacity: btnAnim, transform: [{ translateY: Animated.multiply(Animated.subtract(new Animated.Value(1), btnAnim), new Animated.Value(20)) }] }]}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#00C896', '#00A87E']} style={styles.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.btnText}>Get Started →</Text>
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.footerText}>Free to use · No credit card required</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between', paddingBottom: 48 },
  circle: { position: 'absolute', borderRadius: 999, opacity: 0.08, backgroundColor: '#00C896' },
  circle1: { width: 300, height: 300, top: -80, right: -80 },
  circle2: { width: 200, height: 200, top: height * 0.3, left: -60 },
  circle3: { width: 150, height: 150, bottom: 100, right: -40 },
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  logoContainer: { marginBottom: 20, shadowColor: '#00C896', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 12 },
  logoGradient: { width: 96, height: 96, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  logoEmoji: { fontSize: 48 },
  appName: { fontSize: 48, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1, marginBottom: 8 },
  tagline: { fontSize: 18, color: 'rgba(255,255,255,0.65)', fontWeight: '400', marginBottom: 40 },
  features: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center' },
  featurePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  featureIcon: { fontSize: 16 },
  featureLabel: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  actions: { paddingHorizontal: 24, gap: 16 },
  primaryBtn: { borderRadius: 18, overflow: 'hidden', shadowColor: '#00C896', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  btnGradient: { height: 60, justifyContent: 'center', alignItems: 'center' },
  btnText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },
  footerText: { textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: '500' },
});
