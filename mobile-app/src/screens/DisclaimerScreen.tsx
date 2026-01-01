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

interface DisclaimerScreenProps {
  onBack?: () => void;
}

export default function DisclaimerScreen({ onBack }: DisclaimerScreenProps) {
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
            Disclaimer
          </Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Warning Banner */}
          <View style={[styles.warningBanner, { backgroundColor: dark ? '#2a1a1a' : '#fef2f2' }]}>
            <Text style={[styles.warningIcon]}>⚠️</Text>
            <Text style={[styles.warningText, { color: dark ? '#fca5a5' : '#b91c1c' }]}>
              IMPORTANT: Please read this disclaimer carefully before using MedPlant.
            </Text>
          </View>

          <Text style={[styles.lastUpdated, { color: dark ? '#6a7a72' : '#888888' }]}>
            Last Updated: January 1, 2026
          </Text>

          {/* 1. Educational Purpose Only */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            1. Educational Purpose Only
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            MedPlant is designed and intended exclusively for educational and informational purposes. The application provides general information about medicinal plants, their traditional uses, botanical characteristics, and related topics. All content is provided to facilitate learning and awareness about plant-based remedies and botanical knowledge.
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            The information presented in this application is derived from traditional knowledge, historical references, and publicly available botanical research. It is not intended to replace formal education, professional training, or expert consultation in botany, pharmacology, or medicine.
          </Text>

          {/* 2. Not Medical Advice */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            2. Not Medical Advice
          </Text>
          <Text style={[styles.emphasisBox, { backgroundColor: dark ? '#1a2420' : '#f0fdf4', borderColor: dark ? '#2a3a32' : '#86efac' }]}>
            <Text style={[styles.emphasisText, { color: dark ? '#f2f2f2' : '#171717' }]}>
              THE INFORMATION PROVIDED BY MEDPLANT DOES NOT CONSTITUTE MEDICAL ADVICE AND SHOULD NOT BE INTERPRETED AS SUCH.
            </Text>
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            Nothing in this application should be construed as an attempt to offer or render medical advice, opinion, or otherwise engage in the practice of medicine. The content is not intended to be a substitute for professional medical advice, diagnosis, or treatment.
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            No physician-patient, pharmacist-patient, or any other healthcare provider relationship is created by your use of this application. Self-medication based on information obtained from this application may be dangerous.
          </Text>

          {/* 3. No Diagnosis or Treatment Claims */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            3. No Diagnosis or Treatment Claims
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            MedPlant does not diagnose, treat, cure, or prevent any disease, illness, or medical condition. The application does not make any claims regarding the therapeutic efficacy of any plant, compound, or preparation mentioned herein.
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            Any information regarding medicinal uses of plants reflects traditional or historical usage and does not imply endorsement, recommendation, or validation of such uses. The efficacy and safety of traditional plant remedies have not been evaluated or approved by any regulatory authority.
          </Text>

          {/* 4. Consult Qualified Professionals */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            4. Consult Qualified Professionals
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52', fontWeight: '600' }]}>
            Before using any plant or plant-derived product for medicinal purposes, you must consult with a qualified healthcare professional, licensed physician, pharmacist, or certified herbalist.
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            This is especially important if you:
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • Are pregnant, nursing, or planning to become pregnant
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • Have any pre-existing medical conditions
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • Are taking prescription or over-the-counter medications
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • Have known allergies or sensitivities
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • Are considering use for children or elderly individuals
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            Never delay seeking professional medical advice, disregard medical advice, or discontinue medical treatment because of information obtained through this application.
          </Text>

          {/* 5. No Liability for Misuse */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            5. No Liability for Misuse
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            MedPlant, its developers, affiliates, licensors, and contributors expressly disclaim any and all liability arising from:
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • Any use or misuse of information provided in this application
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • Any adverse effects, injuries, or damages resulting from plant identification, consumption, or application
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • Allergic reactions, poisoning, or any health complications
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • Reliance on any information obtained through this application
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            You assume full responsibility for how you use the information provided by this application. Use of any information is at your sole risk.
          </Text>

          {/* 6. Accuracy Limitations */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            6. Accuracy Limitations
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            While we endeavor to provide accurate plant identification and information, no guarantee is made regarding the accuracy, completeness, reliability, or currentness of any content. Plant identification through image recognition technology is inherently imprecise and may produce incorrect results.
          </Text>
          <Text style={[styles.emphasisBox, { backgroundColor: dark ? '#2a1a1a' : '#fef2f2', borderColor: dark ? '#4a2a2a' : '#fca5a5' }]}>
            <Text style={[styles.emphasisText, { color: dark ? '#fca5a5' : '#b91c1c' }]}>
              WARNING: Misidentification of plants can result in serious injury, poisoning, or death. Never consume, apply, or use any plant without absolute certainty of its identity, verified through multiple authoritative sources and professional consultation.
            </Text>
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            Many plants have toxic look-alikes. Visual identification alone is never sufficient for safe use of any plant for medicinal or edible purposes.
          </Text>

          {/* 7. External Reference Responsibility */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            7. External Reference Responsibility
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            Users are solely responsible for conducting independent verification of all plant identifications and information through:
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • Authoritative botanical reference materials and field guides
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • Qualified botanists, herbalists, or ethnobotanists
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • Accredited academic or scientific institutions
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • Local agricultural extension services
          </Text>
          <Text style={[styles.bulletItem, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            • Poison control centers when necessary
          </Text>
          <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            This application should be used as a preliminary reference tool only and never as the sole basis for plant identification or usage decisions.
          </Text>

          {/* Acceptance Statement */}
          <View style={[styles.acceptanceBox, { backgroundColor: dark ? '#1a2420' : '#f8fafc', borderColor: dark ? '#2a3a32' : '#e2e8f0' }]}>
            <Text style={[styles.acceptanceText, { color: dark ? '#f2f2f2' : '#171717' }]}>
              By using MedPlant, you acknowledge that you have read, understood, and agree to this Disclaimer in its entirety. If you do not agree with any part of this Disclaimer, you must not use the application.
            </Text>
          </View>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: dark ? '#1e2a24' : '#e5e5ea' }]}>
            <Text style={[styles.footerText, { color: dark ? '#6a7a72' : '#888888' }]}>
              © 2026 MedPlant. All rights reserved.
            </Text>
            <Text style={[styles.contactText, { color: dark ? '#6a7a72' : '#888888' }]}>
              Contact: info@willsblogger.com
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
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  lastUpdated: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 20,
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
  emphasisBox: {
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 12,
  },
  emphasisText: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20,
  },
  acceptanceBox: {
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 28,
  },
  acceptanceText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'center',
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
  contactText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
  },
});
