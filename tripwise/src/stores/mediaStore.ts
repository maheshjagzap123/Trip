import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { decode } from 'base64-arraybuffer';

export interface MediaItem {
  id: string;
  trip_id: string;
  uploaded_by: string;
  uploaded_by_name?: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  storage_path: string;
  thumbnail_url: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  created_at: string;
  public_url?: string;
}

interface MediaState {
  media: MediaItem[];
  isLoading: boolean;
  isUploading: boolean;
  uploadProgress: number;

  fetchMedia: (tripId: string) => Promise<void>;
  uploadMedia: (tripId: string, uri: string, fileName: string, mimeType: string) => Promise<void>;
  deleteMedia: (mediaId: string, tripId: string) => Promise<void>;
  subscribeToMedia: (tripId: string) => () => void;
}

export const useMediaStore = create<MediaState>((set, get) => ({
  media: [],
  isLoading: false,
  isUploading: false,
  uploadProgress: 0,

  fetchMedia: async (tripId: string) => {
    set({ isLoading: true });
    try {
      const { data } = await supabase
        .from('media')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });

      if (data) {
        // Get public URLs and uploader names
        const userIds = [...new Set(data.map((m) => m.uploaded_by))];
        const { data: profiles } = await supabase.rpc('get_profiles_by_ids', { user_ids: userIds });

        const enriched = data.map((m) => {
          const { data: urlData } = supabase.storage.from('trip-media').getPublicUrl(m.storage_path);
          const uploaderProfile = Array.isArray(profiles) ? profiles.find((p: any) => p.id === m.uploaded_by) : null;
          return {
            ...m,
            public_url: urlData?.publicUrl || '',
            uploaded_by_name: uploaderProfile?.display_name || 'Member',
          };
        });

        set({ media: enriched });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  uploadMedia: async (tripId: string, uri: string, fileName: string, mimeType: string) => {
    set({ isUploading: true, uploadProgress: 0 });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate unique path
      const ext = fileName.split('.').pop() || 'jpg';
      const storagePath = `${tripId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      set({ uploadProgress: 30 });

      // Read file and upload
      let fileData: ArrayBuffer;

      if (Platform.OS === 'web') {
        // Web: fetch the blob URL and convert to ArrayBuffer
        const response = await fetch(uri);
        fileData = await response.arrayBuffer();
      } else {
        // Native: read as base64 and decode
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: 'base64',
        });
        fileData = decode(base64);
      }

      set({ uploadProgress: 60 });

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('trip-media')
        .upload(storagePath, fileData, {
          contentType: mimeType,
          upsert: false,
        });

      if (uploadError) throw new Error(uploadError.message);

      set({ uploadProgress: 85 });

      // Save metadata to media table
      const { error: dbError } = await supabase.from('media').insert({
        trip_id: tripId,
        uploaded_by: user.id,
        file_name: fileName,
        file_size: fileData.byteLength,
        mime_type: mimeType,
        storage_path: storagePath,
        caption: null,
      });

      if (dbError) throw new Error(dbError.message);

      set({ uploadProgress: 100 });

      // Refresh media list
      await get().fetchMedia(tripId);
    } finally {
      set({ isUploading: false, uploadProgress: 0 });
    }
  },

  deleteMedia: async (mediaId: string, tripId: string) => {
    // Get the storage path first
    const item = get().media.find((m) => m.id === mediaId);
    if (item) {
      await supabase.storage.from('trip-media').remove([item.storage_path]);
    }

    await supabase.from('media').delete().eq('id', mediaId);
    await get().fetchMedia(tripId);
  },

  subscribeToMedia: (tripId: string) => {
    const channel = supabase
      .channel(`media-${tripId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'media', filter: `trip_id=eq.${tripId}` }, () => {
        get().fetchMedia(tripId);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  },
}));
