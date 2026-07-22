import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, Platform, ActivityIndicator, Linking, BackHandler,
} from 'react-native';
import { useThemeColors, typography, spacing, borderRadius } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Cloud, CloudOff, Check, HardDrive } from 'lucide-react-native';

const GOOGLE_CLIENT_ID = '596689950582-me8hjlaj74c53pi7e57gins8mf9js8n5.apps.googleusercontent.com';

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

  useEffect(() => { checkConnection(); }, []);

  useEffect(() => {
    const bh = BackHandler.addEventListener('hardwareBackPress', () => { onClose(); return true; });
    return () => bh.remove();
  }, [onClose]);

  const checkConnection = async () => {
    if (!user) { setIsLoading(false); return; }
    try {
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
    } catch {}
    setIsLoading(false);
  };

  const handleConnect = async () => {
    if (!user) return;
    setIsConnecting(true);

    try {
      // Build OAuth URL manually (works on web and native)
      const redirectUri = Platform.OS === 'web' 
        ? window.location.origin 
        : 'tripwise://oauth-callback';

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=token` +
        `&scope=${encodeURIComponent('https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email')}` +
        `&prompt=consent`;

      if (Platform.OS === 'web') {
        // Open popup for web
        const popup = window.open(authUrl, 'google-auth', 'width=500,height=600');

        // Listen for the redirect with token
        const checkPopup = setInterval(async () => {
          try {
            if (popup?.closed) {
              clearInterval(checkPopup);
              setIsConnecting(false);
              return;
            }
            const url = popup?.location.href;
            if (url && url.includes('access_token')) {
              clearInterval(checkPopup);
              popup?.close();

              // Extract access token from URL hash
              const hash = url.split('#')[1];
              const params = new URLSearchParams(hash);
              const accessToken = params.get('access_token');

              if (accessToken) {
                await saveConnection(accessToken);
              }
            }
          } catch {
            // Cross-origin error — popup still on Google domain, keep waiting
          }
        }, 500);
      } else {
        // Native: open in browser
        await Linking.openURL(authUrl);
      }
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to connect');
      setIsConnecting(false);
    }
  };

  const saveConnection = async (accessToken: string) => {
    if (!user) return;
    try {
      // Get user email
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const userInfo = await userInfoRes.json();

      // Store in Supabase — use a far-future expiry so token persists
      // until user manually disconnects or Google rejects it
      await supabase.from('cloud_connections').upsert({
        user_id: user.id,
        provider: 'google_drive',
        access_token: accessToken,
        provider_email: userInfo.email,
        expires_at: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
      }, { onConflict: 'user_id,provider' });

      // Create TripWise folder
      await createTripWiseFolder(accessToken);

      setIsConnected(true);
      setDriveEmail(userInfo.email || '');
      showAlert('Connected!', `Google Drive connected as ${userInfo.email}`);
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to save connection');
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
                  onPress={handleConnect}
                  disabled={isConnecting}
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
