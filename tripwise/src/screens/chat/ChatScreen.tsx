import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, FlatList, KeyboardAvoidingView, Platform,
  Modal, Pressable, Dimensions, Alert, Clipboard, BackHandler,
} from 'react-native';
import { useThemeColors, typography, spacing, borderRadius } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore } from '../../stores/chatStore';
import { supabase } from '../../lib/supabase';
import type { Message } from '../../stores/chatStore';
import { ArrowLeft, Send, Pin, X, ChevronDown, Reply, Copy, Trash2, AlertTriangle, Search } from 'lucide-react-native';
import { format, isToday, isYesterday } from 'date-fns';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  tripId: string;
  tripName: string;
  onClose: () => void;
}

interface MenuPosition {
  x: number;
  y: number;
}

export function ChatScreen({ tripId, tripName, onClose }: Props) {
  const colors = useThemeColors();
  const { user, profile } = useAuthStore();
  const { messages, isLoading, isSending, fetchMessages, sendMessage, pinMessage, deleteMessage, deleteForEveryone, subscribeToChatRealtime } = useChatStore();
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({ x: 0, y: 0 });
  const [searchText, setSearchText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const presenceChannelRef = useRef<any>(null);

  useEffect(() => {
    fetchMessages(tripId);
    const unsub = subscribeToChatRealtime(tripId);

    // Handle Android hardware back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });

    // Set up typing indicator presence channel
    const presenceChannel = supabase
      .channel(`typing-${tripId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const typing: string[] = [];
        Object.values(state).forEach((presences: any) => {
          presences.forEach((p: any) => {
            if (p.is_typing && p.user_id !== user?.id) {
              typing.push(p.display_name || 'Someone');
            }
          });
        });
        setTypingUsers(typing);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: user?.id,
            display_name: profile?.display_name || 'Member',
            is_typing: false,
          });
        }
      });

    presenceChannelRef.current = presenceChannel;

    return () => {
      unsub();
      backHandler.remove();
      supabase.removeChannel(presenceChannel);
    };
  }, [tripId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(tripId, inputText, replyingTo?.id);
    setInputText('');
    setReplyingTo(null);
    // Stop typing indicator
    if (presenceChannelRef.current) {
      presenceChannelRef.current.track({ user_id: user?.id, display_name: profile?.display_name || 'Member', is_typing: false });
    }
  };

  const handleTextChange = (text: string) => {
    setInputText(text);
    // Broadcast typing state
    if (presenceChannelRef.current && text.trim()) {
      presenceChannelRef.current.track({ user_id: user?.id, display_name: profile?.display_name || 'Member', is_typing: true });
      // Auto-stop after 3 seconds of no typing
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        presenceChannelRef.current?.track({ user_id: user?.id, display_name: profile?.display_name || 'Member', is_typing: false });
      }, 3000);
    }
  };

  const formatMessageDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, 'h:mm a');
    if (isYesterday(date)) return 'Yesterday ' + format(date, 'h:mm a');
    return format(date, 'MMM d, h:mm a');
  };

  // Group messages by date for separators
  const shouldShowDateHeader = (index: number) => {
    if (index === 0) return true;
    const curr = new Date(messages[index].created_at).toDateString();
    const prev = new Date(messages[index - 1].created_at).toDateString();
    return curr !== prev;
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMM d');
  };

  const pinnedMessages = messages.filter((m) => m.is_pinned);

  // Filter messages based on search
  const filteredMessages = searchText.trim()
    ? messages.filter((m) => m.content.toLowerCase().includes(searchText.toLowerCase()))
    : messages;

  // --- Message Action Menu ---
  const openMessageMenu = useCallback((message: Message, event: any) => {
    // Get position from the touch event to position the menu
    const { pageX, pageY } = event.nativeEvent;
    const isMe = message.user_id === user?.id;

    // Position menu near the arrow, adjust if near screen edges
    let x = isMe ? pageX - 180 : pageX;
    let y = pageY + 5;

    // Keep menu within screen bounds
    if (x < 10) x = 10;
    if (x + 200 > SCREEN_WIDTH - 10) x = SCREEN_WIDTH - 210;
    if (y + 250 > Dimensions.get('window').height - 100) y = pageY - 250;

    setMenuPosition({ x, y });
    setSelectedMessage(message);
    setMenuVisible(true);
  }, [user?.id]);

  const closeMenu = () => {
    setMenuVisible(false);
    setSelectedMessage(null);
  };

  const handleReply = () => {
    if (selectedMessage) {
      setReplyingTo(selectedMessage);
    }
    closeMenu();
  };

  const handleCopy = () => {
    if (selectedMessage) {
      Clipboard.setString(selectedMessage.content);
    }
    closeMenu();
  };

  const handlePin = () => {
    if (selectedMessage) {
      pinMessage(selectedMessage.id, !selectedMessage.is_pinned, tripId);
    }
    closeMenu();
  };

  const handleDeleteForMe = () => {
    if (selectedMessage) {
      Alert.alert(
        'Delete Message',
        'This message will be deleted for you. Others in the chat will still be able to see it.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete for Me',
            style: 'destructive',
            onPress: () => deleteMessage(selectedMessage.id, tripId),
          },
        ]
      );
    }
    closeMenu();
  };

  const handleDeleteForEveryone = () => {
    if (selectedMessage) {
      Alert.alert(
        'Delete for Everyone',
        'This message will be permanently deleted for all participants in this chat.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete for Everyone',
            style: 'destructive',
            onPress: () => deleteForEveryone(selectedMessage.id, tripId),
          },
        ]
      );
    }
    closeMenu();
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.user_id === user?.id;
    const showHeader = shouldShowDateHeader(index);
    const showName = !isMe && (index === 0 || messages[index - 1].user_id !== item.user_id);

    return (
      <View>
        {showHeader && (
          <View style={styles.dateHeader}>
            <Text style={[typography.caption, { color: colors.textTertiary }]}>
              {getDateLabel(item.created_at)}
            </Text>
          </View>
        )}
        <View style={[styles.messageBubbleWrap, isMe ? styles.myMessageWrap : styles.otherMessageWrap]}>
          {showName && !isMe && (
            <Text style={[styles.senderName, { color: colors.primary }]}>
              {item.sender_name}
            </Text>
          )}
          {/* Reply preview */}
          {item.reply_to && (() => {
            const repliedMsg = messages.find((m) => m.id === item.reply_to);
            return repliedMsg ? (
              <View style={[styles.replyPreview, { borderColor: colors.primary }]}>
                <Text style={[styles.replyName, { color: colors.primary }]}>{repliedMsg.sender_name}</Text>
                <Text style={[styles.replyContent, { color: colors.textTertiary }]} numberOfLines={1}>{repliedMsg.content}</Text>
              </View>
            ) : null;
          })()}
          {/* Message bubble with dropdown arrow */}
          <View style={[styles.bubbleContainer, isMe ? { flexDirection: 'row' } : { flexDirection: 'row' }]}>
            <View style={[
              styles.bubble,
              isMe
                ? [styles.myBubble, { backgroundColor: colors.primary }]
                : [styles.otherBubble, { backgroundColor: colors.surface, borderColor: colors.border }]
            ]}>
              <Text style={[
                typography.bodyMedium,
                { color: isMe ? '#fff' : colors.textPrimary }
              ]}>
                {item.content}
              </Text>
              <View style={styles.bubbleMeta}>
                {item.is_pinned && <Pin size={10} color={isMe ? 'rgba(255,255,255,0.6)' : colors.textTertiary} />}
                <Text style={[styles.timeText, { color: isMe ? 'rgba(255,255,255,0.6)' : colors.textTertiary }]}>
                  {format(new Date(item.created_at), 'h:mm a')}
                </Text>
              </View>
              {/* Down arrow button - positioned at top-right of bubble */}
              <TouchableOpacity
                style={[
                  styles.dropdownArrow,
                  {
                    backgroundColor: isMe ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)',
                  }
                ]}
                onPress={(e) => openMessageMenu(item, e)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Message options"
              >
                <ChevronDown size={14} color={isMe ? 'rgba(255,255,255,0.7)' : colors.textTertiary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // --- Message Actions Popup Menu ---
  const renderMessageMenu = () => {
    if (!selectedMessage) return null;
    const isMe = selectedMessage.user_id === user?.id;

    const menuItems = [
      {
        label: 'Reply',
        icon: <Reply size={18} color={colors.textPrimary} />,
        onPress: handleReply,
      },
      {
        label: 'Copy',
        icon: <Copy size={18} color={colors.textPrimary} />,
        onPress: handleCopy,
      },
      {
        label: selectedMessage.is_pinned ? 'Unpin' : 'Pin',
        icon: <Pin size={18} color={colors.textPrimary} />,
        onPress: handlePin,
      },
      {
        label: 'Delete for Me',
        icon: <Trash2 size={18} color={colors.error || '#ef4444'} />,
        onPress: handleDeleteForMe,
        danger: true,
      },
      // Only show "Delete for Everyone" if the message is mine
      ...(isMe ? [{
        label: 'Delete for Everyone',
        icon: <AlertTriangle size={18} color={colors.error || '#ef4444'} />,
        onPress: handleDeleteForEveryone,
        danger: true,
      }] : []),
    ];

    return (
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.menuOverlay} onPress={closeMenu}>
          <View
            style={[
              styles.menuContainer,
              {
                backgroundColor: colors.surface,
                top: menuPosition.y,
                left: menuPosition.x,
                shadowColor: '#000',
              }
            ]}
          >
            {menuItems.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.menuItem,
                  idx < menuItems.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: colors.border },
                ]}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                {item.icon}
                <Text style={[
                  styles.menuLabel,
                  { color: item.danger ? (colors.error || '#ef4444') : colors.textPrimary }
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onClose} style={styles.headerBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} accessibilityLabel="Go back">
          <ArrowLeft color={colors.textPrimary} size={22} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text style={[typography.labelLarge, { color: colors.textPrimary }]} numberOfLines={1}>
            {tripName}
          </Text>
          <Text style={[typography.caption, { color: colors.textTertiary }]}>
            Trip Chat • {messages.length} messages
          </Text>
        </View>
      </View>

      {/* Search Bar - always visible */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Search size={16} color={colors.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Search messages..."
          placeholderTextColor={colors.textTertiary}
          value={searchText}
          onChangeText={setSearchText}
          returnKeyType="search"
        />
        {searchText.length > 0 && (
          <Text style={[typography.caption, { color: colors.textTertiary }]}>
            {filteredMessages.length} found
          </Text>
        )}
      </View>

      {/* Pinned messages banner */}
      {pinnedMessages.length > 0 && (
        <View style={[styles.pinnedBanner, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Pin size={12} color={colors.primary} />
          <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: spacing.xs, flex: 1 }]} numberOfLines={1}>
            {pinnedMessages[pinnedMessages.length - 1].content}
          </Text>
        </View>
      )}

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={filteredMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={{ fontSize: 40 }}>{searchText ? '🔍' : '💬'}</Text>
              <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' }]}>
                {searchText ? 'No messages match your search' : 'No messages yet. Start the conversation!'}
              </Text>
            </View>
          }
        />

        {/* Reply Indicator */}
        {replyingTo && (
          <View style={[styles.replyBar, { backgroundColor: colors.surface, borderLeftColor: colors.primary }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.replyBarName, { color: colors.primary }]}>{replyingTo.sender_name}</Text>
              <Text style={[styles.replyBarContent, { color: colors.textSecondary }]} numberOfLines={1}>{replyingTo.content}</Text>
            </View>
            <TouchableOpacity onPress={() => setReplyingTo(null)}>
              <X size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <View style={styles.typingBar}>
            <Text style={[styles.typingText, { color: colors.textTertiary }]}>
              {typingUsers.length === 1
                ? `${typingUsers[0]} is typing...`
                : `${typingUsers.join(', ')} are typing...`}
            </Text>
          </View>
        )}

        {/* Input */}
        <View style={[styles.inputBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
            placeholder="Type a message..."
            placeholderTextColor={colors.textTertiary}
            value={inputText}
            onChangeText={handleTextChange}
            multiline
            maxLength={2000}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: inputText.trim() ? colors.primary : colors.surface }]}
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
          >
            <Send size={18} color={inputText.trim() ? '#fff' : colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Message Actions Menu */}
      {renderMessageMenu()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1 },
  headerBtn: { padding: spacing.xs },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 34,
    fontSize: 14,
    paddingVertical: 0,
  },
  pinnedBanner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderBottomWidth: 1 },
  messageList: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, flexGrow: 1 },
  emptyChat: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  dateHeader: { alignItems: 'center', marginVertical: spacing.md },
  messageBubbleWrap: { marginBottom: spacing.xs, maxWidth: '80%' },
  myMessageWrap: { alignSelf: 'flex-end' },
  otherMessageWrap: { alignSelf: 'flex-start' },
  senderName: { fontSize: 11, fontWeight: '600', marginBottom: 2, marginLeft: spacing.xs },
  bubbleContainer: { flexDirection: 'row', alignItems: 'flex-start' },
  bubble: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, position: 'relative', minWidth: 80 },
  myBubble: { borderBottomRightRadius: 6 },
  otherBubble: { borderBottomLeftRadius: 6, borderWidth: 1 },
  bubbleMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, alignSelf: 'flex-end' },
  timeText: { fontSize: 10 },
  dropdownArrow: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Menu styles
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  menuContainer: {
    position: 'absolute',
    width: 210,
    borderRadius: 16,
    paddingVertical: 8,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Existing styles
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, borderTopWidth: 1, gap: spacing.xs },
  typingBar: { paddingHorizontal: spacing.md, paddingVertical: 4 },
  typingText: { fontSize: 12, fontStyle: 'italic' },
  replyPreview: { borderLeftWidth: 3, paddingLeft: 8, paddingVertical: 2, marginBottom: 4, marginLeft: 4 },
  replyName: { fontSize: 11, fontWeight: '700' },
  replyContent: { fontSize: 12 },
  replyBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 8, borderLeftWidth: 3, marginHorizontal: spacing.sm, borderRadius: 4 },
  replyBarName: { fontSize: 12, fontWeight: '700' },
  replyBarContent: { fontSize: 13 },
  input: { flex: 1, minHeight: 44, maxHeight: 120, borderWidth: 1, borderRadius: 24, paddingHorizontal: 18, paddingVertical: Platform.OS === 'ios' ? 12 : 10, fontSize: 15 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
});
