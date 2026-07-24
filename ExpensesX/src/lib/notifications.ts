import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

/**
 * Push Notifications Setup for ExpenseX
 * 
 * Flow:
 * 1. Request permission on app startup
 * 2. Get Expo push token
 * 3. Save token to user's profile in Supabase
 * 4. When a notification is created in DB → Edge Function sends push via Expo API
 */

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register for push notifications and save token to Supabase.
 * Call this once after user logs in.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // Push notifications only work on physical devices
    if (!Device.isDevice) {
      console.log('[Notifications] Must use physical device for push notifications');
      return null;
    }

    // Check/request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permission not granted');
      return null;
    }

    // Android: set notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'ExpenseX',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#5B8CFF',
        sound: 'default',
      });
    }

    // Get Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '54c1f729-d743-4bf7-b3ee-8d1c39714170',
    });
    const token = tokenData.data;
    console.log('[Notifications] Push token:', token);

    // Save to Supabase profile
    await savePushToken(token);

    return token;
  } catch (err) {
    console.warn('[Notifications] Setup failed:', err);
    return null;
  }
}

/**
 * Save push token to user's profile in Supabase
 */
async function savePushToken(token: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('profiles')
    .update({ push_token: token })
    .eq('id', user.id);
}

/**
 * Listen for incoming notifications while app is in foreground.
 * Returns cleanup function.
 */
export function addNotificationListeners(
  onReceived?: (notification: Notifications.Notification) => void,
  onTapped?: (response: Notifications.NotificationResponse) => void,
): () => void {
  const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
    console.log('[Notifications] Received:', notification.request.content.title);
    onReceived?.(notification);
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('[Notifications] Tapped:', response.notification.request.content.title);
    onTapped?.(response);
  });

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}
