import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, Animated, Dimensions, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { AuthStackParamList } from '../../navigation/types';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Mail, Phone } from 'lucide-react-native';
import { TermsOfServiceScreen } from './TermsOfServiceScreen';
import { PrivacyPolicyScreen } from './PrivacyPolicyScreen';

type Nav = StackNavigationProp<AuthStackParamList, 'Login'>;
type AuthMethod = 'email' | 'phone';
const { height: H } = Dimensions.get('window');

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const [method, setMethod] = useState<AuthMethod>('email');
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(32)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const onFocus = () => {
    setFocused(true);
    Animated.timing(borderAnim, { toValue: 1, duration: 250, useNativeDriver: false }).start();
  };
  const onBlur = () => {
    setFocused(false);
    Animated.timing(borderAnim, { toValue: 0, duration: 250, useNativeDriver: false }).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.08)', '#5B8CFF'],
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
    <LinearGradient colors={['#080C16', '#0D1320', '#111827']} style={styles.gradient} start={{ x: 0, y: 0 }} end={{ x: 0.3, y: 1 }}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {/* Back */}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }} accessibilityLabel="Go back" accessibilityRole="button">
            <View style={styles.backCircle}>
              <ArrowLeft color="#fff" size={18} strokeWidth={2.2} />
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
                      ? <Mail size={15} color={method === m ? '#5B8CFF' : 'rgba(255,255,255,0.35)'} strokeWidth={2} />
                      : <Phone size={15} color={method === m ? '#5B8CFF' : 'rgba(255,255,255,0.35)'} strokeWidth={2} />
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
                  ? <Mail size={18} color={focused ? '#5B8CFF' : 'rgba(255,255,255,0.3)'} strokeWidth={1.8} />
                  : <Phone size={18} color={focused ? '#5B8CFF' : 'rgba(255,255,255,0.3)'} strokeWidth={1.8} />
                }
                <TextInput
                  style={styles.input}
                  placeholder={method === 'email' ? 'you@example.com' : '+91 98765 43210'}
                  placeholderTextColor="rgba(255,255,255,0.22)"
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
                <LinearGradient colors={['#5B8CFF', '#7B61FF']} style={styles.sendBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={styles.sendTxt}>{isLoading ? 'Sending…' : 'Send Code →'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <Text style={styles.terms}>
              By continuing, you agree to our{' '}
              <Text style={styles.termsLink} onPress={() => setShowTerms(true)}>Terms of Service</Text>
              {' & '}
              <Text style={styles.termsLink} onPress={() => setShowPrivacy(true)}>Privacy Policy</Text>
            </Text>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Terms of Service Modal */}
      <Modal visible={showTerms} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setShowTerms(false)}>
        <TermsOfServiceScreen onClose={() => setShowTerms(false)} />
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal visible={showPrivacy} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setShowPrivacy(false)}>
        <PrivacyPolicyScreen onClose={() => setShowPrivacy(false)} />
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  kav: { flex: 1 },
  backBtn: { paddingHorizontal: 20, paddingTop: 12 },
  backCircle: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  header: { marginBottom: 36 },
  title: { fontSize: 34, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1.2, marginBottom: 8 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.45)', fontWeight: '400', lineHeight: 22 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    gap: 16,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 14, padding: 4, gap: 4,
  },
  toggleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 10,
  },
  toggleBtnActive: {
    backgroundColor: 'rgba(91,140,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(91,140,255,0.3)',
  },
  toggleTxt: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.4)' },
  toggleTxtActive: { color: '#5B8CFF' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 16, paddingHorizontal: 18, paddingVertical: 4,
    borderWidth: 1,
  },
  input: { flex: 1, height: 54, fontSize: 16, color: '#FFFFFF', fontWeight: '500' },
  sendWrap: {
    borderRadius: 16, overflow: 'hidden',
    shadowColor: '#5B8CFF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 8,
  },
  sendBtn: { height: 58, justifyContent: 'center', alignItems: 'center' },
  sendTxt: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3 },
  terms: { textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.22)', marginTop: 28, lineHeight: 20 },
  termsLink: { color: '#5B8CFF', textDecorationLine: 'underline' },
});
