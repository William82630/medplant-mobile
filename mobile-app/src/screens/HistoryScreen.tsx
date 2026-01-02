import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';
import { AppStateContext } from '../MainApp';
import { HistoryItem } from '../history';

export default function HistoryScreen() {
  const { colors, dark } = useTheme();
  const context = useContext(AppStateContext);
  const history = context?.history || [];

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderItem = ({ item }: { item: HistoryItem }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.imageUri }} style={styles.thumbnail} />
      <View style={styles.cardContent}>
        <Text style={[styles.plantName, { color: colors.text }]}>
          {item.identified?.species || 'Unknown Plant'}
        </Text>
        <Text style={[styles.commonName, { color: colors.subtext }]}>
          {item.identified?.commonNames?.[0] || 'No common name'}
        </Text>
        <Text style={[styles.date, { color: colors.subtext }]}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
      <View style={styles.confidenceBadge}>
        <Text style={[styles.confidenceText, { color: colors.primary }]}>
          {Math.round((item.identified?.confidence || 0) * 100)}%
        </Text>
      </View>
    </TouchableOpacity>
  );

  const gradientColors = dark
    ? ['#0a0f0d', '#0d1a14', '#0a0f0d'] as const
    : ['#f0f9f4', '#e8f5e9', '#f0f9f4'] as const;

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>History</Text>
        <Text style={[styles.subtitle, { color: colors.subtext }]}>
          Your identified plants
        </Text>
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyIcon]}>🌿</Text>
          <Text style={[styles.emptyText, { color: colors.subtext }]}>
            No plants identified yet
          </Text>
          <Text style={[styles.emptyHint, { color: colors.subtext }]}>
            Start scanning plants to build your history
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#ccc',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
  },
  plantName: {
    fontSize: 16,
    fontWeight: '700',
  },
  commonName: {
    fontSize: 14,
    marginTop: 2,
  },
  date: {
    fontSize: 12,
    marginTop: 4,
  },
  confidenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});
