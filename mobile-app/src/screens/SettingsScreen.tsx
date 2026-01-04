import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  Pressable,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';
import { clearHistory } from '../history';
import { useAuth } from '../../App';

const { width } = Dimensions.get('window');

interface SettingsScreenProps {
  onBack?: () => void;
}

type ThemeOption = 'system' | 'light' | 'dark';
type LanguageOption = 'en' | 'hi' | 'es' | 'fr' | 'de' | 'pt' | 'ar' | 'zh' | 'ja' | 'ta' | 'te' | 'bn';

const LANGUAGES: { code: LanguageOption; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt', label: 'Português' },
  { code: 'ar', label: 'العربية' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
];

export default function SettingsScreen({ onBack }: SettingsScreenProps) {
  const { colors, dark } = useTheme();
  const { signOut, user } = useAuth();

  // App Preferences state
  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>('system');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>('en');

  // Handle theme selection
  const handleThemeChange = (theme: ThemeOption) => {
    setSelectedTheme(theme);
    console.log(`[Placeholder] Theme changed to: ${theme}`);
    // TODO: Implement actual theme switching
  };

  // Handle language selection
  const handleLanguageChange = (language: LanguageOption) => {
    setSelectedLanguage(language);
    console.log(`[Placeholder] Language changed to: ${language}`);
    // TODO: Implement actual language switching with i18n
  };

  // Handle clear download history
  const handleClearHistory = () => {
    Alert.alert(
      'Clear Download History',
      'This will permanently delete all your recent downloads. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearHistory();
            Alert.alert('Success', 'Download history has been cleared.');
          }
        },
      ]
    );
  };

  // Handle logout - works on both web and native
  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      // Web: use browser confirm dialog
      const confirmed = window.confirm('Are you sure you want to sign out?');
      if (confirmed) {
        await signOut();
      }
    } else {
      // Native: use Alert.alert
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: async () => {
              await signOut();
            }
          },
        ]
      );
    }
  };

  // Handle placeholder navigation
  const handleNavigate = (screen: string) => {
    console.log(`[Placeholder] Navigate to: ${screen}`);
    // TODO: Wire actual navigation when screens are ready
  };

  // Handle contact support
  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Email us at: info@willsblogger.com\n\nWe typically respond within 24-48 hours.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      {/* Background */}
      <LinearGradient
        colors={dark
          ? ['#0a1410', '#081210', '#050a08']
          : ['#f5faf8', '#eef5f2', '#e8f0ec']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          {onBack && (
            <Pressable onPress={onBack} style={styles.backButton}>
              <Text style={[styles.backButtonText, { color: colors.primary }]}>← Back</Text>
            </Pressable>
          )}
          <Text style={[styles.headerTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
            Settings
          </Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* SECTION 1: App Preferences */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: dark ? '#8a9a92' : '#5b6b62' }]}>
              APP PREFERENCES
            </Text>

            <View style={[styles.card, { backgroundColor: dark ? '#141c18' : '#ffffff' }]}>
              {/* Theme */}
              <View style={styles.settingItem}>
                <Text style={[styles.settingLabel, { color: dark ? '#f2f2f2' : '#171717' }]}>
                  Theme
                </Text>
                <View style={styles.themeOptions}>
                  {(['system', 'light', 'dark'] as ThemeOption[]).map((theme) => (
                    <Pressable
                      key={theme}
                      onPress={() => handleThemeChange(theme)}
                      style={[
                        styles.themeButton,
                        {
                          backgroundColor: selectedTheme === theme
                            ? (dark ? '#2a3a32' : '#e8f5f0')
                            : 'transparent',
                          borderColor: selectedTheme === theme
                            ? colors.primary
                            : (dark ? '#2a3a32' : '#e5e5ea'),
                        }
                      ]}
                    >
                      <Text style={[
                        styles.themeButtonText,
                        {
                          color: selectedTheme === theme
                            ? colors.primary
                            : (dark ? '#8a9a92' : '#5b6b62')
                        }
                      ]}>
                        {theme === 'system' ? 'System' : theme === 'light' ? 'Light' : 'Dark'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={[styles.separator, { backgroundColor: dark ? '#1e2a24' : '#e5e5ea' }]} />

              {/* Language */}
              <View style={styles.languageSettingItem}>
                <Text style={[styles.settingLabel, { color: dark ? '#f2f2f2' : '#171717' }]}>
                  Language
                </Text>
                <View style={styles.languageOptions}>
                  {LANGUAGES.map((lang) => (
                    <Pressable
                      key={lang.code}
                      onPress={() => handleLanguageChange(lang.code)}
                      style={[
                        styles.languageButton,
                        {
                          backgroundColor: selectedLanguage === lang.code
                            ? (dark ? '#2a3a32' : '#e8f5f0')
                            : 'transparent',
                          borderColor: selectedLanguage === lang.code
                            ? colors.primary
                            : (dark ? '#2a3a32' : '#e5e5ea'),
                        }
                      ]}
                    >
                      <Text style={[
                        styles.languageButtonText,
                        {
                          color: selectedLanguage === lang.code
                            ? colors.primary
                            : (dark ? '#8a9a92' : '#5b6b62')
                        }
                      ]}>
                        {lang.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={[styles.languageHelperText, { color: dark ? '#6a7a72' : '#888888' }]}>
                  Language switching will be enabled in a future update.
                </Text>
              </View>
            </View>
          </View>

          {/* SECTION 2: Safety & Usage */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: dark ? '#8a9a92' : '#5b6b62' }]}>
              SAFETY & USAGE
            </Text>

            <View style={[styles.card, { backgroundColor: dark ? '#141c18' : '#ffffff' }]}>
              <Pressable
                style={styles.settingItem}
                onPress={() => handleNavigate('SafetyDisclaimer')}
              >
                <View>
                  <Text style={[styles.settingLabel, { color: dark ? '#f2f2f2' : '#171717' }]}>
                    Safety Disclaimer
                  </Text>
                  <Text style={[styles.settingSubtext, { color: dark ? '#6a7a72' : '#888888' }]}>
                    Educational content, not medical advice
                  </Text>
                </View>
                <Text style={[styles.chevron, { color: dark ? '#6a7a72' : '#888888' }]}>›</Text>
              </Pressable>

              <View style={[styles.separator, { backgroundColor: dark ? '#1e2a24' : '#e5e5ea' }]} />

              <Pressable
                style={styles.settingItem}
                onPress={() => handleNavigate('UsageGuidelines')}
              >
                <View>
                  <Text style={[styles.settingLabel, { color: dark ? '#f2f2f2' : '#171717' }]}>
                    Usage Guidelines
                  </Text>
                  <Text style={[styles.settingSubtext, { color: dark ? '#6a7a72' : '#888888' }]}>
                    Safe identification and responsible use
                  </Text>
                </View>
                <Text style={[styles.chevron, { color: dark ? '#6a7a72' : '#888888' }]}>›</Text>
              </Pressable>
            </View>
          </View>

          {/* SECTION 3: Data & Storage */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: dark ? '#8a9a92' : '#5b6b62' }]}>
              DATA & STORAGE
            </Text>

            <View style={[styles.card, { backgroundColor: dark ? '#141c18' : '#ffffff' }]}>
              <Pressable
                style={styles.settingItem}
                onPress={handleClearHistory}
              >
                <View>
                  <Text style={[styles.settingLabel, { color: '#ef4444' }]}>
                    Clear Download History
                  </Text>
                  <Text style={[styles.settingSubtext, { color: dark ? '#6a7a72' : '#888888' }]}>
                    Remove all recent downloads
                  </Text>
                </View>
                <Text style={[styles.chevron, { color: dark ? '#6a7a72' : '#888888' }]}>›</Text>
              </Pressable>

              <View style={[styles.separator, { backgroundColor: dark ? '#1e2a24' : '#e5e5ea' }]} />

              <Pressable
                style={styles.settingItem}
                onPress={() => handleNavigate('DataSourceInfo')}
              >
                <View>
                  <Text style={[styles.settingLabel, { color: dark ? '#f2f2f2' : '#171717' }]}>
                    Data Source Information
                  </Text>
                  <Text style={[styles.settingSubtext, { color: dark ? '#6a7a72' : '#888888' }]}>
                    AI and plant database sources
                  </Text>
                </View>
                <Text style={[styles.chevron, { color: dark ? '#6a7a72' : '#888888' }]}>›</Text>
              </Pressable>
            </View>
          </View>

          {/* SECTION 4: App Info */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: dark ? '#8a9a92' : '#5b6b62' }]}>
              APP INFO
            </Text>

            <View style={[styles.card, { backgroundColor: dark ? '#141c18' : '#ffffff' }]}>
              <View style={styles.settingItem}>
                <Text style={[styles.settingLabel, { color: dark ? '#f2f2f2' : '#171717' }]}>
                  App Version
                </Text>
                <Text style={[styles.settingValue, { color: dark ? '#8a9a92' : '#5b6b62' }]}>
                  1.0.0
                </Text>
              </View>

              <View style={[styles.separator, { backgroundColor: dark ? '#1e2a24' : '#e5e5ea' }]} />

              <Pressable
                style={styles.settingItem}
                onPress={handleContactSupport}
              >
                <View>
                  <Text style={[styles.settingLabel, { color: dark ? '#f2f2f2' : '#171717' }]}>
                    Contact Support
                  </Text>
                  <Text style={[styles.settingSubtext, { color: dark ? '#6a7a72' : '#888888' }]}>
                    info@willsblogger.com
                  </Text>
                </View>
                <Text style={[styles.chevron, { color: dark ? '#6a7a72' : '#888888' }]}>›</Text>
              </Pressable>
            </View>
          </View>

          {/* SECTION 5: Account */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: dark ? '#8a9a92' : '#5b6b62' }]}>
              ACCOUNT
            </Text>

            <View style={[styles.card, { backgroundColor: dark ? '#141c18' : '#ffffff' }]}>
              {user && (
                <>
                  <View style={styles.settingItem}>
                    <View>
                      <Text style={[styles.settingLabel, { color: dark ? '#f2f2f2' : '#171717' }]}>
                        Signed in as
                      </Text>
                      <Text style={[styles.settingSubtext, { color: dark ? '#6a7a72' : '#888888' }]}>
                        {user.email}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.separator, { backgroundColor: dark ? '#1e2a24' : '#e5e5ea' }]} />
                </>
              )}
              <Pressable
                style={styles.settingItem}
                onPress={handleLogout}
              >
                <View>
                  <Text style={[styles.settingLabel, { color: '#ef4444' }]}>
                    Sign Out
                  </Text>
                  <Text style={[styles.settingSubtext, { color: dark ? '#6a7a72' : '#888888' }]}>
                    Return to login screen
                  </Text>
                </View>
                <Text style={[styles.chevron, { color: dark ? '#6a7a72' : '#888888' }]}>›</Text>
              </Pressable>
            </View>
          </View>

          {/* Bottom spacing */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 60,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
    paddingLeft: 4,
  },
  card: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 54,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingSubtext: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  chevron: {
    fontSize: 22,
    fontWeight: '300',
  },
  separator: {
    height: 1,
    marginHorizontal: 16,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  themeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  themeButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  languageSettingItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  languageOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  languageButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  languageHelperText: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 12,
    fontStyle: 'italic',
  },
});
