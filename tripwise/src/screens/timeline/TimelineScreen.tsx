import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  FlatList, TextInput, Modal, Platform, Alert, BackHandler,
} from 'react-native';
import { useThemeColors, typography, spacing, borderRadius } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Plus, FileText, Camera, Receipt, X } from 'lucide-react-native';
import { format } from 'date-fns';

interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  user_id: string;
  user_name: string;
  event_date: string;
  created_at: string;
  data: any;
}

interface Props {
  tripId: string;
  tripName: string;
  onClose: () => void;
}

export function TimelineScreen({ tripId, tripName, onClose }: Props) {
  const colors = useThemeColors();
  const { user } = useAuthStore();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddNote, setShowAddNote] = useState(false);

  useEffect(() => {
    fetchTimeline();
  }, [tripId]);

  // Handle Android hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => backHandler.remove();
  }, [onClose]);

  const fetchTimeline = async () => {
    setIsLoading(true);
    const { data } = await supabase.rpc('get_trip_timeline', { p_trip_id: tripId });
    if (data && Array.isArray(data)) setEvents(data);
    setIsLoading(false);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'expense': return <Receipt size={16} color="#00C896" />;
      case 'note': return <FileText size={16} color="#6366F1" />;
      case 'photo': return <Camera size={16} color="#F59E0B" />;
      default: return <FileText size={16} color={colors.textTertiary} />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'expense': return '#00C896';
      case 'note': return '#6366F1';
      case 'photo': return '#F59E0B';
      default: return colors.textTertiary;
    }
  };

  // Group by date
  const groupedEvents = events.reduce((groups, event) => {
    const date = event.event_date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(event);
    return groups;
  }, {} as Record<string, TimelineEvent[]>);

  const dateGroups = Object.entries(groupedEvents).sort(([a], [b]) => b.localeCompare(a));

  const renderEvent = (event: TimelineEvent) => (
    <View key={event.id} style={styles.eventRow}>
      <View style={[styles.eventDot, { backgroundColor: getEventColor(event.type) }]}>
        {getEventIcon(event.type)}
      </View>
      <View style={[styles.eventCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.eventHeader}>
          <Text style={[typography.labelMedium, { color: colors.textPrimary, flex: 1 }]} numberOfLines={1}>
            {event.title}
          </Text>
          <Text style={[typography.caption, { color: colors.textTertiary }]}>
            {format(new Date(event.created_at), 'h:mm a')}
          </Text>
        </View>
        <Text style={[typography.bodySmall, { color: colors.textSecondary }]} numberOfLines={2}>
          {event.subtitle}
        </Text>
        <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 4 }]}>
          by {event.user_name}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onClose}><ArrowLeft color={colors.textPrimary} size={22} /></TouchableOpacity>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text style={[typography.labelLarge, { color: colors.textPrimary }]}>Timeline</Text>
          <Text style={[typography.caption, { color: colors.textTertiary }]}>{tripName}</Text>
        </View>
        <TouchableOpacity onPress={() => setShowAddNote(true)} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
          <Plus size={16} color="#fff" />
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff', marginLeft: 4 }}>Note</Text>
        </TouchableOpacity>
      </View>

      {/* Timeline */}
      {events.length === 0 && !isLoading ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 40 }}>📖</Text>
          <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: spacing.md, textAlign: 'center' }]}>
            Your trip story will appear here as you add expenses, photos, and notes.
          </Text>
        </View>
      ) : (
        <FlatList
          data={dateGroups}
          keyExtractor={([date]) => date}
          contentContainerStyle={styles.list}
          renderItem={({ item: [date, dayEvents] }) => (
            <View style={styles.dateGroup}>
              <Text style={[styles.dateLabel, { color: colors.primary }]}>
                {format(new Date(date), 'EEEE, MMM d')}
              </Text>
              {dayEvents.map(renderEvent)}
            </View>
          )}
        />
      )}

      {/* Add Note Modal */}
      <Modal visible={showAddNote} animationType="slide" transparent>
        <AddNoteModal tripId={tripId} onClose={() => { setShowAddNote(false); fetchTimeline(); }} />
      </Modal>
    </SafeAreaView>
  );
}

// ============================================================
// Add Note Modal
// ============================================================

function AddNoteModal({ tripId, onClose }: { tripId: string; onClose: () => void }) {
  const colors = useThemeColors();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) {
      Platform.OS === 'web' ? window.alert('Please write something') : Alert.alert('Error', 'Please write something');
      return;
    }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('trip_notes').insert({
      trip_id: tripId,
      user_id: user.id,
      title: title.trim() || null,
      content: content.trim(),
    });

    setSaving(false);
    onClose();
  };

  return (
    <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
      <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
        <View style={styles.modalHeader}>
          <Text style={[typography.h3, { color: colors.textPrimary }]}>Add Note</Text>
          <TouchableOpacity onPress={onClose}><X color={colors.textTertiary} size={22} /></TouchableOpacity>
        </View>
        <TextInput
          style={[styles.modalInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
          placeholder="Title (optional)"
          placeholderTextColor={colors.textTertiary}
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={[styles.modalTextArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
          placeholder="Write your note..."
          placeholderTextColor={colors.textTertiary}
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
        <TouchableOpacity
          style={[styles.modalSaveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={[typography.labelMedium, { color: '#fff' }]}>{saving ? 'Saving...' : 'Save Note'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1 },
  addBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  list: { paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl },
  dateGroup: { marginBottom: spacing.lg },
  dateLabel: { fontSize: 13, fontWeight: '700', marginBottom: spacing.sm, marginLeft: 4 },
  eventRow: { flexDirection: 'row', marginBottom: spacing.sm },
  eventDot: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm, marginTop: 4 },
  eventCard: { flex: 1, padding: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1 },
  eventHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: spacing.xxl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalInput: { height: 44, borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, fontSize: 15, marginBottom: spacing.sm },
  modalTextArea: { minHeight: 120, borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 15, marginBottom: spacing.md },
  modalSaveBtn: { height: 48, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center' },
});
