import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  FlatList, Dimensions, Modal, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useThemeColors, typography, spacing, borderRadius } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { useMediaStore } from '../../stores/mediaStore';
import type { MediaItem } from '../../stores/mediaStore';
import { ArrowLeft, Plus, Trash2, X, Upload } from 'lucide-react-native';
import { format } from 'date-fns';

const SCREEN_WIDTH = Dimensions.get('window').width;
const NUM_COLUMNS = 3;
const IMAGE_SIZE = (SCREEN_WIDTH - spacing.md * 2 - spacing.xs * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

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

  useEffect(() => {
    fetchMedia(tripId);
    const unsub = subscribeToMedia(tripId);
    return unsub;
  }, [tripId]);

  const showAlert = (title: string, msg: string) => {
    Platform.OS === 'web' ? window.alert(`${title}: ${msg}`) : Alert.alert(title, msg);
  };

  const handlePickImage = async () => {
    // Request permission
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

    // Upload each selected image
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

  const renderGridItem = ({ item }: { item: MediaItem }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => setSelectedImage(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.public_url }}
        style={styles.gridImage}
        contentFit="cover"
        transition={200}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onClose}>
          <ArrowLeft color={colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={[typography.h3, { color: colors.textPrimary, flex: 1, marginLeft: spacing.md }]} numberOfLines={1}>
          {tripName} — Photos
        </Text>
        <Text style={[typography.caption, { color: colors.textTertiary }]}>
          {media.length} photos
        </Text>
      </View>

      {/* Upload Progress */}
      {isUploading && (
        <View style={[styles.uploadBar, { backgroundColor: colors.primaryLight }]}>
          <View style={[styles.uploadProgress, { width: `${uploadProgress}%`, backgroundColor: colors.primary }]} />
          <Text style={[typography.caption, { color: colors.primary, position: 'absolute', alignSelf: 'center' }]}>
            Uploading... {uploadProgress}%
          </Text>
        </View>
      )}

      {/* Grid */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : media.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 56 }}>📸</Text>
          <Text style={[typography.h3, { color: colors.textPrimary, marginTop: spacing.md }]}>No photos yet</Text>
          <Text style={[typography.bodyMedium, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs }]}>
            Upload your trip memories and share them with the group!
          </Text>
          <TouchableOpacity
            style={[styles.uploadBtn, { backgroundColor: colors.primary }]}
            onPress={handlePickImage}
          >
            <Upload color="#fff" size={18} />
            <Text style={[typography.labelMedium, { color: '#fff', marginLeft: spacing.xs }]}>Upload Photos</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={media}
          renderItem={renderGridItem}
          keyExtractor={(item) => item.id}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
        />
      )}

      {/* FAB */}
      {media.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={handlePickImage}
          disabled={isUploading}
          activeOpacity={0.8}
        >
          <Plus color="#fff" size={26} />
        </TouchableOpacity>
      )}

      {/* Lightbox Modal */}
      <Modal visible={!!selectedImage} transparent animationType="fade">
        {selectedImage && (
          <View style={styles.lightbox}>
            <View style={styles.lightboxHeader}>
              <TouchableOpacity onPress={() => setSelectedImage(null)}>
                <X color="#fff" size={24} />
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={[typography.labelMedium, { color: '#fff' }]}>{selectedImage.uploaded_by_name}</Text>
                <Text style={[typography.caption, { color: 'rgba(255,255,255,0.6)' }]}>
                  {format(new Date(selectedImage.created_at), 'MMM d, yyyy • h:mm a')}
                </Text>
              </View>
              {selectedImage.uploaded_by === user?.id && (
                <TouchableOpacity onPress={() => handleDelete(selectedImage)}>
                  <Trash2 color="#EF4444" size={20} />
                </TouchableOpacity>
              )}
            </View>
            <Image
              source={{ uri: selectedImage.public_url }}
              style={styles.lightboxImage}
              contentFit="contain"
              transition={300}
            />
            {selectedImage.caption && (
              <Text style={[typography.bodyMedium, { color: '#fff', textAlign: 'center', padding: spacing.md }]}>
                {selectedImage.caption}
              </Text>
            )}
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1 },
  uploadBar: { height: 24, marginHorizontal: spacing.md, marginTop: spacing.sm, borderRadius: 12, overflow: 'hidden', justifyContent: 'center' },
  uploadProgress: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: borderRadius.md, marginTop: spacing.lg },
  grid: { padding: spacing.md },
  gridRow: { gap: spacing.xs },
  gridItem: { width: IMAGE_SIZE, height: IMAGE_SIZE, borderRadius: borderRadius.sm, overflow: 'hidden', marginBottom: spacing.xs },
  gridImage: { width: '100%', height: '100%' },
  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.lg, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  lightbox: { flex: 1, backgroundColor: '#000' },
  lightboxHeader: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, paddingTop: spacing.xl },
  lightboxImage: { flex: 1, width: '100%' },
});
