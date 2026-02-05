
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  Pressable,
  StatusBar,
  Linking,
  Platform,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from './theme';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { generateComprehensiveReport, downloadPdfReport } from './services/GeminiService';
import { saveToHistory, HistoryItem } from './history';
import Toast from './components/Toast';
type Props = {
  data: any;
  imageUri?: string;
  onBack: () => void;
  onRefresh: () => void;
  hasCredits: () => boolean;
  useCredit: () => Promise<{ success: boolean; remaining: number }>;
  isAdmin: () => boolean;
};

export default function ResultScreen({
  data,
  imageUri,
  onBack,
  onRefresh,
  hasCredits,
  useCredit,
  isAdmin,
}: Props) {
  const { colors, dark } = useTheme();

  // Collapse states
  const [habitatOpen, setHabitatOpen] = useState(false);
  const [compoundsOpen, setCompoundsOpen] = useState(false);
  const [detailedOpen, setDetailedOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('Preparing report...');

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const savedPdfUri = useRef<string | null>(null);

  React.useEffect(() => {
    console.log('[DEBUG] ResultScreen Data:', JSON.stringify(data, null, 2));
  }, [data]);

  if (!data) return null;

  // -- ROBUST DATA EXTRACTION --
  const p = data.identified || {};

  // Plant Header info
  const plant = p.plant || {};

  // Handle case where medicinalUses might be an object (old schema) or array (new schema)
  let displayUses: string[] = [];
  if (Array.isArray(p.medicinalUses)) {
    displayUses = p.medicinalUses;
  } else if (p.medicinalUses && Array.isArray((p.medicinalUses as any).summary)) {
    displayUses = (p.medicinalUses as any).summary;
  }

  const compounds = p.activeCompounds || [];
  const sideEffects = p.sideEffects || [];
  const warnings = p.warnings || [];
  const habitat = p.habitat || {};
  const confidence = plant.confidence;
  const detailedInfo = p.detailedInfo || habitat.environment || '';

  // Default trusted Ayurvedic reference sources as fallback
  const DEFAULT_REFERENCES = [
    'https://www.nhp.gov.in/',
    'https://www.ayush.gov.in/',
    'https://indianmedicinalplants.info/',
    'https://www.planetayurveda.com/'
  ];
  const references = (p.references && p.references.length > 0) ? p.references : DEFAULT_REFERENCES;

  // Combine side effects and warnings for unified display
  const allCautions = [...sideEffects, ...warnings];

  const isHighConf = confidence === 'High';

  // Handle Share Report (text)
  const handleShareReport = async () => {
    try {
      const reportText = `
══════════════════════════════════════
       MEDICINAL PLANT REPORT
══════════════════════════════════════

🌿 PLANT NAME: ${plant.commonName || 'Unknown'}
📜 SCIENTIFIC NAME: ${plant.scientificName || 'Unknown'}
🏷️ FAMILY: ${plant.family || 'Unknown'}
✅ CONFIDENCE: ${confidence || 'Unknown'}

──────────────────────────────────────
        MEDICINAL USES
──────────────────────────────────────
${displayUses.map((use, i) => `${i + 1}. ${use}`).join('\n')}

──────────────────────────────────────
        SIDE EFFECTS & PRECAUTIONS
──────────────────────────────────────
${allCautions.length > 0 ? allCautions.map(s => `• ${s}`).join('\n') : 'None reported'}

──────────────────────────────────────
        ACTIVE COMPOUNDS
──────────────────────────────────────
${compounds.length > 0 ? compounds.map((c: string) => `• ${c}`).join('\n') : 'Not specified'}

──────────────────────────────────────
        HABITAT & DISTRIBUTION
──────────────────────────────────────
Distribution: ${habitat.distribution || 'Unknown'}
Environment: ${habitat.environment || 'Unknown'}

──────────────────────────────────────
        DETAILED INFORMATION
──────────────────────────────────────
${detailedInfo || 'Not available'}

──────────────────────────────────────
        REFERENCES
──────────────────────────────────────
${references.length > 0 ? references.join('\n') : 'Not available'}

══════════════════════════════════════
DISCLAIMER: This information is for educational
purposes only. Always consult a healthcare
professional before using any plant medicinally.
══════════════════════════════════════
Generated by MedPlant App
      `.trim();

      await Share.share({
        message: reportText,
        title: `${plant.commonName || 'Plant'} - Medicinal Report`,
      });
    } catch (error: any) {
      Alert.alert('Share Failed', 'Unable to share the report. Please try again.');
    }
  };

  // Handle Download Comprehensive PDF Report
  const handleDownloadPDF = async () => {
    if (isGeneratingPDF) return;

    // 1. Confirmation Alert (User-preferred flow)
    Alert.alert(
      "Premium Report",
      `Would you like to generate and save a comprehensive premium PDF report for ${plant.commonName || 'this plant'}?`,
      [
        {
          text: "Later",
          style: "cancel",
          onPress: () => console.log('[PDF] User chose Later')
        },
        {
          text: "Save",
          onPress: () => startPDFGeneration()
        }
      ]
    );
  };

  const startPDFGeneration = async () => {
    // Check credits for PDF generation
    if (!hasCredits() && !isAdmin()) {
      Alert.alert("Out of Credits", "You have 0 credits remaining. Please buy more credits to download the premium report.");
      return;
    }

    try {
      setIsGeneratingPDF(true);
      setLoadingStatus('Preparing report data...');
      console.log('[PDF] Starting backend PDF generation...');

      // 1. Get Data
      setLoadingStatus('Generating comprehensive analysis...');
      const comprehensiveData = await generateComprehensiveReport(plant.commonName || plant.scientificName || 'Unknown Plant');

      // 2. Deduct Credit (if not admin)
      if (!isAdmin() && comprehensiveData) {
        console.log('[PDF] Deducting credit...');
        await useCredit();
      }

      // 3. Prepare Plain Text Report for Backend
      setLoadingStatus('Building PDF document...');
      const cPlant = comprehensiveData?.plant || plant;
      const therapeutic = comprehensiveData?.therapeuticProfile || detailedInfo || 'Not available';
      const benefits = Array.isArray(comprehensiveData?.expandedMedicinalBenefits)
        ? comprehensiveData.expandedMedicinalBenefits.map((b: any) => `- ${b.title || 'Benefit'}: ${b.description}`).join('\n')
        : (displayUses.map(u => `- ${u}`).join('\n'));

      const safetyData = comprehensiveData?.sideEffectsAndSafetyProfile || {};
      const safetyText = `
Side Effects: ${Array.isArray(safetyData.generalSideEffects) ? safetyData.generalSideEffects.join(', ') : 'None reported'}
Contraindications: ${Array.isArray(safetyData.contraindications) ? safetyData.contraindications.join(', ') : 'None'}
      `;

      const reportText = `
REPORT: ${cPlant.commonName || 'Unknown Plant'}
Scientific Name: ${cPlant.scientificName || 'N/A'}
Family: ${cPlant.family || 'N/A'}

--- THERAPEUTIC PROFILE ---
${therapeutic}

--- MEDICINAL BENEFITS ---
${benefits}

--- SAFETY PROFILE ---
${safetyText}

--- DETAILED EXPLANATION ---
${comprehensiveData?.detailedExplanation || 'N/A'}

Generated by MedPlant AI
      `.trim();

      console.log('[PDF] Sending text to backend...');
      setLoadingStatus('Downloading PDF...');

      // 4. Call Backend
      const pdfUri = await downloadPdfReport(cPlant.commonName || 'Plant', reportText);
      console.log('[PDF] Downloaded to:', pdfUri);

      // 5. Save URI for "Open PDF" action and show toast
      savedPdfUri.current = pdfUri;
      setToastMessage(`${cPlant.commonName || 'Plant'} report saved successfully!`);
      setToastVisible(true);

      // Auto-open share sheet so user can save/open immediately
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save PDF Report',
          UTI: 'com.adobe.pdf',
        });
      }

      // 6. Save History
      const historyItem: HistoryItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        timestamp: Date.now(),
        plantName: cPlant.commonName || 'Unknown Plant',
        scientificName: cPlant.scientificName,
        confidence: confidence,
        fileName: `${cPlant.commonName}_Report.pdf`,
        fileUri: pdfUri,
      };
      await saveToHistory(historyItem);

    } catch (error: any) {
      console.error('[PDF Error]', error);
      Alert.alert('PDF Failed', `Could not generate report: ${error.message}`);
    } finally {
      setIsGeneratingPDF(false);
      setLoadingStatus('Preparing report...');
    }
  };

  // Handle opening the saved PDF
  const handleOpenPdf = async () => {
    if (savedPdfUri.current) {
      try {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(savedPdfUri.current, {
            mimeType: 'application/pdf',
            dialogTitle: 'Open PDF Report',
            UTI: 'com.adobe.pdf',
          });
        }
      } catch (error) {
        console.error('[PDF Open Error]', error);
      }
    }
  };

  return (
    <View style={[styles.main, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />

      {/* 2. Top Section: Hero Image & Back */}
      <View style={styles.imageContainer}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.heroImage} />
        ) : (
          <View style={[styles.heroPlaceholder, { backgroundColor: colors.muted }]} />
        )}

        <Pressable
          onPress={onBack}
          android_ripple={{ color: 'rgba(255,255,255,0.3)', borderless: true }}
          style={({ pressed }) => [
            styles.backButton,
            {
              backgroundColor: 'rgba(0,0,0,0.45)',
              opacity: Platform.OS === 'ios' && pressed ? 0.6 : 1
            }
          ]}
        >
          <Text style={styles.backButtonText}>←</Text>
        </Pressable>

        <Pressable
          onPress={onRefresh}
          android_ripple={{ color: 'rgba(255,255,255,0.3)', borderless: true }}
          style={({ pressed }) => [
            styles.refreshButton,
            {
              backgroundColor: 'rgba(0,0,0,0.45)',
              opacity: Platform.OS === 'ios' && pressed ? 0.6 : 1
            }
          ]}
        >
          <Text style={styles.refreshButtonText}>↻</Text>
        </Pressable>
      </View>

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Page Name & Header */}
        <View style={styles.header}>
          <Text style={[styles.pageName, { color: colors.primary }]}>Plant Report</Text>
          <View style={styles.titleRow}>
            <Text style={[styles.commonName, { color: colors.text }]}>
              {plant.commonName || 'Unknown Species'}
            </Text>
            {confidence && (
              <View style={[
                styles.confidenceBadge,
                { backgroundColor: isHighConf ? '#E6F4EA' : colors.card }
              ]}>
                <Text style={[
                  styles.confidenceText,
                  { color: isHighConf ? '#137333' : colors.subtext }
                ]}>
                  {confidence} Confidence
                </Text>
              </View>
            )}
          </View>

          <Text style={[styles.scientificName, { color: colors.subtext }]}>
            {plant.scientificName} • {plant.family}
          </Text>
        </View>

        {/* 3. Medicinal Uses (PRIMARY SECTION - PROMINENT CARD) */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.primary, borderWidth: 2 }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.primary }]}>🌿 Medicinal Uses</Text>
          </View>
          <View style={styles.numberedList}>
            {displayUses.map((item: string, i: number) => (
              <View key={i} style={styles.numberedItem}>
                <Text style={[styles.number, { color: colors.primary }]}>{i + 1}.</Text>
                <Text style={[styles.itemText, { color: colors.text }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 4. Known Side Effects (Simple red outline, mild styling) */}
        {allCautions.length > 0 && (
          <View style={[styles.card, {
            backgroundColor: colors.card,
            borderColor: dark ? '#8B4513' : '#CD853F',
            borderWidth: 1.5
          }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>💊 Known Side Effects</Text>
            </View>
            <View style={styles.bulletList}>
              {allCautions.slice(0, 4).map((item: string, i: number) => (
                <View key={i} style={styles.bulletItem}>
                  <Text style={[styles.itemText, { color: colors.text }]}>• {item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 5. Active Compounds (Collapsible - Secondary information) */}
        {compounds.length > 0 && (
          <>
            <Pressable
              onPress={() => setCompoundsOpen(!compoundsOpen)}
              android_ripple={{ color: colors.primary + '20' }}
              style={({ pressed }) => [
                styles.collapsibleHeader,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  marginBottom: compoundsOpen ? 0 : 12,
                  opacity: Platform.OS === 'ios' && pressed ? 0.8 : 1
                }
              ]}
            >
              <Text style={[styles.collapsibleTitle, { color: colors.text }]}>🧪 Active Compounds</Text>
              <Text style={[styles.toggleIcon, { color: colors.text }]}>{compoundsOpen ? '↑' : '↓'}</Text>
            </Pressable>

            {compoundsOpen && (
              <View style={[styles.collapsibleContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.bulletList}>
                  {compounds.map((item: string, i: number) => (
                    <View key={i} style={styles.bulletItem}>
                      <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                      <Text style={[styles.itemText, { color: colors.text }]}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        {/* 6. Habitat & Distribution (Collapsible - Low priority) */}
        <Pressable
          onPress={() => setHabitatOpen(!habitatOpen)}
          android_ripple={{ color: colors.primary + '20' }}
          style={({ pressed }) => [
            styles.collapsibleHeader,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              marginBottom: habitatOpen ? 0 : 12,
              opacity: Platform.OS === 'ios' && pressed ? 0.8 : 1
            }
          ]}
        >
          <Text style={[styles.collapsibleTitle, { color: colors.text }]}>📍 Habitat & Distribution</Text>
          <Text style={[styles.toggleIcon, { color: colors.text }]}>{habitatOpen ? '↑' : '↓'}</Text>
        </Pressable>

        {habitatOpen && (
          <View style={[styles.collapsibleContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.habitatLabel, { color: colors.primary }]}>Distribution:</Text>
            <Text style={[styles.habitatText, { color: colors.subtext }]}>{habitat.distribution}</Text>

            <Text style={[styles.habitatLabel, { color: colors.primary, marginTop: 12 }]}>Environment:</Text>
            <Text style={[styles.habitatText, { color: colors.subtext }]}>{habitat.environment}</Text>
          </View>
        )}

        {/* 7. Detailed Information Section (Collapsible - At bottom) */}
        {(detailedInfo || references.length > 0) && (
          <>
            <Pressable
              onPress={() => setDetailedOpen(!detailedOpen)}
              android_ripple={{ color: colors.primary + '20' }}
              style={({ pressed }) => [
                styles.collapsibleHeader,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  marginBottom: detailedOpen ? 0 : 12,
                  opacity: Platform.OS === 'ios' && pressed ? 0.8 : 1
                }
              ]}
            >
              <Text style={[styles.collapsibleTitle, { color: colors.text }]}>📖 Detailed Information</Text>
              <Text style={[styles.toggleIcon, { color: colors.text }]}>{detailedOpen ? '↑' : '↓'}</Text>
            </Pressable>

            {detailedOpen && (
              <View style={[styles.collapsibleContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {detailedInfo && (
                  <Text style={[styles.detailedText, { color: colors.text }]}>
                    {detailedInfo}
                  </Text>
                )}
                {references.length > 0 && (
                  <View style={styles.referencesSection}>
                    <Text style={[styles.referencesLabel, { color: colors.primary }]}>References & Sources:</Text>
                    {references.map((ref: string, i: number) => (
                      <Text
                        key={i}
                        style={[styles.refText, { color: colors.primary }]}
                        onPress={() => Linking.openURL(ref)}
                      >
                        🔗 {ref}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {/* 8. Share Button (Text) */}
        <Pressable
          onPress={handleShareReport}
          style={({ pressed }) => [
            styles.shareButton,
            {
              backgroundColor: dark ? '#1a2520' : '#f0f8f5',
              borderColor: colors.border,
              opacity: Platform.OS === 'ios' && pressed ? 0.8 : 1
            }
          ]}
          android_ripple={{ color: colors.primary + '30', borderless: false }}
        >
          <Text style={[styles.shareButtonText, { color: colors.text }]}>📤 Share</Text>
        </Pressable>

        {/* 9. Download Comprehensive PDF Report Button */}
        <Pressable
          onPress={handleDownloadPDF}
          disabled={isGeneratingPDF}
          style={({ pressed }) => [
            styles.downloadButton,
            {
              backgroundColor: dark ? '#2a3a32' : '#e8f5f0',
              borderColor: colors.primary,
              opacity: (Platform.OS === 'ios' && pressed) || isGeneratingPDF ? 0.8 : 1
            }
          ]}
          android_ripple={{ color: colors.primary + '30', borderless: false }}
        >
          {isGeneratingPDF ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.downloadButtonText, { color: colors.primary }]}>{loadingStatus}</Text>
            </View>
          ) : (
            <Text style={[styles.downloadButtonText, { color: colors.primary }]}>📥 Download Comprehensive PDF Report</Text>
          )}
        </Pressable>

        {/* 10. Disclaimer */}
        <View style={styles.disclaimerContainer}>
          <Text style={[styles.disclaimerText, { color: colors.subtext }]}>
            MEDICAL DISCLAIMER: The information provided in this report is for educational purposes only and is not intended as medical advice. Always consult a qualified healthcare professional before using any plant for medicinal purposes. Antigravity and MedPlant do not guarantee the accuracy of AI-generated content.
          </Text>
        </View>

        {/* 11. Scan Again Button */}
        <Pressable
          style={({ pressed }) => [
            styles.scanAgainButton,
            {
              backgroundColor: colors.primary,
              opacity: Platform.OS === 'ios' && pressed ? 0.8 : 1
            }
          ]}
          android_ripple={{ color: '#ffffff30', borderless: false }}
          onPress={onBack}
        >
          <Text style={styles.scanAgainButtonText}>Scan Again</Text>
        </Pressable>
      </ScrollView>

      {/* Success Toast */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type="success"
        duration={5000}
        actionLabel="Open PDF"
        onAction={handleOpenPdf}
        onDismiss={() => setToastVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: '#fff', // Default fallback
  },
  imageContainer: {
    height: 240,
    width: '100%',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '300',
  },
  refreshButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '300',
    marginTop: -2,
  },
  container: {
    flex: 1,
    marginTop: -40,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    overflow: 'hidden', // Ensure content doesn't bleed out during scroll
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 60,
  },
  header: {
    marginBottom: 28,
  },
  pageName: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  commonName: {
    fontSize: 32,
    fontWeight: '900',
    flex: 1,
  },
  scientificName: {
    fontSize: 16,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  confidenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 4,
    marginLeft: 12,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  numberedList: {
    gap: 12,
  },
  numberedItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  number: {
    fontSize: 16,
    fontWeight: '800',
    width: 28,
  },
  bulletList: {
    gap: 10,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    marginRight: 10,
  },
  itemText: {
    fontSize: 15,
    lineHeight: 24,
    flex: 1,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
  },
  collapsibleTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  toggleIcon: {
    fontSize: 18,
    fontWeight: '700',
  },
  collapsibleContent: {
    padding: 18,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderWidth: 1,
    borderTopWidth: 0,
    marginTop: -2,
    marginBottom: 28,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 8,
  },
  habitatLabel: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  habitatText: {
    fontSize: 15,
    lineHeight: 22,
  },
  referencesCard: {
    marginTop: 24,
    paddingHorizontal: 4,
  },
  refItem: {
    marginBottom: 10,
  },
  refText: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  disclaimerContainer: {
    marginTop: 40,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  disclaimerText: {
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  scanAgainButton: {
    marginTop: 32,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  scanAgainButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // New styles for restructured report
  cautionNote: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  detailedText: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 16,
  },
  referencesSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  referencesLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  downloadButton: {
    marginTop: 8,
    marginBottom: 8,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    borderWidth: 2,
  },
  downloadButtonText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  shareButton: {
    marginTop: 20,
    marginBottom: 4,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
