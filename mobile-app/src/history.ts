import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Simplified History - Tracks PDF downloads only (like Chrome Downloads)
 * Auto-expires after 48 hours
 */
export type HistoryItem = {
  id: string;
  timestamp: number;        // download time (epoch ms)
  plantName: string;        // common name
  scientificName?: string;  // optional
  confidence?: string;      // optional (High/Medium/Low)
  fileName: string;         // PDF filename
  fileUri?: string;         // PDF file path (for re-opening)
};

const KEY = 'mp_downloads_v1';
const EXPIRY_MS = 48 * 60 * 60 * 1000; // 48 hours

/**
 * Load all non-expired history items
 */
export async function loadHistory(): Promise<HistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr as HistoryItem[];
  } catch {
    return [];
  }
}

/**
 * Save a new download entry to history (prepends to list)
 */
export async function saveToHistory(item: HistoryItem): Promise<void> {
  const list = await loadHistory();
  list.unshift(item);
  // Cap at 50 entries (downloads are less frequent)
  const capped = list.slice(0, 50);
  await AsyncStorage.setItem(KEY, JSON.stringify(capped));
}

/**
 * Cleanup expired history entries (48-hour expiry)
 * Safe, idempotent, won't crash on empty storage
 */
export async function cleanupExpiredHistory(): Promise<void> {
  try {
    const list = await loadHistory();
    if (list.length === 0) return;

    const cutoff = Date.now() - EXPIRY_MS;
    const valid = list.filter(item => item.timestamp > cutoff);

    // Only write if something changed
    if (valid.length !== list.length) {
      await AsyncStorage.setItem(KEY, JSON.stringify(valid));
    }
  } catch {
    // Silently fail - cleanup is non-critical
  }
}

/**
 * Clear all history
 */
export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
