import { useColorScheme } from 'react-native';

export function useTheme() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const colors = dark
    ? {
      background: '#0a1410',
      card: '#141c18',
      surface: '#1a2420',
      text: '#f2f2f2',
      subtext: '#8a9a92',
      primary: '#2dd4a8',
      border: '#1e2a24',
      muted: '#0f1612',
    }
    : {
      background: '#f5faf8',
      card: '#ffffff',
      surface: '#ffffff',
      text: '#171717',
      subtext: '#5b6b62',
      primary: '#16a085',
      border: '#d5e5dd',
      muted: '#e8f5f0',
    };

  const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  };

  const radius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  };

  return { dark, colors, spacing, radius };
}
