import React, { useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { useTheme } from './theme';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  onScanPress: () => void;
}

export default function HomeScreen({ onScanPress }: HomeScreenProps) {
  const { colors, dark } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Visual Hero / Header */}
        <View style={styles.heroContainer}>
          <View style={[styles.heroGlow, { backgroundColor: dark ? '#1b3a2b' : '#e8f5e9' }]} />
          <View style={styles.header}>
            <Text style={[styles.appName, { color: colors.text }]}>MedPlant</Text>
            <View style={[styles.taglineBadge, { backgroundColor: colors.muted }]}>
              <Text style={[styles.tagline, { color: colors.primary }]}>
                AI-ASSISTED IDENTIFICATION
              </Text>
            </View>
          </View>
        </View>

        {/* Primary Action Section */}
        <View style={styles.section}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Pressable
              onPress={onScanPress}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              android_ripple={{ color: colors.primary + '30', borderless: false }}
              style={({ pressed }) => [
                styles.actionCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  shadowColor: dark ? '#000' : colors.primary,
                  opacity: Platform.OS === 'ios' && pressed ? 0.9 : 1,
                }
              ]}
            >
              <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
                <Text style={styles.iconText}>📸</Text>
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={[styles.actionTitle, { color: colors.text }]}>Scan a Plant</Text>
                <Text style={[styles.actionSubtext, { color: colors.subtext }]}>
                  Instantly identify medicinal species and learn about their healing properties.
                </Text>
              </View>
              <View style={[styles.arrowContainer, { backgroundColor: colors.muted }]}>
                <Text style={[styles.arrow, { color: colors.primary }]}>→</Text>
              </View>
            </Pressable>
          </Animated.View>
        </View>

        {/* Features / Discover Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>Discover Capabilities</Text>
          <View style={[styles.featuresContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <FeatureItem
              icon="🎯"
              title="Precise Analysis"
              description="High-accuracy botanical identification"
              color={colors.text}
              subColor={colors.subtext}
            />
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            <FeatureItem
              icon="🧪"
              title="Medicinal Profile"
              description="Detailed active compounds & uses"
              color={colors.text}
              subColor={colors.subtext}
            />
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            <FeatureItem
              icon="🛡️"
              title="Safety Guidelines"
              description="Research-backed precautions & warnings"
              color={colors.text}
              subColor={colors.subtext}
            />
          </View>
        </View>

        {/* Trust / Disclaimer Footer */}
        <View style={styles.footer}>
          <View style={[styles.footerDivider, { backgroundColor: colors.border }]} />
          <Text style={[styles.disclaimer, { color: colors.subtext }]}>
            Professional Reference Only {"\n"}
            Not a substitute for certified medical advice.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureItem({ icon, title, description, color, subColor }: {
  icon: string;
  title: string;
  description: string;
  color: string;
  subColor: string;
}) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIconContainer}>
        <Text style={styles.featureIcon}>{icon}</Text>
      </View>
      <View style={styles.featureTextContainer}>
        <Text style={[styles.featureTitle, { color }]}>{title}</Text>
        <Text style={[styles.featureDescription, { color: subColor }]}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  heroContainer: {
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    top: -100,
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width,
    opacity: 0.5,
    zIndex: -1,
  },
  header: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1.5,
    marginBottom: 12,
  },
  taglineBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 100,
  },
  tagline: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    paddingLeft: 4,
  },
  actionCard: {
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    overflow: 'hidden', // Required for ripple
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  iconText: {
    fontSize: 28,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  actionSubtext: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  arrow: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  featuresContainer: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureIcon: {
    fontSize: 22,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  separator: {
    height: 1,
    marginHorizontal: 20,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  footerDivider: {
    width: 40,
    height: 3,
    borderRadius: 2,
    marginBottom: 20,
    opacity: 0.5,
  },
  disclaimer: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
