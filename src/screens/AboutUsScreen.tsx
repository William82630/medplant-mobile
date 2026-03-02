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

interface AboutUsScreenProps {
  onBack?: () => void;
}

export default function AboutUsScreen({ onBack }: AboutUsScreenProps) {
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
            About Us
          </Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* App Identity Banner */}
          <View style={[styles.identityBanner, { backgroundColor: dark ? '#1a2420' : '#f0fdf4' }]}>
            <Text style={styles.appIcon}>🌿</Text>
            <Text style={[styles.appName, { color: dark ? '#2dd4a8' : '#16a085' }]}>MedPlant</Text>
            <Text style={[styles.appTagline, { color: dark ? '#8a9a92' : '#5b6b62' }]}>
              Medicinal Plant Analysis & Education
            </Text>
          </View>

          {/* 1. Introduction */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            Introduction
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            MedPlant is a medicinal plant analysis and educational platform designed to help users identify plants and understand their traditional and medicinal relevance. Our application serves as a bridge between the rich heritage of botanical knowledge and modern technology, making plant identification accessible to everyone from curious learners to dedicated researchers.
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            At the core of MedPlant is a commitment to responsible, safety-focused knowledge sharing. We believe that access to accurate information about medicinal plants can empower individuals to make informed decisions, while always emphasizing the importance of professional guidance when it comes to health-related applications.
          </Text>

          {/* 2. Purpose & Vision */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            Purpose & Vision
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            MedPlant was created in response to a growing global interest in medicinal plants, traditional knowledge systems, and natural remedies. Across cultures and generations, plants have served as the foundation of healing practices, and this wisdom deserves to be preserved, organized, and shared responsibly.
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            The internet is filled with fragmented, unverified, and sometimes dangerous information about medicinal plants. Our vision is to counter this by providing a structured, curated, and cautious approach to botanical knowledge. Rather than promoting quick remedies or unsubstantiated claims, MedPlant presents information in an educational context, encouraging users to learn, verify, and consult professionals before applying any knowledge practically.
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            We envision a future where anyone can confidently identify a plant, understand its historical uses, recognize potential risks, and make informed decisions—all supported by technology that respects both traditional wisdom and modern safety standards.
          </Text>

          {/* 3. What MedPlant Offers */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            What MedPlant Offers
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            MedPlant provides a comprehensive suite of features designed to support learning and discovery in the field of medicinal botany:
          </Text>
          <View style={[styles.featureCard, { backgroundColor: dark ? '#141c18' : '#ffffff' }]}>
            <Text style={[styles.featureTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
              🔍 Plant Identification & Analysis
            </Text>
            <Text style={[styles.featureDesc, { color: dark ? '#8a9a92' : '#5b6b62' }]}>
              Using advanced image recognition technology, users can photograph plants and receive identification results along with detailed botanical information.
            </Text>
          </View>
          <View style={[styles.featureCard, { backgroundColor: dark ? '#141c18' : '#ffffff' }]}>
            <Text style={[styles.featureTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
              📚 Educational Medicinal Information
            </Text>
            <Text style={[styles.featureDesc, { color: dark ? '#8a9a92' : '#5b6b62' }]}>
              Each identified plant comes with curated information about its traditional uses, active compounds, and historical significance in various medical traditions.
            </Text>
          </View>
          <View style={[styles.featureCard, { backgroundColor: dark ? '#141c18' : '#ffffff' }]}>
            <Text style={[styles.featureTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
              ⚠️ Safety Considerations & Warnings
            </Text>
            <Text style={[styles.featureDesc, { color: dark ? '#8a9a92' : '#5b6b62' }]}>
              We prominently display potential side effects, contraindications, toxicity warnings, and precautions for each plant, ensuring users are aware of risks.
            </Text>
          </View>
          <View style={[styles.featureCard, { backgroundColor: dark ? '#141c18' : '#ffffff' }]}>
            <Text style={[styles.featureTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
              🩺 Ailment-Based Exploration
            </Text>
            <Text style={[styles.featureDesc, { color: dark ? '#8a9a92' : '#5b6b62' }]}>
              Users can explore plants traditionally associated with specific health conditions for educational purposes, understanding how different cultures have approached wellness through botanicals.
            </Text>
          </View>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            All information presented in MedPlant is curated and structured, drawing from documented traditional knowledge rather than random claims or unverified internet sources. We prioritize quality over quantity in every piece of content.
          </Text>

          {/* 4. Safety & Responsibility */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            Safety & Responsibility
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52', fontWeight: '600' }]}>
            MedPlant does not promote self-medication, self-diagnosis, or the unsupervised use of any plant for medical purposes.
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            All information provided through our platform is strictly for educational and informational purposes. We believe that knowledge empowers individuals, but we equally believe that knowledge must be applied responsibly. The medicinal use of any plant should always be undertaken under the guidance of qualified healthcare professionals, licensed herbalists, or traditional medicine practitioners who understand individual health contexts.
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            We recognize the ethical responsibility that comes with presenting health-related information. MedPlant is designed to inform and educate, never to replace professional medical consultation. Users are consistently reminded throughout the app that plant identification has inherent limitations, and that even correctly identified plants may have risks that depend on individual circumstances such as allergies, medications, pregnancy, or pre-existing conditions.
          </Text>

          {/* 5. Who This App Is For */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            Who This App Is For
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            MedPlant is designed for a diverse audience united by a common interest in plants and their place in human wellness:
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • <Text style={{ fontWeight: '600' }}>Students and Learners</Text> – Those studying botany, pharmacology, ethnobotany, traditional medicine, or related fields who need a reference tool for plant identification and medicinal knowledge.
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • <Text style={{ fontWeight: '600' }}>Researchers and Enthusiasts</Text> – Individuals conducting research or exploring the intersection of traditional plant knowledge and modern science.
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • <Text style={{ fontWeight: '600' }}>Traditional Knowledge Seekers</Text> – People interested in preserving and understanding regional plant knowledge and cultural heritage related to medicinal botanicals.
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • <Text style={{ fontWeight: '600' }}>Health-Conscious Individuals</Text> – Users seeking awareness and education about plants, not medical diagnosis or treatment recommendations.
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            MedPlant is for those who approach plant knowledge with curiosity, respect, and responsibility. It is not intended for users seeking quick medical fixes or alternatives to professional healthcare.
          </Text>

          {/* 6. Commitment to Accuracy & Improvement */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            Commitment to Accuracy & Improvement
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            We are committed to continuously improving the accuracy, depth, and reliability of the information presented in MedPlant. Our content is derived from documented sources, traditional knowledge systems, and botanical references, but we acknowledge that knowledge is always evolving.
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            No technological system is perfect. Plant identification through image recognition has inherent limitations, and the complexity of medicinal botany means that new research may update or refine previous understanding. We are transparent about these limitations and committed to updating our platform as knowledge advances.
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            Responsibility and improvement are core values at MedPlant. We welcome feedback from users, experts, and the community to help us enhance the quality and accuracy of our content. If you identify errors or have suggestions, we encourage you to reach out to us.
          </Text>

          {/* 7. Transparency & Trust */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            Transparency & Trust
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            Trust is the foundation of our relationship with users. MedPlant is built on principles of transparency, honesty, and respect for the people who use our platform.
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            We do not misuse personal data. User privacy is respected, and we are committed to responsible data practices as outlined in our Privacy Policy. We do not sell user information, we do not engage in invasive tracking, and we do not compromise user trust for commercial gain.
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            Our goal is to be a platform that users can rely on—not just for information, but for integrity. When we make mistakes, we aim to correct them. When we improve, we do so with our users' interests in mind. MedPlant is here to serve as a trustworthy companion in your journey to understand the botanical world.
          </Text>

          {/* 8. Contact Information */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            Contact Information
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            We value communication with our users. If you have questions, feedback, suggestions, or concerns, please do not hesitate to reach out to us.
          </Text>

          <View style={[styles.contactCard, { backgroundColor: dark ? '#141c18' : '#ffffff' }]}>
            <Text style={[styles.contactLabel, { color: dark ? '#8a9a92' : '#5b6b62' }]}>Email</Text>
            <Text style={[styles.contactValue, { color: colors.primary }]}>info@willsblogger.com</Text>

            <View style={[styles.contactDivider, { backgroundColor: dark ? '#1e2a24' : '#e5e5ea' }]} />

            <Text style={[styles.contactLabel, { color: dark ? '#8a9a92' : '#5b6b62' }]}>Address</Text>
            <Text style={[styles.contactAddress, { color: dark ? '#f2f2f2' : '#171717' }]}>
              Thingkangphai{'\n'}
              Churachandpur{'\n'}
              Manipur – 795128{'\n'}
              India
            </Text>
          </View>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: dark ? '#1e2a24' : '#e5e5ea' }]}>
            <Text style={[styles.footerText, { color: dark ? '#6a7a72' : '#888888' }]}>
              Thank you for choosing MedPlant as your companion in exploring the world of medicinal plants.
            </Text>
            <Text style={[styles.copyright, { color: dark ? '#6a7a72' : '#888888' }]}>
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
  identityBanner: {
    alignItems: 'center',
    paddingVertical: 28,
    borderRadius: 16,
    marginBottom: 24,
  },
  appIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 28,
    marginBottom: 14,
  },
  paragraph: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 23,
    marginBottom: 14,
  },
  bulletItem: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 23,
    marginBottom: 10,
    paddingLeft: 8,
  },
  featureCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  featureDesc: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 20,
  },
  contactCard: {
    padding: 20,
    borderRadius: 14,
    marginTop: 8,
  },
  contactLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  contactValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  contactDivider: {
    height: 1,
    marginVertical: 16,
  },
  contactAddress: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 24,
  },
  footer: {
    marginTop: 36,
    paddingTop: 24,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  copyright: {
    fontSize: 12,
    fontWeight: '500',
  },
});
