import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, Platform, ActivityIndicator,
} from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useThemeColors, typography, spacing, borderRadius } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Cloud, CloudOff, Check, HardDrive } from 'lucide-react-native';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = '596689950582-me8hjlaj74c53pi7e57gins8mf9js8n5.apps.googleusercontent.com';

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

interface Props {
  onClose: () => void;
}

export function ConnectDriveScreen({ onClose }: Props) {
  const colors = useThemeColors();
  const { user } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [driveEmail, setDriveEmail] = useState('');

  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'tripwise' });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/userinfo.email'],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    },
    discovery
  );

  useEffect(() => { checkConnection(); }, []);

  useEffect(() => {
    if (response?.type === 'success' && response.params.code) {
      exchangeCodeForToken(response.params.code);
    }
  }, [response]);

  const checkConnection = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('cloud_connections')
      .select('id, provider_email')
      .eq('user_id', user.id)
      .eq('provider', 'google_drive')
      .single();

    if (data) {
      setIsConnected(true);
      setDriveEmail(data.provider_email || '');
    }
    setIsLoading(false);
  };

  const exchangeCodeForToken = async (code: string) => {
    if (!user) return;
    setIsConnecting(true);
    try {
      // Exchange code for tokens
      const tokenResponse = await fetch(discovery.tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
          code_verifier: request?.codeVerifier || '',
        }).toString(),
      });

      const tokens = await tokenResponse.json();

      if (tokens.error) {
        showAlert('Error', tokens.error_description || 'Failed to connect');
        return;
      }

      // Get user email from Google
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const userInfo = await userInfoRes.json();

      // Store in Supabase
      await supabase.from('cloud_connections').upsert({
        user_id: user.id,
        provider: 'google_drive',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        provider_email: userInfo.email,
      }, { onConflict: 'user_id,provider' });

      // Create TripWise folder in Drive
      await createTripWiseFolder(tokens.access_token);

      setIsConnected(true);
      setDriveEmail(userInfo.email || '');
      showAlert('Connected!', `Google Drive connected as ${userInfo.email}`);
    } catch (err: any) {
      showAlert('Error', err.message || 'Connection failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const createTripWiseFolder = async (accessToken: string) => {
    // Check if folder exists
    const searchRes = await fetch(
      "https://www.googleapis.com/drive/v3/files?q=name='TripWise' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const searchData = await searchRes.json();

    if (searchData.files && searchData.files.length > 0) return; // Already exists

    // Create folder
    await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'TripWise',
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });
  };

  const handleDisconnect = async () => {
    const confirm = Platform.OS === 'web'
      ? window.confirm('Disconnect Google Drive? Your uploaded files will remain in Drive.')
      : await new Promise((r) => Alert.alert('Disconnect', 'Remove Google Drive connection?', [{ text: 'Cancel', onPress: () => r(false) }, { text: 'Disconnect', style: 'destructive', onPress: () => r(true) }]));

    if (!confirm || !user) return;

    await supabase.from('cloud_connections').delete().eq('user_id', user.id).eq('provider', 'google_drive');
    setIsConnected(false);
    setDriveEmail('');
  };

  const showAlert = (t: string, m: string) => {
    Platform.OS === 'web' ? window.alert(`${t}: ${m}`) : Alert.alert(t, m);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onClose}><ArrowLeft color={colors.textPrimary} size={22} /></TouchableOpacity>
        <Text style={[typography.h3, { color: colors.textPrimary, marginLeft: spacing.sm }]}>Cloud Storage</Text>
      </View>

      <View style={styles.content}>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            {/* Drive Card */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.providerIcon, { backgroundColor: isConnected ? 'rgba(0,200,150,0.12)' : colors.inputBackground }]}>
                  <HardDrive size={24} color={isConnected ? colors.primary : colors.textTertiary} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={[typography.labelLarge, { color: colors.textPrimary }]}>Google Drive</Text>
                  <Text style={[typography.caption, { color: colors.textTertiary }]}>
                    {isConnected ? `Connected • ${driveEmail}` : 'Not connected'}
                  </Text>
                </View>
                {isConnected && <Check size={20} color={colors.primary} />}
              </View>

              <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.md }]}>
                {isConnected
                  ? 'Your trip photos can be saved to the TripWise folder in your Google Drive. This saves storage on our servers and gives you full control over your files.'
                  : 'Connect your Google Drive to save trip photos directly to your own cloud storage. Free up server space and keep your memories safe.'}
              </Text>

              {isConnected ? (
                <TouchableOpacity
                  style={[styles.disconnectBtn, { borderColor: colors.error }]}
                  onPress={handleDisconnect}
                >
                  <CloudOff size={16} color={colors.error} />
                  <Text style={[typography.labelMedium, { color: colors.error, marginLeft: spacing.xs }]}>Disconnect</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.connectBtn, { backgroundColor: colors.primary, opacity: isConnecting ? 0.6 : 1 }]}
                  onPress={() => promptAsync()}
                  disabled={!request || isConnecting}
                >
                  <Cloud size={18} color="#fff" />
                  <Text style={[typography.labelMedium, { color: '#fff', marginLeft: spacing.sm }]}>
                    {isConnecting ? 'Connecting...' : 'Connect Google Drive'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Info */}
            <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[typography.labelSmall, { color: colors.textTertiary }]}>HOW IT WORKS</Text>
              <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.sm }]}>
                • Photos upload to a "TripWise" folder in your Drive{'\n'}
                • Each trip gets its own sub-folder{'\n'}
                • We only store the file link, not the file itself{'\n'}
                • You can disconnect anytime — files stay in your Drive{'\n'}
                • 15GB free with every Google account
              </Text>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1 },
  content: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  card: { borderRadius: borderRadius.lg, borderWidth: 1, padding: spacing.lg, marginBottom: spacing.lg },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  providerIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  connectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: borderRadius.md, marginTop: spacing.lg },
  disconnectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: borderRadius.md, borderWidth: 1, marginTop: spacing.lg },
  infoCard: { borderRadius: borderRadius.lg, borderWidth: 1, padding: spacing.lg },
});
