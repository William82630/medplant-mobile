import { createClient } from '@supabase/supabase-js';

// Supabase credentials
// Note: These are public anon keys, safe for client-side use
const SUPABASE_URL = 'https://amogozhndwshgdvkagdu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtb2dvemhuZHdzaGdkdmthZ2R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzODUxODMsImV4cCI6MjA3OTk2MTE4M30.-M8jevVuqhF8kKgf4s9WwZTdzfdPR34ON4IdTsAaxZ0';

// Check if running in browser (for SSR compatibility)
const isBrowser = typeof window !== 'undefined';

// Create SSR-safe storage that uses localStorage in browser
// and a dummy storage during SSR (which runs on Node.js)
const customStorage = {
  getItem: (key: string): Promise<string | null> => {
    if (isBrowser) {
      return Promise.resolve(localStorage.getItem(key));
    }
    return Promise.resolve(null);
  },
  setItem: (key: string, value: string): Promise<void> => {
    if (isBrowser) {
      localStorage.setItem(key, value);
    }
    return Promise.resolve();
  },
  removeItem: (key: string): Promise<void> => {
    if (isBrowser) {
      localStorage.removeItem(key);
    }
    return Promise.resolve();
  },
};

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: customStorage,
      persistSession: true,
      autoRefreshToken: true,
      // Enable URL session detection in browser for password recovery links
      detectSessionInUrl: isBrowser,
    },
  }
);

