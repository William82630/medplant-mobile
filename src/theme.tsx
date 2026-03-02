import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeContextType {
  dark: boolean;
  colors: typeof darkColors;
  spacing: typeof spacingValues;
  radius: typeof radiusValues;
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => void;
}

const darkColors = {
  background: '#0a1410',
  card: '#141c18',
  surface: '#1a2420',
  text: '#f2f2f2',
  subtext: '#8a9a92',
  primary: '#2dd4a8',
  border: '#1e2a24',
  muted: '#0f1612',
};

const lightColors = {
  background: '#f5faf8',
  card: '#ffffff',
  surface: '#ffffff',
  text: '#171717',
  subtext: '#5b6b62',
  primary: '#16a085',
  border: '#d5e5dd',
  muted: '#e8f5f0',
};

const spacingValues = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const radiusValues = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');

  // Load saved preference from AsyncStorage on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem('themePreference');
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setThemePreferenceState(saved);
        }
      } catch (e) {
        console.log('Error loading theme preference:', e);
      }
    };
    loadTheme();
  }, []);

  // Save preference to AsyncStorage
  const setThemePreference = (pref: ThemePreference) => {
    setThemePreferenceState(pref);
    AsyncStorage.setItem('themePreference', pref).catch(e => {
      console.log('Error saving theme preference:', e);
    });
  };

  // Determine if dark mode should be active
  const dark = themePreference === 'system'
    ? systemScheme === 'dark'
    : themePreference === 'dark';

  const colors = dark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{
      dark,
      colors,
      spacing: spacingValues,
      radius: radiusValues,
      themePreference,
      setThemePreference,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  // Fallback for components not wrapped in ThemeProvider
  if (!context) {
    const scheme = useColorScheme();
    const dark = scheme === 'dark';
    return {
      dark,
      colors: dark ? darkColors : lightColors,
      spacing: spacingValues,
      radius: radiusValues,
      themePreference: 'system' as ThemePreference,
      setThemePreference: () => { },
    };
  }

  return context;
}
