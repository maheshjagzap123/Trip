import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, TextInput, Alert, Platform, ActivityIndicator, BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { useThemeColors, typography, spacing, borderRadius } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Plus, FileText, Trash2, X, Upload } from 'lucide-react-native';
import { format } from 'date-fns';

const DOC_CATEGORIES = ['Passport', 'Driving License', 'PAN Card', 'Aadhaar Card', 'Visa', 'Insurance', 'Other'];

interface Document {
  id: string;
  title: string;
  category: string;
  storage_path: string;
  file_name: string;
  expiry_date: string | null;
  created_at: string;
  public_url?: string;
}

interface Props {
  onClose: () => void;
}

export function PersonalDocumentsScreen({ onClose }: Props) {
  const colors = useThemeColors();
  const { user } = useAuthStore();
  const [docs, setDocs] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { fetchDocs(); }, []);

  useEffect(() => {
    const bh = BackHandler.addEventListener('hardwareBackPress', () => { onClose(); return true; });
    return () => bh.remove();
  }, [onClose]);

  const fetchDocs = async () => {
    if (!user) return;
    setIsLoading(true);
    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .is('trip_id', null)
      .order('created_at', { ascending: false });

    if (data) {
      const enriched = data.map((d) => {
        const { data: urlData } = supabase.storage.from('documents').getPublicUrl(d.storage_path);
        return { ...d, public_url: urlData?.publicUrl || '' };
      });
      setDocs(enriched);
    }
    setIsLoading(false);
  };

  const handleDelete = async (doc: Document) => {
    const confirm = Platform.OS === 'web'
      ? window.confirm(`Delete "${doc.title}"?`)
      : await new Promise((r) => Alert.alert('Delete', `Delete "${doc.title}"?`, [{ text: 'Cancel', onPress: () => r(false) }, { text: 'Delete', style: 'destructive', onPress: () => r(true) }]));
    if (!confirm) return;

    await supabase.storage.from('documents').remove([doc.storage_path]);
    await supabase.from('documents').delete().eq('id', doc.id);
    fetchDocs();
  };

  const renderDoc = ({ item }: { item: Document }) => (
    <View style={[styles.docCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.docIcon, { backgroundColor: colors.primaryLight }]}>
        <FileText size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1, marginLeft: spacing.sm }}>
        <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>{item.title}</Text>
        <Text style={[typography.caption, { color: colors.textTertiary }]}>
          {item.category} • {format(new Date(item.created_at), 'MMM d, yyyy')}
        </Text>
        {item.expiry_date && (
          <Text style={[typography.caption, { color: new Date(item.expiry_date) < new Date() ? colors.error : colors.textTertiary }]}>
            Expires: {format(new Date(item.expiry_date), 'MMM d, yyyy')}
          </Text>
        )}
      </View>
      <TouchableOpacity onPress={() => handleDelete(item)}>
        <Trash2 size={16} color={colors.textTertiary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onClose}><ArrowLeft color={colors.textPrimary} size={22} /></TouchableOpacity>
        <Text style={[typography.h3, { color: colors.textPrimary, flex: 1, marginLeft: spacing.sm }]}>My Documents</Text>
        <TouchableOpacity onPress={() => setShowAdd(true)} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
          <Plus size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      ) : docs.length === 0 ? (
        <View style={styles.center}>
          <FileText size={48} color={colors.textTertiary} />
          <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: spacing.md, textAlign: 'center' }]}>
            Store your important documents here{'\n'}(License, PAN, Aadhaar, Passport)
          </Text>
          <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: colors.primary }]} onPress={() => setShowAdd(true)}>
            <Upload size={16} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', marginLeft: 6 }}>Upload Document</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList data={docs} renderItem={renderDoc} keyExtractor={(i) => i.id} contentContainerStyle={styles.list} />
      )}

      <Modal visible={showAdd} animationType="slide" transparent>
        <AddDocModal onClose={() => { setShowAdd(false); fetchDocs(); }} />
      </Modal>
    </SafeAreaView>
  );
}

// Add Document Modal
function AddDocModal({ onClose }: { onClose: () => void }) {
  const colors = useThemeColors();
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Other');
  const [expiryDate, setExpiryDate] = useState('');
  const [saving, setSaving] = useState(false);

  const showAlert = (t: string, m: string) => { Platform.OS === 'web' ? window.alert(`${t}: ${m}`) : Alert.alert(t, m); };

  const handleUpload = async () => {
    if (!title.trim()) { showAlert('Error', 'Enter a title'); return; }
    if (!user) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { showAlert('Permission', 'Allow access to upload'); return; }

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled || !result.assets.length) return;

    setSaving(true);
    try {
      const asset = result.assets[0];
      const ext = asset.fileName?.split('.').pop() || 'jpg';
      const path = `personal/${user.id}/${Date.now()}.${ext}`;

      let fileData: ArrayBuffer;
      if (Platform.OS === 'web') {
        fileData = await (await fetch(asset.uri)).arrayBuffer();
      } else {
        const b64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: 'base64' });
        fileData = decode(b64);
      }

      const { error: upErr } = await supabase.storage.from('documents').upload(path, fileData, { contentType: asset.mimeType || 'image/jpeg' });
      if (upErr) { showAlert('Error', upErr.message); return; }

      await supabase.from('documents').insert({
        user_id: user.id,
        trip_id: null,
        title: title.trim(),
        category,
        file_name: asset.fileName || `doc.${ext}`,
        storage_path: path,
        mime_type: asset.mimeType || 'image/jpeg',
        expiry_date: expiryDate.trim() || null,
      });

      onClose();
    } catch (err: any) {
      showAlert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.modalOverlay]}>
      <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
        <View style={styles.modalHeader}>
          <Text style={[typography.h3, { color: colors.textPrimary }]}>Upload Document</Text>
          <TouchableOpacity onPress={onClose}><X color={colors.textTertiary} size={22} /></TouchableOpacity>
        </View>

        <TextInput
          style={[styles.modalInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
          placeholder="Document title (e.g. Driving License)"
          placeholderTextColor={colors.textTertiary}
          value={title} onChangeText={setTitle}
        />

        <Text style={[typography.labelSmall, { color: colors.textSecondary, marginBottom: spacing.xs }]}>Category</Text>
        <View style={styles.catRow}>
          {DOC_CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.catChip, { backgroundColor: category === c ? colors.primary : colors.surface, borderColor: category === c ? colors.primary : colors.border }]}
              onPress={() => setCategory(c)}
            >
              <Text style={[{ fontSize: 11, fontWeight: '600', color: category === c ? '#fff' : colors.textPrimary }]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={[styles.modalInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
          placeholder="Expiry date (YYYY-MM-DD, optional)"
          placeholderTextColor={colors.textTertiary}
          value={expiryDate} onChangeText={setExpiryDate}
        />

        <TouchableOpacity
          style={[styles.uploadBtn, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]}
          onPress={handleUpload} disabled={saving}
        >
          <Upload size={18} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', marginLeft: 8 }}>{saving ? 'Uploading...' : 'Choose File & Upload'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1 },
  addBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: 12, borderRadius: borderRadius.md, marginTop: spacing.lg },
  list: { padding: spacing.md },
  docCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, marginBottom: spacing.sm },
  docIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: spacing.xxl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalInput: { height: 44, borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, fontSize: 15, marginBottom: spacing.md },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  catChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: borderRadius.md },
});

