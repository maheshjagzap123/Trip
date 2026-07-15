import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { AuthStackParamList } from '../../navigation/types';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '../../theme';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Mail, Phone } from 'lucide-react-native';

type NavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;
type AuthMethod = 'email' | 'phone';

export function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  const colors = useThemeColors();
  const [method, setMethod] = useState<AuthMethod>('email');
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSendOtp = async () => {
    const value = identifier.trim();
    if (!value) {
      Alert.alert('Error', `Please enter your ${method === 'email' ? 'email address' : 'phone number'}.`);
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
    <LinearGradient colors={['#0F172A', '#1E3A5F']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {/* Back */}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <View style={styles.backCircle}>
              <ArrowLeft color="#fff" size={20} />
            </View>
          </TouchableOpacity>

          <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Welcome back 👋</Text>
              <Text style={styles.subtitle}>Sign in to continue your journey</Text>
            </View>

            {/* Card */}
            <View style={styles.card}>
              {/* Toggle */}
              <View style={styles.toggle}>
                {(['email', 'phone'] as AuthMethod[]).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.toggleBtn, method === m && styles.toggleBtnActive]}
                    onPress={() => { setMethod(m); setIdentifier(''); }}
                  >
                    {m === 'email'
                      ? <Mail size={15} color={method === m ? '#fff' : 'rgba(255,255,255,0.5)'} />
                      : <Phone size={15} color={method === m ? '#fff' : 'rgba(255,255,255,0.5)'} />
                    }
                    <Text style={[styles.toggleTxt, method === m && styles.toggleTxtActive]}>
                      {m === 'email' ? 'Email' : 'Phone'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Input */}
              <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
                {method === 'email'
                  ? <Mail size={18} color={focused ? '#00C896' : 'rgba(255,255,255,0.4)'} />
                  : <Phone size={18} color={focused ? '#00C896' : 'rgba(255,255,255,0.4)'} />
                }
                <TextInput
                  style={styles.input}
                  placeholder={method === 'email' ? 'you@example.com' : '+91 98765 43210'}
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={identifier}
                  onChangeText={setIdentifier}
                  keyboardType={method === 'email' ? 'email-address' : 'phone-pad'}
                  autoCapitalize="none"
                  autoFocus
                  editable={!isLoading}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                />
              </View>

              {/* Send Button */}
              <TouchableOpacity onPress={handleSendOtp} disabled={isLoading} activeOpacity={0.85}>
                <LinearGradient colors={['#00C896', '#00A87E']} style={styles.sendBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {isLoading
                    ? <Text style={styles.sendTxt}>Sending...</Text>
                    : <Text style={styles.sendTxt}>Send Code →</Text>
                  }
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
  backBtn: { padding: 16 },
  backCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  header: { marginBottom: 32 },
  title: { fontSize: 34, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.55)', fontWeight: '400' },
  card: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', gap: 16 },
  toggle: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 14, padding: 4, gap: 4 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  toggleBtnActive: { backgroundColor: 'rgba(0,200,150,0.25)', borderWidth: 1, borderColor: 'rgba(0,200,150,0.4)' },
  toggleTxt: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  toggleTxtActive: { color: '#00C896' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  inputWrapFocused: { borderColor: '#00C896', backgroundColor: 'rgba(0,200,150,0.05)' },
  input: { flex: 1, height: 52, fontSize: 16, color: '#FFFFFF', fontWeight: '500' },
  sendBtn: { height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  sendTxt: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },
  terms: { textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 24, lineHeight: 18 },
});
