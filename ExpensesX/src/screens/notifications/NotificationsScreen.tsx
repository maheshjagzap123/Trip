import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, BackHandler,
  Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors, typography, spacing, borderRadius } from '../../theme';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Bell, UserPlus, MessageCircle, Check, CreditCard, Trash2 } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: any;
  read: boolean;
  created_at: string;
}

interface Props {
  onClose: () => void;
  onNavigateToTrip?: (tripId: string) => void;
}

export function NotificationsScreen({ onClose, onNavigateToTrip }: Props) {
  const colors = useThemeColors();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Handle Android hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => backHandler.remove();
  }, [onClose]);

  useEffect(() => {
    fetchNotifications();
    // Subscribe to new notifications
    const channel = supabase
      .channel('my-notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) setNotifications(data);
    setIsLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = async (id: string) => {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) {
      console.warn('Delete notification failed:', error.message);
      return;
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = async () => {
    const doDelete = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('notifications').delete().eq('user_id', user.id);
      setNotifications([]);
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Clear all notifications?')) {
        await doDelete();
      }
    } else {
      Alert.alert('Clear All', 'Delete all notifications?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const handleNotificationPress = async (item: Notification) => {
    // Just mark as read — no navigation
    if (!item.read) {
      await markAsRead(item.id);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'trip_invite': return <UserPlus size={18} color={colors.primary} />;
      case 'trip_accepted': return <Check size={18} color={colors.success} />;
      case 'new_message': return <MessageCircle size={18} color="#F59E0B" />;
      case 'expense_added': return <CreditCard size={18} color={colors.warning} />;
      case 'settlement_confirm_request': return <CreditCard size={18} color="#D97706" />;
      case 'settlement_confirmed': return <Check size={18} color={colors.success} />;
      case 'settlement_disputed': return <CreditCard size={18} color={colors.error} />;
      default: return <Bell size={18} color={colors.textTertiary} />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderItem = ({ item }: { item: Notification }) => (
    <View
      style={[styles.notifItem, { backgroundColor: item.read ? 'transparent' : colors.primaryLight, borderBottomColor: colors.border }]}
    >
      <TouchableOpacity
        style={{ flexDirection: 'row', flex: 1, alignItems: 'flex-start' }}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.notifIcon}>{getIcon(item.type)}</View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>{item.title}</Text>
          <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 2 }]} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 4 }]}>
            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
          </Text>
        </View>
      </TouchableOpacity>
      <View style={styles.notifRight}>
        {!item.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
        <TouchableOpacity
          onPress={() => deleteNotification(item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.deleteBtn}
        >
          <Trash2 size={15} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onClose} style={styles.headerBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} accessibilityLabel="Go back">
          <ArrowLeft color={colors.textPrimary} size={22} />
        </TouchableOpacity>
        <Text style={[typography.h3, { color: colors.textPrimary, flex: 1, marginLeft: spacing.sm }]}>
          Notifications
        </Text>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={clearAllNotifications} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ marginRight: spacing.sm }}>
            <Trash2 size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[typography.labelSmall, { color: colors.primary }]}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ flexGrow: 1 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Bell size={40} color={colors.textTertiary} />
            <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: spacing.md }]}>
              No notifications yet
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1 },
  headerBtn: { padding: spacing.xs },
  notifItem: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 0.5 },
  notifIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(128,128,128,0.08)', justifyContent: 'center', alignItems: 'center' },
  notifRight: { alignItems: 'center', justifyContent: 'center', marginLeft: spacing.xs, gap: 8 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  deleteBtn: { padding: 6 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
});
