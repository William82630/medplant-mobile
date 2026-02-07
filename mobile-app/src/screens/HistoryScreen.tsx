import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { useTheme } from '../theme';
import { HistoryItem, cleanupExpiredHistory } from '../history';

interface HistoryScreenProps {
  history: HistoryItem[];
  refreshHistory: () => Promise<void>;
  navigation: any;
}

export default function HistoryScreen({ history = [], refreshHistory, navigation }: HistoryScreenProps) {
  const { colors, dark } = useTheme();

  // Cleanup expired entries on mount
  useEffect(() => {
    cleanupExpiredHistory().then(() => {
      refreshHistory?.();
    });
  }, []);

  // Format relative time (e.g., "2 hours ago")
  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${Math.floor(hours / 24)} day${Math.floor(hours / 24) > 1 ? 's' : ''} ago`;
  };

  // Handle tap on history item - try to open or navigate
  const handleItemPress = async (item: HistoryItem) => {
    // 1. Scan Result logic
    if (item.data) {
      if (item.data.identified) {
        // AI Scan result
        navigation.navigate('IdentifyTab', {
          screen: 'Results',
          params: {
            resultData: item.data,
            imageUri: item.imageUri
          }
        });
      } else {
        // Ailment search result
        navigation.navigate('IdentifyTab', {
          screen: 'AilmentDetail',
          params: {
            plantData: item.data
          }
        });
      }
      return;
    }

    // 2. Original PDF Download logic
    if (item.fileUri) {
      // Check if file still exists
      try {
        const fileInfo = await (FileSystem as any).getInfoAsync(item.fileUri);
        if (fileInfo.exists) {
          // File exists - share/open it
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(item.fileUri, {
              mimeType: 'application/pdf',
              dialogTitle: `${item.plantName} Report`,
              UTI: 'com.adobe.pdf',
            });
          }
          return;
        }
      } catch (e) {
        // File check failed, show message
      }
    }

    // File doesn't exist or no URI - inform user
    Alert.alert(
      'Report Unavailable',
      'The original report is no longer available. Please scan the plant again.',
      [{ text: 'OK' }]
    );
  };

  const renderItem = ({ item }: { item: HistoryItem }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.7}
      onPress={() => handleItemPress(item)}
    >
      <View style={styles.iconContainer}>
        {item.imageUri ? (
          <Image source={{ uri: item.imageUri }} style={styles.thumbnail} />
        ) : (
          <Text style={styles.icon}>{item.data ? '🌿' : '📄'}</Text>
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.plantName, { color: colors.text }]} numberOfLines={1}>
          {item.plantName}
        </Text>
        {item.scientificName && (
          <Text style={[styles.scientificName, { color: colors.subtext }]} numberOfLines={1}>
            {item.scientificName}
          </Text>
        )}
        <Text style={[styles.date, { color: colors.subtext }]}>
          {formatRelativeTime(item.timestamp)}
        </Text>
      </View>
      {item.confidence && (
        <View style={[styles.confidenceBadge, { backgroundColor: colors.muted }]}>
          <Text style={[styles.confidenceText, { color: colors.primary }]}>
            {item.confidence}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const gradientColors = dark
    ? ['#0a0f0d', '#0d1a14', '#0a0f0d'] as const
    : ['#f0f9f4', '#e8f5e9', '#f0f9f4'] as const;

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Recent Downloads</Text>
        <Text style={[styles.subtitle, { color: colors.subtext }]}>
          Your recent scans and downloads
        </Text>
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📥</Text>
          <Text style={[styles.emptyText, { color: colors.subtext }]}>
            No history yet
          </Text>
          <Text style={[styles.emptyHint, { color: colors.subtext }]}>
            Your scans and reports will appear here
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
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(45, 106, 79, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  cardContent: {
    flex: 1,
    marginLeft: 14,
  },
  plantName: {
    fontSize: 16,
    fontWeight: '700',
  },
  scientificName: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 2,
  },
  date: {
    fontSize: 12,
    marginTop: 4,
  },
  confidenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  confidenceText: {
    fontSize: 12,
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
