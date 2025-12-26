
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
} from 'react-native';
import { useTheme } from './theme';

type Props = {
  data: any;
  imageUri?: string;
  onBack: () => void;
  onRefresh: () => void;
};

export default function ResultScreen({ data, imageUri, onBack, onRefresh }: Props) {
  const { colors, dark } = useTheme();

  // Collapse states
  const [warningsOpen, setWarningsOpen] = useState(false);
  const [habitatOpen, setHabitatOpen] = useState(false);

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
  const references = p.references || [];
  const confidence = plant.confidence;

  const isHighConf = confidence === 'High';

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


        {/* 4. Active Compounds */}
        {compounds.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>🧪 Active Compounds</Text>
            </View>
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

        {/* 5. Side Effects */}
        {sideEffects.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>💊 Known Side Effects</Text>
            </View>
            <View style={styles.bulletList}>
              {sideEffects.map((item: string, i: number) => (
                <View key={i} style={styles.bulletItem}>
                  <Text style={[styles.itemText, { color: colors.text }]}>• {item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 6. Warnings & Precautions (Collapsible) */}
        <Pressable
          onPress={() => setWarningsOpen(!warningsOpen)}
          android_ripple={{ color: (dark ? '#FF8A8A' : '#C53030') + '20' }}
          style={({ pressed }) => [
            styles.collapsibleHeader,
            {
              backgroundColor: dark ? '#2D1515' : '#FFF5F5',
              borderColor: dark ? '#5C2D2D' : '#FED7D7',
              marginBottom: warningsOpen ? 0 : 28,
              opacity: Platform.OS === 'ios' && pressed ? 0.8 : 1
            }
          ]}
        >
          <Text style={[styles.collapsibleTitle, { color: dark ? '#FF8A8A' : '#C53030' }]}>⚠️ Important Precautions</Text>
          <Text style={[styles.toggleIcon, { color: dark ? '#FF8A8A' : '#C53030' }]}>{warningsOpen ? '↑' : '↓'}</Text>
        </Pressable>

        {warningsOpen && (
          <View style={[
            styles.collapsibleContent,
            {
              backgroundColor: dark ? '#2D1515' : '#FFF5F5',
              borderColor: dark ? '#5C2D2D' : '#FED7D7'
            }
          ]}>
            {warnings.map((item: string, i: number) => (
              <Text key={i} style={[styles.warningText, { color: dark ? '#FFC0C0' : '#9B2C2C' }]}>• {item}</Text>
            ))}
          </View>
        )}

        {/* 7. Habitat & Distribution (Expandable) */}
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

        {habitatOpen && (
          <View style={[styles.collapsibleContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.habitatLabel, { color: colors.primary }]}>Distribution:</Text>
            <Text style={[styles.habitatText, { color: colors.subtext }]}>{habitat.distribution}</Text>

            <Text style={[styles.habitatLabel, { color: colors.primary, marginTop: 12 }]}>Environment:</Text>
            <Text style={[styles.habitatText, { color: colors.subtext }]}>{habitat.environment}</Text>
          </View>
        )}

        {/* 8. Research & References */}
        {references.length > 0 && (
          <View style={styles.referencesCard}>
            <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 12 }]}>📚 Research & References</Text>
            {references.map((ref: string, i: number) => (
              <View key={i} style={styles.refItem}>
                <Text style={[styles.refText, { color: colors.primary }]} onPress={() => Linking.openURL(ref)}>🔗 {ref}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 9. Disclaimer */}
        <View style={styles.disclaimerContainer}>
          <Text style={[styles.disclaimerText, { color: colors.subtext }]}>
            MEDICAL DISCLAIMER: The information provided in this report is for educational purposes only and is not intended as medical advice. Always consult a qualified healthcare professional before using any plant for medicinal purposes. Antigravity and MedPlant do not guarantee the accuracy of AI-generated content.
          </Text>
        </View>

        {/* 10. Scan Again Button */}
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
});
