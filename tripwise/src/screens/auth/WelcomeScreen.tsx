import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Easing, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { AuthStackParamList } from '../../navigation/types';
import { LinearGradient } from 'expo-linear-gradient';

type Nav = StackNavigationProp<AuthStackParamList, 'Welcome'>;
const { width: W, height: H } = Dimensions.get('window');

const FEATURES = [
  { icon: '✈️', label: 'Plan Trips',      desc: 'Organize every detail effortlessly' },
  { icon: '💸', label: 'Split Expenses',  desc: 'Fair, transparent & instant' },
  { icon: '👥', label: 'Travel Together', desc: 'Collaborate in real-time' },
];

export function WelcomeScreen() {
  const navigation = useNavigation<Nav>();

  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroY       = useRef(new Animated.Value(24)).current;
  const cardAnims   = FEATURES.map(() => useRef(new Animated.Value(0)).current);
  const btnOpacity  = useRef(new Animated.Value(0)).current;
  const orb1        = useRef(new Animated.Value(0)).current;
  const orb2        = useRef(new Animated.Value(0)).current;
  const orb3        = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Floating orb animations
    Animated.loop(
      Animated.sequence([
        Animated.timing(orb1, { toValue: 1, duration: 5000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(orb1, { toValue: 0, duration: 5000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(orb2, { toValue: 1, duration: 4200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(orb2, { toValue: 0, duration: 4200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(orb3, { toValue: 1, duration: 3600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(orb3, { toValue: 0, duration: 3600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Entrance sequence
    Animated.sequence([
      Animated.parallel([
        Animated.timing(heroOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(heroY, { toValue: 0, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.stagger(120, cardAnims.map((a) =>
        Animated.spring(a, { toValue: 1, friction: 8, tension: 60, useNativeDriver: true })
      )),
      Animated.timing(btnOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const orb1Y = orb1.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });
  const orb2Y = orb2.interpolate({ inputRange: [0, 1], outputRange: [0, 14] });
  const orb3Y = orb3.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  return (
    <LinearGradient colors={['#080C16', '#0D1320', '#111827']} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 0.3, y: 1 }}>
      {/* Ambient orbs */}
      <Animated.View style={[styles.orb1, { transform: [{ translateY: orb1Y }] }]} />
      <Animated.View style={[styles.orb2, { transform: [{ translateY: orb2Y }] }]} />
      <Animated.View style={[styles.orb3, { transform: [{ translateY: orb3Y }] }]} />

      {/* Hero */}
      <Animated.View style={[styles.hero, { opacity: heroOpacity, transform: [{ translateY: heroY }] }]}>
        <LinearGradient colors={['#5B8CFF', '#7B61FF']} style={styles.logoGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.logoEmoji}>✈️</Text>
        </LinearGradient>
        <Text style={styles.appName}>TripWise</Text>
        <Text style={styles.tagline}>Your premium travel companion</Text>
      </Animated.View>

      {/* Feature cards */}
      <View style={styles.features}>
        {FEATURES.map((f, i) => {
          const scale = cardAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] });
          const opacity = cardAnims[i];
          return (
            <Animated.View key={f.label} style={[styles.featureCard, { opacity, transform: [{ scale }] }]}>
              <View style={styles.featureIconWrap}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureLabel}>{f.label}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </Animated.View>
          );
        })}
      </View>

      {/* CTA */}
      <Animated.View style={[styles.cta, { opacity: btnOpacity }]}>
        <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.88} style={styles.btnWrap}>
          <LinearGradient colors={['#5B8CFF', '#7B61FF']} style={styles.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.btnTxt}>Get Started</Text>
            <Text style={styles.btnArrow}>→</Text>
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.footerTxt}>Free to use · No credit card required</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...(Platform.OS === 'web' ? { minHeight: '100vh' } : {}),
  } as any,
  orb1: {
    position: 'absolute', width: 400, height: 400, borderRadius: 200,
    backgroundColor: 'rgba(91,140,255,0.06)', top: -100, right: -120,
  },
  orb2: {
    position: 'absolute', width: 320, height: 320, borderRadius: 160,
    backgroundColor: 'rgba(123,97,255,0.05)', bottom: 60, left: -100,
  },
  orb3: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(53,208,127,0.04)', top: '40%', left: '60%',
  },
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingTop: 48 },
  logoGrad: {
    width: 88, height: 88, borderRadius: 28, justifyContent: 'center', alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#5B8CFF', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 28, elevation: 16,
  },
  logoEmoji: { fontSize: 42 },
  appName: { fontSize: 46, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1.8, marginBottom: 8 },
  tagline: { fontSize: 16, color: 'rgba(255,255,255,0.45)', fontWeight: '400', letterSpacing: 0.3 },
  features: { paddingHorizontal: 24, gap: 12, marginBottom: 36 },
  featureCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  featureIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center', alignItems: 'center',
  },
  featureIcon: { fontSize: 22 },
  featureLabel: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 },
  featureDesc: { fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: '400', lineHeight: 18 },
  cta: { paddingHorizontal: 24, paddingBottom: 52, gap: 16 },
  btnWrap: {
    borderRadius: 20, overflow: 'hidden',
    shadowColor: '#5B8CFF', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 10,
  },
  btn: { height: 60, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  btnTxt: { fontSize: 17, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3 },
  btnArrow: { fontSize: 20, color: '#FFFFFF', fontWeight: '700' },
  footerTxt: { textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.25)', fontWeight: '500' },
});
