import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = 'scan_history';
const MAX_ITEMS = 5;

export interface ScanHistoryItem {
  id: string;
  plantName: string;
  imageUri: string | undefined;
  resultData: any;
  createdAt: number;
}

export async function saveScanToHistory(item: ScanHistoryItem): Promise<void> {
  try {
    const existingHistory = await getScanHistory();
    // Add new item to the beginning
    const newHistory = [item, ...existingHistory].slice(0, MAX_ITEMS);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  } catch (error) {
    console.error('Error saving scan to history:', error);
  }
}

export async function getScanHistory(): Promise<ScanHistoryItem[]> {
  try {
    const historyJson = await AsyncStorage.getItem(HISTORY_KEY);
    if (!historyJson) return [];
    return JSON.parse(historyJson);
  } catch (error) {
    console.error('Error getting scan history:', error);
    return [];
  }
}
