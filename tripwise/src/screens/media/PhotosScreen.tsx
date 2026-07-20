import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  FlatList, Dimensions, Modal, Platform, Alert, ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useThemeColors, typography, spacing, borderRadius } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { useMediaStore } from '../../stores/mediaStore';
import { supabase } from '../../lib/supabase';
import { ConnectDriveScreen } from '../cloud/ConnectDriveScreen';
import type { MediaItem } from '../../stores/mediaStore';
import { ArrowLeft, Plus, Trash2, X, Upload, ImageIcon, Cloud } from 'lucide-react-native';
import { format } from 'date-fns';

const GAP = 2;
const NUM_COLUMNS = 3;

interface Props {
  tripId: string;
  tripName: string;
  onClose: () => void;
}

export function PhotosScreen({ tripId, tripName, onClose }: Props) {
  const colors = useThemeColors();
  const { user } = useAuthStore();
  const { media, isLoading, isUploading, uploadProgress, fetchMedia, uploadMedia, deleteMedia, subscribeToMedia } = useMediaStore();
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null);
  const [showConnectDrive, setShowConnectDrive] = useState(false);
  const [driveConnected, setDriveConnected] = useState<boolean | null>(null); // null = loading
  const { width: screenWidth } = useWindowDimensions();

  const imageSize = (screenWidth - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

  useEffect(() => {
    fetchMedia(tripId);
    checkDriveConnection();
    const unsub = subscribeToMedia(tripId);
    return unsub;
  }, [tripId]);

  const checkDriveConnection = async () => {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return;
    const { data } = await supabase
      .from('cloud_connections')
      .select('id')
      .eq('user_id', u.id)
      .eq('provider', 'google_drive')
      .maybeSingle();
    setDriveConnected(!!data);
  };

  const showAlert = (title: string, msg: string) => {
    Platform.OS === 'web' ? window.alert(`${title}: ${msg}`) : Alert.alert(title, msg);
  };

  const handlePickImage = async () => {
    // Check if Drive is connected
    if (!driveConnected) {
      setShowConnectDrive(true);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission needed', 'Please allow access to your photos to upload.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10,
    });

    if (result.canceled || !result.assets.length) return;

    for (const asset of result.assets) {
      const fileName = asset.fileName || `photo_${Date.now()}.jpg`;
      const mimeType = asset.mimeType || 'image/jpeg';
      try {
        await uploadMedia(tripId, asset.uri, fileName, mimeType);
      } catch (err: any) {
        showAlert('Upload Failed', err.message);
      }
    }
  };

  const handleDelete = (item: MediaItem) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this photo?')) {
        deleteMedia(item.id, tripId);
        setSelectedImage(null);
      }
    } else {
      Alert.alert('Delete', 'Delete this photo?', [
        { text: 'Cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => { deleteMedia(item.id, tripId); setSelectedImage(null); } },
      ]);
    }
  };

  // Navigate lightbox
  const currentIndex = selectedImage ? media.findIndex((m) => m.id === selectedImage.id) : -1;
  const goNext = () => { if (currentIndex < media.length - 1) setSelectedImage(media[currentIndex + 1]); };
  const goPrev = () => { if (currentIndex > 0) setSelectedImage(media[currentIndex - 1]); };

  // Group photos by uploader
  const groupedByUser = React.useMemo(() => {
    const groups: { userId: string; name: string; photos: MediaItem[] }[] = [];
    const map = new Map<string, MediaItem[]>();

    for (const item of media) {
      const existing = map.get(item.uploaded_by);
      if (existing) {
        existing.push(item);
      } else {
        map.set(item.uploaded_by, [item]);
      }
    }

    map.forEach((photos, userId) => {
      const name = userId === user?.id
        ? `${photos[0]?.uploaded_by_name || 'You'} (You)`
        : (photos[0]?.uploaded_by_name || 'Member');
      groups.push({ userId, name, photos });
    });

    return groups;
  }, [media, user?.id]);

  const renderGridItem = useCallback(({ item }: { item: MediaItem }) => (
    <TouchableOpacity
      style={[styles.gridItem, { width: imageSize, height: imageSize }]}
      onPress={() => setSelectedImage(item)}
      activeOpacity={0.85}
    >
      <Image
        source={{ uri: item.public_url }}
        style={styles.gridImage}
        contentFit="cover"
        transition={150}
        placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
      />
    </TouchableOpacity>
  ), [imageSize]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
          <ArrowLeft color={colors.textPrimary} size={22} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text style={[typography.labelLarge, { color: colors.textPrimary }]} numberOfLines={1}>
            Trip Photos
          </Text>
          <Text style={[typography.caption, { color: colors.textTertiary }]}>
            {media.length} {media.length === 1 ? 'photo' : 'photos'} • {tripName}
          </Text>
        </View>
        <TouchableOpacity onPress={handlePickImage} style={[styles.headerUploadBtn, { backgroundColor: colors.primary }]} disabled={isUploading}>
          <Plus color="#fff" size={16} />
          <Text style={styles.headerUploadTxt}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Upload Progress */}
      {isUploading && (
        <View style={[styles.uploadBar, { backgroundColor: colors.surface }]}>
          <View style={[styles.uploadProgress, { width: `${uploadProgress}%`, backgroundColor: colors.primary }]} />
          <Text style={[typography.caption, styles.uploadText, { color: colors.primary }]}>
            Uploading {uploadProgress}%
          </Text>
        </View>
      )}

      {/* Content */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : media.length === 0 ? (
        <View style={styles.center}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.surface }]}>
            <ImageIcon color={colors.textTertiary} size={48} />
          </View>
          <Text style={[typography.h3, { color: colors.textPrimary, marginTop: spacing.lg }]}>No photos yet</Text>
          <Text style={[typography.bodyMedium, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, paddingHorizontal: spacing.xl }]}>
            {driveConnected
              ? 'Capture your trip memories! Upload photos and everyone in the trip can see them.'
              : 'Connect Google Drive to upload and store your trip photos safely in your own cloud.'}
          </Text>
          <TouchableOpacity
            style={[styles.emptyUploadBtn, { backgroundColor: colors.primary }]}
            onPress={driveConnected ? handlePickImage : () => setShowConnectDrive(true)}
          >
            {driveConnected ? <Upload color="#fff" size={18} /> : <Cloud color="#fff" size={18} />}
            <Text style={[typography.labelMedium, { color: '#fff', marginLeft: spacing.sm }]}>
              {driveConnected ? 'Upload Photos' : 'Connect Google Drive'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={groupedByUser}
          keyExtractor={(item) => item.userId}
          renderItem={({ item: group }) => (
            <View style={styles.userSection}>
              {/* User header */}
              <View style={styles.userHeader}>
                <View style={[styles.userAvatar, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.userAvatarText, { color: colors.primary }]}>
                    {group.name[0].toUpperCase()}
                  </Text>
                </View>
                <View style={{ marginLeft: spacing.sm }}>
                  <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>{group.name}</Text>
                  <Text style={[typography.caption, { color: colors.textTertiary }]}>
                    {group.photos.length} {group.photos.length === 1 ? 'photo' : 'photos'}
                  </Text>
                </View>
              </View>
              {/* Photos grid */}
              <View style={styles.userGrid}>
                {group.photos.map((photo) => (
                  <TouchableOpacity
                    key={photo.id}
                    style={[styles.gridItem, { width: imageSize, height: imageSize }]}
                    onPress={() => setSelectedImage(photo)}
                    activeOpacity={0.85}
                  >
                    <Image
                      source={{ uri: photo.public_url }}
                      style={styles.gridImage}
                      contentFit="cover"
                      transition={150}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Lightbox */}
      <Modal visible={!!selectedImage} transparent animationType="fade">
        {selectedImage && (
          <View style={styles.lightbox}>
            {/* Top bar */}
            <View style={styles.lightboxTop}>
              <TouchableOpacity onPress={() => setSelectedImage(null)} style={styles.lightboxCloseBtn}>
                <X color="#fff" size={22} />
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={[typography.labelMedium, { color: '#fff' }]}>
                  {selectedImage.uploaded_by === user?.id ? `${selectedImage.uploaded_by_name} (You)` : selectedImage.uploaded_by_name}
                </Text>
                <Text style={[typography.caption, { color: 'rgba(255,255,255,0.5)' }]}>
                  {format(new Date(selectedImage.created_at), 'MMM d, yyyy • h:mm a')}
                </Text>
              </View>
              <Text style={[typography.caption, { color: 'rgba(255,255,255,0.5)' }]}>
                {currentIndex + 1} / {media.length}
              </Text>
              {selectedImage.uploaded_by === user?.id && (
                <TouchableOpacity onPress={() => handleDelete(selectedImage)} style={{ marginLeft: spacing.md }}>
                  <Trash2 color="#EF4444" size={20} />
                </TouchableOpacity>
              )}
            </View>

            {/* Image */}
            <View style={styles.lightboxImageWrap}>
              <Image
                source={{ uri: selectedImage.public_url }}
                style={styles.lightboxImage}
                contentFit="contain"
                transition={200}
              />
            </View>

            {/* Navigation arrows */}
            <View style={styles.lightboxNav}>
              <TouchableOpacity onPress={goPrev} style={[styles.navBtn, currentIndex === 0 && { opacity: 0.3 }]} disabled={currentIndex === 0}>
                <Text style={styles.navBtnText}>‹ Prev</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={goNext} style={[styles.navBtn, currentIndex === media.length - 1 && { opacity: 0.3 }]} disabled={currentIndex === media.length - 1}>
                <Text style={styles.navBtnText}>Next ›</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>

      {/* Connect Drive Modal */}
      <Modal visible={showConnectDrive} animationType="slide" presentationStyle="fullScreen">
        <ConnectDriveScreen onClose={() => { setShowConnectDrive(false); checkDriveConnection(); }} />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  headerBtn: { padding: spacing.xs + 2 },
  headerUploadBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 16, gap: 4,
  },
  headerUploadTxt: { fontSize: 13, fontWeight: '700', color: '#fff' },
  uploadBar: { height: 28, marginHorizontal: spacing.md, marginTop: spacing.xs, borderRadius: 14, overflow: 'hidden', justifyContent: 'center' },
  uploadProgress: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 14 },
  uploadText: { textAlign: 'center', fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center' },
  emptyUploadBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: 14, borderRadius: borderRadius.md, marginTop: spacing.xl },
  gridItem: { position: 'relative', overflow: 'hidden' },
  gridImage: { width: '100%', height: '100%' },
  userSection: { marginBottom: spacing.lg },
  userHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  userAvatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  userAvatarText: { fontSize: 14, fontWeight: '700' },
  userGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  lightbox: { flex: 1, backgroundColor: '#000' },
  lightboxTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.xl, paddingBottom: spacing.sm },
  lightboxCloseBtn: { padding: spacing.xs },
  lightboxImageWrap: { flex: 1, justifyContent: 'center' },
  lightboxImage: { width: '100%', height: '100%' },
  lightboxNav: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  navBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
  navBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
