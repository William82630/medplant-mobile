import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  StatusBar,
  Platform,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';
import { useAuth } from '../../App';
import { createProBasicSubscription, createProUnlimitedSubscription, createProUnlimitedYearlySubscription, purchaseCreditPack, CREDIT_PACKS } from '../services/RazorpayService';
import { ActivityIndicator, Alert } from 'react-native';

interface PlansAndPricingScreenProps {
  onBack: () => void;
  onNavigateToProScan?: () => void;
}

export default function PlansAndPricingScreen({ onBack, onNavigateToProScan }: PlansAndPricingScreenProps) {
  const { colors, dark } = useTheme();
  const { user, subscription, refreshSubscription, isAdmin } = useAuth();
  const [loadingPlan, setLoadingPlan] = React.useState<string | null>(null);
  const [showCreditModal, setShowCreditModal] = React.useState(false);
  const [purchasingPack, setPurchasingPack] = React.useState<string | null>(null);

  // Get current plan from context
  const currentPlan = subscription?.plan || 'free';
  const currentCredits = subscription?.daily_credits || 0;

  const handleSelectPlan = async (planId: string) => {
    // Admin bypass: navigate directly to Pro AI Scan for all premium plans
    if (isAdmin() && (planId === 'pro_basic' || planId === 'pay_per_scan' || planId === 'pro_unlimited' || planId === 'pro_unlimited_yearly')) {
      if (onNavigateToProScan) {
        onNavigateToProScan();
      }
      return;
    }

    // If user already has Pro Basic, navigate to feature
    if (planId === 'pro_basic' && currentPlan === 'pro_basic') {
      if (onNavigateToProScan) {
        onNavigateToProScan();
      }
      return;
    }

    // If user already has Pro Unlimited, navigate to feature (for both monthly and yearly buttons)
    if ((planId === 'pro_unlimited' || planId === 'pro_unlimited_yearly') && currentPlan === 'pro_unlimited') {
      if (onNavigateToProScan) {
        onNavigateToProScan();
      }
      return;
    }

    // Pay-per-scan: Show credit pack modal
    if (planId === 'pay_per_scan') {
      setShowCreditModal(true);
      return;
    }

    // Handle Pro Unlimited subscription
    if (planId === 'pro_unlimited') {
      if (!user) {
        if (Platform.OS === 'web') {
          window.alert('Please sign in first');
        }
        return;
      }

      setLoadingPlan(planId);

      try {
        await createProUnlimitedSubscription(
          user.id,
          user.email,
          async () => {
            await refreshSubscription();
            setLoadingPlan(null);
            if (Platform.OS === 'web') {
              window.alert('Success! You are now subscribed to Pro Unlimited.');
            } else {
              Alert.alert('Success', 'You are now subscribed to Pro Unlimited.');
            }
          },
          (errorMessage) => {
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
        console.error('Pro Unlimited payment error:', error);
      }
      return;
    }

    // Handle Pro Unlimited Yearly subscription (₹7,999/year)
    if (planId === 'pro_unlimited_yearly') {
      if (!user) {
        if (Platform.OS === 'web') {
          window.alert('Please sign in first');
        }
        return;
      }

      setLoadingPlan(planId);

      try {
        await createProUnlimitedYearlySubscription(
          user.id,
          user.email,
          async () => {
            await refreshSubscription();
            setLoadingPlan(null);
            if (Platform.OS === 'web') {
              window.alert('Success! You are now subscribed to Pro Unlimited (Yearly).');
            } else {
              Alert.alert('Success', 'You are now subscribed to Pro Unlimited (Yearly).');
            }
          },
          (errorMessage) => {
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
        console.error('Pro Unlimited Yearly payment error:', error);
      }
      return;
    }



    // Fallback: Unhandled plans
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

  const handlePurchasePack = async (packId: string) => {
    if (!user) {
      if (Platform.OS === 'web') {
        window.alert('Please sign in first');
      }
      return;
    }

    setPurchasingPack(packId);

    await purchaseCreditPack(
      user.id,
      user.email,
      packId,
      async (newBalance) => {
        // Success callback
        await refreshSubscription();
        setPurchasingPack(null);
        setShowCreditModal(false);
        if (Platform.OS === 'web') {
          window.alert(`Success! You now have ${newBalance} credits.`);
        } else {
          Alert.alert('Success', `You now have ${newBalance} credits.`);
        }
        // Navigate to Pro Scan page after purchase
        if (onNavigateToProScan) {
          onNavigateToProScan();
        }
      },
      (errorMessage) => {
        // Error callback
        setPurchasingPack(null);
        if (Platform.OS === 'web') {
          window.alert(errorMessage);
        } else {
          Alert.alert('Payment Failed', errorMessage);
        }
      }
    );
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
                Buy Credits
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

          {/* Pro Unlimited Yearly Plan */}
          <View style={[
            styles.planCard,
            { backgroundColor: dark ? '#1a1420' : '#faf5ff', borderColor: '#8b5cf6' }
          ]}>
            {/* Save 2 Months Badge */}
            <View style={[styles.heavyUserBadge, { backgroundColor: '#8b5cf6' }]}>
              <Text style={[styles.heavyUserBadgeText, { color: '#ffffff' }]}>
                💰 SAVE 2 MONTHS
              </Text>
            </View>

            <View style={styles.planHeader}>
              <Text style={styles.planIcon}>🎁</Text>
              <View style={styles.planTitleContainer}>
                <Text style={[styles.planName, { color: colors.text }]}>Pro Unlimited (Yearly)</Text>
                <Text style={[styles.planTagline, { color: colors.subtext }]}>
                  Best value for committed users
                </Text>
              </View>
            </View>

            <View style={styles.planPricing}>
              <Text style={[styles.planPrice, { color: '#8b5cf6' }]}>
                ₹7,999/year
              </Text>
              <Text style={[styles.planLimit, { color: colors.subtext }]}>
                Equivalent to ₹667/month
              </Text>
            </View>

            <View style={styles.planFeatures}>
              <View style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Everything in Pro Unlimited
                </Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Save ₹1,589 compared to monthly
                </Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Billed once per year
                </Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Priority customer support
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => handleSelectPlan('pro_unlimited_yearly')}
              disabled={loadingPlan === 'pro_unlimited_yearly'}
              style={({ pressed }) => [
                styles.selectButton,
                styles.primaryButton,
                { backgroundColor: '#8b5cf6', opacity: pressed ? 0.8 : 1 }
              ]}
            >
              {loadingPlan === 'pro_unlimited_yearly' ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={[styles.primaryButtonText, { color: '#ffffff' }]}>
                  {currentPlan === 'pro_unlimited' ? '🚀 Use Pro Scan' : 'Get Yearly Plan'}
                </Text>
              )}
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

      {/* Credit Pack Purchase Modal */}
      <Modal
        visible={showCreditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreditModal(false)
        }
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Buy Scan Credits
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.subtext }]}>
              Current Balance: {currentCredits} credit{currentCredits !== 1 ? 's' : ''}
            </Text>

            {CREDIT_PACKS.map((pack) => (
              <Pressable
                key={pack.id}
                onPress={() => handlePurchasePack(pack.id)}
                disabled={purchasingPack !== null}
                style={({ pressed }) => [
                  styles.packOption,
                  {
                    backgroundColor: dark ? '#1a2520' : '#f0f8f5',
                    borderColor: (pack as any).bestValue ? '#4ade80' : colors.border,
                    borderWidth: (pack as any).bestValue ? 2 : 1,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <View style={styles.packInfo}>
                  <Text style={[styles.packCredits, { color: colors.text }]}>
                    {pack.label}
                  </Text>
                  {(pack as any).bestValue && (
                    <View style={styles.bestValueBadge}>
                      <Text style={styles.bestValueText}>BEST VALUE</Text>
                    </View>
                  )}
                </View>
                <View style={styles.packPriceContainer}>
                  {purchasingPack === pack.id ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text style={[styles.packPrice, { color: dark ? '#4ade80' : '#16a085' }]}>
                      {pack.description}
                    </Text>
                  )}
                </View>
              </Pressable>
            ))}

            <Pressable
              onPress={() => setShowCreditModal(false)}
              style={({ pressed }) => [
                styles.cancelButton,
                { opacity: pressed ? 0.7 : 1 }
              ]}
            >
              <Text style={[styles.cancelButtonText, { color: colors.subtext }]}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
  },
  packOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  packInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  packCredits: {
    fontSize: 18,
    fontWeight: '700',
  },
  bestValueBadge: {
    backgroundColor: '#4ade80',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bestValueText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '800',
  },
  packPriceContainer: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  packPrice: {
    fontSize: 18,
    fontWeight: '800',
  },
  cancelButton: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
