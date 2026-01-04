import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  TextInput,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';
import Card from '../components/Card';
import plantsData from '../data/plants_v2.json';

const { width } = Dimensions.get('window');

// Type for plant data
interface PlantData {
  commonName: string;
  scientificName: string;
  plantType?: string;
  medicinalUses: string;
  sideEffects?: string;
  regionsFound?: string;
  preparation?: string;
  detailedExplanation?: string;
  imageUrl?: string; // Optional image URL from database
}

// Example ailments for user convenience
const EXAMPLE_AILMENTS = [
  'cough',
  'liver detox',
  'stomach pain',
  'skin infection',
  'fever',
  'digestive aid',
  'wound healing',
  'headache',
];

export default function IdentifyScreen({ navigation }: any) {
  const { colors, spacing, radius } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlantData[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  // Toggle card expansion
  const toggleExpand = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Search plants by ailment/keyword
  const searchPlants = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    const normalizedQuery = query.toLowerCase().trim();
    const keywords = normalizedQuery.split(/\s+/);

    const results = (plantsData as PlantData[]).filter((plant) => {
      const searchableText = [
        plant.medicinalUses || '',
        plant.commonName || '',
        plant.detailedExplanation || '',
      ].join(' ').toLowerCase();

      // Check if ALL keywords match (AND logic for better relevance)
      return keywords.every(keyword => searchableText.includes(keyword));
    });

    // Sort by relevance (number of keyword matches in medicinalUses)
    results.sort((a, b) => {
      const aUses = (a.medicinalUses || '').toLowerCase();
      const bUses = (b.medicinalUses || '').toLowerCase();
      const aMatches = keywords.filter(k => aUses.includes(k)).length;
      const bMatches = keywords.filter(k => bUses.includes(k)).length;
      return bMatches - aMatches;
    });

    setSearchResults(results.slice(0, 20)); // Limit to top 20 results
    setHasSearched(true);
  }, []);

  // Handle search submit
  const handleSearch = () => {
    searchPlants(searchQuery);
  };

  // Handle example ailment tap
  const handleExampleTap = (ailment: string) => {
    setSearchQuery(ailment);
    searchPlants(ailment);
  };

  // Navigate to plant report
  const handlePlantSelect = (plant: PlantData) => {
    // Create report data for AilmentDetailScreen
    const plantData = {
      plantName: plant.commonName,
      scientificName: plant.scientificName,
      plantType: plant.plantType,
      medicinalBenefits: plant.medicinalUses,
      sideEffects: plant.sideEffects,
      regionsFound: plant.regionsFound,
      preparation: plant.preparation,
      detailedExplanation: plant.detailedExplanation,
      imageUrl: plant.imageUrl, // Pass image URL if available
    };

    navigation.navigate('AilmentDetail', {
      plantData: plantData
    });
  };

  // Render a single plant result with expandable details
  const renderPlantItem = ({ item, index }: { item: PlantData; index: number }) => {
    const isExpanded = expandedCards.has(index);
    const hasAdditionalInfo = item.sideEffects || item.detailedExplanation || item.regionsFound || item.plantType;

    return (
      <Card variant="glass" style={styles.resultCard}>
        {/* Main content - tappable to go to full report */}
        <TouchableOpacity
          onPress={() => handlePlantSelect(item)}
          activeOpacity={0.7}
        >
          <View style={styles.resultHeader}>
            <Text style={{ fontSize: 24, marginRight: 12 }}>🌿</Text>
            <View style={styles.resultTextContainer}>
              <Text style={[styles.plantName, { color: colors.text }]} numberOfLines={1}>
                {item.commonName}
              </Text>
              <Text style={[styles.scientificName, { color: colors.subtext }]} numberOfLines={1}>
                {item.scientificName}
              </Text>
            </View>
          </View>

          {/* Medicinal Uses Preview */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>✓ Uses:</Text>
            <Text style={[styles.usesPreview, { color: colors.subtext }]} numberOfLines={2}>
              {item.medicinalUses}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Expand/Collapse Button */}
        {hasAdditionalInfo && (
          <TouchableOpacity
            onPress={() => toggleExpand(index)}
            style={styles.expandButton}
            activeOpacity={0.7}
          >
            <View style={styles.expandButtonContent}>
              <Text style={[styles.expandButtonText, { color: colors.primary }]}>
                {isExpanded ? 'Show Less' : 'Show More Details'}
              </Text>
              <Text style={[styles.chevron, { color: colors.primary, transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }]}>
                ▼
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Expanded Details Section */}
        {isExpanded && (
          <View style={styles.expandedSection}>
            {/* Plant Type */}
            {item.plantType && item.plantType.trim().length > 0 && (
              <View style={styles.detailBlock}>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailIcon}>🌱</Text>
                  <Text style={[styles.detailTitle, { color: colors.text }]}>Plant Type</Text>
                </View>
                <Text style={[styles.detailText, { color: colors.subtext }]}>
                  {item.plantType}
                </Text>
              </View>
            )}

            {/* Region Found */}
            {item.regionsFound && item.regionsFound.trim().length > 0 && (
              <View style={styles.detailBlock}>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailIcon}>🌍</Text>
                  <Text style={[styles.detailTitle, { color: colors.text }]}>Region Found</Text>
                </View>
                <Text style={[styles.detailText, { color: colors.subtext }]}>
                  {item.regionsFound}
                </Text>
              </View>
            )}

            {/* Side Effects */}
            {item.sideEffects && item.sideEffects.trim().length > 0 && (
              <View style={[styles.detailBlock, styles.warningBlock]}>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailIcon}>⚠️</Text>
                  <Text style={[styles.detailTitle, { color: colors.text }]}>Side Effects</Text>
                </View>
                <Text style={[styles.detailText, { color: colors.subtext }]}>
                  {item.sideEffects}
                </Text>
              </View>
            )}

            {/* Detailed Explanation */}
            {item.detailedExplanation && item.detailedExplanation.trim().length > 0 && (
              <View style={styles.detailBlock}>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailIcon}>📖</Text>
                  <Text style={[styles.detailTitle, { color: colors.text }]}>Detailed Information</Text>
                </View>
                <Text style={[styles.detailText, { color: colors.subtext }]}>
                  {item.detailedExplanation}
                </Text>
              </View>
            )}

            {/* View Full Report Button */}
            <TouchableOpacity
              onPress={() => handlePlantSelect(item)}
              style={[styles.viewReportButton, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
            >
              <Text style={styles.viewReportButtonText}>View Full Report →</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Background with dramatic gradient */}
      <View style={StyleSheet.absoluteFill}>
        <View style={{ flex: 1, backgroundColor: '#000000' }} />
        <LinearGradient
          colors={['rgba(0, 100, 100, 0.2)', 'transparent']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 400 }}
        />
        <View style={{
          position: 'absolute', top: -100, left: -50, width: 400, height: 400,
          borderRadius: 200, backgroundColor: 'rgba(0, 252, 168, 0.08)', transform: [{ scaleX: 1.5 }]
        }} />
        <View style={{
          position: 'absolute', top: 50, right: -100, width: 300, height: 300,
          borderRadius: 150, backgroundColor: 'rgba(59, 130, 246, 0.1)', transform: [{ scaleX: 1.2 }]
        }} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.heroTitle, { color: colors.text }]}>
              Identify Medicinal Plants by Ailment
            </Text>
            <Text style={[styles.subtitle, { color: colors.subtext }]}>
              What problem are you facing?
            </Text>
            <Text style={styles.helperText}>
              Enter your health issue, symptom, or <Text style={{ fontWeight: '700' }}>plant name</Text> to discover suitable medicinal plants.
            </Text>
          </View>

          {/* Search Card */}
          <Card variant="glass" style={styles.searchCard}>
            {/* Search Input */}
            <View style={[styles.searchInputContainer, { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radius.md }]}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="e.g., cough, fever, headache..."
                placeholderTextColor={colors.subtext}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); setHasSearched(false); }}>
                  <Text style={[styles.clearButton, { color: colors.subtext }]}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Search Button */}
            <TouchableOpacity
              onPress={handleSearch}
              activeOpacity={0.85}
              style={styles.searchButtonContainer}
            >
              <LinearGradient
                colors={['#00e6b8', '#00c9a7', '#009b85', '#007a69']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.searchButton}
              >
                <Text style={styles.searchButtonText}>🌿  Find Medicinal Plants</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Example Ailments */}
            {!hasSearched && (
              <View style={styles.examplesSection}>
                <Text style={[styles.examplesTitle, { color: colors.subtext }]}>
                  Common concerns
                </Text>
                <View style={styles.exampleTags}>
                  {EXAMPLE_AILMENTS.map((ailment) => (
                    <TouchableOpacity
                      key={ailment}
                      style={[styles.exampleTag, { backgroundColor: 'rgba(0, 252, 168, 0.15)', borderColor: 'rgba(0, 252, 168, 0.3)' }]}
                      onPress={() => handleExampleTap(ailment)}
                    >
                      <Text style={[styles.exampleTagText, { color: colors.primary }]}>
                        {ailment}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </Card>

          {/* Search Results */}
          {hasSearched && (
            <View style={styles.resultsSection}>
              <Text style={[styles.resultsTitle, { color: colors.text }]}>
                {searchResults.length > 0
                  ? `Found ${searchResults.length} plant${searchResults.length > 1 ? 's' : ''}`
                  : 'No plants found'}
              </Text>

              {searchResults.length === 0 ? (
                <Card variant="glass" style={styles.noResultsCard}>
                  <Text style={{ fontSize: 40, marginBottom: 12 }}>🌱</Text>
                  <Text style={[styles.noResultsText, { color: colors.subtext }]}>
                    No medicinal plants found for "{searchQuery}"
                  </Text>
                  <Text style={[styles.noResultsHint, { color: colors.subtext }]}>
                    Try different keywords like "fever", "digestive", or "skin"
                  </Text>
                </Card>
              ) : (
                <View style={styles.resultsList}>
                  {searchResults.map((plant, index) => (
                    <View key={`${plant.scientificName}-${index}`} style={{ marginBottom: 12 }}>
                      {renderPlantItem({ item: plant, index })}
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Info Section */}
          {!hasSearched && (
            <View style={styles.infoSection}>
              <Card variant="glass" style={styles.infoCard}>
                <View style={styles.infoHeader}>
                  <Text style={styles.infoIcon}>💡</Text>
                  <View>
                    <Text style={[styles.infoTitle, { color: colors.text }]}>How it works</Text>
                    <Text style={[styles.infoBody, { color: colors.subtext }]}>
                      Search by ailment or symptom to find medicinal plants from our database of over 3,000 medicinal plants.
                    </Text>
                  </View>
                </View>
              </Card>

              <View style={{ height: spacing.md }} />

              <Card variant="glass" style={styles.infoCard}>
                <View style={styles.infoHeader}>
                  <Text style={styles.infoIcon}>⚠️</Text>
                  <View>
                    <Text style={[styles.infoTitle, { color: colors.text }]}>Safety Note</Text>
                    <Text style={[styles.infoBody, { color: colors.subtext }]}>
                      Information provided is for educational purposes only. Always consult a qualified healthcare professional before use.
                    </Text>
                  </View>
                </View>
              </Card>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  header: { marginBottom: 24, marginTop: 10 },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  helperText: {
    fontSize: 14,
    fontWeight: '500',
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 20,
    textAlign: 'center',
    color: '#ffd700',
  },
  searchCard: {
    padding: 20,
    marginBottom: 24,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  clearButton: {
    fontSize: 18,
    padding: 4,
  },
  searchButtonContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#00d4aa',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  searchButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  examplesSection: {
    marginTop: 8,
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  exampleTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  exampleTag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  exampleTagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resultsSection: {
    marginTop: 8,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  resultsList: {
    // gap handled by marginBottom on children
  },
  resultCard: {
    padding: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultTextContainer: {
    flex: 1,
  },
  plantName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  scientificName: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  usesPreview: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  infoRow: {
    marginTop: 8,
    marginLeft: 36,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4ade80',
    marginBottom: 4,
  },
  sideEffectsRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  sideEffectsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ff9999',
    marginBottom: 4,
  },
  sideEffectsPreview: {
    fontSize: 13,
    lineHeight: 18,
  },
  noResultsCard: {
    padding: 32,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  noResultsHint: {
    fontSize: 13,
    textAlign: 'center',
  },
  infoSection: {
    marginTop: 8,
  },
  infoCard: {
    padding: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  infoBody: {
    fontSize: 13,
    lineHeight: 18,
    maxWidth: width - 120,
  },
  // Expandable card styles
  expandButton: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  expandButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandButtonText: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 6,
  },
  chevron: {
    fontSize: 10,
    fontWeight: '600',
  },
  expandedSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  detailBlock: {
    marginBottom: 16,
    paddingLeft: 12,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(0, 252, 168, 0.4)',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  detailTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  detailText: {
    fontSize: 13,
    lineHeight: 20,
    paddingLeft: 24,
  },
  warningBlock: {
    borderLeftColor: 'rgba(200, 120, 80, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(200, 120, 80, 0.4)',
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingRight: 10,
    borderRadius: 8,
  },
  viewReportButton: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  viewReportButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },
});
