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
  drive_file_id?: string | null;
}

interface DriveConnection {
  access_token: string;
  provider_email: string;
  expires_at: string;
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

// ─── Google Drive Helpers ────────────────────────────────────────────────────

/** Get the user's Google Drive connection from Supabase */
async function getDriveConnection(userId: string): Promise<DriveConnection | null> {
  const { data } = await supabase
    .from('cloud_connections')
    .select('access_token, provider_email, expires_at')
    .eq('user_id', userId)
    .eq('provider', 'google_drive')
    .single();

  if (!data) return null;
  return data as DriveConnection;
}

/** Get a valid access token - don't reject based on local expiry time,
 *  instead let the actual API call determine if the token is still valid.
 *  Google implicit tokens can last longer than the stated expiry in practice,
 *  and we want the token to persist until the user manually disconnects. */
async function getValidAccessToken(userId: string): Promise<string | null> {
  const conn = await getDriveConnection(userId);
  if (!conn) return null;
  return conn.access_token;
}

/** Verify the token is still accepted by Google. Returns true if valid. */
async function isTokenValid(accessToken: string): Promise<boolean> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + accessToken);
    return res.ok;
  } catch {
    return false;
  }
}

/** Find or create the TripWise folder in Google Drive */
async function getOrCreateTripWiseFolder(accessToken: string): Promise<string> {
  // Search for existing TripWise folder
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent("name='TripWise' and mimeType='application/vnd.google-apps.folder' and trashed=false")}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const searchData = await searchRes.json();

  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create TripWise folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
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
  const folder = await createRes.json();
  return folder.id;
}

/** Find or create a trip-specific subfolder inside TripWise folder */
async function getOrCreateTripFolder(accessToken: string, parentFolderId: string, tripId: string, tripName?: string): Promise<string> {
  const folderName = tripName || tripId;

  // Search for existing trip folder
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`name='${folderName}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const searchData = await searchRes.json();

  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create trip folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    }),
  });
  const folder = await createRes.json();
  return folder.id;
}

/** Upload a file to Google Drive and return the file ID and web view link */
async function uploadToDrive(
  accessToken: string,
  folderId: string,
  fileName: string,
  mimeType: string,
  fileData: ArrayBuffer,
): Promise<{ fileId: string; webViewLink: string; webContentLink: string }> {
  // Use multipart upload (metadata + content in one request)
  const metadata = {
    name: fileName,
    parents: [folderId],
  };

  const boundary = 'tripwise_upload_boundary';
  const metadataStr = JSON.stringify(metadata);

  // Build multipart body
  const encoder = new TextEncoder();
  const metaPart = encoder.encode(
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${metadataStr}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${mimeType}\r\n` +
    `Content-Transfer-Encoding: binary\r\n\r\n`
  );
  const endPart = encoder.encode(`\r\n--${boundary}--`);

  // Combine parts
  const body = new Uint8Array(metaPart.length + fileData.byteLength + endPart.length);
  body.set(metaPart, 0);
  body.set(new Uint8Array(fileData), metaPart.length);
  body.set(endPart, metaPart.length + fileData.byteLength);

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: body,
    }
  );

  if (!uploadRes.ok) {
    const errorData = await uploadRes.json();
    throw new Error(errorData.error?.message || 'Failed to upload to Google Drive');
  }

  const result = await uploadRes.json();

  // Make the file publicly viewable so other trip members can see it
  await fetch(`https://www.googleapis.com/drive/v3/files/${result.id}/permissions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      role: 'reader',
      type: 'anyone',
    }),
  });

  // Get the direct thumbnail/content link
  const fileRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${result.id}?fields=id,webViewLink,webContentLink,thumbnailLink`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const fileData2 = await fileRes.json();

  return {
    fileId: result.id,
    webViewLink: fileData2.webViewLink || result.webViewLink || '',
    webContentLink: fileData2.webContentLink || result.webContentLink || '',
  };
}

/** Delete a file from Google Drive */
async function deleteFromDrive(accessToken: string, fileId: string): Promise<void> {
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

/** Get a direct viewable URL for a Drive file */
function getDriveImageUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

// ─── Store ───────────────────────────────────────────────────────────────────

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
        // Get uploader names
        const userIds = [...new Set(data.map((m) => m.uploaded_by))];
        const { data: profiles } = await supabase.rpc('get_profiles_by_ids', { user_ids: userIds });

        const enriched = data.map((m) => {
          const uploaderProfile = Array.isArray(profiles) ? profiles.find((p: any) => p.id === m.uploaded_by) : null;

          // Determine the public URL:
          // If drive_file_id exists → use Google Drive direct link
          // Otherwise → use Supabase storage (legacy uploads)
          let publicUrl = '';
          if (m.drive_file_id) {
            publicUrl = getDriveImageUrl(m.drive_file_id);
          } else if (m.storage_path) {
            const { data: urlData } = supabase.storage.from('trip-media').getPublicUrl(m.storage_path);
            publicUrl = urlData?.publicUrl || '';
          }

          return {
            ...m,
            public_url: publicUrl,
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

      set({ uploadProgress: 10 });

      // Read file data
      let fileData: ArrayBuffer;
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        fileData = await response.arrayBuffer();
      } else {
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: 'base64',
        });
        fileData = decode(base64);
      }

      set({ uploadProgress: 30 });

      // Try Google Drive upload
      const accessToken = await getValidAccessToken(user.id);

      if (accessToken) {
        // Verify the token is still accepted by Google
        const tokenValid = await isTokenValid(accessToken);
        if (!tokenValid) {
          throw new Error('DRIVE_TOKEN_EXPIRED');
        }

        // ─── Upload to Google Drive ─────────────────────────────────────
        set({ uploadProgress: 40 });

        // Get or create TripWise folder
        const tripWiseFolderId = await getOrCreateTripWiseFolder(accessToken);

        set({ uploadProgress: 50 });

        // Get trip name for folder naming
        const { data: tripData } = await supabase
          .from('trips')
          .select('trip_name')
          .eq('id', tripId)
          .single();

        // Get or create trip-specific subfolder
        const tripFolderId = await getOrCreateTripFolder(
          accessToken,
          tripWiseFolderId,
          tripId,
          tripData?.trip_name || tripId,
        );

        set({ uploadProgress: 60 });

        // Upload file to Drive
        const { fileId, webViewLink, webContentLink } = await uploadToDrive(
          accessToken,
          tripFolderId,
          fileName,
          mimeType,
          fileData,
        );

        set({ uploadProgress: 85 });

        // Save metadata to Supabase (only metadata, NOT the file)
        const { error: dbError } = await supabase.from('media').insert({
          trip_id: tripId,
          uploaded_by: user.id,
          file_name: fileName,
          file_size: fileData.byteLength,
          mime_type: mimeType,
          storage_path: '', // No Supabase storage path
          drive_file_id: fileId,
          caption: null,
        });

        if (dbError) throw new Error(dbError.message);

      } else {
        // ─── No Drive connection — show error ──────────────────────────
        throw new Error('DRIVE_NOT_CONNECTED');
      }

      set({ uploadProgress: 100 });

      // Refresh media list
      await get().fetchMedia(tripId);
    } finally {
      set({ isUploading: false, uploadProgress: 0 });
    }
  },

  deleteMedia: async (mediaId: string, tripId: string) => {
    const item = get().media.find((m) => m.id === mediaId);

    if (item) {
      // If stored in Google Drive, delete from there
      if (item.drive_file_id) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const accessToken = await getValidAccessToken(user.id);
            if (accessToken) {
              await deleteFromDrive(accessToken, item.drive_file_id);
            }
          }
        } catch (err) {
          console.warn('Failed to delete from Drive:', err);
          // Continue with DB deletion even if Drive delete fails
        }
      } else if (item.storage_path) {
        // Legacy: delete from Supabase Storage
        await supabase.storage.from('trip-media').remove([item.storage_path]);
      }
    }

    // Delete metadata from Supabase
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
