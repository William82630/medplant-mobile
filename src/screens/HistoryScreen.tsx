import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';
import { getScanHistory, ScanHistoryItem } from '../utils/scanHistory';
import { useFocusEffect } from '@react-navigation/native';

interface HistoryScreenProps {
  history: any[]; // Existing prop kept for compatibility
  refreshHistory: () => Promise<void>;
  navigation: any;
}

export default function HistoryScreen({ navigation }: HistoryScreenProps) {
  const { colors, dark } = useTheme();
  const [scanHistory, setScanHistory] = React.useState<ScanHistoryItem[]>([]);

  // Load history every time the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const loadScans = async () => {
        const scans = await getScanHistory();
        setScanHistory(scans);
      };
      loadScans();
    }, [])
  );

  // Format date helper
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString([], {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleItemPress = (item: ScanHistoryItem) => {
    navigation.navigate('IdentifyTab', {
      screen: 'Results',
      params: {
        fromHistory: true,
        cachedResult: item
      }
    });
  };

  const renderItem = ({ item }: { item: ScanHistoryItem }) => (
    <Pressable
      style={({ pressed }: { pressed: boolean }) => [
        styles.historyItem,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.7 : 1
        }
      ]}
      onPress={() => handleItemPress(item)}
    >
      <View style={styles.historyTextContainer}>
        <Text style={[styles.historyPlantName, { color: colors.text }]}>
          {item.plantName}
        </Text>
        <Text style={[styles.historyDate, { color: colors.subtext }]}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
      <Text style={styles.historyArrow}>→</Text>
    </Pressable>
  );

  const gradientColors = dark
    ? ['#0a0f0d', '#0d1a14', '#0a0f0d'] as const
    : ['#f0f9f4', '#e8f5e9', '#f0f9f4'] as const;

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Scan History</Text>
        <Text style={[styles.subtitle, { color: colors.subtext }]}>
          Your last 5 scans
        </Text>
      </View>

      {scanHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📜</Text>
          <Text style={[styles.emptyText, { color: colors.subtext }]}>
            No scan history yet
          </Text>
        </View>
      ) : (
        <FlatList
          data={scanHistory}
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
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  historyTextContainer: {
    flex: 1,
  },
  historyPlantName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 13,
  },
  historyArrow: {
    fontSize: 20,
    color: '#888',
    marginLeft: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: -100,
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
});
