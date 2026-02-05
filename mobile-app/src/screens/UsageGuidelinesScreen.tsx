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

interface UsageGuidelinesScreenProps {
  onBack?: () => void;
}

export default function UsageGuidelinesScreen({ onBack }: UsageGuidelinesScreenProps) {
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
            Usage Guidelines
          </Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.introText, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
            These guidelines are designed to help you use MedPlant safely and responsibly. Please read them carefully before using any information from this application.
          </Text>

          {/* 1. Safe Identification */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            1. Safe Identification
          </Text>
          <View style={[styles.card, { backgroundColor: dark ? '#141c18' : '#ffffff' }]}>
            <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
              • <Text style={{ fontWeight: '700' }}>Never rely solely on AI.</Text> AI identification is a tool, not a guarantee. Always verify with a secondary source.
            </Text>
            <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
              • <Text style={{ fontWeight: '700' }}>Check for toxic look-alikes.</Text> Many medicinal plants have poisonous look-alikes. If you are not 100% sure, do not use it.
            </Text>
            <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
              • <Text style={{ fontWeight: '700' }}>Use clear images.</Text> Blurred, dark, or distant photos can lead to incorrect identification.
            </Text>
          </View>

          {/* 2. Preparation & Dosage */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            2. Preparation & Dosage
          </Text>
          <View style={[styles.card, { backgroundColor: dark ? '#141c18' : '#ffffff' }]}>
            <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
              • <Text style={{ fontWeight: '700' }}>Start small.</Text> If you are trying a safe, edible plant for the first time, start with a tiny amount to check for allergies.
            </Text>
            <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
              • <Text style={{ fontWeight: '700' }}>Follow traditional methods.</Text> Some plants are only safe when cooked or prepared in a specific way.
            </Text>
            <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
              • <Text style={{ fontWeight: '700' }}>Consult a professional.</Text> For dosage of potent medicinal herbs, always consult a herbalist or doctor.
            </Text>
          </View>

          {/* 3. Sustainable Harvesting */}
          <Text style={[styles.sectionTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            3. Sustainable Harvesting
          </Text>
          <View style={[styles.card, { backgroundColor: dark ? '#141c18' : '#ffffff' }]}>
            <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
              • <Text style={{ fontWeight: '700' }}>Take only what you need.</Text> Never harvest more than 10-20% of a plant patch to ensure it can regrow.
            </Text>
            <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
              • <Text style={{ fontWeight: '700' }}>Leave the roots.</Text> Unless you are specifically harvesting roots, cut the stem to allow regrowth.
            </Text>
            <Text style={[styles.paragraph, { color: dark ? '#b0c0b8' : '#4a5a52' }]}>
              • <Text style={{ fontWeight: '700' }}>Respect protected areas.</Text> Do not forage in national parks, nature reserves, or private property without permission.
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
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 12,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  paragraph: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 24,
    marginBottom: 8,
  },
});
