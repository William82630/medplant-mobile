import AsyncStorage from '@react-native-async-storage/async-storage';

export type HistoryItem = {
  id: string; // uuid-ish
  createdAt: number; // epoch ms
  imageUri?: string;
  identified: {
    species: string;
    confidence: number;
    commonNames: string[];
    medicinalUses: string[];
    cautions: string;
    regionFound?: string | null;
    preparation?: string | null;
    disclaimer?: string | null;
    source: string;
  };
};

const KEY = 'mp_history_v1';

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

export async function saveToHistory(item: HistoryItem): Promise<void> {
  const list = await loadHistory();
  // Prepend latest
  list.unshift(item);
  // Cap at 100 entries
  const capped = list.slice(0, 100);
  await AsyncStorage.setItem(KEY, JSON.stringify(capped));
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
