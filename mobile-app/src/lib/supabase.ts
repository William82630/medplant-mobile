import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Supabase credentials
// Note: These are public anon keys, safe for client-side use
const SUPABASE_URL = 'https://amogozhndwshgdvkagdu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtb2dvemhuZHdzaGdkdmthZ2R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzODUxODMsImV4cCI6MjA3OTk2MTE4M30.-M8jevVuqhF8kKgf4s9WwZTdzfdPR34ON4IdTsAaxZ0';

// Custom storage adapter that swallows errors (needed for Expo Router static rendering)
const SafeStorage = {
  getItem: async (key: string) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      // In Node/Server env, this might fail. Return null.
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      // Ignore errors in server env
    }
  },
  removeItem: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      // Ignore errors
    }
  },
};

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: SafeStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

