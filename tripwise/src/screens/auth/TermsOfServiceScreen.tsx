import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useThemeColors, typography, spacing, borderRadius } from '../../theme';

interface TermsOfServiceScreenProps {
  onClose: () => void;
}

export function TermsOfServiceScreen({ onClose }: TermsOfServiceScreenProps) {
  const colors = useThemeColors();

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
          Terms of Service
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.lastUpdated, { color: colors.textTertiary }]}>
          Last updated: July 2026
        </Text>

        <Section title="1. Acceptance of Terms" colors={colors}>
          By accessing or using TripWise ("the App"), you agree to be bound by these Terms of
          Service. If you do not agree to these terms, please do not use the App.
        </Section>

        <Section title="2. Description of Service" colors={colors}>
          TripWise is a collaborative travel planning platform that allows users to create trips,
          manage shared expenses, communicate with trip members, and store travel-related media
          and documents.
        </Section>

        <Section title="3. User Accounts" colors={colors}>
          You must provide accurate information when creating your account. You are responsible
          for maintaining the security of your account credentials and for all activities that
          occur under your account. You must be at least 16 years of age to use this service.
        </Section>

        <Section title="4. User Content" colors={colors}>
          You retain ownership of content you upload to TripWise (photos, documents, messages).
          By uploading content, you grant TripWise a limited license to store, process, and
          display that content to authorized trip members. You must not upload content that
          violates any laws or infringes on the rights of others.
        </Section>

        <Section title="5. Shared Expenses" colors={colors}>
          TripWise facilitates expense tracking and splitting calculations between trip members.
          TripWise does not process payments directly. Settlement of debts is the responsibility
          of the users involved. TripWise makes no guarantees about the accuracy of calculations
          beyond what is displayed in the app.
        </Section>

        <Section title="6. Privacy & Data" colors={colors}>
          Your use of the App is also governed by our Privacy Policy. We collect and process
          personal data as described therein. Trip data is shared only with members you invite
          or accept into your trips.
        </Section>

        <Section title="7. Prohibited Conduct" colors={colors}>
          You agree not to:{'\n'}
          • Use the App for any unlawful purpose{'\n'}
          • Attempt to gain unauthorized access to other users' data{'\n'}
          • Upload malicious content or spam{'\n'}
          • Impersonate other users{'\n'}
          • Interfere with the proper functioning of the App
        </Section>

        <Section title="8. Termination" colors={colors}>
          We reserve the right to suspend or terminate your account if you violate these terms.
          You may delete your account at any time through the app settings. Upon deletion, your
          personal data will be removed as described in our Privacy Policy.
        </Section>

        <Section title="9. Limitation of Liability" colors={colors}>
          TripWise is provided "as is" without warranties of any kind. We shall not be liable
          for any indirect, incidental, or consequential damages arising from your use of the
          App. Our total liability shall not exceed the amount you have paid us in the 12 months
          preceding the claim.
        </Section>

        <Section title="10. Changes to Terms" colors={colors}>
          We may update these Terms from time to time. We will notify you of significant changes
          via the App or email. Continued use of the App after changes constitutes acceptance of
          the new terms.
        </Section>

        <Section title="11. Contact" colors={colors}>
          If you have questions about these Terms, please contact us at support@tripwise.app.
        </Section>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children, colors }: { title: string; children: string; colors: any }) {
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
