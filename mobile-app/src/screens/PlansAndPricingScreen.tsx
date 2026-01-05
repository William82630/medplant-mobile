import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';
import { useAuth } from '../../App';
import { createProBasicSubscription } from '../services/RazorpayService';
import { ActivityIndicator, Alert } from 'react-native';

interface PlansAndPricingScreenProps {
  onBack: () => void;
  onNavigateToProScan?: () => void;
}

export default function PlansAndPricingScreen({ onBack, onNavigateToProScan }: PlansAndPricingScreenProps) {
  const { colors, dark } = useTheme();
  const { user, subscription, refreshSubscription } = useAuth();
  const [loadingPlan, setLoadingPlan] = React.useState<string | null>(null);

  // Get current plan from context
  const currentPlan = subscription?.plan || 'free';

  const handleSelectPlan = async (planId: string) => {
    // If user already has this plan (Pro Basic), navigate to feature
    if (planId === 'pro_basic' && currentPlan === 'pro_basic') {
      if (onNavigateToProScan) {
        onNavigateToProScan();
      }
      return;
    }

    // Only Pro Basic is implemented
    if (planId !== 'pro_basic') {
      if (Platform.OS === 'web') {
        window.alert('This plan is coming soon!');
      } else {
        Alert.alert('Coming Soon', 'This plan is not yet available.');
      }
      return;
    }

    if (!user) {
      if (Platform.OS === 'web') {
        window.alert('Please sign in first');
      }
      return;
    }

    setLoadingPlan(planId);

    try {
      await createProBasicSubscription(
        user.id,
        user.email,
        async () => {
          // Success callback
          await refreshSubscription();
          setLoadingPlan(null);
          if (Platform.OS === 'web') {
            window.alert('Success! You are now subscribed to Pro Basic.');
          } else {
            Alert.alert('Success', 'You are now subscribed to Pro Basic.');
          }
        },
        (errorMessage) => {
          // Error callback
          setLoadingPlan(null);
          if (Platform.OS === 'web') {
            window.alert(errorMessage);
          } else {
            Alert.alert('Payment Failed', errorMessage);
          }
        }
      );
    } catch (error) {
      setLoadingPlan(null);
      console.error('Payment error:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            { opacity: pressed ? 0.7 : 1 }
          ]}
        >
          <Text style={[styles.backButtonText, { color: colors.text }]}>← Back</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Plans & Pricing</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro Section */}
        <View style={styles.introSection}>
          <Text style={[styles.introTitle, { color: colors.text }]}>
            Choose Your Plan
          </Text>
          <Text style={[styles.introSubtitle, { color: colors.subtext }]}>
            Unlock powerful AI features to identify plants, generate reports, and learn more about medicinal properties.
          </Text>
        </View>

        {/* Plan Cards */}
        <View style={styles.plansContainer}>

          {/* Pro Basic Plan - Recommended */}
          <View style={[
            styles.planCard,
            styles.recommendedCard,
            { backgroundColor: dark ? '#1a2f25' : '#e8f5f0' }
          ]}>
            {/* Recommended Badge */}
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedBadgeText}>⭐ RECOMMENDED</Text>
            </View>

            <View style={styles.planHeader}>
              <Text style={styles.planIcon}>🔬</Text>
              <View style={styles.planTitleContainer}>
                <Text style={[styles.planName, { color: colors.text }]}>Pro Basic</Text>
                <Text style={[styles.planTagline, { color: colors.subtext }]}>
                  Perfect for regular users
                </Text>
              </View>
            </View>

            <View style={styles.planPricing}>
              <Text style={[styles.planPrice, { color: dark ? '#4ade80' : '#16a085' }]}>
                ₹99/month
              </Text>
              <Text style={[styles.planLimit, { color: colors.subtext }]}>
                10 AI scans per day
              </Text>
            </View>

            <View style={styles.planFeatures}>
              <View style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={[styles.featureText, { color: colors.text }]}>
                  AI-powered plant identification
                </Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Detailed medicinal reports
                </Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Camera & gallery support
                </Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={[styles.featureText, { color: colors.text }]}>
                  PDF report downloads
                </Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Access to upcoming advanced features
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => handleSelectPlan('pro_basic')}
              disabled={loadingPlan === 'pro_basic'}
              style={({ pressed }) => [
                styles.selectButton,
                styles.primaryButton,
                { opacity: pressed ? 0.9 : 1 }
              ]}
            >
              {loadingPlan === 'pro_basic' ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {currentPlan === 'pro_basic' ? '🚀 Use Pro Scan' : 'Select Plan'}
                </Text>
              )}
            </Pressable>
          </View>

          {/* Pay-per-scan Plan */}
          <View style={[
            styles.planCard,
            { backgroundColor: dark ? '#141c18' : '#ffffff', borderColor: colors.border }
          ]}>
            <View style={styles.planHeader}>
              <Text style={styles.planIcon}>💳</Text>
              <View style={styles.planTitleContainer}>
                <Text style={[styles.planName, { color: colors.text }]}>Pay-per-Scan</Text>
                <Text style={[styles.planTagline, { color: colors.subtext }]}>
                  Maximum flexibility
                </Text>
              </View>
            </View>

            <View style={styles.planPricing}>
              <Text style={[styles.planPrice, { color: dark ? '#f0c040' : '#b8860b' }]}>
                ₹10/scan
              </Text>
              <Text style={[styles.planLimit, { color: colors.subtext }]}>
                Buy credits as needed
              </Text>
            </View>

            <View style={styles.planFeatures}>
              <View style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={[styles.featureText, { color: colors.text }]}>
                  No subscription required
                </Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Credits have no short-term expiry
                </Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Same AI quality as Pro
                </Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={[styles.featureText, { color: colors.text }]}>
                  PDF report downloads
                </Text>
              </View>
            </View>

            <Text style={[styles.planNote, { color: colors.subtext }]}>
              💡 Great for occasional users who don't need daily scans.
            </Text>

            <Pressable
              onPress={() => handleSelectPlan('pay_per_scan')}
              style={({ pressed }) => [
                styles.selectButton,
                styles.secondaryButton,
                { borderColor: colors.primary, opacity: pressed ? 0.8 : 1 }
              ]}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
                {currentPlan === 'pay_per_scan' ? '✓ Current Plan' : 'Buy Credits'}
              </Text>
            </Pressable>
          </View>

          {/* Pro Unlimited Plan */}
          <View style={[
            styles.planCard,
            { backgroundColor: dark ? '#141c18' : '#ffffff', borderColor: colors.border }
          ]}>
            {/* Best for Heavy Users Badge */}
            <View style={[styles.heavyUserBadge, { backgroundColor: dark ? '#2a3a32' : '#e0f0e8' }]}>
              <Text style={[styles.heavyUserBadgeText, { color: dark ? '#a0b0a8' : '#5b6b62' }]}>
                🚀 BEST FOR HEAVY USERS
              </Text>
            </View>

            <View style={styles.planHeader}>
              <Text style={styles.planIcon}>♾️</Text>
              <View style={styles.planTitleContainer}>
                <Text style={[styles.planName, { color: colors.text }]}>Pro Unlimited</Text>
                <Text style={[styles.planTagline, { color: colors.subtext }]}>
                  For power users & researchers
                </Text>
              </View>
            </View>

            <View style={styles.planPricing}>
              <Text style={[styles.planPrice, { color: dark ? '#60a5fa' : '#3b82f6' }]}>
                ₹799/month
              </Text>
              <Text style={[styles.planLimit, { color: colors.subtext }]}>
                Unlimited scans (soft cap: 100/day)
              </Text>
            </View>

            <View style={styles.planFeatures}>
              <View style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Everything in Pro Basic
                </Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Unlimited daily scans
                </Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Designed for high-volume scanning
                </Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Optimized for frequent use
                </Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Advanced report customization
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => handleSelectPlan('pro_unlimited')}
              style={({ pressed }) => [
                styles.selectButton,
                styles.secondaryButton,
                { borderColor: colors.primary, opacity: pressed ? 0.8 : 1 }
              ]}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
                {currentPlan === 'pro_unlimited' ? '✓ Current Plan' : 'Select Plan'}
              </Text>
            </Pressable>
          </View>

        </View>

        {/* Free Tier Info */}
        <View style={[styles.freeTierCard, { backgroundColor: dark ? '#1a1c18' : '#f8f9fa' }]}>
          <Text style={[styles.freeTierTitle, { color: colors.text }]}>
            🌱 Currently Free
          </Text>
          <Text style={[styles.freeTierDesc, { color: colors.subtext }]}>
            You're using the free tier with unlimited access to ailment-based plant search.
            Upgrade to unlock AI-powered photo identification and detailed reports.
          </Text>
        </View>

        {/* FAQ / Note */}
        <View style={styles.noteSection}>
          <Text style={[styles.noteText, { color: colors.subtext }]}>
            💡 All payments are processed securely.
          </Text>
          <Text style={[styles.comingSoonText, { color: colors.subtext }]}>
            Secure payments via Razorpay
          </Text>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  introSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  introTitle: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  introSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  plansContainer: {
    gap: 20,
  },
  planCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  recommendedCard: {
    borderWidth: 2,
    borderColor: '#4ade80',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: '#4ade80',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  recommendedBadgeText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heavyUserBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  heavyUserBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  planIcon: {
    fontSize: 32,
    marginRight: 14,
  },
  planTitleContainer: {
    flex: 1,
  },
  planName: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },
  planTagline: {
    fontSize: 14,
    fontWeight: '500',
  },
  planPricing: {
    marginBottom: 18,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  planLimit: {
    fontSize: 14,
    fontWeight: '500',
  },
  planFeatures: {
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  featureCheck: {
    fontSize: 16,
    color: '#4ade80',
    marginRight: 10,
    fontWeight: '700',
  },
  featureText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },
  planNote: {
    fontSize: 13,
    fontWeight: '500',
    fontStyle: 'italic',
    marginBottom: 16,
    lineHeight: 18,
  },
  selectButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#4ade80',
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  freeTierCard: {
    marginTop: 28,
    padding: 20,
    borderRadius: 16,
  },
  freeTierTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  freeTierDesc: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  noteSection: {
    marginTop: 24,
    alignItems: 'center',
  },
  noteText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 12,
    fontWeight: '600',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
