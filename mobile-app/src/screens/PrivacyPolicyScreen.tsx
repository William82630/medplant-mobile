import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  Pressable,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';

interface PrivacyPolicyScreenProps {
  onBack?: () => void;
}

export default function PrivacyPolicyScreen({ onBack }: PrivacyPolicyScreenProps) {
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
        {/* Header */}
        <View style={styles.header}>
          {onBack && (
            <Pressable onPress={onBack} style={styles.backButton}>
              <Text style={[styles.backButtonText, { color: colors.primary }]}>← Back</Text>
            </Pressable>
          )}
          <Text style={[styles.headerTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            Privacy Policy
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

          {/* 1. Introduction */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            1. Introduction
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            Welcome to MedPlant. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use the MedPlant application and related services.
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            By using MedPlant, you agree to the collection and use of information in accordance with this policy. We encourage you to read this Privacy Policy carefully to understand our practices regarding your data.
          </Text>

          {/* 2. Information We Collect */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            2. Information We Collect
          </Text>
          <Text style={[styles.subheading, { color: dark ? '#d0e0d8' : '#3a4a42' }]}>
            Information You Voluntarily Provide
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            When you use MedPlant, you may choose to provide certain information, including but not limited to account registration details such as email address, profile information, and communication preferences. This information is collected only when you voluntarily submit it.
          </Text>
          <Text style={[styles.subheading, { color: dark ? '#d0e0d8' : '#3a4a42' }]}>
            Plant Identification Data
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            When you use our plant identification feature, we process the images and text you submit for the sole purpose of providing plant analysis and identification services. These inputs are used exclusively to generate your plant report and are not used for any other commercial purposes.
          </Text>
          <Text style={[styles.subheading, { color: dark ? '#d0e0d8' : '#3a4a42' }]}>
            Automatically Collected Information
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            We may automatically collect certain non-personal information when you use the app, including device type, operating system version, app usage patterns, error logs, and general analytics data. This information helps us improve app performance and user experience. We do not use this data to personally identify you.
          </Text>

          {/* 3. How We Use Information */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            3. How We Use Information
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            We use the information we collect for the following purposes:
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • To provide plant identification and medicinal analysis services
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • To maintain and improve app functionality, performance, and features
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • To provide user support and respond to inquiries
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • To analyze usage trends and improve user experience
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • To comply with legal obligations and protect our rights
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52', fontWeight: '600' }]}>
            We do not use your personal information for targeted advertising. We do not sell, rent, or trade your personal data to third parties for marketing purposes.
          </Text>

          {/* 4. Medical & Safety Disclaimer */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            4. Medical & Safety Disclaimer
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            The information provided through MedPlant is intended for educational and informational purposes only. Our plant identification and medicinal information services are designed to enhance your understanding of plants and their traditional uses.
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52', fontWeight: '600' }]}>
            MedPlant is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of a qualified healthcare provider or licensed herbalist before using any plant for medicinal purposes. Never disregard professional medical advice or delay seeking it because of information obtained through this application.
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            The accuracy of plant identification cannot be guaranteed. Misidentification of plants can lead to serious health risks. Users are responsible for verifying plant identification through multiple authoritative sources before any practical use.
          </Text>

          {/* 5. Data Storage & Security */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            5. Data Storage & Security
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            We implement reasonable administrative, technical, and physical security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. These measures include encryption, secure data transmission protocols, and access controls.
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            However, no method of transmission over the internet or electronic storage is completely secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security. You acknowledge and accept that any transmission of personal information is at your own risk.
          </Text>

          {/* 6. Data Retention */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            6. Data Retention
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            Your scan history and plant identification records are stored locally on your device. You have full control over this data and can clear your scan history at any time through the app's Settings menu.
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            We retain personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When your data is no longer needed, we will securely delete or anonymize it.
          </Text>

          {/* 7. Data Sharing & Disclosure */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            7. Data Sharing & Disclosure
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            We do not sell, trade, or otherwise transfer your personal information to outside parties for commercial purposes. We may share your information only in the following limited circumstances:
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • When required by law, legal process, or government request
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • To protect the rights, property, or safety of MedPlant, our users, or the public
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • With service providers who assist in operating our app, subject to confidentiality agreements
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • In connection with a merger, acquisition, or sale of assets, with appropriate user notification
          </Text>

          {/* 8. Third-Party Services */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            8. Third-Party Services
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            MedPlant may utilize third-party services for certain functionalities, including plant identification analysis, analytics, and infrastructure support. These third-party services are used solely to provide and improve our app's core functionality.
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            Third-party service providers are bound by their own privacy policies and data protection practices. We encourage you to review the privacy policies of any third-party services that may be integrated with our application. We are not responsible for the privacy practices of third-party services.
          </Text>

          {/* 9. Children's Privacy */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            9. Children's Privacy
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            MedPlant is not intended for use by children under the age of 13. We do not knowingly collect personal information from children under 13 years of age. If you are a parent or guardian and believe that your child has provided us with personal information, please contact us immediately. If we become aware that we have collected personal information from a child under 13 without verification of parental consent, we will take steps to delete that information promptly.
          </Text>

          {/* 10. User Rights */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            10. Your Rights
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            Depending on your jurisdiction, you may have certain rights regarding your personal information, including:
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • The right to access and obtain a copy of your personal data
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • The right to request correction of inaccurate personal data
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • The right to request deletion of your personal data
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • The right to withdraw consent where processing is based on consent
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            You can exercise control over your data through the Settings menu within the app. For additional requests or inquiries regarding your data rights, please contact us using the information provided below.
          </Text>

          {/* 11. Policy Updates */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            11. Policy Updates
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. When we make material changes, we will notify you by updating the "Last Updated" date at the top of this policy and, where appropriate, through in-app notifications.
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            Your continued use of MedPlant after any changes to this Privacy Policy constitutes your acceptance of the updated policy. We encourage you to periodically review this page for the latest information on our privacy practices.
          </Text>

          {/* 12. Contact Information */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            12. Contact Information
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:
          </Text>
          <Text style={[styles.contactInfo, { color: colors.primary }]}>
            Email: info@willsblogger.com
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            We will respond to your inquiry within a reasonable timeframe and work to address any concerns you may have.
          </Text>

          {/* 13. Governing Law */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            13. Governing Law
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            This Privacy Policy shall be governed by and construed in accordance with applicable local laws and regulations. Any disputes arising from or related to this Privacy Policy shall be subject to the exclusive jurisdiction of the courts in the relevant jurisdiction.
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
  subheading: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
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
