
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
import { generateComprehensiveReport } from './services/GeminiService';

type Props = {
  data: any;
  imageUri?: string;
  onBack: () => void;
  onRefresh: () => void;
};

export default function ResultScreen({ data, imageUri, onBack, onRefresh }: Props) {
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
${compounds.length > 0 ? compounds.map(c => `• ${c}`).join('\n') : 'Not specified'}

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

    try {
      // 1. Show loading indicator state
      setIsGeneratingPDF(true);

      // 2. Call Gemini for comprehensive report data
      const comprehensiveData = await generateComprehensiveReport(plant.commonName || plant.scientificName || 'Unknown Plant');

      // Fallback to on-screen data if Gemini call fails
      const cPlant = comprehensiveData?.plant || plant;
      const therapeuticProfile = comprehensiveData?.therapeuticProfile || detailedInfo || 'Therapeutic information not available.';
      const benefitList = comprehensiveData?.expandedMedicinalBenefits || displayUses.map(u => ({ title: 'Medicinal Benefit', description: u }));
      const preparations = comprehensiveData?.traditionalPreparationAndUsage || [];
      const safety = comprehensiveData?.sideEffectsAndSafetyProfile || {
        generalSideEffects: p.sideEffects || [],
        contraindications: [],
        drugInteractions: [],
        allergicReactions: []
      };
      const detailedExplanation = comprehensiveData?.detailedExplanation || '';
      const cReferences = comprehensiveData?.trustedReferencesAndBibliography || references;

      // 3. Generate HTML with PREMIUM 6-section detailed content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${cPlant.commonName || plant.commonName || 'Plant'} - Comprehensive Premium Report</title>
          <style>
            body { font-family: 'Georgia', serif; padding: 40px; line-height: 1.8; color: #222; max-width: 900px; margin: 0 auto; background: #fff; }
            .header { text-align: center; border-bottom: 4px double #2D6A4F; padding-bottom: 30px; margin-bottom: 40px; }
            .title { font-size: 36px; font-weight: bold; color: #1B4332; margin: 0; font-family: 'Helvetica Neue', sans-serif; }
            .subtitle { font-size: 20px; font-style: italic; color: #555; margin: 10px 0; }
            .meta { font-size: 14px; color: #777; margin-top: 10px; }
            
            .section { margin: 35px 0; page-break-inside: avoid; }
            .section-title { font-size: 22px; font-weight: bold; color: #2D6A4F; margin-bottom: 15px; border-bottom: 2px solid #e0e0e0; padding-bottom: 8px; font-family: 'Helvetica Neue', sans-serif; }
            
            .benefit-item { margin-bottom: 20px; }
            .benefit-title { font-weight: bold; color: #1B4332; font-size: 16px; }
            .benefit-desc { color: #444; margin-top: 5px; }
            
            .therapeutic-box { background: #F0F7F4; padding: 20px; border-left: 5px solid #2D6A4F; border-radius: 4px; white-space: pre-wrap; }
            
            .prep-item { margin-bottom: 15px; background: #fff; border: 1px solid #eee; padding: 15px; border-radius: 8px; }
            .prep-method { font-weight: bold; color: #d35400; text-transform: uppercase; font-size: 12px; letter-spacing: 1px; }
            .prep-desc { margin-top: 8px; color: #444; }
            
            .safety-box { background: #FFF5F5; border: 2px solid #F5C6CB; padding: 25px; border-radius: 8px; margin-top: 20px; }
            .safety-title { color: #721C24; font-weight: bold; font-size: 18px; margin-bottom: 15px; }
            .safety-section { margin-bottom: 15px; }
            .safety-label { font-weight: bold; color: #721C24; }
            
            .explanation-box { background: #F8F9FA; padding: 20px; border-radius: 8px; border-left: 5px solid #6C757D; white-space: pre-wrap; }
            
            .references { background: #F8F9FA; padding: 20px; border-radius: 8px; font-size: 14px; }
            .ref-link { color: #2D6A4F; text-decoration: none; display: block; margin-bottom: 8px; }
            
            .disclaimer { font-size: 11px; color: #888; text-align: center; margin-top: 60px; padding: 30px; border-top: 1px solid #ddd; font-style: italic; background: #fafafa; }
            .footer { text-align: center; font-size: 12px; color: #aaa; margin-top: 20px; }
            
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">🌿 ${cPlant.commonName || plant.commonName}</h1>
            <p class="subtitle">${cPlant.scientificName || plant.scientificName}</p>
            <p class="meta">Family: ${cPlant.family || plant.family} | Premium Medicinal Report</p>
          </div>

          <!-- SECTION 1: Therapeutic Profile -->
          <div class="section">
            <h2 class="section-title">✨ 1. Therapeutic Profile</h2>
            <div class="therapeutic-box">
              ${therapeuticProfile}
            </div>
          </div>

          <!-- SECTION 2: Expanded Medicinal Benefits -->
          <div class="section">
            <h2 class="section-title">🌿 2. Expanded Medicinal Benefits</h2>
            ${Array.isArray(benefitList) ? benefitList.map((b: any) => `
              <div class="benefit-item">
                <div class="benefit-title">✓ ${b.title || 'Benefit'}</div>
                <div class="benefit-desc">${b.description || ''}</div>
              </div>
            `).join('') : '<p>No benefits data available.</p>'}
          </div>

          <!-- SECTION 3: Traditional Preparation & Usage -->
          <div class="section">
            <h2 class="section-title">🍃 3. Traditional Preparation & Usage</h2>
            ${Array.isArray(preparations) && preparations.length > 0 ? preparations.map((prep: any) => `
              <div class="prep-item">
                <div class="prep-method">${prep.method || 'Method'}</div>
                <div class="prep-desc">${prep.description || prep.instructions || ''}</div>
              </div>
            `).join('') : '<p>Preparation information not available.</p>'}
          </div>

          <!-- SECTION 4: Side Effects & Safety Profile (SEPARATE) -->
          <div class="section">
            <h2 class="section-title">⚠️ 4. Side Effects & Safety Profile</h2>
            <div class="safety-box">
              <div class="safety-section">
                <span class="safety-label">General Side Effects:</span>
                <ul>${(safety.generalSideEffects || safety.sideEffects || []).map((s: string) => `<li>${s}</li>`).join('') || '<li>None reported</li>'}</ul>
              </div>

              <div class="safety-section">
                <span class="safety-label">Contraindications:</span>
                <ul>${(safety.contraindications || []).map((c: string) => `<li>${c}</li>`).join('') || '<li>None specified</li>'}</ul>
              </div>

              <div class="safety-section">
                <span class="safety-label">Drug Interactions:</span>
                <ul>${(safety.drugInteractions || []).map((d: string) => `<li>${d}</li>`).join('') || '<li>None specified</li>'}</ul>
              </div>

              <div class="safety-section">
                <span class="safety-label">Allergic Reactions:</span>
                <ul>${(safety.allergicReactions || []).map((a: string) => `<li>${a}</li>`).join('') || '<li>None specified</li>'}</ul>
              </div>
            </div>
          </div>

          <!-- SECTION 5: Detailed Explanation -->
          <div class="section">
            <h2 class="section-title">📖 5. Detailed Explanation</h2>
            <div class="explanation-box">
              ${detailedExplanation || 'Detailed ethnomedicinal information not available.'}
            </div>
          </div>

          <!-- SECTION 6: Trusted References & Bibliography -->
          <div class="section references">
            <h2 class="section-title">📚 6. Trusted References & Bibliography</h2>
            ${Array.isArray(cReferences) && cReferences.length > 0 ? cReferences.map((r: string) => {
        const url = r.split(' - ')[0] || r;
        return `<a href="${url}" class="ref-link" target="_blank">🔗 ${r}</a>`;
      }).join('') : '<p>No references available.</p>'}
          </div>

          <div class="disclaimer">
            <strong>MEDICAL DISCLAIMER:</strong> This PREMIUM REPORT is for educational and informational purposes only. 
            It is not intended to be a substitute for professional medical advice, diagnosis, or treatment. 
            Always seek the advice of your physician or qualified ayurvedic practitioner with any questions you may have regarding a medical condition. 
            Never disregard professional medical advice or delay in seeking it because of something you have read in this report.
          </div>

          <div class="footer">
            Generated by MedPlant App Premium • ${new Date().toLocaleDateString()}
          </div>
        </body>
        </html>
      `;

      // Check if running on web
      const isWeb = Platform.OS === 'web';

      if (isWeb) {
        // For WEB: Open HTML in new tab (user can save as PDF via browser)
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${(plant.commonName || 'Plant').replace(/\s+/g, '_')}_Report.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        Alert.alert('Report Downloaded', 'HTML report downloaded! Open it in your browser and use Print > Save as PDF for a PDF version.');
      } else {
        // For MOBILE: Use expo-print to create actual PDF
        const { uri } = await Print.printToFileAsync({ html: htmlContent });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: `${plant.commonName || 'Plant'} Report`,
            UTI: 'com.adobe.pdf',
          });
        } else {
          Alert.alert('PDF Created', `Report saved to: ${uri}`);
        }
      }
    } catch (error: any) {
      console.error('[PDF Error]', error);
      Alert.alert('Report Generation Failed', 'Unable to generate premium report. Please try again.');
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
        style={styles.container}
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
  },
  imageContainer: {
    height: 320,
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
    backgroundColor: 'transparent',
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
