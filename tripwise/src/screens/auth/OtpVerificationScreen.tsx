import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { AuthStackParamList } from '../../navigation/types';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';

type RouteProps = RouteProp<AuthStackParamList, 'OtpVerification'>;

export function OtpVerificationScreen() {
  const route = useRoute<RouteProps>();
  const { identifier, method } = route.params;
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(60);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleVerify = async () => {
    if (otp.length !== 6) { setError('Please enter the 6-digit code.'); shake(); return; }
    setError('');
    setIsLoading(true);
    try {
      const { error: err } = await supabase.auth.verifyOtp({
        ...(method === 'email' ? { email: identifier } : { phone: identifier }),
        token: otp,
        type: method === 'email' ? 'email' : 'sms',
      });
      if (err) { setError(err.message); shake(); }
    } catch {
      setError('Verification failed. Please try again.');
      shake();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    const { error: err } = await supabase.auth.signInWithOtp({
      ...(method === 'email' ? { email: identifier } : { phone: identifier }),
    });
    if (!err) setResendCooldown(60);
  };

  // Render 6 digit boxes
  const digits = otp.padEnd(6, ' ').split('');

  return (
    <LinearGradient colors={['#0F172A', '#1E3A5F']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Icon */}
          <View style={styles.iconWrap}>
            <LinearGradient colors={['#00C896', '#0EA5E9']} style={styles.iconGrad}>
              <Text style={styles.iconEmoji}>{method === 'email' ? '📧' : '📱'}</Text>
            </LinearGradient>
          </View>

          <Text style={styles.title}>Check your {method}</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{'\n'}
            <Text style={styles.identifier}>{identifier}</Text>
          </Text>

          {/* Hidden real input */}
          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            value={otp}
            onChangeText={(t) => { setOtp(t.replace(/[^0-9]/g, '').slice(0, 6)); setError(''); }}
            keyboardType="number-pad"
            maxLength={6}
          />

          {/* Digit boxes */}
          <Animated.View style={[styles.digitRow, { transform: [{ translateX: shakeAnim }] }]}>
            {digits.map((d, i) => {
              const filled = i < otp.length;
              const active = i === otp.length;
              return (
                <TouchableOpacity key={i} style={[styles.digitBox, filled && styles.digitBoxFilled, active && styles.digitBoxActive]} onPress={() => inputRef.current?.focus()}>
                  <Text style={[styles.digitTxt, filled && styles.digitTxtFilled]}>{filled ? d : ''}</Text>
                  {active && <View style={styles.cursor} />}
                </TouchableOpacity>
              );
            })}
          </Animated.View>

          {error ? <Text style={styles.errorTxt}>{error}</Text> : null}

          {/* Verify */}
          <TouchableOpacity onPress={handleVerify} disabled={isLoading} activeOpacity={0.85} style={styles.verifyWrap}>
            <LinearGradient colors={otp.length === 6 ? ['#00C896', '#00A87E'] : ['#334155', '#334155']} style={styles.verifyBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.verifyTxt}>{isLoading ? 'Verifying...' : 'Verify Code'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Resend */}
          <TouchableOpacity onPress={handleResend} disabled={resendCooldown > 0} style={styles.resend}>
            <Text style={[styles.resendTxt, resendCooldown === 0 && styles.resendActive]}>
              {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 28, justifyContent: 'center', alignItems: 'center' },
  iconWrap: { marginBottom: 24, shadowColor: '#00C896', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
  iconGrad: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  iconEmoji: { fontSize: 36 },
  title: { fontSize: 30, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5, marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  identifier: { color: '#00C896', fontWeight: '700' },
  hiddenInput: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  digitRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  digitBox: { width: 48, height: 60, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  digitBoxFilled: { backgroundColor: 'rgba(0,200,150,0.12)', borderColor: '#00C896' },
  digitBoxActive: { borderColor: '#00C896', backgroundColor: 'rgba(0,200,150,0.08)' },
  digitTxt: { fontSize: 24, fontWeight: '700', color: 'rgba(255,255,255,0.3)' },
  digitTxtFilled: { color: '#FFFFFF' },
  cursor: { position: 'absolute', width: 2, height: 28, backgroundColor: '#00C896', borderRadius: 1 },
  errorTxt: { color: '#F87171', fontSize: 14, marginBottom: 16, textAlign: 'center' },
  verifyWrap: { width: '100%', borderRadius: 16, overflow: 'hidden', marginTop: 8, shadowColor: '#00C896', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  verifyBtn: { height: 56, justifyContent: 'center', alignItems: 'center' },
  verifyTxt: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },
  resend: { marginTop: 24, padding: 8 },
  resendTxt: { fontSize: 15, color: 'rgba(255,255,255,0.35)', fontWeight: '500' },
  resendActive: { color: '#00C896', fontWeight: '600' },
});
