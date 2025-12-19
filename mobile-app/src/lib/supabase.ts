import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra;

if (!extra?.supabase?.url || !extra?.supabase?.anonKey) {
  throw new Error('Supabase environment variables are missing');
}

export const supabase = createClient(
  extra.supabase.url,
  extra.supabase.anonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  }
);
