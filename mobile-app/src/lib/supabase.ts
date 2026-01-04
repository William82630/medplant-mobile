import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Supabase credentials
// Note: These are public anon keys, safe for client-side use
const SUPABASE_URL = 'https://amogozhndwshgdvkagdu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtb2dvemhuZHdzaGdkdmthZ2R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzODUxODMsImV4cCI6MjA3OTk2MTE4M30.-M8jevVuqhF8kKgf4s9WwZTdzfdPR34ON4IdTsAaxZ0';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      persistSession: true,
      autoRefreshToken: true,
      // Enable URL session detection on web for password recovery links
      // Disable on native as deep links are handled differently
      detectSessionInUrl: Platform.OS === 'web',
    },
  }
);
