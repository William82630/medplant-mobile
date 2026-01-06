import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Animated,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from './theme';
import { useAuth } from '../App';
import SettingsScreen from './screens/SettingsScreen';
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen';
import TermsConditionsScreen from './screens/TermsConditionsScreen';
import DisclaimerScreen from './screens/DisclaimerScreen';
import AboutUsScreen from './screens/AboutUsScreen';
import ProAIScanScreen from './screens/ProAIScanScreen';
import ProAIReportScreen from './screens/ProAIReportScreen';
import PlansAndPricingScreen from './screens/PlansAndPricingScreen';

const { width, height } = Dimensions.get('window');
const CIRCLE_SIZE = Math.min(width * 0.52, 220);

interface HomeScreenProps {
  onScanPress: () => void;
}

export default function HomeScreen({ onScanPress }: HomeScreenProps) {
  const { colors, dark } = useTheme();
  const { user, signOut, subscription, isAdmin, hasCredits, refreshSubscription } = useAuth();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  // Profile dropdown state
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  // Screen states
  const [showSettings, setShowSettings] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsConditions, setShowTermsConditions] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showAboutUs, setShowAboutUs] = useState(false);
  const [showProAIScan, setShowProAIScan] = useState(false);
  const [showProAIReport, setShowProAIReport] = useState(false);
  const [showPlansAndPricing, setShowPlansAndPricing] = useState(false);

  // Refresh subscription when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshSubscription();
    }, [refreshSubscription])
  );

  // Handle logout - works on web and native
  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to log out?');
      if (confirmed) {
        await signOut();
      }
    } else {
      // For native, would use Alert.alert but this is for web testing
      await signOut();
    }
  };

  // Handle menu item press
  const handleMenuPress = (item: string) => {
    setShowProfileMenu(false);

    switch (item) {
      case 'Settings':
        setShowSettings(true);
        break;
      case 'Privacy Policy':
        setShowPrivacyPolicy(true);
        break;
      case 'Terms & Conditions':
        setShowTermsConditions(true);
        break;
      case 'Disclaimer':
        setShowDisclaimer(true);
        break;
      case 'About Us':
        setShowAboutUs(true);
        break;
      case 'Preview Report':
        setShowProAIReport(true);
        break;
      case 'Plans & Pricing':
        setShowPlansAndPricing(true);
        break;
      case 'Log out':
        handleLogout();
        break;
      default:
        console.log(`[Placeholder] Navigate to: ${item}`);
      // TODO: Wire navigation when other screens are implemented
    }
  };

  // Pulse animation for outer rings
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Glow animation
  useEffect(() => {
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.5,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    glow.start();
    return () => glow.stop();
  }, [glowAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  return (
    <View style={styles.container}>
      {/* Settings Screen Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        onRequestClose={() => setShowSettings(false)}
      >
        <SettingsScreen onBack={() => setShowSettings(false)} />
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        visible={showPrivacyPolicy}
        animationType="slide"
        onRequestClose={() => setShowPrivacyPolicy(false)}
      >
        <PrivacyPolicyScreen onBack={() => setShowPrivacyPolicy(false)} />
      </Modal>

      {/* Terms & Conditions Modal */}
      <Modal
        visible={showTermsConditions}
        animationType="slide"
        onRequestClose={() => setShowTermsConditions(false)}
      >
        <TermsConditionsScreen onBack={() => setShowTermsConditions(false)} />
      </Modal>

      {/* Disclaimer Modal */}
      <Modal
        visible={showDisclaimer}
        animationType="slide"
        onRequestClose={() => setShowDisclaimer(false)}
      >
        <DisclaimerScreen onBack={() => setShowDisclaimer(false)} />
      </Modal>

      {/* About Us Modal */}
      <Modal
        visible={showAboutUs}
        animationType="slide"
        onRequestClose={() => setShowAboutUs(false)}
      >
        <AboutUsScreen onBack={() => setShowAboutUs(false)} />
      </Modal>

      {/* Pro AI Scan Modal */}
      <Modal
        visible={showProAIScan}
        animationType="slide"
        onRequestClose={() => setShowProAIScan(false)}
      >
        <ProAIScanScreen onBack={() => setShowProAIScan(false)} />
      </Modal>

      {/* Pro AI Report Modal */}
      <Modal
        visible={showProAIReport}
        animationType="slide"
        onRequestClose={() => setShowProAIReport(false)}
      >
        <ProAIReportScreen onBack={() => setShowProAIReport(false)} />
      </Modal>

      {/* Plans & Pricing Modal */}
      <Modal
        visible={showPlansAndPricing}
        animationType="slide"
        onRequestClose={() => setShowPlansAndPricing(false)}
      >
        <PlansAndPricingScreen
          onBack={() => setShowPlansAndPricing(false)}
          onNavigateToProScan={() => {
            setShowPlansAndPricing(false);
            setTimeout(() => setShowProAIScan(true), 100);
          }}
        />
      </Modal>

      {/* Dark gradient background */}
      <LinearGradient
        colors={dark
          ? ['#0a1410', '#081210', '#050a08']
          : ['#e8f5f0', '#d5ebe2', '#c0e0d4']}
        style={StyleSheet.absoluteFill}
      />

      {/* Aurora glow effects */}
      <Animated.View style={[
        styles.auroraGlow,
        {
          backgroundColor: dark ? '#0d3025' : '#a8e6cf',
          opacity: glowAnim,
        }
      ]} />
      <View style={[
        styles.auroraGlow2,
        {
          backgroundColor: dark ? '#1a4a38' : '#88d8b0',
          opacity: dark ? 0.25 : 0.15,
        }
      ]} />

      <SafeAreaView style={styles.safeArea}>
        {/* Profile Dropdown Modal */}
        <Modal
          visible={showProfileMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setShowProfileMenu(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowProfileMenu(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={[styles.dropdownMenu, { backgroundColor: dark ? '#1a2420' : '#ffffff' }]}>
                  {/* SECTION 1: ACCOUNT */}
                  <Text style={[styles.dropdownSectionLabel, { color: dark ? '#6a7a72' : '#888888' }]}>
                    Account
                  </Text>
                  <TouchableOpacity style={styles.dropdownItem} onPress={() => handleMenuPress('My Account')}>
                    <Text style={styles.dropdownIcon}>👤</Text>
                    <Text style={[styles.dropdownItemText, { color: dark ? '#f2f2f2' : '#171717' }]}>My Account</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dropdownItem} onPress={() => handleMenuPress('Subscription')}>
                    <Text style={styles.dropdownIcon}>💳</Text>
                    <Text style={[styles.dropdownItemText, { color: dark ? '#f2f2f2' : '#171717', flex: 1 }]}>Subscription</Text>
                    <Text style={[styles.dropdownBadge, { backgroundColor: dark ? '#2a3a32' : '#e8f5f0', color: dark ? '#8a9a92' : '#5b6b62' }]}>Free</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dropdownItem} onPress={() => handleMenuPress('Plans & Pricing')}>
                    <Text style={styles.dropdownIcon}>📊</Text>
                    <Text style={[styles.dropdownItemText, { color: dark ? '#f2f2f2' : '#171717' }]}>Plans & Pricing</Text>
                  </TouchableOpacity>

                  <View style={[styles.dropdownSeparator, { backgroundColor: dark ? '#2a3a32' : '#e5e5ea' }]} />

                  {/* SECTION 2: SETTINGS */}
                  <TouchableOpacity style={styles.dropdownItem} onPress={() => handleMenuPress('Settings')}>
                    <Text style={styles.dropdownIcon}>⚙️</Text>
                    <Text style={[styles.dropdownItemText, { color: dark ? '#f2f2f2' : '#171717' }]}>Settings</Text>
                  </TouchableOpacity>

                  <View style={[styles.dropdownSeparator, { backgroundColor: dark ? '#2a3a32' : '#e5e5ea' }]} />

                  {/* SECTION 3: LEGALS */}
                  <Text style={[styles.dropdownSectionLabel, { color: dark ? '#6a7a72' : '#888888' }]}>
                    Legals
                  </Text>
                  <TouchableOpacity style={styles.dropdownItem} onPress={() => handleMenuPress('Privacy Policy')}>
                    <Text style={styles.dropdownIcon}>🔒</Text>
                    <Text style={[styles.dropdownItemText, { color: dark ? '#f2f2f2' : '#171717' }]}>Privacy Policy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dropdownItem} onPress={() => handleMenuPress('Terms & Conditions')}>
                    <Text style={styles.dropdownIcon}>📜</Text>
                    <Text style={[styles.dropdownItemText, { color: dark ? '#f2f2f2' : '#171717' }]}>Terms & Conditions</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dropdownItem} onPress={() => handleMenuPress('About Us')}>
                    <Text style={styles.dropdownIcon}>ℹ️</Text>
                    <Text style={[styles.dropdownItemText, { color: dark ? '#f2f2f2' : '#171717' }]}>About Us</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dropdownItem} onPress={() => handleMenuPress('Disclaimer')}>
                    <Text style={styles.dropdownIcon}>⚠️</Text>
                    <Text style={[styles.dropdownItemText, { color: dark ? '#f2f2f2' : '#171717' }]}>Disclaimer</Text>
                  </TouchableOpacity>

                  <View style={[styles.dropdownSeparator, { backgroundColor: dark ? '#2a3a32' : '#e5e5ea' }]} />

                  {/* SECTION 4: DEVELOPER PREVIEW */}
                  <Text style={[styles.dropdownSectionLabel, { color: dark ? '#6a7a72' : '#888888' }]}>
                    Developer Preview
                  </Text>
                  <TouchableOpacity style={styles.dropdownItem} onPress={() => handleMenuPress('Preview Report')}>
                    <Text style={styles.dropdownIcon}>📋</Text>
                    <Text style={[styles.dropdownItemText, { color: dark ? '#f2f2f2' : '#171717' }]}>Preview Report</Text>
                  </TouchableOpacity>

                  <View style={[styles.dropdownSeparator, { backgroundColor: dark ? '#2a3a32' : '#e5e5ea' }]} />

                  {/* SECTION 5: AUTH */}
                  <TouchableOpacity style={styles.dropdownItem} onPress={() => handleMenuPress('Log out')}>
                    <Text style={styles.dropdownIcon}>🚪</Text>
                    <Text style={[styles.dropdownItemText, { color: '#ef4444' }]}>Log out</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section with Profile Icon */}
          <View style={styles.headerRow}>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.headerTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
                Medicinal Plant Analysis
              </Text>
              <Text style={[styles.headerSubtitle, { color: dark ? '#8a9a92' : '#5b6b62' }]}>
                Identify medicinal plants and understand their health benefits safely.
              </Text>
            </View>
            {/* Profile Icon */}
            <Pressable
              onPress={() => setShowProfileMenu(true)}
              style={[styles.profileIcon, { backgroundColor: dark ? '#2a3a32' : '#e8f5f0' }]}
            >
              <Text style={styles.profileIconText}>👤</Text>
            </Pressable>
          </View>

          {/* Main Circular IDENTIFY Button */}
          <View style={styles.heroSection}>
            {/* Outer pulsing ring */}
            <Animated.View style={[
              styles.outerRing,
              {
                borderColor: dark ? '#1a3a2a' : '#88d8b0',
                transform: [{ scale: pulseAnim }],
              }
            ]} />
            {/* Middle ring */}
            <View style={[
              styles.middleRing,
              { borderColor: dark ? '#1e4a38' : '#66c9a0' }
            ]} />

            {/* Main circular button - triggers onScanPress */}
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Pressable
                onPress={onScanPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={({ pressed }) => [
                  styles.mainCircleButton,
                  {
                    backgroundColor: dark ? '#0f1f18' : '#e0f5ec',
                    borderColor: dark ? '#2a5a45' : '#4ade80',
                    opacity: pressed ? 0.9 : 1,
                  }
                ]}
              >
                {/* Shield Icon */}
                <View style={[styles.shieldIcon, { borderColor: dark ? '#4a7a65' : '#4ade80' }]}>
                  <Text style={styles.shieldEmoji}>🛡️</Text>
                </View>
                <Text style={[styles.identifyText, { color: dark ? '#2dd4a8' : '#16a085' }]}>
                  IDENTIFY
                </Text>
              </Pressable>
            </Animated.View>
          </View>

          {/* Ready to analyze button */}
          <Pressable
            onPress={onScanPress}
            style={({ pressed }) => [
              styles.analyzeButton,
              {
                backgroundColor: dark ? '#2dd4a8' : '#16a085',
                opacity: pressed ? 0.8 : 1,
              }
            ]}
          >
            <Text style={styles.analyzeButtonText}>Ready to analyze specimen</Text>
          </Pressable>

          {/* Statistical Summary Section */}
          <View style={styles.summarySection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
                Statistical Summary
              </Text>
              <Pressable>
                <Text style={[styles.seeAllText, { color: dark ? '#2dd4a8' : '#16a085' }]}>
                  See all
                </Text>
              </Pressable>
            </View>
            <Text style={[styles.sectionDescription, { color: dark ? '#8a9a92' : '#5b6b62' }]}>
              Understand the medicinal value of plants around you and across regions—by scanning plants or exploring remedies based on your health conditions.
            </Text>

            {/* Summary Cards */}
            <View style={[styles.summaryCard, { backgroundColor: dark ? '#141c18' : '#ffffff' }]}>
              {/* Daily Scans */}
              <View style={styles.summaryItem}>
                <View style={[styles.summaryIcon, { backgroundColor: '#2a1a1a' }]}>
                  <Text style={styles.summaryIconText}>📅</Text>
                </View>
                <View style={styles.summaryTextContainer}>
                  <Text style={[styles.summaryItemTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
                    Daily Scans
                  </Text>
                  <Text style={[styles.summaryItemSubtitle, { color: dark ? '#8a9a92' : '#5b6b62' }]}>
                    Track your recent plant identifications and analyses
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: dark ? '#1e2a24' : '#e5e5ea' }]} />

              {/* Safety Insights */}
              <View style={styles.summaryItem}>
                <View style={[styles.summaryIcon, { backgroundColor: '#2a2a1a' }]}>
                  <Text style={styles.summaryIconText}>⚠️</Text>
                </View>
                <View style={styles.summaryTextContainer}>
                  <Text style={[styles.summaryItemTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
                    Safety Insights
                  </Text>
                  <Text style={[styles.summaryItemSubtitle, { color: dark ? '#8a9a92' : '#5b6b62' }]}>
                    Warnings on toxicity, side effects, and safe usage
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: dark ? '#1e2a24' : '#e5e5ea' }]} />

              {/* Plant Archive */}
              <View style={styles.summaryItem}>
                <View style={[styles.summaryIcon, { backgroundColor: '#1a2a2a' }]}>
                  <Text style={styles.summaryIconText}>💾</Text>
                </View>
                <View style={styles.summaryTextContainer}>
                  <Text style={[styles.summaryItemTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
                    Plant Archive
                  </Text>
                  <Text style={[styles.summaryItemSubtitle, { color: dark ? '#8a9a92' : '#5b6b62' }]}>
                    Access your saved plants and medicinal reports
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Go Deeper with Advanced AI Tools - Informational Section */}
          <View style={styles.advancedAISection}>
            <View style={[styles.advancedAICard, { backgroundColor: dark ? '#141c18' : '#ffffff' }]}>
              {/* Header with icon */}
              <View style={styles.advancedAIHeader}>
                <Text style={styles.advancedAIIcon}>🧠</Text>
                <Text style={[styles.advancedAITitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
                  Go Deeper with Advanced AI Tools
                </Text>
              </View>

              {/* Body text */}
              <Text style={[styles.advancedAIBody, { color: dark ? '#a0b0a8' : '#5b6b62' }]}>
                Curious to learn more than just the basics?{'\n\n'}
                Our advanced AI features help you identify plants from real photos, understand their medicinal properties in depth, and generate detailed reports you can save or share.{'\n\n'}
                These tools are designed for users who want greater accuracy, deeper insight, and real-world usefulness — whether you're a student, researcher, farmer, or plant enthusiast.
              </Text>

              {/* Feature bullets */}
              <View style={styles.advancedAIFeatures}>
                <View style={styles.advancedAIFeatureRow}>
                  <Text style={styles.advancedAIBullet}>•</Text>
                  <Text style={[styles.advancedAIFeatureText, { color: dark ? '#d0dcd4' : '#3a4a42' }]}>
                    Identify plants directly from camera or gallery
                  </Text>
                </View>
                <View style={styles.advancedAIFeatureRow}>
                  <Text style={styles.advancedAIBullet}>•</Text>
                  <Text style={[styles.advancedAIFeatureText, { color: dark ? '#d0dcd4' : '#3a4a42' }]}>
                    Generate comprehensive AI-powered reports (PDF)
                  </Text>
                </View>
                <View style={styles.advancedAIFeatureRow}>
                  <Text style={styles.advancedAIBullet}>•</Text>
                  <Text style={[styles.advancedAIFeatureText, { color: dark ? '#d0dcd4' : '#3a4a42' }]}>
                    Faster, deeper analysis beyond basic listings
                  </Text>
                </View>
              </View>

              {/* Soft note */}
              <Text style={[styles.advancedAISoftNote, { color: dark ? '#6a7a72' : '#888888' }]}>
                Prefer flexibility? You can also choose pay-per-scan instead of a monthly plan.
              </Text>
            </View>
          </View>

          {/* Pro AI Scan Section */}
          <View style={styles.proSection}>
            <LinearGradient
              colors={dark
                ? ['#1a2f25', '#0f1f18', '#0a1410']
                : ['#e8f5f0', '#d5ebe2', '#c0e0d4']}
              style={styles.proCardGradient}
            >
              {/* Glow border effect */}
              <View style={[styles.proCardBorder, { borderColor: dark ? '#3a5a4580' : '#4ade8050' }]}>
                {/* Header Row */}
                <View style={styles.proHeader}>
                  <View style={styles.proTitleRow}>
                    <Text style={styles.proSparkle}>✨</Text>
                    <Text style={[styles.proTitle, { color: dark ? '#f0c040' : '#b8860b' }]}>
                      Pro AI Scan
                    </Text>
                  </View>
                  <View style={[styles.proBadge, { backgroundColor: dark ? '#2a4a3a' : '#d0f0e0' }]}>
                    <Text style={[styles.proBadgeText, { color: dark ? '#4ade80' : '#16a085' }]}>
                      POWERED BY GEMINI
                    </Text>
                  </View>
                </View>

                {/* Description */}
                <Text style={[styles.proDescription, { color: dark ? '#a0b0a8' : '#5b6b62' }]}>
                  Unlock AI-powered plant identification with detailed botanical reports.
                </Text>

                {/* Feature List */}
                <View style={styles.proFeatures}>
                  <View style={styles.proFeatureItem}>
                    <Text style={styles.proFeatureIcon}>🔬</Text>
                    <Text style={[styles.proFeatureText, { color: dark ? '#e0e8e4' : '#3a4a42' }]}>
                      Advanced AI Detection
                    </Text>
                  </View>
                  <View style={styles.proFeatureItem}>
                    <Text style={styles.proFeatureIcon}>💉</Text>
                    <Text style={[styles.proFeatureText, { color: dark ? '#e0e8e4' : '#3a4a42' }]}>
                      Full Medicinal Reports
                    </Text>
                  </View>
                  <View style={styles.proFeatureItem}>
                    <Text style={styles.proFeatureIcon}>📷</Text>
                    <Text style={[styles.proFeatureText, { color: dark ? '#e0e8e4' : '#3a4a42' }]}>
                      Camera & Gallery Support
                    </Text>
                  </View>
                </View>

                {/* CTA Button */}
                <Pressable
                  onPress={() => {
                    // Check entitlement: Admin, Pro subscriber, or has credits (Pay-Per-Scan)
                    if (isAdmin() || subscription?.is_pro === true || hasCredits()) {
                      setShowProAIScan(true);
                    } else {
                      // Redirect to Plans & Pricing if not entitled
                      setShowPlansAndPricing(true);
                    }
                  }}
                  style={({ pressed }) => [
                    styles.proButton,
                    { opacity: pressed ? 0.9 : 1 }
                  ]}
                >
                  <Text style={styles.proButtonText}>🚀 Try Pro AI Scan</Text>
                </Pressable>
              </View>
            </LinearGradient>
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
  scrollContent: {
    paddingTop: 20,
  },
  // Header section
  headerSection: {
    paddingHorizontal: 20,
    marginBottom: 10,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 14,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 10,
    opacity: 0.7,
  },
  // Aurora glow effects
  auroraGlow: {
    position: 'absolute',
    top: -height * 0.15,
    left: -width * 0.3,
    width: width * 1.6,
    height: height * 0.55,
    borderRadius: width,
  },
  auroraGlow2: {
    position: 'absolute',
    top: height * 0.08,
    right: -width * 0.4,
    width: width * 1.2,
    height: height * 0.45,
    borderRadius: width,
  },
  // Hero section with circular button
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    height: CIRCLE_SIZE + 100,
    marginTop: 50,
  },
  outerRing: {
    position: 'absolute',
    width: CIRCLE_SIZE + 65,
    height: CIRCLE_SIZE + 65,
    borderRadius: (CIRCLE_SIZE + 65) / 2,
    borderWidth: 1.5,
  },
  middleRing: {
    position: 'absolute',
    width: CIRCLE_SIZE + 35,
    height: CIRCLE_SIZE + 35,
    borderRadius: (CIRCLE_SIZE + 35) / 2,
    borderWidth: 1,
  },
  mainCircleButton: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2dd4a8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 12,
  },
  shieldIcon: {
    width: 55,
    height: 55,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  shieldEmoji: {
    fontSize: 26,
  },
  identifyText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 4,
  },
  // Analyze button
  analyzeButton: {
    alignSelf: 'center',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 30,
    marginTop: 35,
    marginBottom: 40,
  },
  analyzeButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  // Summary section
  summarySection: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  summaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  summaryIconText: {
    fontSize: 18,
  },
  summaryTextContainer: {
    flex: 1,
  },
  summaryItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  summaryItemSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  // Header row with profile icon
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  profileIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  profileIconText: {
    fontSize: 20,
  },
  // Modal and dropdown styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 20,
  },
  dropdownMenu: {
    width: 220,
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  dropdownIcon: {
    fontSize: 16,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dropdownBadge: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  dropdownSeparator: {
    height: 1,
    marginVertical: 6,
    marginHorizontal: 16,
  },
  // Pro AI Scan section styles
  proSection: {
    paddingHorizontal: 20,
    marginTop: 28,
  },
  proCardGradient: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  proCardBorder: {
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 20,
  },
  proHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  proTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proSparkle: {
    fontSize: 20,
    marginRight: 8,
  },
  proTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  proBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  proBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  proDescription: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 18,
  },
  proFeatures: {
    marginBottom: 20,
  },
  proFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  proFeatureIcon: {
    fontSize: 18,
    marginRight: 12,
    width: 26,
  },
  proFeatureText: {
    fontSize: 15,
    fontWeight: '600',
  },
  proButton: {
    backgroundColor: '#f0c040',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#f0c040',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  proButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '800',
  },
  // Advanced AI Section styles
  advancedAISection: {
    paddingHorizontal: 20,
    marginTop: 28,
    marginBottom: 8,
  },
  advancedAICard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  advancedAIHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  advancedAIIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  advancedAITitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  advancedAIBody: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 22,
    marginBottom: 18,
  },
  advancedAIFeatures: {
    marginBottom: 16,
  },
  advancedAIFeatureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  advancedAIBullet: {
    fontSize: 16,
    marginRight: 10,
    color: '#4ade80',
    fontWeight: '700',
  },
  advancedAIFeatureText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },
  advancedAISoftNote: {
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
});
