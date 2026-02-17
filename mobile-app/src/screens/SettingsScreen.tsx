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
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';
import { clearHistory } from '../history';
import { useAuth } from '../../App';
import { getPlanDisplayName, updateUserProfile } from '../services/ProfileService';
import DisclaimerScreen from './DisclaimerScreen';
import UsageGuidelinesScreen from './UsageGuidelinesScreen';
import DataSourceInfoScreen from './DataSourceInfoScreen';

const { width } = Dimensions.get('window');

interface SettingsScreenProps {
  onBack?: () => void;
  // onNavigate prop removed as we handle it internally now
  onNavigate?: (screen: string) => void;
}

type ThemeOption = 'system' | 'light' | 'dark';

export default function SettingsScreen({ onBack }: SettingsScreenProps) {
  const { colors, dark, themePreference, setThemePreference } = useTheme();
  const { signOut, user, profile, refreshProfile, remainingCredits } = useAuth(); // Add remainingCredits

  // Full Name Edit state
  const [showEditFullName, setShowEditFullName] = useState(false);
  const [editingFullName, setEditingFullName] = useState(profile?.full_name || '');
  const [savingFullName, setSavingFullName] = useState(false);

  // Internal Modals state
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showUsageGuidelines, setShowUsageGuidelines] = useState(false);
  const [showDataSourceInfo, setShowDataSourceInfo] = useState(false);

  // Handle theme selection
  const handleThemeChange = (theme: ThemeOption) => {
    setThemePreference(theme);
  };

  // Handle save full name
  const handleSaveFullName = async () => {
    if (!user) return;

    setSavingFullName(true);
    const result = await updateUserProfile(user.id, {
      full_name: editingFullName.trim() || null
    });

    if (result.success) {
      // Refresh profile to get updated data
      await refreshProfile();
      setShowEditFullName(false);
      Alert.alert('Success', 'Full name updated successfully');
    } else {
      Alert.alert('Error', result.error || 'Failed to update full name');
    }
    setSavingFullName(false);
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

  // Handle logout
  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to sign out?');
      if (confirmed) {
        await signOut();
      }
    } else {
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

  // Handle navigation to internal modals
  const handleNavigate = (screen: string) => {
    switch (screen) {
      case 'SafetyDisclaimer':
        setShowDisclaimer(true);
        break;
      case 'UsageGuidelines':
        setShowUsageGuidelines(true);
        break;
      case 'DataSourceInfo':
        setShowDataSourceInfo(true);
        break;
      default:
        console.log(`[Settings] Unknown screen: ${screen}`);
    }
  };

  // Handle contact support
  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Email us at: info@willsblogger.com\n\nWe typically respond within 24-48 hours.',
      [{ text: 'OK' }]
    );
  };

  const credits = remainingCredits ? remainingCredits() : 0;
  const displayCredits = credits === 'unlimited' ? 'Unlimited (Admin)' : credits;

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
                          backgroundColor: themePreference === theme
                            ? (dark ? '#2a3a32' : '#e8f5f0')
                            : 'transparent',
                          borderColor: themePreference === theme
                            ? colors.primary
                            : (dark ? '#2a3a32' : '#e5e5ea'),
                        }
                      ]}
                    >
                      <Text style={[
                        styles.themeButtonText,
                        {
                          color: themePreference === theme
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
                  {/* Name (Display Name) */}
                  <Pressable
                    style={styles.settingItem}
                    onPress={() => {
                      setEditingFullName(profile?.full_name || '');
                      setShowEditFullName(true);
                    }}
                  >
                    <View>
                      <Text style={[styles.settingLabel, { color: dark ? '#f2f2f2' : '#171717' }]}>
                        Name
                      </Text>
                      <Text style={[styles.settingSubtext, { color: dark ? '#6a7a72' : '#888888' }]}>
                        {profile?.full_name || user.user_metadata?.full_name || 'Not set'}
                      </Text>
                    </View>
                    <Text style={[styles.chevron, { color: dark ? '#6a7a72' : '#888888' }]}>›</Text>
                  </Pressable>
                  <View style={[styles.separator, { backgroundColor: dark ? '#1e2a24' : '#e5e5ea' }]} />

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

                  {/* Plan Info */}
                  <View style={styles.settingItem}>
                    <View>
                      <Text style={[styles.settingLabel, { color: dark ? '#f2f2f2' : '#171717' }]}>
                        Current Plan
                      </Text>
                      {getPlanDisplayName(profile)}
                    </View>
                  </View>
                  <View style={[styles.separator, { backgroundColor: dark ? '#1e2a24' : '#e5e5ea' }]} />

                  {/* Credits Info */}
                  <View style={styles.settingItem}>
                    <View>
                      <Text style={[styles.settingLabel, { color: dark ? '#f2f2f2' : '#171717' }]}>
                        Credits Remaining
                      </Text>
                      <Text style={[styles.settingSubtext, { color: dark ? '#6a7a72' : '#888888' }]}>
                        {displayCredits}
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

        {/* INTERNAL MODALS */}
        <Modal
          visible={showDisclaimer}
          animationType="slide"
          onRequestClose={() => setShowDisclaimer(false)}
        >
          <DisclaimerScreen onBack={() => setShowDisclaimer(false)} />
        </Modal>

        <Modal
          visible={showUsageGuidelines}
          animationType="slide"
          onRequestClose={() => setShowUsageGuidelines(false)}
        >
          <UsageGuidelinesScreen onBack={() => setShowUsageGuidelines(false)} />
        </Modal>

        <Modal
          visible={showDataSourceInfo}
          animationType="slide"
          onRequestClose={() => setShowDataSourceInfo(false)}
        >
          <DataSourceInfoScreen onBack={() => setShowDataSourceInfo(false)} />
        </Modal>

        {/* Edit Name Modal */}
        <Modal
          visible={showEditFullName}
          transparent
          animationType="fade"
          onRequestClose={() => setShowEditFullName(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: dark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)' }]}>
            <View style={[styles.modalContent, { backgroundColor: dark ? '#0f1410' : '#ffffff' }]}>
              <Text style={[styles.modalTitle, { color: dark ? '#f2f2f2' : '#171717' }]}>
                Edit Name
              </Text>
              <Text style={[styles.modalSubtitle, { color: dark ? '#6a7a72' : '#888888' }]}>
                Enter your display name
              </Text>

              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: dark ? '#1a241f' : '#f5f5f5',
                    color: dark ? '#f2f2f2' : '#171717',
                    borderColor: dark ? '#2a3a32' : '#e5e5ea',
                  }
                ]}
                placeholder="Name"
                placeholderTextColor={dark ? '#6a7a72' : '#888888'}
                value={editingFullName}
                onChangeText={setEditingFullName}
                autoCapitalize="words"
                editable={!savingFullName}
              />

              <View style={styles.modalButtonContainer}>
                <Pressable
                  style={[styles.modalButton, { backgroundColor: dark ? '#1a241f' : '#f5f5f5' }]}
                  onPress={() => setShowEditFullName(false)}
                  disabled={savingFullName}
                >
                  <Text style={[styles.modalButtonText, { color: dark ? '#8a9a92' : '#5b6b62' }]}>
                    Cancel
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={handleSaveFullName}
                  disabled={savingFullName}
                >
                  {savingFullName ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.modalButtonText}>Save</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
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
    paddingBottom: 60,
    flexGrow: 1,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxWidth: 340,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});
