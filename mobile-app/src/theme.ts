import { useColorScheme } from 'react-native';

export function useTheme() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const colors = dark
    ? {
        background: '#0b0b0c',
        card: '#151518',
        surface: '#1d1d22',
        text: '#f2f2f2',
        subtext: '#b6b6c0',
        primary: '#4da3ff',
        border: '#2a2a2f',
        muted: '#222228',
      }
    : {
        background: '#ffffff',
        card: '#f7f7fb',
        surface: '#ffffff',
        text: '#171717',
        subtext: '#5b5b66',
        primary: '#007aff',
        border: '#e5e5ea',
        muted: '#f0f0f5',
      };
  return { dark, colors };
}
