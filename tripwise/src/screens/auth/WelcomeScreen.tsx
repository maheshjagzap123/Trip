import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { AuthStackParamList } from '../../navigation/types';
import { LinearGradient } from 'expo-linear-gradient';

type Nav = StackNavigationProp<AuthStackParamList, 'Welcome'>;
const { width: W, height: H } = Dimensions.get('window');

const FEATURES = [
  { icon: '✈️', label: 'Plan Trips',      desc: 'Organize every detail' },
  { icon: '💸', label: 'Split Expenses',  desc: 'Fair & transparent' },
  { icon: '👥', label: 'Invite Friends',  desc: 'Travel together' },
];

export function WelcomeScreen() {
  const navigation = useNavigation<Nav>();

  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroY       = useRef(new Animated.Value(30)).current;
  const cardAnims   = FEATURES.map(() => useRef(new Animated.Value(0)).current);
  const btnOpacity  = useRef(new Animated.Value(0)).current;
  const orb1        = useRef(new Animated.Value(0)).current;
  const orb2        = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(orb1, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(orb1, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(orb2, { toValue: 1, duration: 3400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(orb2, { toValue: 0, duration: 3400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    Animated.sequence([
      Animated.parallel([
        Animated.timing(heroOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(heroY, { toValue: 0, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.stagger(100, cardAnims.map((a) =>
        Animated.spring(a, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true })
      )),
      Animated.timing(btnOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const orb1Y = orb1.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });
  const orb2Y = orb2.interpolate({ inputRange: [0, 1], outputRange: [0, 16] });

  return (
    <LinearGradient colors={['#080E1A', '#0F172A', '#1A2744']} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <Animated.View style={[styles.orb1, { transform: [{ translateY: orb1Y }] }]} />
      <Animated.View style={[styles.orb2, { transform: [{ translateY: orb2Y }] }]} />

      {/* Hero */}
      <Animated.View style={[styles.hero, { opacity: heroOpacity, transform: [{ translateY: heroY }] }]}>
        <LinearGradient colors={['#3B82F6', '#8B5CF6']} style={styles.logoGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.logoEmoji}>✈️</Text>
        </LinearGradient>
        <Text style={styles.appName}>TripWise</Text>
        <Text style={styles.tagline}>Your ultimate travel companion</Text>
      </Animated.View>

      {/* Feature cards */}
      <View style={styles.features}>
        {FEATURES.map((f, i) => {
          const scale = cardAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
          const opacity = cardAnims[i];
          return (
            <Animated.View key={f.label} style={[styles.featureCard, { opacity, transform: [{ scale }] }]}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
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
          <LinearGradient colors={['#3B82F6', '#6366F1']} style={styles.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
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
  container: { flex: 1 },
  orb1: {
    position: 'absolute', width: 360, height: 360, borderRadius: 180,
    backgroundColor: 'rgba(59,130,246,0.07)', top: -80, right: -100,
  },
  orb2: {
    position: 'absolute', width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'rgba(139,92,246,0.06)', bottom: 80, left: -80,
  },
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingTop: 40 },
  logoGrad: {
    width: 96, height: 96, borderRadius: 28, justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.45, shadowRadius: 24, elevation: 16,
  },
  logoEmoji: { fontSize: 46 },
  appName: { fontSize: 44, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1.5, marginBottom: 10 },
  tagline: { fontSize: 16, color: 'rgba(255,255,255,0.5)', fontWeight: '400', letterSpacing: 0.2 },
  features: { paddingHorizontal: 24, gap: 10, marginBottom: 32 },
  featureCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  featureIcon: { fontSize: 26, width: 36, textAlign: 'center' },
  featureLabel: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 },
  featureDesc: { fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: '400' },
  cta: { paddingHorizontal: 24, paddingBottom: 48, gap: 14 },
  btnWrap: {
    borderRadius: 18, overflow: 'hidden',
    shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10,
  },
  btn: { height: 60, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  btnTxt: { fontSize: 17, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3 },
  btnArrow: { fontSize: 20, color: '#FFFFFF', fontWeight: '700' },
  footerTxt: { textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: '500' },
});
