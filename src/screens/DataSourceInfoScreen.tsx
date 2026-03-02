import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';

interface DataSourceInfoScreenProps {
  onBack?: () => void;
}

export default function DataSourceInfoScreen({ onBack }: DataSourceInfoScreenProps) {
  const { colors, dark } = useTheme();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={dark
          ? ['#0a1410', '#081210', '#050a08']
          : ['#f5faf8', '#eef5f2', '#e8f0ec']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          {onBack && (
            <Pressable onPress={onBack} style={styles.backButton}>
              <Text style={[styles.backButtonText, { color: colors.primary }]}>← Back</Text>
            </Pressable>
          )}
          <Text style={[styles.headerTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            Data Sources
          </Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.introText, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            MedPlant aggregates information from trusted botanical datasets and advanced AI models to provide you with accurate plant insights.
          </Text>

          {/* 1. AI Technology */}
          <View style={[styles.card, { backgroundColor: dark ? '#141c18' : '#ffffff' }]}>
            <Text style={[styles.cardTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
              Artificial Intelligence
            </Text>
            <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
              MedPlant uses Google's <Text style={{ fontWeight: '700' }}>Gemini Pro Vision</Text> model for image analysis and botanical identification. This state-of-the-art model has been trained on millions of plant images to recognize species with high accuracy.
            </Text>
          </View>

          {/* 2. Botanical Databases */}
          <View style={[styles.card, { backgroundColor: dark ? '#141c18' : '#ffffff' }]}>
            <Text style={[styles.cardTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
              Botanical Knowledge Base
            </Text>
            <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
              Our medicinal data is cross-referenced with established traditional knowledge systems and public botanical databases, including:
            </Text>
            <Text style={[styles.bullet, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>• Global Biodiversity Information Facility (GBIF)</Text>
            <Text style={[styles.bullet, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>• Plants of the World Online (POWO)</Text>
            <Text style={[styles.bullet, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>• Traditional medicinal compendiums</Text>
          </View>

          {/* 3. Accuracy Disclaimer */}
          <View style={[styles.warningCard, { backgroundColor: dark ? '#2a1a1a' : '#fff5f5' }]}>
            <Text style={[styles.warningTitle, { color: '#ef4444' }]}>
              Note on Accuracy
            </Text>
            <Text style={[styles.paragraph, { color: dark ? '#e0a0a0' : '#c53030' }]}>
              While we strive for high accuracy, automated identification is not infallible. Environmental factors like lighting, angles, and plant condition can affect results. Always consult a human expert for critical identification needs.
            </Text>
          </View>

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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  introText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
  },
  bullet: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 24,
    marginLeft: 8,
    marginTop: 4,
  },
  warningCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
});
