import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';

interface TermsConditionsScreenProps {
  onBack?: () => void;
}

export default function TermsConditionsScreen({ onBack }: TermsConditionsScreenProps) {
  const { colors, dark } = useTheme();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={dark
          ? ['#0a1410', '#081210', '#050a08']
          : ['#f5faf8', '#eef5f2', '#e8f0ec']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          {onBack && (
            <Pressable onPress={onBack} style={styles.backButton}>
              <Text style={[styles.backButtonText, { color: colors.primary }]}>← Back</Text>
            </Pressable>
          )}
          <Text style={[styles.headerTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            Terms & Conditions
          </Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.lastUpdated, { color: dark ? '#6a7a72' : '#888888' }]}>
            Last Updated: January 1, 2026
          </Text>

          {/* 1. Acceptance of Terms */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            1. Acceptance of Terms
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            By downloading, installing, accessing, or using the MedPlant application ("App"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, you must not use the App.
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            These Terms constitute a legally binding agreement between you ("User," "you," or "your") and MedPlant ("we," "us," or "our"). We reserve the right to modify these Terms at any time, and your continued use of the App following any changes constitutes acceptance of those changes.
          </Text>

          {/* 2. Description of Service */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            2. Description of Service
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            MedPlant is a medicinal plant analysis application that provides plant identification services, educational information about medicinal plants, and related botanical content. The App uses image recognition technology to help users identify plants and access information about their traditional medicinal uses.
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            The service is provided for educational and informational purposes only. We may modify, suspend, or discontinue any aspect of the service at any time without prior notice or liability.
          </Text>

          {/* 3. User Responsibilities */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            3. User Responsibilities
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            As a user of MedPlant, you agree to:
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • Provide accurate and truthful information when creating an account or using the service
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • Use the App only for lawful purposes and in accordance with these Terms
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • Verify plant identifications through multiple authoritative sources before any practical use
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • Consult qualified healthcare professionals before using any plant for medicinal purposes
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • Maintain the confidentiality of your account credentials
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • Accept full responsibility for all activities under your account
          </Text>

          {/* 4. Acceptable Use */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            4. Acceptable Use
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            You agree not to use the App to:
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • Violate any applicable local, state, national, or international law or regulation
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • Upload or transmit viruses, malware, or other malicious code
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • Attempt to gain unauthorized access to any portion of the App or its systems
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • Interfere with or disrupt the integrity or performance of the App
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • Reproduce, duplicate, copy, sell, or resell any part of the service without permission
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • Use the service for any commercial purpose without prior written consent
          </Text>

          {/* 5. Medical Disclaimer */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            5. Medical Disclaimer
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52', fontWeight: '600' }]}>
            IMPORTANT: The information provided through MedPlant is for educational and informational purposes only and is not intended as medical advice, diagnosis, or treatment.
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            The App does not provide professional medical advice. Nothing contained in the App is intended to be used for diagnosing or treating a health problem or disease. Always seek the advice of a qualified healthcare provider with any questions you may have regarding a medical condition or before using any plant for medicinal purposes.
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            Reliance on any information provided by MedPlant is solely at your own risk. We are not responsible for any health consequences resulting from the use of information obtained through the App.
          </Text>

          {/* 6. Intellectual Property Rights */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            6. Intellectual Property Rights
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            The App and its entire contents, features, and functionality (including but not limited to all information, software, text, displays, images, graphics, and the design, selection, and arrangement thereof) are owned by MedPlant, its licensors, or other providers of such material and are protected by copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            You are granted a limited, non-exclusive, non-transferable license to use the App for personal, non-commercial purposes in accordance with these Terms. You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of the material on our App without prior written consent.
          </Text>

          {/* 7. Limitation of Liability */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            7. Limitation of Liability
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, MEDPLANT AND ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AND LICENSORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • Your access to or use of or inability to access or use the App
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • Any conduct or content of any third party on the App
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • Any content obtained from the App
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • Unauthorized access, use, or alteration of your transmissions or content
          </Text>

          {/* 8. No Guarantees of Accuracy */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            8. No Guarantees of Accuracy
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            While we strive to provide accurate plant identification and information, we make no warranties or representations about the accuracy, reliability, completeness, or timeliness of any content provided through the App.
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            Plant identification is inherently challenging and errors may occur. Misidentification of plants can lead to serious health risks, including poisoning. Users must verify all plant identifications through multiple authoritative sources before any practical use, including consumption or medicinal application.
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
          </Text>

          {/* 9. Account Termination */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            9. Account Termination
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            We reserve the right to suspend or terminate your account and access to the App at our sole discretion, without prior notice or liability, for any reason, including but not limited to a breach of these Terms.
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            Upon termination, your right to use the App will cease immediately. All provisions of these Terms which by their nature should survive termination shall survive, including without limitation, ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            You may terminate your account at any time by discontinuing use of the App and, where applicable, by deleting your account through the App settings.
          </Text>

          {/* 10. Changes to Terms */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            10. Changes to Terms
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            We reserve the right to modify or replace these Terms at any time at our sole discretion. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect, where practicable. What constitutes a material change will be determined at our sole discretion.
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            By continuing to access or use our App after any revisions become effective, you agree to be bound by the revised Terms. If you do not agree to the new Terms, you are no longer authorized to use the App.
          </Text>

          {/* 11. Governing Law */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            11. Governing Law
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            These Terms shall be governed and construed in accordance with applicable local laws, without regard to conflict of law provisions. Any disputes arising from or relating to these Terms or the use of the App shall be subject to the exclusive jurisdiction of the courts in the relevant jurisdiction.
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect.
          </Text>

          {/* 12. Contact Information */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            12. Contact Information
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            If you have any questions about these Terms and Conditions, please contact us at:
          </Text>
          <Text style={[styles.contactInfo, { color: colors.primary }]}>
            Email: info@willsblogger.com
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            We will make reasonable efforts to respond to your inquiry in a timely manner.
          </Text>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: dark ? '#1e2a24' : '#e5e5ea' }]}>
            <Text style={[styles.footerText, { color: dark ? '#6a7a72' : '#888888' }]}>
              © 2026 MedPlant. All rights reserved.
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 60,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  lastUpdated: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 24,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
    marginBottom: 12,
  },
  bulletItem: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
    marginBottom: 6,
    paddingLeft: 8,
  },
  contactInfo: {
    fontSize: 15,
    fontWeight: '600',
    marginVertical: 8,
  },
  footer: {
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
