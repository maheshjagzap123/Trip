import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Platform, Linking, BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors, typography, spacing, borderRadius } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, HelpCircle, MessageSquare, Star, ChevronRight, ExternalLink } from 'lucide-react-native';

interface Props {
  onClose: () => void;
}

const FAQ_ITEMS = [
  { q: 'How do I add members to a trip?', a: 'Open the trip → tap the "+" icon in Members section → enter their email. They\'ll receive an invitation.' },
  { q: 'How does expense splitting work?', a: 'When you add an expense, choose who paid and select members to split with. You can split equally or enter custom amounts.' },
  { q: 'Can I upload photos to a trip?', a: 'Yes! Open any trip → tap "Trip Photos" → use the "+" button to upload from your gallery.' },
  { q: 'How do I settle up?', a: 'Go to Expenses → switch to "Balances" tab → tap "Settle Up" to record a payment.' },
  { q: 'Is my data safe?', a: 'Yes. We use Supabase with Row Level Security. Only trip members can see trip data. Your documents are encrypted.' },
  { q: 'Can I delete my account?', a: 'Contact us at support and we\'ll process your deletion request within 48 hours (GDPR/DPDP compliant).' },
];

export function SupportScreen({ onClose }: Props) {
  const colors = useThemeColors();
  const { user } = useAuthStore();

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => { onClose(); return true; });
    return () => backHandler.remove();
  }, [onClose]);
  const [activeTab, setActiveTab] = useState<'help' | 'contact' | 'feedback'>('help');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const showAlert = (t: string, m: string) => { Platform.OS === 'web' ? window.alert(`${t}: ${m}`) : Alert.alert(t, m); };

  const handleSendFeedback = async () => {
    if (feedbackRating === 0) { showAlert('Error', 'Please select a rating'); return; }
    if (!feedbackText.trim()) { showAlert('Error', 'Please write your feedback'); return; }
    setSending(true);
    try {
      await supabase.from('notifications').insert({
        user_id: '00000000-0000-0000-0000-000000000001',
        type: 'feedback',
        title: `Feedback (${feedbackRating}★)`,
        body: feedbackText.trim(),
        data: { rating: feedbackRating, user_email: user?.email, from_user_id: user?.id },
      });
      showAlert('Thank you!', 'Your feedback has been submitted.');
      setFeedbackRating(0);
      setFeedbackText('');
    } finally { setSending(false); }
  };

  const handleSendContact = async () => {
    if (!contactSubject.trim() || !contactMessage.trim()) { showAlert('Error', 'Please fill all fields'); return; }
    setSending(true);
    try {
      await supabase.from('notifications').insert({
        user_id: '00000000-0000-0000-0000-000000000001',
        type: 'support_request',
        title: contactSubject.trim(),
        body: contactMessage.trim(),
        data: { user_email: user?.email, from_user_id: user?.id },
      });
      showAlert('Sent!', 'We\'ll get back to you within 24 hours.');
      setContactSubject('');
      setContactMessage('');
    } finally { setSending(false); }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onClose}><ArrowLeft color={colors.textPrimary} size={22} /></TouchableOpacity>
        <Text style={[typography.h3, { color: colors.textPrimary, marginLeft: spacing.sm }]}>Help & Support</Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: colors.surface }]}>
        {(['help', 'contact', 'feedback'] as const).map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && { backgroundColor: colors.primary }]} onPress={() => setActiveTab(tab)}>
            {tab === 'help' && <HelpCircle size={14} color={activeTab === tab ? '#fff' : colors.textSecondary} />}
            {tab === 'contact' && <MessageSquare size={14} color={activeTab === tab ? '#fff' : colors.textSecondary} />}
            {tab === 'feedback' && <Star size={14} color={activeTab === tab ? '#fff' : colors.textSecondary} />}
            <Text style={[styles.tabTxt, { color: activeTab === tab ? '#fff' : colors.textSecondary }]}>
              {tab === 'help' ? 'FAQ' : tab === 'contact' ? 'Contact' : 'Feedback'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* FAQ */}
        {activeTab === 'help' && (
          <View>
            {FAQ_ITEMS.map((item, i) => (
              <TouchableOpacity key={i} style={[styles.faqItem, { borderColor: colors.border }]} onPress={() => setExpandedFaq(expandedFaq === i ? null : i)}>
                <View style={styles.faqHeader}>
                  <Text style={[typography.labelMedium, { color: colors.textPrimary, flex: 1 }]}>{item.q}</Text>
                  <ChevronRight size={16} color={colors.textTertiary} style={{ transform: [{ rotate: expandedFaq === i ? '90deg' : '0deg' }] }} />
                </View>
                {expandedFaq === i && (
                  <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.sm }]}>{item.a}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Contact */}
        {activeTab === 'contact' && (
          <View>
            <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
              Have a question or issue? We're here to help.
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Subject" placeholderTextColor={colors.textTertiary}
              value={contactSubject} onChangeText={setContactSubject}
            />
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Describe your issue..." placeholderTextColor={colors.textTertiary}
              value={contactMessage} onChangeText={setContactMessage} multiline numberOfLines={5} textAlignVertical="top"
            />
            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: sending ? 0.6 : 1 }]} onPress={handleSendContact} disabled={sending}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{sending ? 'Sending...' : 'Send Message'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Feedback */}
        {activeTab === 'feedback' && (
          <View>
            <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
              How's your ExpenseX experience? We'd love to hear from you.
            </Text>
            <Text style={[typography.labelMedium, { color: colors.textPrimary, marginBottom: spacing.sm }]}>Rating</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity key={n} onPress={() => setFeedbackRating(n)}>
                  <Text style={{ fontSize: 32 }}>{n <= feedbackRating ? '⭐' : '☆'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Tell us what you think..." placeholderTextColor={colors.textTertiary}
              value={feedbackText} onChangeText={setFeedbackText} multiline numberOfLines={4} textAlignVertical="top"
            />
            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: sending ? 0.6 : 1 }]} onPress={handleSendFeedback} disabled={sending}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{sending ? 'Sending...' : 'Submit Feedback'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1 },
  tabs: { flexDirection: 'row', margin: spacing.md, borderRadius: borderRadius.md, padding: 3 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: borderRadius.sm, gap: 4 },
  tabTxt: { fontSize: 12, fontWeight: '600' },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  faqItem: { paddingVertical: spacing.md, borderBottomWidth: 1 },
  faqHeader: { flexDirection: 'row', alignItems: 'center' },
  input: { height: 44, borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, fontSize: 15, marginBottom: spacing.md },
  textArea: { minHeight: 100, borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 15, marginBottom: spacing.md },
  starRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  submitBtn: { height: 48, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center' },
});

