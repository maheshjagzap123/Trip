import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useThemeColors, typography, spacing, borderRadius } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore } from '../../stores/chatStore';
import { supabase } from '../../lib/supabase';
import type { Message } from '../../stores/chatStore';
import { ArrowLeft, Send, Pin, X } from 'lucide-react-native';
import { format, isToday, isYesterday } from 'date-fns';

interface Props {
  tripId: string;
  tripName: string;
  onClose: () => void;
}

export function ChatScreen({ tripId, tripName, onClose }: Props) {
  const colors = useThemeColors();
  const { user, profile } = useAuthStore();
  const { messages, isLoading, isSending, fetchMessages, sendMessage, pinMessage, subscribeToChatRealtime } = useChatStore();
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const presenceChannelRef = useRef<any>(null);

  useEffect(() => {
    fetchMessages(tripId);
    const unsub = subscribeToChatRealtime(tripId);

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
        <TouchableOpacity
          style={[styles.messageBubbleWrap, isMe ? styles.myMessageWrap : styles.otherMessageWrap]}
          onLongPress={() => setReplyingTo(item)}
          activeOpacity={0.85}
        >
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
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={{ fontSize: 40 }}>💬</Text>
              <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' }]}>
                No messages yet. Start the conversation!
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1 },
  headerBtn: { padding: spacing.xs },
  pinnedBanner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderBottomWidth: 1 },
  messageList: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, flexGrow: 1 },
  emptyChat: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  dateHeader: { alignItems: 'center', marginVertical: spacing.md },
  messageBubbleWrap: { marginBottom: spacing.xs, maxWidth: '80%' },
  myMessageWrap: { alignSelf: 'flex-end' },
  otherMessageWrap: { alignSelf: 'flex-start' },
  senderName: { fontSize: 11, fontWeight: '600', marginBottom: 2, marginLeft: spacing.xs },
  bubble: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18 },
  myBubble: { borderBottomRightRadius: 4 },
  otherBubble: { borderBottomLeftRadius: 4, borderWidth: 1 },
  bubbleMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, alignSelf: 'flex-end' },
  timeText: { fontSize: 10 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, borderTopWidth: 1, gap: spacing.xs },
  typingBar: { paddingHorizontal: spacing.md, paddingVertical: 4 },
  typingText: { fontSize: 12, fontStyle: 'italic' },
  replyPreview: { borderLeftWidth: 3, paddingLeft: 8, paddingVertical: 2, marginBottom: 4, marginLeft: 4 },
  replyName: { fontSize: 11, fontWeight: '700' },
  replyContent: { fontSize: 12 },
  replyBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 8, borderLeftWidth: 3, marginHorizontal: spacing.sm, borderRadius: 4 },
  replyBarName: { fontSize: 12, fontWeight: '700' },
  replyBarContent: { fontSize: 13 },
  input: { flex: 1, minHeight: 40, maxHeight: 120, borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
});
