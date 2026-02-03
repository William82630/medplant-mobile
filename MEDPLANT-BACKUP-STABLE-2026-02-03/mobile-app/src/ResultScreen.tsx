
import React, { useState } from 'react';
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
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { generateComprehensiveReport } from './services/GeminiService';
import { saveToHistory, HistoryItem } from './history';
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
      // 1. Show loading indicator state
      console.log('[PDF] STARTING GENERATION PROCESS...');
      setIsGeneratingPDF(true);

      // 2. Call Gemini for comprehensive report data
      console.log('[PDF] Stage 1: Requesting Gemini Data...');
      const comprehensiveData = await generateComprehensiveReport(plant.commonName || plant.scientificName || 'Unknown Plant');
      console.log('[PDF] Stage 1 Complete. Comprehensive data received:', comprehensiveData ? 'YES' : 'NO');

      // 3. Deduct credit (if not admin) - ONLY after success
      if (!isAdmin() && comprehensiveData) {
        console.log('[PDF] Stage 2: Deducting Credit...');
        const creditResult = await useCredit();
        console.log('[PDF] Stage 2 Complete. Result:', creditResult.success ? 'Success' : 'Failed');
      } else if (isAdmin()) {
        console.log('[PDF] Admin - skipping credit deduction.');
      }

      // Populate data for HTML
      const cPlant = comprehensiveData?.plant || plant;
      const therapeuticProfile = comprehensiveData?.therapeuticProfile || detailedInfo || 'Therapeutic information not available.';
      const benefitList = Array.isArray(comprehensiveData?.expandedMedicinalBenefits) ? comprehensiveData.expandedMedicinalBenefits : (displayUses.map(u => ({ title: 'Medicinal Benefit', description: u })));
      const preparations = Array.isArray(comprehensiveData?.traditionalPreparationAndUsage) ? comprehensiveData.traditionalPreparationAndUsage : [];
      const rawSafety = comprehensiveData?.sideEffectsAndSafetyProfile || {};
      const safety = {
        generalSideEffects: Array.isArray(rawSafety.generalSideEffects) ? rawSafety.generalSideEffects : (Array.isArray(p.sideEffects) ? p.sideEffects : []),
        contraindications: Array.isArray(rawSafety.contraindications) ? rawSafety.contraindications : [],
        drugInteractions: Array.isArray(rawSafety.drugInteractions) ? rawSafety.drugInteractions : [],
        allergicReactions: Array.isArray(rawSafety.allergicReactions) ? rawSafety.allergicReactions : []
      };
      const detailedExplanation = comprehensiveData?.detailedExplanation || '';
      const cReferences = Array.isArray(comprehensiveData?.trustedReferencesAndBibliography) ? comprehensiveData.trustedReferencesAndBibliography : references;

      console.log('[PDF] Stage 3: Formatting HTML...');
      // Generate HTML Content (Same logic as before, condensed for brevity)
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${cPlant.commonName || 'Plant'} Report</title>
          <style>
            body { font-family: sans-serif; padding: 20px; line-height: 1.5; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #2D6A4F; padding-bottom: 10px; margin-bottom: 20px; }
            .section { margin-bottom: 20px; }
            .section-title { color: #2D6A4F; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            .box { background: #f9f9f9; padding: 15px; border-radius: 5px; border-left: 4px solid #2D6A4F; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🌿 ${cPlant.commonName || 'Plant'}</h1>
            <p>${cPlant.scientificName || ''} | Family: ${cPlant.family || ''}</p>
          </div>
          <div class="section">
            <h2 class="section-title">Therapeutic Profile</h2>
            <div class="box">${therapeuticProfile}</div>
          </div>
          <div class="section">
            <h2 class="section-title">Medicinal Benefits</h2>
            <ul>${benefitList.map((b: any) => `<li><strong>${b.title || ''}</strong>: ${b.description || ''}</li>`).join('')}</ul>
          </div>
          <div class="section">
            <h2 class="section-title">Side Effects & Safety</h2>
            <div class="box">
              <p><strong>Side Effects:</strong> ${safety.generalSideEffects.join(', ') || 'None reported'}</p>
              <p><strong>Contraindications:</strong> ${safety.contraindications.join(', ') || 'None specified'}</p>
            </div>
          </div>
          <div class="section">
            <h2 class="section-title">Detailed Info</h2>
            <p>${detailedExplanation}</p>
          </div>
          <div style="font-size: 10px; color: #888; margin-top: 40px; text-align: center;">Generated by MedPlant App • ${new Date().toLocaleDateString()}</div>
        </body>
        </html>
      `;

      console.log(`[PDF] Stage 4: Writing File (HTML Length: ${htmlContent.length})...`);

      // GUARD: Ensure HTML is valid
      if (!htmlContent || htmlContent.length < 50) {
        throw new Error('Generated HTML is too short/invalid.');
      }

      if (Platform.OS === 'web') {
        // WEB FALLBACK
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${(plant.commonName || 'Plant')}_Report.html`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        // MOBILE PDF GENERATION
        const fileName = `${(plant.commonName || 'Plant').replace(/\s+/g, '_')}_Report.pdf`;
        const fileUri = FileSystem.cacheDirectory + fileName;

        console.log('[PDF] Calling Print.printToFileAsync...');
        // 60-second timeout for native print call
        const printPromise = Print.printToFileAsync({
          html: htmlContent,
          base64: false,
          // @ts-ignore - Following user request for 'uri' property
          uri: fileUri
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('PDF Engine Timeout after 60s')), 60000)
        );

        const printResult = await Promise.race([printPromise, timeoutPromise]) as any;
        const uri = printResult.uri;

        console.log('[PDF] Stage 4 Complete. PDF URI:', uri);

        // Stage 5: Share
        if (await Sharing.isAvailableAsync()) {
          console.log('[PDF] Stage 5: Opening Sharing Dialog...');
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: `${plant.commonName || 'Plant'} Report`,
            UTI: 'com.adobe.pdf',
          });
        }

        // Save to history
        const historyItem: HistoryItem = {
          id: `${Date.now()}`,
          timestamp: Date.now(),
          plantName: plant.commonName || 'Unknown Plant',
          scientificName: plant.scientificName,
          confidence: confidence,
          fileName: fileName,
          fileUri: uri,
        };
        await saveToHistory(historyItem);
      }

      console.log('[PDF] SUCCESS: Process finished.');
    } catch (error: any) {
      console.error('[PDF ERROR]', error);
      Alert.alert('PDF Issue', `Could not complete PDF: ${error.message || 'Unknown Error'}`);
    } finally {
      setIsGeneratingPDF(false);
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
              <Text style={[styles.downloadButtonText, { color: colors.primary }]}>Generating Premium Report...</Text>
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
