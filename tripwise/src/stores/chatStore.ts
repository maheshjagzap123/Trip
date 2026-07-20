import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Message {
  id: string;
  trip_id: string;
  user_id: string;
  content: string;
  message_type: string;
  media_url: string | null;
  reply_to: string | null;
  is_pinned: boolean;
  created_at: string;
  deleted_at: string | null;
  // Enriched
  sender_name?: string;
  sender_avatar?: string | null;
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;

  fetchMessages: (tripId: string) => Promise<void>;
  sendMessage: (tripId: string, content: string, replyTo?: string) => Promise<void>;
  deleteMessage: (messageId: string, tripId: string) => Promise<void>;
  deleteForEveryone: (messageId: string, tripId: string) => Promise<void>;
  pinMessage: (messageId: string, pinned: boolean, tripId: string) => Promise<void>;
  subscribeToChatRealtime: (tripId: string) => () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  isSending: false,

  fetchMessages: async (tripId: string) => {
    set({ isLoading: true });
    try {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('trip_id', tripId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
        .limit(200);

      if (data) {
        // Enrich with sender names
        const userIds = [...new Set(data.map((m) => m.user_id))];
        const { data: profiles } = await supabase.rpc('get_profiles_by_ids', { user_ids: userIds });

        const enriched = data.map((m) => {
          const profile = Array.isArray(profiles) ? profiles.find((p: any) => p.id === m.user_id) : null;
          return {
            ...m,
            sender_name: profile?.display_name || 'Member',
            sender_avatar: profile?.avatar_url || null,
          };
        });

        set({ messages: enriched });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  sendMessage: async (tripId: string, content: string, replyTo?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !content.trim()) return;

    set({ isSending: true });
    try {
      const { data, error } = await supabase.from('messages').insert({
        trip_id: tripId,
        user_id: user.id,
        content: content.trim(),
        message_type: 'text',
        reply_to: replyTo || null,
      }).select().single();

      if (error) {
        console.error('Send message error:', error);
        throw new Error(error.message);
      }

      // Optimistically add to local state immediately
      if (data) {
        const { data: profiles } = await supabase.rpc('get_profiles_by_ids', { user_ids: [user.id] });
        const profile = Array.isArray(profiles) ? profiles[0] : null;

        const newMsg: Message = {
          ...data,
          sender_name: profile?.display_name || 'You',
          sender_avatar: profile?.avatar_url || null,
        };

        set((state) => ({
          messages: [...state.messages, newMsg],
        }));
      }
    } finally {
      set({ isSending: false });
    }
  },

  deleteMessage: async (messageId: string, tripId: string) => {
    await supabase
      .from('messages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', messageId);

    // Remove from local state immediately
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== messageId),
    }));
  },

  deleteForEveryone: async (messageId: string, tripId: string) => {
    // Permanently delete the message for all participants
    await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    // Remove from local state immediately
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== messageId),
    }));
  },

  pinMessage: async (messageId: string, pinned: boolean, tripId: string) => {
    await supabase
      .from('messages')
      .update({ is_pinned: pinned, updated_at: new Date().toISOString() })
      .eq('id', messageId);

    await get().fetchMessages(tripId);
  },

  subscribeToChatRealtime: (tripId: string) => {
    const channel = supabase
      .channel(`chat-${tripId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `trip_id=eq.${tripId}` },
        async (payload) => {
          const newMsg = payload.new as any;

          // Skip if we already have this message (optimistic update already added it)
          const existing = get().messages.find((m) => m.id === newMsg.id);
          if (existing) return;

          // Fetch sender info for the new message
          const { data: profiles } = await supabase.rpc('get_profiles_by_ids', { user_ids: [newMsg.user_id] });
          const profile = Array.isArray(profiles) ? profiles[0] : null;

          const enrichedMsg: Message = {
            ...newMsg,
            sender_name: profile?.display_name || 'Member',
            sender_avatar: profile?.avatar_url || null,
          };

          set((state) => ({
            messages: [...state.messages, enrichedMsg],
          }));
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `trip_id=eq.${tripId}` },
        () => {
          get().fetchMessages(tripId);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  },
}));
