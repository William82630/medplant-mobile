
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
import { useTheme } from '../theme';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import Toast from '../components/Toast';

// Direct save to documentDirectory - no SAF needed

// Type matching the data passed from IdentifyScreen
export type AilmentPlantData = {
  plantName: string;
  scientificName: string;
  plantType?: string;
  medicinalBenefits: string; // semicolon separated or raw text
  sideEffects?: string;
  regionsFound?: string;
  preparation?: string;
  detailedExplanation?: string;
  source?: string;
  imageUrl?: string; // Optional image URL from database
};

// Navigation props
interface ScreenProps {
  route: any;
  navigation: any;
}

export default function AilmentDetailScreen({ route, navigation }: ScreenProps) {
  const { colors, dark } = useTheme();

  const { plantData } = route.params;
  const data = plantData as AilmentPlantData;
  const onBack = () => navigation.goBack();

  // Collapse states
  const [warningsOpen, setWarningsOpen] = useState(false);
  const [habitatOpen, setHabitatOpen] = useState(true); // Open by default for region info
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('Preparing report...');

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const savedPdfUri = useRef<string | null>(null);

  if (!data) return null;

  const plantName = data.plantName || 'Unknown Plant';
  const scientificName = data.scientificName || '';
  const plantType = data.plantType || 'Medicinal Plant';

  // Format Medicinal Benefits
  const medicinalUses = data.medicinalBenefits
    ? data.medicinalBenefits.split(';').map(u => u.trim()).filter(u => u.length > 0)
    : [];

  const sideEffects = data.sideEffects
    ? data.sideEffects.split(';').map(s => s.trim()).filter(s => s.length > 0)
    : [];

  // Extract URL from detailed explanation if present
  const sourceMatch = data.detailedExplanation?.match(/Source:\s*(https?:\/\/[^\s]+)/);
  const sourceUrl = sourceMatch ? sourceMatch[1] : null;
  const detailedText = sourceMatch
    ? data.detailedExplanation?.replace(/Source:\s*https?:\/\/[^\s]+/, '').trim()
    : data.detailedExplanation;

  // Generate HTML Content
  const generateHtml = () => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${plantName} - Medical Report</title>
          <style>
            body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; line-height: 1.6; color: #212121; max-width: 800px; margin: 0 auto; background: #fff; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 28px; font-weight: bold; color: #000; margin: 0; text-transform: uppercase; }
            .subtitle { font-size: 18px; font-style: italic; color: #444; margin: 8px 0; }
            .meta { font-size: 13px; color: #666; margin-top: 5px; }
            .section { margin: 25px 0; page-break-inside: avoid; }
            .section-title { font-size: 18px; font-weight: bold; color: #1a1a1a; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 4px; text-transform: uppercase; }
            .content { font-size: 14px; color: #333; }
            ul { margin: 10px 0; padding-left: 20px; }
            li { margin-bottom: 6px; font-size: 14px; }
            .warning-box { background: #fdf2f2; border: 1px solid #fbd5d5; padding: 12px; border-radius: 4px; }
            .disclaimer { font-size: 10px; color: #666; text-align: justify; margin-top: 40px; padding: 20px; border-top: 1px solid #eee; font-style: italic; background: #f9f9f9; }
            .footer { text-align: center; font-size: 11px; color: #999; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">${plantName}</h1>
            <p class="subtitle">${scientificName}</p>
            <p class="meta">Report Category: ${plantType}</p>
          </div>

          <div class="section">
            <h2 class="section-title">Uses</h2>
            <ul>
              ${medicinalUses.map(use => `<li>${use}</li>`).join('')}
            </ul>
          </div>

          ${detailedText ? `
          <div class="section">
            <h2 class="section-title">Description</h2>
            <p class="content">${detailedText}</p>
          </div>
          ` : ''}

          ${data.preparation ? `
          <div class="section">
            <h2 class="section-title">Dosage</h2>
            <p class="content">${data.preparation}</p>
          </div>
          ` : ''}

          ${sideEffects.length > 0 ? `
          <div class="section">
            <h2 class="section-title">Side Effects</h2>
            <div class="warning-box">
              <ul>
                ${sideEffects.map(effect => `<li>${effect}</li>`).join('')}
              </ul>
            </div>
          </div>
          ` : ''}

          ${data.regionsFound ? `
          <div class="section">
            <h2 class="section-title">Habitat</h2>
            <p class="content">${data.regionsFound}</p>
          </div>
          ` : ''}

          ${sourceUrl ? `
          <div class="section">
            <h2 class="section-title">References</h2>
            <p class="content"><a href="${sourceUrl}">${sourceUrl}</a></p>
          </div>
          ` : ''}

          <div class="disclaimer">
            <strong>MEDICAL DISCLAIMER:</strong> This report is for educational and informational purposes only.
            It is not intended to be a substitute for professional medical advice, diagnosis, or treatment.
            Always seek the advice of your physician or qualified healthcare professional regarding any medical condition.
            The use of medicinal plants should be supervised by a healthcare practitioner.
          </div>

          <div class="footer">
            Generated by MedPlant AI • ${new Date().toLocaleDateString()}
          </div>
        </body>
        </html>
      `;
  };

  // Helper: Generate PDF file
  const generatePdfFile = async () => {
    const htmlContent = generateHtml();
    const { uri, base64 } = await Print.printToFileAsync({
      html: htmlContent,
      base64: true // Needed for SAF writing
    });
    return { uri, base64 };
  };

  // 1. Handle Download PDF (Strictly Download / Save)
  const handleDownloadPDF = async () => {
    if (isGeneratingPDF) return;

    try {
      setIsGeneratingPDF(true);
      setLoadingStatus('Generating report...');

      const isWeb = Platform.OS === 'web';

      if (isWeb) {
        // WEB: Download clean HTML file (Standardized behavior)
        setLoadingStatus('Creating download...');
        const htmlContent = generateHtml();
        const fileName = `${plantName.replace(/\s+/g, '_')}_Report.html`;
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setToastMessage('Report downloaded! Open the file and print as PDF.');
        setToastVisible(true);
      } else {
        // MOBILE: Save clean PDF to document directory
        const { uri, base64 } = await generatePdfFile();
        savedPdfUri.current = uri;

        if (Platform.OS === 'android') {
          // ANDROID: Direct save to persistent storage
          setLoadingStatus('Saving...');
          const fileName = `${plantName.replace(/\s+/g, '_')}_Report.pdf`;
          const targetUri = `${FileSystem.documentDirectory}${fileName}`;

          if (base64) {
            await FileSystem.writeAsStringAsync(targetUri, base64, {
              encoding: FileSystem.EncodingType.Base64
            });
            savedPdfUri.current = targetUri;
            setToastMessage('PDF saved to device');
            setToastVisible(true);
          } else {
            throw new Error('PDF generation failed.');
          }
        } else {
          // iOS: Silent save to app documents
          setLoadingStatus('Saving...');
          const fileName = `${plantName.replace(/\s+/g, '_')}_Report.pdf`;
          const targetUri = `${FileSystem.documentDirectory}${fileName}`;
          await FileSystem.copyAsync({ from: uri, to: targetUri });
          savedPdfUri.current = targetUri;
          setToastMessage('PDF saved to device');
          setToastVisible(true);
        }
      }
    } catch (error: any) {
      console.error('[PDF Download Error]', error);
      Alert.alert('Download Failed', 'Unable to save report.');
    } finally {
      setIsGeneratingPDF(false);
      setLoadingStatus('Preparing report...');
    }
  };

  // 2. Handle Share Report (Share the PDF file)
  const handleShareReport = async () => {
    try {
      if (isGeneratingPDF) return;

      const isWeb = Platform.OS === 'web';

      if (isWeb) {
        // WEB: Attempt system share sheet if supported
        if (navigator.share) {
          try {
            const htmlContent = generateHtml();
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const file = new File([blob], `${plantName.replace(/\s+/g, '_')}_Report.html`, { type: 'text/html' });

            await navigator.share({
              title: `${plantName} Report`,
              text: `Check out this report for ${plantName}`,
              files: [file]
            });
            return;
          } catch (shareError: any) {
            if (shareError.name === 'AbortError') return; // User cancelled
            console.warn('[Web Share Error]', shareError);
          }
        }

        // Fallback for browsers without navigator.share or if sharing fails
        Alert.alert('Share Unavailable', 'Sharing is not supported by your browser. Please use "Download Report" instead.');
        return;
      }

      // MOBILE: Original sharing logic
      let uriToShare = savedPdfUri.current;

      // If we don't have a cached PDF yet, generate one now
      if (!uriToShare) {
        setIsGeneratingPDF(true);
        setLoadingStatus('Preparing share...');
        const { uri } = await generatePdfFile();
        savedPdfUri.current = uri;
        uriToShare = uri;
        setIsGeneratingPDF(false);
      }

      // Share the file
      if (uriToShare && await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uriToShare, {
          mimeType: 'application/pdf',
          dialogTitle: `Share ${plantName} Report`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Share Unavailable', 'Sharing is not available on this device');
      }
    } catch (error: any) {
      console.error('[Share Error]', error);
      setIsGeneratingPDF(false);
      Alert.alert('Share Failed', 'Unable to share the report.');
    }
  };

  // Handle opening the saved PDF (via Toast action)
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

      {/* Image Section - Shows actual image or placeholder */}
      <View style={styles.imageContainer}>
        {data.imageUrl ? (
          <Image source={{ uri: data.imageUrl }} style={styles.heroImage} />
        ) : (
          <View style={[styles.heroPlaceholder, { backgroundColor: colors.muted }]}>
            <Text style={{ fontSize: 80, opacity: 0.3 }}>🌿</Text>
          </View>
        )}

        {/* Back Button Overlay */}
        <Pressable
          onPress={onBack}
          android_ripple={{ color: 'rgba(255,255,255,0.3)', borderless: true }}
          style={({ pressed }) => [
            styles.backButtonOverlay,
            {
              backgroundColor: 'rgba(0,0,0,0.45)',
              opacity: Platform.OS === 'ios' && pressed ? 0.6 : 1
            }
          ]}
        >
          <Text style={styles.backButtonTextWhite}>←</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Page Name & Header */}
        <View style={styles.header}>
          <Text style={[styles.pageName, { color: colors.primary }]}>Medicinal Plant Report</Text>
          <View style={styles.titleRow}>
            <Text style={[styles.commonName, { color: colors.text }]}>
              {plantName}
            </Text>
            {/* Confidence Badge - Always High for database plants */}
            <View style={[
              styles.confidenceBadge,
              { backgroundColor: '#E6F4EA' }
            ]}>
              <Text style={[styles.confidenceText, { color: '#137333' }]}>
                High Confidence
              </Text>
            </View>
          </View>

          <Text style={[styles.scientificName, { color: colors.subtext }]}>
            {scientificName}
          </Text>

          {/* Meta info row - Family & Type */}
          <View style={styles.metaRow}>
            <Text style={[styles.metaText, { color: colors.subtext }]}>
              Family: <Text style={{ fontWeight: '700' }}>Medicinal Plants</Text> | Type: <Text style={{ fontWeight: '700' }}>{plantType}</Text>
            </Text>
          </View>
        </View>

        {/* 2. Medicinal Uses (PRIMARY SECTION) */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.primary, borderWidth: 2 }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.primary }]}>🌿 Medicinal Uses</Text>
          </View>
          <View style={styles.bulletList}>
            {medicinalUses.length > 0 ? (
              medicinalUses.map((item, i) => (
                <View key={i} style={styles.bulletItem}>
                  <Text style={[styles.itemText, { color: colors.text }]}>• {item}</Text>
                </View>
              ))
            ) : (
              <Text style={{ color: colors.subtext }}>No specific uses listed.</Text>
            )}
          </View>
        </View>

        {/* 3. Detailed Explanation (NEW SECTION FOR LONG PASSAGE) */}
        {detailedText && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>📖 Detailed Information</Text>
            </View>
            <Text style={[styles.bodyText, { color: colors.text }]}>
              {detailedText}
            </Text>
          </View>
        )}

        {/* 4. Preparation (If available) */}
        {data.preparation && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>🍵 Preparation Method</Text>
            </View>
            <Text style={[styles.itemText, { color: colors.text }]}>
              {data.preparation}
            </Text>
          </View>
        )}

        {/* 5. Side Effects */}
        {sideEffects.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>💊 Known Side Effects</Text>
            </View>
            <View style={styles.bulletList}>
              {sideEffects.map((item, i) => (
                <View key={i} style={styles.bulletItem}>
                  <Text style={[styles.itemText, { color: colors.text }]}>• {item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 6. Habitat & Distribution (Expandable) */}
        <Pressable
          onPress={() => setHabitatOpen(!habitatOpen)}
          android_ripple={{ color: colors.primary + '20' }}
          style={({ pressed }) => [
            styles.collapsibleHeader,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              marginBottom: habitatOpen ? 0 : 28,
              opacity: Platform.OS === 'ios' && pressed ? 0.8 : 1
            }
          ]}
        >
          <Text style={[styles.collapsibleTitle, { color: colors.text }]}>📍 Habitat & Distribution</Text>
          <Text style={[styles.toggleIcon, { color: colors.text }]}>{habitatOpen ? '↑' : '↓'}</Text>
        </Pressable>

        {/* 7. Research & References */}
        {sourceUrl && (
          <View style={styles.referencesCard}>
            <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 12 }]}>📚 References</Text>
            <View style={styles.refItem}>
              <Text style={[styles.refText, { color: colors.primary }]} onPress={() => Linking.openURL(sourceUrl)}>
                🔗 {sourceUrl}
              </Text>
            </View>
          </View>
        )}

        {habitatOpen && (
          <View style={[styles.collapsibleContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.habitatLabel, { color: colors.primary }]}>Region Found:</Text>
            <Text style={[styles.habitatText, { color: colors.subtext }]}>{data.regionsFound || 'Unknown'}</Text>
          </View>
        )}

        {/* 8. Download PDF Button */}
        <Pressable
          onPress={handleDownloadPDF}
          android_ripple={{ color: '#4CAF5030', borderless: false }}
          style={({ pressed }) => [
            styles.downloadButton,
            {
              opacity: Platform.OS === 'ios' && pressed ? 0.8 : 1
            }
          ]}
        >
          <Text style={styles.downloadButtonText}>📥  {Platform.OS === 'web' ? 'Download Report' : 'Download PDF'}</Text>
        </Pressable>

        {/* 9. Share Button */}
        <Pressable
          onPress={handleShareReport}
          android_ripple={{ color: 'rgba(0,0,0,0.1)', borderless: false }}
          style={({ pressed }) => [
            styles.shareButton,
            {
              opacity: Platform.OS === 'ios' && pressed ? 0.8 : 1
            }
          ]}
        >
          <Text style={styles.shareButtonText}>📤  {Platform.OS === 'web' ? 'Share Report' : 'Share PDF'}</Text>
        </Pressable>

        {/* 9. Disclaimer */}
        <View style={styles.disclaimerContainer}>
          <Text style={[styles.disclaimerText, { color: colors.subtext }]}>
            MEDICAL DISCLAIMER: The information provided in this report is for educational purposes only and is not intended as medical advice. Always consult a qualified healthcare professional before using any plant for medicinal purposes.
          </Text>
        </View>

        {/* Bottom Padding */}
        <View style={{ height: 40 }} />

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
  },
  topBar: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    height: 200,
    width: '100%',
    position: 'relative',
  },
  backButtonOverlay: {
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
  backButtonTextWhite: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '300',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '300',
  },
  container: {
    flex: 1,
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
  metaRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  metaText: {
    fontSize: 13,
    lineHeight: 18,
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
  itemText: {
    fontSize: 15,
    lineHeight: 24,
    flex: 1,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 24,
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
    marginBottom: 20
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
    marginTop: 20,
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
  downloadButton: {
    marginTop: 24,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#1A1A1A',
    borderColor: '#4CAF50',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4CAF50',
    letterSpacing: 0.5,
  },
  shareButton: {
    marginTop: 12,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#FF9933', // Saffron
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 0.5,
  },
});
