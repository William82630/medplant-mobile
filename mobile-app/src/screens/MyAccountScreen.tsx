import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  Pressable,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';
import { ADMIN_EMAIL } from '../services/SubscriptionService';

const { width } = Dimensions.get('window');

interface MyAccountScreenProps {
  onBack?: () => void;
  user: any;
  subscription: any;
  isAdmin: () => boolean;
  remainingCredits: () => number | 'unlimited';
  signOut: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

// Local helper for initials (no service dependency)
function getUserInitials(nameOrEmail?: string | null): string {
  if (!nameOrEmail) return 'U';
  if (nameOrEmail.includes('@')) {
    return nameOrEmail.substring(0, 2).toUpperCase();
  }
  const parts = nameOrEmail.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return nameOrEmail.substring(0, 2).toUpperCase();
}

export default function MyAccountScreen({
  onBack,
  user,
  subscription,
  isAdmin,
  remainingCredits,
  signOut,
  refreshSubscription,
}: MyAccountScreenProps) {
  const { colors, dark } = useTheme();

  useEffect(() => {
    refreshSubscription();
  }, []);

  // Get display name for the plan
  const getPlanName = () => {
    if (user?.email === ADMIN_EMAIL) return 'Administrator';
    if (!subscription) return 'Free';
    if (subscription.is_admin) return 'Administrator';

    // Check specific plan strings
    if (subscription.plan === 'pro_unlimited') return 'Pro Unlimited';
    if (subscription.plan === 'pro_basic') return 'Pro Basic';

    // Fallback: Check boolean flags if plan string is missing
    if (subscription.is_pro) return 'Pro';

    return 'Free';
  };

  const planName = getPlanName();
  const credits = remainingCredits();
  const displayCredits = credits === 'unlimited' ? 'Unlimited' : credits.toString();

  // Name logic: Check metadata unique to how Supabase stores it, or fallback to email
  const fullName = user?.user_metadata?.full_name || '';
  const displayName = fullName || user?.email || 'User';

  // Avatar logic: Priority check for photo URL
  // 1. user.photoURL (standard Firebase/Auth)
  // 2. user.user_metadata.picture (Google/OAuth standard)
  // 3. user.user_metadata.avatar_url (Supabase/GitHub standard)
  const photoURL = user?.photoURL || user?.user_metadata?.picture || user?.user_metadata?.avatar_url;
  const avatarInitials = getUserInitials(displayName);

  return (
    <View style={styles.container}>
      {/* Background */}
      <LinearGradient
        colors={dark
          ? ['#0a1410', '#081210', '#050a08']
          : ['#f5faf8', '#eef5f2', '#e8f0ec']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: colors.primary }]}>← Back</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            My Account
          </Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            {photoURL ? (
              <Image
                source={{ uri: photoURL }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.avatarCircle, { backgroundColor: dark ? '#2a4a3a' : '#d0f0e0' }]}>
                <Text style={[styles.avatarText, { color: dark ? '#4ade80' : '#16a085' }]}>
                  {avatarInitials}
                </Text>
              </View>
            )}
            <Text style={[styles.emailText, { color: dark ? '#f2f2f2' : '#171717' }]}>
              {displayName}
            </Text>
            <View style={[styles.badge, { backgroundColor: dark ? '#1f2f28' : '#e0e0e0' }]}>
              <Text style={[styles.badgeText, { color: dark ? '#a0b0a8' : '#555' }]}>
                {planName.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: dark ? '#8a9a92' : '#5b6b62' }]}>
              ACCOUNT DETAILS
            </Text>

            <View style={[styles.card, { backgroundColor: dark ? '#141c18' : '#ffffff' }]}>
              {/* Name (if available separate from header) */}
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: dark ? '#8a9a92' : '#5b6b62' }]}>Name</Text>
                <Text style={[styles.value, { color: dark ? '#f2f2f2' : '#171717' }]}>
                  {fullName || 'Not set'}
                </Text>
              </View>

              <View style={[styles.separator, { backgroundColor: dark ? '#1e2a24' : '#e5e5ea' }]} />

              {/* Email */}
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: dark ? '#8a9a92' : '#5b6b62' }]}>Email</Text>
                <Text style={[styles.value, { color: dark ? '#f2f2f2' : '#171717' }]}>
                  {user?.email}
                </Text>
              </View>

              <View style={[styles.separator, { backgroundColor: dark ? '#1e2a24' : '#e5e5ea' }]} />

              {/* Plan Type */}
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: dark ? '#8a9a92' : '#5b6b62' }]}>Current Plan</Text>
                <Text style={[styles.value, { color: colors.primary, fontWeight: '700' }]}>
                  {planName}
                </Text>
              </View>

              <View style={[styles.separator, { backgroundColor: dark ? '#1e2a24' : '#e5e5ea' }]} />

              {/* Credits */}
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: dark ? '#8a9a92' : '#5b6b62' }]}>Credits Remaining</Text>
                <Text style={[styles.value, { color: dark ? '#f2f2f2' : '#171717' }]}>
                  {displayCredits}
                </Text>
              </View>
            </View>
          </View>

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
    padding: 8,
    marginLeft: -8,
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
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginVertical: 24,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
  },
  emailText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
    paddingLeft: 4,
  },
  card: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  separator: {
    height: 1,
    marginHorizontal: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
  },
  valueSmall: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    maxWidth: 200,
  },
});
