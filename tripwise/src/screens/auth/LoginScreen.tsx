import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { AuthStackParamList } from '../../navigation/types';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Mail, Phone } from 'lucide-react-native';

type Nav = StackNavigationProp<AuthStackParamList, 'Login'>;
type AuthMethod = 'email' | 'phone';
const { height: H } = Dimensions.get('window');

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const [method, setMethod] = useState<AuthMethod>('email');
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 550, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 550, useNativeDriver: true }),
    ]).start();
  }, []);

  const onFocus = () => {
    setFocused(true);
    Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  };
  const onBlur = () => {
    setFocused(false);
    Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.12)', '#3B82F6'],
  });

  const handleSendOtp = async () => {
    const value = identifier.trim();
    if (!value) {
      Alert.alert('Required', `Please enter your ${method === 'email' ? 'email address' : 'phone number'}.`);
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp(
        method === 'email' ? { email: value } : { phone: value }
      );
      if (error) { Alert.alert('Error', error.message); return; }
      navigation.navigate('OtpVerification', { identifier: value, method });
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#080E1A', '#0F172A', '#1A2744']} style={styles.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {/* Back */}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }} accessibilityLabel="Go back" accessibilityRole="button">
            <View style={styles.backCircle}>
              <ArrowLeft color="#fff" size={18} />
            </View>
          </TouchableOpacity>

          <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Welcome back 👋</Text>
              <Text style={styles.subtitle}>Sign in to continue your journey</Text>
            </View>

            {/* Glass card */}
            <View style={styles.card}>
              {/* Toggle */}
              <View style={styles.toggle}>
                {(['email', 'phone'] as AuthMethod[]).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.toggleBtn, method === m && styles.toggleBtnActive]}
                    onPress={() => { setMethod(m); setIdentifier(''); }}
                    activeOpacity={0.8}
                  >
                    {m === 'email'
                      ? <Mail size={14} color={method === m ? '#3B82F6' : 'rgba(255,255,255,0.4)'} />
                      : <Phone size={14} color={method === m ? '#3B82F6' : 'rgba(255,255,255,0.4)'} />
                    }
                    <Text style={[styles.toggleTxt, method === m && styles.toggleTxtActive]}>
                      {m === 'email' ? 'Email' : 'Phone'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Input */}
              <Animated.View style={[styles.inputWrap, { borderColor }]}>
                {method === 'email'
                  ? <Mail size={17} color={focused ? '#3B82F6' : 'rgba(255,255,255,0.35)'} />
                  : <Phone size={17} color={focused ? '#3B82F6' : 'rgba(255,255,255,0.35)'} />
                }
                <TextInput
                  style={styles.input}
                  placeholder={method === 'email' ? 'you@example.com' : '+91 98765 43210'}
                  placeholderTextColor="rgba(255,255,255,0.28)"
                  value={identifier}
                  onChangeText={setIdentifier}
                  keyboardType={method === 'email' ? 'email-address' : 'phone-pad'}
                  autoCapitalize="none"
                  autoFocus
                  editable={!isLoading}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </Animated.View>

              {/* Send OTP */}
              <TouchableOpacity onPress={handleSendOtp} disabled={isLoading} activeOpacity={0.88} style={styles.sendWrap}>
                <LinearGradient colors={['#3B82F6', '#6366F1']} style={styles.sendBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={styles.sendTxt}>{isLoading ? 'Sending…' : 'Send Code →'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <Text style={styles.terms}>By continuing, you agree to our Terms & Privacy Policy</Text>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  kav: { flex: 1 },
  backBtn: { paddingHorizontal: 16, paddingTop: 8 },
  backCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  header: { marginBottom: 32 },
  title: { fontSize: 34, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1, marginBottom: 8 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.5)', fontWeight: '400' },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
    gap: 14,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12, padding: 3, gap: 3,
  },
  toggleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 9,
  },
  toggleBtnActive: {
    backgroundColor: 'rgba(59,130,246,0.18)',
    borderWidth: 1, borderColor: 'rgba(59,130,246,0.4)',
  },
  toggleTxt: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.45)' },
  toggleTxtActive: { color: '#60A5FA' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 4,
    borderWidth: 1.5,
  },
  input: { flex: 1, height: 52, fontSize: 16, color: '#FFFFFF', fontWeight: '500' },
  sendWrap: {
    borderRadius: 14, overflow: 'hidden',
    shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  sendBtn: { height: 56, justifyContent: 'center', alignItems: 'center' },
  sendTxt: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3 },
  terms: { textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.28)', marginTop: 24, lineHeight: 18 },
});
