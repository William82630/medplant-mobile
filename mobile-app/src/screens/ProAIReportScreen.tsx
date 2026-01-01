import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  Pressable,
  Linking,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';

interface ProAIReportScreenProps {
  onBack?: () => void;
  imageUri?: string;
}

// Mock data for UI demonstration
const MOCK_PLANT = {
  commonName: 'Aloe Vera',
  scientificName: 'Aloe barbadensis miller',
  plantType: 'Succulent / Herb',
  regionFound: 'Arabian Peninsula, Africa, India, Mediterranean',
  medicinalBenefits: [
    'Soothes and heals minor burns and skin irritations',
    'Provides natural moisturization for dry skin',
    'Contains antioxidants that support skin health',
    'May aid in digestive wellness when consumed properly',
    'Has antibacterial properties for wound care',
    'Traditionally used to reduce inflammation',
  ],
  sideEffects: [
    'May cause skin irritation or allergic reactions in sensitive individuals',
    'Internal consumption may cause digestive discomfort or cramping',
    'Not recommended during pregnancy or breastfeeding',
    'May interact with certain medications (consult a professional)',
    'Overuse on skin may lead to dryness or irritation',
  ],
  preparation: 'The gel from aloe vera leaves can be extracted by cutting the leaf and scooping out the clear inner gel. This gel is typically applied topically to the skin for soothing purposes. For educational purposes only: traditional methods include using fresh gel directly or mixing with other natural ingredients. Always consult a qualified professional before any medicinal application.',
  description: 'Aloe vera is a succulent plant species that has been used for thousands of years across various cultures for its purported healing properties. The plant features thick, fleshy leaves that contain a clear gel-like substance. Native to the Arabian Peninsula, aloe vera now grows in tropical, semi-tropical, and arid climates worldwide. It has been documented in ancient Egyptian, Greek, and Indian medical traditions.',
  references: [
    { title: 'National Center for Complementary and Integrative Health', url: 'https://nccih.nih.gov/' },
    { title: 'World Health Organization - Medicinal Plants', url: 'https://www.who.int/' },
    { title: 'PubMed - Aloe Vera Research', url: 'https://pubmed.ncbi.nlm.nih.gov/' },
  ],
};

export default function ProAIReportScreen({ onBack, imageUri }: ProAIReportScreenProps) {
  const { colors, dark } = useTheme();

  // Placeholder handler for download button
  const handleDownloadReport = () => {
    console.log('[Placeholder] Download Full Report pressed');
  };

  // Placeholder handler for reference links
  const handleReferencePress = (url: string) => {
    console.log(`[Placeholder] Opening reference: ${url}`);
    // In production, this would use: Linking.openURL(url);
  };

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
          <View style={styles.headerCenter}>
            <Text style={styles.headerIcon}>📋</Text>
            <Text style={[styles.headerTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
              Pro AI Report
            </Text>
          </View>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Image Preview (if provided) */}
          {imageUri && (
            <View style={[styles.imagePreviewCard, { backgroundColor: dark ? '#141c18' : '#ffffff' }]}>
              <Image
                source={{ uri: imageUri }}
                style={styles.reportImage}
                resizeMode="cover"
              />
              <Text style={[styles.imageCaption, { color: dark ? '#6a7a72' : '#888888' }]}>
                Scanned Plant Image
              </Text>
            </View>
          )}

          {/* 1. PLANT IDENTITY */}
          <View style={styles.identitySection}>
            <Text style={[styles.commonName, { color: dark ? '#f2f2f2' : '#171717' }]}>
              {MOCK_PLANT.commonName}
            </Text>
            <Text style={[styles.scientificName, { color: dark ? '#8a9a92' : '#5b6b62' }]}>
              {MOCK_PLANT.scientificName}
            </Text>
          </View>

          {/* 2. MEDICINAL BENEFITS (GREEN CARD) */}
          <View style={[styles.benefitsCard, { borderColor: dark ? '#2a5a3a' : '#4ade80' }]}>
            <View style={[styles.cardHeader, { backgroundColor: dark ? '#1a3a2a' : '#ecfdf5' }]}>
              <Text style={styles.cardHeaderIcon}>💚</Text>
              <Text style={[styles.cardHeaderTitle, { color: dark ? '#4ade80' : '#16a085' }]}>
                Medicinal Benefits
              </Text>
            </View>
            <View style={styles.cardContent}>
              {MOCK_PLANT.medicinalBenefits.map((benefit, index) => (
                <View key={index} style={styles.bulletItem}>
                  <Text style={[styles.bullet, { color: dark ? '#4ade80' : '#16a085' }]}>•</Text>
                  <Text style={[styles.bulletText, { color: dark ? '#d0e0d8' : '#3a4a42' }]}>
                    {benefit}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* 3. SIDE EFFECTS & WARNINGS (RED CARD) */}
          <View style={[styles.warningsCard, { borderColor: dark ? '#5a2a2a' : '#ef4444' }]}>
            <View style={[styles.cardHeader, { backgroundColor: dark ? '#3a1a1a' : '#fef2f2' }]}>
              <Text style={styles.cardHeaderIcon}>⚠️</Text>
              <Text style={[styles.cardHeaderTitle, { color: dark ? '#fca5a5' : '#dc2626' }]}>
                Side Effects & Warnings
              </Text>
            </View>
            <View style={styles.cardContent}>
              {MOCK_PLANT.sideEffects.map((effect, index) => (
                <View key={index} style={styles.bulletItem}>
                  <Text style={[styles.bullet, { color: dark ? '#fca5a5' : '#dc2626' }]}>•</Text>
                  <Text style={[styles.bulletText, { color: dark ? '#d0c0c0' : '#4a3a3a' }]}>
                    {effect}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* 4. PLANT CLASSIFICATION & DISTRIBUTION */}
          <View style={styles.infoSection}>
            <View style={[styles.infoRow, { backgroundColor: dark ? '#141c18' : '#ffffff' }]}>
              <Text style={[styles.infoLabel, { color: dark ? '#8a9a92' : '#5b6b62' }]}>
                Plant Type
              </Text>
              <Text style={[styles.infoValue, { color: dark ? '#f2f2f2' : '#171717' }]}>
                {MOCK_PLANT.plantType}
              </Text>
            </View>
            <View style={[styles.infoRow, { backgroundColor: dark ? '#141c18' : '#ffffff' }]}>
              <Text style={[styles.infoLabel, { color: dark ? '#8a9a92' : '#5b6b62' }]}>
                Region Found
              </Text>
              <Text style={[styles.infoValue, { color: dark ? '#f2f2f2' : '#171717' }]}>
                {MOCK_PLANT.regionFound}
              </Text>
            </View>
          </View>

          {/* 5. PREPARATION METHOD */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
              How to Prepare
            </Text>
            <View style={[styles.sectionCard, { backgroundColor: dark ? '#141c18' : '#ffffff' }]}>
              <Text style={[styles.sectionText, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
                {MOCK_PLANT.preparation}
              </Text>
            </View>
          </View>

          {/* 6. DETAILED DESCRIPTION & REFERENCES */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
              About the Plant
            </Text>
            <View style={[styles.sectionCard, { backgroundColor: dark ? '#141c18' : '#ffffff' }]}>
              <Text style={[styles.sectionText, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
                {MOCK_PLANT.description}
              </Text>
            </View>
          </View>

          {/* References Subsection */}
          <View style={styles.section}>
            <Text style={[styles.subsectionTitle, { color: dark ? '#a0b0a8' : '#5b6b62' }]}>
              References
            </Text>
            <View style={[styles.referencesCard, { backgroundColor: dark ? '#0f1814' : '#f8faf9' }]}>
              {MOCK_PLANT.references.map((ref, index) => (
                <Pressable
                  key={index}
                  onPress={() => handleReferencePress(ref.url)}
                  style={({ pressed }) => [
                    styles.referenceItem,
                    { opacity: pressed ? 0.7 : 1 }
                  ]}
                >
                  <Text style={styles.referenceIcon}>🔗</Text>
                  <Text style={[styles.referenceText, { color: colors.primary }]}>
                    {ref.title}
                  </Text>
                  <Text style={[styles.externalIcon, { color: dark ? '#6a7a72' : '#888888' }]}>↗</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* 7. COMPREHENSIVE AI REPORT */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
              Comprehensive AI Report
            </Text>
            <View style={[styles.reportCard, { backgroundColor: dark ? '#1a2420' : '#f0f8f5', borderColor: dark ? '#2a4a3a' : '#c0e0d4' }]}>
              <Text style={[styles.reportDescription, { color: dark ? '#a0b0a8' : '#5b6b62' }]}>
                Access a detailed, in-depth AI-generated report including extended analysis, background information, and references.
              </Text>
              <Pressable
                onPress={handleDownloadReport}
                style={({ pressed }) => [
                  styles.downloadButton,
                  { opacity: pressed ? 0.9 : 1 }
                ]}
              >
                <Text style={styles.downloadButtonIcon}>📥</Text>
                <Text style={styles.downloadButtonText}>Download Full Report</Text>
              </Pressable>
            </View>
          </View>

          {/* Safety Disclaimer */}
          <View style={[styles.disclaimerCard, { backgroundColor: dark ? '#1a1a1a' : '#f5f5f5' }]}>
            <Text style={[styles.disclaimerText, { color: dark ? '#808080' : '#666666' }]}>
              This report is for educational purposes only. Always consult qualified healthcare professionals before using any plant for medicinal purposes.
            </Text>
          </View>

          {/* Bottom spacing */}
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
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  // Image Preview
  imagePreviewCard: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  reportImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  imageCaption: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
  },
  // 1. Plant Identity
  identitySection: {
    alignItems: 'center',
    marginBottom: 28,
    paddingTop: 8,
  },
  commonName: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  scientificName: {
    fontSize: 16,
    fontWeight: '500',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  // 2 & 3. Benefit/Warning Cards
  benefitsCard: {
    borderWidth: 2,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  warningsCard: {
    borderWidth: 2,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cardHeaderIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardContent: {
    padding: 16,
    paddingTop: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  bullet: {
    fontSize: 16,
    marginRight: 10,
    marginTop: 1,
  },
  bulletText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 21,
    flex: 1,
  },
  // 4. Info Section
  infoSection: {
    marginBottom: 24,
    gap: 12,
  },
  infoRow: {
    borderRadius: 12,
    padding: 16,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  // 5 & 6. Sections
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCard: {
    borderRadius: 14,
    padding: 16,
  },
  sectionText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 22,
  },
  // References
  referencesCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  referenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  referenceIcon: {
    fontSize: 14,
    marginRight: 10,
  },
  referenceText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  externalIcon: {
    fontSize: 14,
    marginLeft: 8,
  },
  // 7. Comprehensive Report
  reportCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
  },
  reportDescription: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 21,
    marginBottom: 18,
  },
  downloadButton: {
    backgroundColor: '#f0c040',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  downloadButtonIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  downloadButtonText: {
    color: '#1a1a1a',
    fontSize: 15,
    fontWeight: '700',
  },
  // Disclaimer
  disclaimerCard: {
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
  },
  disclaimerText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    textAlign: 'center',
  },
});
