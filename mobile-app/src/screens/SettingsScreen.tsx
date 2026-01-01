import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  Pressable,
  Switch,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';

const { width } = Dimensions.get('window');

interface SettingsScreenProps {
  onBack?: () => void;
}

type ThemeOption = 'system' | 'light' | 'dark';

export default function SettingsScreen({ onBack }: SettingsScreenProps) {
  const { colors, dark } = useTheme();

  // App Preferences state
  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>('system');
  const [safetyAlertsEnabled, setSafetyAlertsEnabled] = useState(true);
  const [scanRemindersEnabled, setScanRemindersEnabled] = useState(false);

  // Handle theme selection
  const handleThemeChange = (theme: ThemeOption) => {
    setSelectedTheme(theme);
    console.log(`[Placeholder] Theme changed to: ${theme}`);
    // TODO: Implement actual theme switching
  };

  // Handle clear scan history
  const handleClearHistory = () => {
    Alert.alert(
      'Clear Scan History',
      'This will permanently delete all your local scan history. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            console.log('[Placeholder] Clearing scan history');
            // TODO: Implement actual history clearing
            Alert.alert('Success', 'Scan history has been cleared.');
          }
        },
      ]
    );
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
              <View style={styles.settingItem}>
                <View>
                  <Text style={[styles.settingLabel, { color: dark ? '#f2f2f2' : '#171717' }]}>
                    Language
                  </Text>
                  <Text style={[styles.settingSubtext, { color: dark ? '#6a7a72' : '#888888' }]}>
                    More languages coming soon
                  </Text>
                </View>
                <Text style={[styles.settingValue, { color: dark ? '#8a9a92' : '#5b6b62' }]}>
                  English
                </Text>
              </View>

              <View style={[styles.separator, { backgroundColor: dark ? '#1e2a24' : '#e5e5ea' }]} />

              {/* Safety Alerts Toggle */}
              <View style={styles.settingItem}>
                <Text style={[styles.settingLabel, { color: dark ? '#f2f2f2' : '#171717' }]}>
                  Safety Alerts
                </Text>
                <Switch
                  value={safetyAlertsEnabled}
                  onValueChange={setSafetyAlertsEnabled}
                  trackColor={{ false: '#767577', true: colors.primary + '50' }}
                  thumbColor={safetyAlertsEnabled ? colors.primary : '#f4f3f4'}
                />
              </View>

              <View style={[styles.separator, { backgroundColor: dark ? '#1e2a24' : '#e5e5ea' }]} />

              {/* Scan Reminders Toggle */}
              <View style={styles.settingItem}>
                <Text style={[styles.settingLabel, { color: dark ? '#f2f2f2' : '#171717' }]}>
                  Scan Reminders
                </Text>
                <Switch
                  value={scanRemindersEnabled}
                  onValueChange={setScanRemindersEnabled}
                  trackColor={{ false: '#767577', true: colors.primary + '50' }}
                  thumbColor={scanRemindersEnabled ? colors.primary : '#f4f3f4'}
                />
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
                    Clear Scan History
                  </Text>
                  <Text style={[styles.settingSubtext, { color: dark ? '#6a7a72' : '#888888' }]}>
                    Remove all local scan data
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
});
