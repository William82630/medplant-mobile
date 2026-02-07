import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  Pressable,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../theme';
import ResultScreen from '../ResultScreen';
import { identifyPlant } from '../api';
import { saveToHistory, HistoryItem } from '../history';

const { width } = Dimensions.get('window');

// Feature data with expanded content
const FEATURES = [
  {
    id: 'ai-detection',
    icon: '🔬',
    title: 'Advanced AI Detection',
    description: 'Pro AI Scan uses enhanced artificial intelligence models to analyze plant images with greater accuracy. The system evaluates visual patterns such as leaf structure, texture, shape, and color to improve identification reliability compared to basic scans.',
  },
  {
    id: 'botanical-analysis',
    icon: '🌱',
    title: 'Detailed Botanical Analysis',
    description: 'This feature provides structured botanical information including plant classification, physical characteristics, and distinguishing features. It helps users understand how a plant is identified and what makes it unique within its species or family.',
  },
  {
    id: 'medicinal-insights',
    icon: '💊',
    title: 'Medicinal Insights',
    description: 'Medicinal insights offer educational information about the traditional and documented medicinal relevance of identified plants. This includes commonly known uses, general preparation context, and historical references where applicable.',
  },
  {
    id: 'safety-warnings',
    icon: '⚠️',
    title: 'Safety & Toxicity Warnings',
    description: 'Safety and toxicity warnings highlight potential risks associated with specific plants. This may include toxicity indicators, possible side effects, and clear cautionary notes to prevent unsafe or inappropriate use.',
  },
  {
    id: 'ai-reports',
    icon: '📋',
    title: 'Comprehensive AI Reports',
    description: 'Pro AI Scan generates longer, well-structured reports that combine identification results, botanical details, medicinal context, and safety considerations into a single, easy-to-read format for deeper understanding.',
  },
];
interface ProAIScanScreenProps {
  onBack?: () => void;
  hasCredits: () => boolean;
  useCredit: () => Promise<{ success: boolean; remaining: number }>;
  isAdmin: () => boolean;
  onNavigateToPricing?: () => void;
}

export default function ProAIScanScreen({
  onBack,
  hasCredits,
  useCredit,
  isAdmin,
  onNavigateToPricing,
}: ProAIScanScreenProps) {
  const { colors, dark } = useTheme();
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [identifyResult, setIdentifyResult] = useState<any>(null);
  const [identifyError, setIdentifyError] = useState<string | null>(null);

  // Call Gemini to identify the plant
  // Call Gemini to identify the plant
  // Call Gemini to identify the plant
  // Call Gemini to identify the plant
  const identifyWithGemini = async (imageUri: string) => {
    console.log('[ProAIScan] Starting identification for:', imageUri);
    setIsIdentifying(true);
    setIdentifyError(null);

    // Debugging auth state
    console.log('[ProAIScan] Auth State:', {
      hasCredits: hasCredits(),
      isAdmin: isAdmin(),
      platform: Platform.OS
    });

    try {
      // 1. Check Credit Balance (Pre-check)
      if (!hasCredits() && !isAdmin()) {
        console.log('[ProAIScan] No credits and not admin. Stopping.');
        setIsIdentifying(false);
        const msg = "You have 0 credits remaining. Please buy more credits or upgrade your plan to identify plants with Pro AI.";

        if (Platform.OS === 'web') {
          if (window.confirm("Out of Credits\n\n" + msg + "\n\nGo to Plans & Pricing?")) {
            onNavigateToPricing?.();
          }
        } else {
          Alert.alert(
            "Out of Credits",
            msg,
            [
              { text: "Cancel", style: "cancel" },
              { text: "Buy Credits", onPress: () => onNavigateToPricing?.() }
            ]
          );
        }
        return;
      }

      // 2. Call API (Generate Report)
      console.log('[ProAIScan] Calling identifyPlant API...');
      const result = await identifyPlant({
        uri: imageUri,
        mimeType: 'image/jpeg',
        name: 'plant_image.jpg',
      });

      console.log('[ProAIScan] API Result received:', result.success ? 'Success' : 'Failed');

      if (result.success && result.data) {
        // 3. Deduct Credit (if not admin) - ONLY after success
        if (!isAdmin()) {
          console.log('[ProAIScan] Attempting to deduct credit...');
          const { success, remaining } = await useCredit();
          console.log('[ProAIScan] Credit deduction result:', { success, remaining });

          if (!success) {
            console.error('[ProAIScan] CRITICAL: Report generated but credit deduction failed.');
            Alert.alert("Deduction Failed", "We couldn't process your credit. Please try again.");
            return; // Block the report if deduction fails
          }
        } else {
          console.log('[ProAIScan] Admin user - bypassing credit deduction.');
        }

        console.log('[ProAIScan] Valid data received. Showing report.');
        setIdentifyResult(result.data);
        setShowReport(true);

        // Save to history
        const historyItem: HistoryItem = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          timestamp: Date.now(),
          plantName: result.data.identified?.plant?.commonName || 'Unknown Plant',
          scientificName: result.data.identified?.plant?.scientificName,
          confidence: result.data.identified?.plant?.confidence,
          imageUri: imageUri,
          data: result.data,
        };
        saveToHistory(historyItem).catch(err => console.error('[History Save Error]', err));
      } else {
        const errorMsg = result.error?.message || 'Failed to identify plant. Please try again.';
        console.error('[ProAIScan] API Error:', errorMsg);
        setIdentifyError(errorMsg);
        Alert.alert('Identification Failed', errorMsg);
      }
    } catch (error: any) {
      console.error('[ProAIScan] CRITICAL EXCEPTION:', error);
      const errorMsg = error.message || 'An unexpected error occurred.';
      setIdentifyError(errorMsg);
      Alert.alert('Error', errorMsg);
    } finally {
      setIsIdentifying(false);
    }
  };

  // Handle camera button press
  const handleCameraPress = async () => {
    try {
      // Request camera permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera permission is needed to take photos of plants.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Open camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        // Image preview only - user will click Identify button
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    }
  };

  // Handle gallery button press
  const handleGalleryPress = async () => {
    try {
      // Request media library permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Gallery permission is needed to select plant images.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Open image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        // Image preview only - user will click Identify button
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to open gallery. Please try again.');
    }
  };

  // Handle back from report
  const handleReportBack = () => {
    setShowReport(false);
    setIdentifyResult(null);
    // Optionally reset image: setSelectedImage(null);
  };

  // Handle refresh - go back to upload screen (camera/gallery) to select NEW image
  const handleRefresh = () => {
    // Close the report modal
    setShowReport(false);
    setIdentifyResult(null);
    // Clear the selected image so user can pick a NEW one
    setSelectedImage(null);
    setIdentifyError(null);
  };

  // Toggle feature expansion with animation
  const toggleFeature = (featureId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedFeature(expandedFeature === featureId ? null : featureId);
  };

  return (
    <View style={styles.container}>
      {/* Loading Overlay */}
      {isIdentifying && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              🌿 Analyzing plant...
            </Text>
            <Text style={[styles.loadingSubtext, { color: colors.subtext }]}>
              Gemini AI is identifying your plant
            </Text>
          </View>
        </View>
      )}

      {/* Result Screen Modal */}
      <Modal
        visible={showReport && identifyResult !== null}
        animationType="slide"
        onRequestClose={handleReportBack}
      >
        <ResultScreen
          data={identifyResult}
          imageUri={selectedImage || undefined}
          onBack={handleReportBack}
          onRefresh={handleRefresh}
          hasCredits={hasCredits}
          useCredit={useCredit}
          isAdmin={isAdmin}
        />
      </Modal>

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
            <Text style={styles.proSparkle}>✨</Text>
            <Text style={[styles.headerTitle, { color: dark ? '#f0c040' : '#b8860b' }]}>
              Pro AI Plant Scan
            </Text>
          </View>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Subtitle */}
          <Text style={[styles.subtitle, { color: dark ? '#8a9a92' : '#5b6b62' }]}>
            Advanced AI-powered plant identification with detailed analysis.
          </Text>

          {/* Primary Action Buttons */}
          <View style={styles.actionButtons}>
            {/* Camera Button */}
            <Pressable
              onPress={handleCameraPress}
              style={({ pressed }) => [
                styles.actionButton,
                {
                  backgroundColor: dark ? '#1a2f25' : '#e8f5f0',
                  borderColor: dark ? '#2a4a3a' : '#c0e0d4',
                  opacity: pressed ? 0.8 : 1,
                }
              ]}
            >
              <Text style={styles.actionIcon}>📷</Text>
              <Text style={[styles.actionText, { color: dark ? '#f2f2f2' : '#171717' }]}>
                Camera
              </Text>
            </Pressable>

            {/* Gallery Button */}
            <Pressable
              onPress={handleGalleryPress}
              style={({ pressed }) => [
                styles.actionButton,
                {
                  backgroundColor: dark ? '#1a2f25' : '#e8f5f0',
                  borderColor: dark ? '#2a4a3a' : '#c0e0d4',
                  opacity: pressed ? 0.8 : 1,
                }
              ]}
            >
              <Text style={styles.actionIcon}>🖼️</Text>
              <Text style={[styles.actionText, { color: dark ? '#f2f2f2' : '#171717' }]}>
                Gallery
              </Text>
            </Pressable>
          </View>

          {/* Image Preview Container */}
          <View style={[
            styles.imagePreviewContainer,
            {
              backgroundColor: dark ? '#0f1a15' : '#f8faf9',
              borderColor: dark ? '#1e2a24' : '#e0e8e4',
            }
          ]}>
            {selectedImage ? (
              <Image
                source={{ uri: selectedImage }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.imagePlaceholder, { borderColor: dark ? '#2a3a32' : '#d0d8d4' }]}>
                <Text style={styles.placeholderIcon}>🌿</Text>
                <Text style={[styles.placeholderText, { color: dark ? '#6a7a72' : '#888888' }]}>
                  Selected image will appear here
                </Text>
              </View>
            )}
          </View>

          {/* Identify Plant Button - Shows after image selection */}
          {selectedImage && (
            <Pressable
              onPress={() => identifyWithGemini(selectedImage)}
              disabled={isIdentifying}
              style={({ pressed }) => [
                styles.identifyButton,
                {
                  backgroundColor: isIdentifying ? '#888' : colors.primary,
                  opacity: pressed ? 0.9 : 1,
                }
              ]}
            >
              <Text style={styles.identifyButtonText}>
                {isIdentifying ? '🔄 Identifying...' : '🔬 Identify This Plant'}
              </Text>
            </Pressable>
          )}

          {/* Features Section with Accordion */}
          <View style={styles.featuresSection}>
            <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
              What Pro AI Scan Includes
            </Text>

            <View style={[styles.featuresCard, { backgroundColor: dark ? '#141c18' : '#ffffff' }]}>
              {FEATURES.map((feature, index) => (
                <View key={feature.id}>
                  {/* Divider between items */}
                  {index > 0 && (
                    <View style={[styles.featureDivider, { backgroundColor: dark ? '#1e2a24' : '#e8ece8' }]} />
                  )}

                  {/* Feature Header (Tappable) */}
                  <Pressable
                    onPress={() => toggleFeature(feature.id)}
                    style={({ pressed }) => [
                      styles.featureItem,
                      { opacity: pressed ? 0.7 : 1 }
                    ]}
                  >
                    <Text style={styles.featureIcon}>{feature.icon}</Text>
                    <Text style={[styles.featureText, { color: dark ? '#e0e8e4' : '#3a4a42', flex: 1 }]}>
                      {feature.title}
                    </Text>
                    <Text style={[styles.chevron, { color: dark ? '#6a7a72' : '#888888' }]}>
                      {expandedFeature === feature.id ? '▼' : '▶'}
                    </Text>
                  </Pressable>

                  {/* Expanded Description */}
                  {expandedFeature === feature.id && (
                    <View style={[styles.featureDescription, { backgroundColor: dark ? '#0f1814' : '#f8faf9' }]}>
                      <Text style={[styles.featureDescriptionText, { color: dark ? '#a0b0a8' : '#5b6b62' }]}>
                        {feature.description}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* AI Transparency Notice */}
          <View style={[styles.noticeCard, { backgroundColor: dark ? '#1a2a24' : '#f0f8f5' }]}>
            <Text style={[styles.noticeTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
              AI Identification Notice
            </Text>
            <Text style={[styles.noticeText, { color: dark ? '#8a9a92' : '#5b6b62' }]}>
              Plant identification is generated using advanced AI image analysis. Results may vary depending on image quality and visibility.
            </Text>
          </View>

          {/* Safety Notice */}
          <View style={[styles.noticeCard, { backgroundColor: dark ? '#2a1a1a' : '#fef8f5' }]}>
            <Text style={[styles.noticeTitle, { color: dark ? '#fca5a5' : '#b91c1c' }]}>
              Safety Notice
            </Text>
            <Text style={[styles.noticeText, { color: dark ? '#a09090' : '#6b5b5b' }]}>
              Information provided is for educational purposes only and should not be considered medical advice.
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
  proSparkle: {
    fontSize: 20,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    maxWidth: 150,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '700',
  },
  // Image Preview
  imagePreviewContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 32,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    height: 200,
    borderRadius: 12,
    width: '100%',
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: 12,
    opacity: 0.6,
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Features Section
  featuresSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
  },
  featuresCard: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 14,
    width: 28,
  },
  featureText: {
    fontSize: 15,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 12,
    marginLeft: 8,
  },
  featureDivider: {
    height: 1,
    marginHorizontal: 16,
  },
  featureDescription: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 4,
    marginLeft: 42,
    marginRight: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  featureDescriptionText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20,
  },
  // Notice Cards
  noticeCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  noticeText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },
  // Loading Overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingBox: {
    padding: 32,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 40, 35, 0.95)',
    alignItems: 'center',
    minWidth: 200,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.8,
  },
  // Identify Button
  identifyButton: {
    marginTop: 20,
    marginBottom: 10,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  identifyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
