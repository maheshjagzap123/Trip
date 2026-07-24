import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useThemeColors, typography, spacing } from '../../theme';

interface PrivacyPolicyScreenProps {
  onClose: () => void;
}

export function PrivacyPolicyScreen({ onClose }: PrivacyPolicyScreenProps) {
  const colors = useThemeColors();

  useEffect(() => {
    const bh = BackHandler.addEventListener('hardwareBackPress', () => { onClose(); return true; });
    return () => bh.remove();
  }, [onClose]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={onClose}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft color={colors.textPrimary} size={22} />
        </TouchableOpacity>
        <Text style={[typography.h3, { color: colors.textPrimary, marginLeft: spacing.md }]}>
          Privacy Policy
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.lastUpdated, { color: colors.textTertiary }]}>
          Last updated: July 2026
        </Text>

        <Section title="1. Information We Collect" colors={colors}>
          We collect the following types of information:{'\n\n'}
          <B>Account Information:</B> Email address, phone number, name, avatar, date of birth,
          gender, home city, and travel interests you provide during registration.{'\n\n'}
          <B>Trip Data:</B> Trip details, destinations, dates, expenses, photos, documents, and
          chat messages you create or share within trips.{'\n\n'}
          <B>Usage Data:</B> App interactions, feature usage patterns, and device information
          (OS version, device model) for improving the service.{'\n\n'}
          <B>Location Data:</B> Only when you explicitly tag expenses or pins with a location.
          We do not track your location in the background.
        </Section>

        <Section title="2. How We Use Your Information" colors={colors}>
          We use your information to:{'\n'}
          • Provide and maintain the ExpenseX service{'\n'}
          • Enable collaborative features (shared groups, expenses, chat){'\n'}
          • Send notifications about group activity and invitations{'\n'}
          • Improve the app experience and fix issues{'\n'}
          • Communicate important service updates{'\n'}
          • Generate anonymized analytics for product improvement
        </Section>

        <Section title="3. Data Sharing" colors={colors}>
          Your data is shared only in these situations:{'\n\n'}
          <B>With Trip Members:</B> Profile info, expenses, messages, and media are visible to
          members of trips you belong to.{'\n\n'}
          <B>Service Providers:</B> We use Supabase for data storage, authentication, and
          real-time features. Data is processed in accordance with their privacy policies.{'\n\n'}
          <B>Legal Requirements:</B> We may disclose data if required by law or to protect
          the rights and safety of users.{'\n\n'}
          We do not sell your personal data to third parties.
        </Section>

        <Section title="4. Data Storage & Security" colors={colors}>
          Your data is stored securely on Supabase infrastructure with encryption at rest and
          in transit. We implement Row Level Security (RLS) to ensure users can only access
          data they are authorized to view. Authentication tokens are stored securely on your
          device.
        </Section>

        <Section title="5. Data Retention" colors={colors}>
          We retain your data for as long as your account is active. If you delete your account,
          your personal data will be permanently removed within 30 days. Shared trip data
          (expenses, messages) may be retained in anonymized form for other trip members.
        </Section>

        <Section title="6. Your Rights" colors={colors}>
          You have the right to:{'\n'}
          • Access your personal data{'\n'}
          • Correct inaccurate information{'\n'}
          • Delete your account and associated data{'\n'}
          • Export your data{'\n'}
          • Withdraw consent for optional data processing{'\n\n'}
          To exercise these rights, go to Settings → Account → Privacy or contact us at
          privacy@expensex.app.
        </Section>

        <Section title="7. Children's Privacy" colors={colors}>
          ExpenseX is not intended for users under 16 years of age. We do not knowingly collect
          personal information from children. If we become aware that a child has provided us
          with personal data, we will delete it promptly.
        </Section>

        <Section title="8. Cookies & Tracking" colors={colors}>
          The ExpenseX mobile app does not use cookies. The web version uses essential cookies
          for authentication only. We do not use advertising trackers or sell data to ad networks.
        </Section>

        <Section title="9. Changes to This Policy" colors={colors}>
          We may update this Privacy Policy periodically. We will notify you of significant
          changes via in-app notification or email. The "Last updated" date at the top indicates
          when the policy was last revised.
        </Section>

        <Section title="10. Contact Us" colors={colors}>
          For privacy-related inquiries:{'\n\n'}
          Email: privacy@expensex.app{'\n'}
          Support: In-app Help Center → Contact Support
        </Section>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function B({ children }: { children: string }) {
  return <Text style={{ fontWeight: '700' }}>{children}</Text>;
}

function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  lastUpdated: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 22,
  },
});
