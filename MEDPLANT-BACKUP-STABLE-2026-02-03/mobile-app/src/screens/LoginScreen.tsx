import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Linking,
  StatusBar,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { signInWithEmail, signInWithGoogle, resetPassword, signUpWithEmail, updatePassword, saveGoogleDisplayName } from '../services/AuthService';

// Import the icon images
const GoogleIcon = require('../../assets/google-icon-48.png');
const EmailIcon = require('../../assets/email-icon-48.png');

interface LoginScreenProps {
  onLogin: () => void;
  isPasswordRecovery?: boolean;
  recoverySession?: Session | null;
}

export default function LoginScreen({ onLogin, isPasswordRecovery = false, recoverySession }: LoginScreenProps) {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Google name capture modal
  const [showGoogleNameModal, setShowGoogleNameModal] = useState(false);
  const [googleName, setGoogleName] = useState('');
  const [googleUserId, setGoogleUserId] = useState<string | null>(null);
  const [savingGoogleName, setSavingGoogleName] = useState(false);

  // If in password recovery mode, show the password reset form
  useEffect(() => {
    if (isPasswordRecovery) {
      setShowEmailForm(true);
    }
  }, [isPasswordRecovery]);

  const handleUpdatePassword = async () => {
    if (!password.trim() || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await updatePassword(password);
      if (result.success) {
        setSuccessMessage('Password updated successfully! You can now sign in.');
        setPassword('');
        setConfirmPassword('');
        // After a short delay, complete the login
        setTimeout(() => {
          onLogin();
        }, 1500);
      } else {
        setError(result.error || 'Failed to update password');
      }
    } catch (e: any) {
      setError(e.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    // Add 45-second timeout for mobile OAuth flow
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      setError('Google sign in timed out. Please check:\n1. Google account credentials\n2. Internet connection\n3. Try again in a moment');
    }, 45000);

    try {
      console.log('[LoginScreen] Starting Google sign in on mobile...');
      const result = await signInWithGoogle();
      clearTimeout(timeoutId);
      
      if (result.success) {
        console.log('[LoginScreen] Google OAuth flow initiated. Waiting for redirect...');
        // On mobile, the OAuth redirect happens in the background
        // The app will be resumed after user authenticates in Google
        // onLogin() will be called by the main App.tsx when session updates
      } else {
        console.error('[LoginScreen] Google sign in failed:', result.error);
        setError(result.error || 'Google sign in failed');
        setIsLoading(false);
      }
    } catch (e: any) {
      clearTimeout(timeoutId);
      console.error('[LoginScreen] Google login exception:', e);
      setError(e.message || 'An error occurred during Google sign in');
      setIsLoading(false);
    }
  };

  const handleSaveGoogleName = async () => {
    if (!googleName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    if (!googleUserId) {
      Alert.alert('Error', 'Session lost. Please try Google sign in again.');
      setShowGoogleNameModal(false);
      return;
    }

    setSavingGoogleName(true);
    console.log('[LoginScreen] Saving Google name for user:', googleUserId);
    const result = await saveGoogleDisplayName(googleUserId, googleName);
    
    if (result.success) {
      console.log('[LoginScreen] Google name saved successfully');
      setShowGoogleNameModal(false);
      setGoogleName('');
      setGoogleUserId(null);
      onLogin();
    } else {
      console.error('[LoginScreen] Failed to save Google name:', result.error);
      Alert.alert('Error', result.error || 'Failed to save name');
      setSavingGoogleName(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!showEmailForm) {
      setShowEmailForm(true);
      setIsSignUp(true); // Default to signup mode for new users
      return;
    }

    // Validate inputs
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!password.trim() || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (isSignUp && !fullName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (isSignUp) {
        // Create new account
        const result = await signUpWithEmail(email.trim(), password, fullName);
        if (result.success) {
          if (result.error) {
            // Account created but needs email confirmation
            setSuccessMessage(result.error);
          } else {
            onLogin();
          }
        } else {
          setError(result.error || 'Sign up failed');
        }
      } else {
        // Sign in to existing account
        const result = await signInWithEmail(email.trim(), password);
        if (result.success) {
          onLogin();
        } else {
          setError(result.error || 'Authentication failed');
        }
      }
    } catch (e: any) {
      setError(e.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://medplant.app/privacy'); // Replace with actual URL
  };

  const openTerms = () => {
    Linking.openURL('https://medplant.app/terms'); // Replace with actual URL
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Please enter your email first, then tap "Forgot Password"');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const result = await resetPassword(email.trim());
      if (result.success) {
        setSuccessMessage('Password reset email sent! Check your inbox.');
      } else {
        setError(result.error || 'Failed to send reset email');
      }
    } catch (e: any) {
      setError(e.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" />

      {/* Background Gradient */}
      <LinearGradient
        colors={['#0a1a14', '#0f2a1f', '#0a1a14']}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Glow */}
      <View style={styles.glowCircle} />

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* App Branding */}
          <View style={styles.branding}>
            <Text style={styles.appIcon}>🌿</Text>
            <Text style={styles.appTitle}>MedPlant</Text>
            <Text style={styles.subtitle}>
              Identify medicinal plants safely and responsibly
            </Text>
          </View>

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Success Message */}
          {successMessage && (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          )}

          {/* Password Recovery Form - Shows when user clicked password reset link */}
          {isPasswordRecovery && (
            <View style={styles.emailForm}>
              <Text style={styles.recoveryTitle}>Set New Password</Text>
              <Text style={styles.recoverySubtitle}>
                Enter your new password below
              </Text>
              <TextInput
                style={styles.input}
                placeholder="New Password (min 6 characters)"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                secureTextEntry
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError(null);
                  setSuccessMessage(null);
                }}
                editable={!isLoading}
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm New Password"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                secureTextEntry
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setError(null);
                  setSuccessMessage(null);
                }}
                editable={!isLoading}
              />
              <Pressable
                onPress={handleUpdatePassword}
                disabled={isLoading}
                style={({ pressed }) => [
                  styles.emailButton,
                  { backgroundColor: '#00C896', borderWidth: 0 },
                  Platform.OS === 'ios' && pressed && { opacity: 0.85 },
                  isLoading && { opacity: 0.7 }
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.emailButtonText}>Update Password</Text>
                )}
              </Pressable>
            </View>
          )}

          {/* Email Form - Shows when "Continue with Email" is tapped (not in recovery mode) */}
          {showEmailForm && !isPasswordRecovery && (
            <View style={styles.emailForm}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError(null);
                  setSuccessMessage(null);
                }}
                editable={!isLoading}
              />
              <TextInput
                style={styles.input}
                placeholder="Password (min 6 characters)"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                secureTextEntry
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError(null);
                  setSuccessMessage(null);
                }}
                editable={!isLoading}
              />
              {/* Name Field - only show for sign up mode */}
              {isSignUp && (
                <TextInput
                  style={styles.input}
                  placeholder="Name"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  autoCapitalize="words"
                  value={fullName}
                  onChangeText={(text) => {
                    setFullName(text);
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  editable={!isLoading}
                />
              )}
              {/* Forgot Password Link - only show for sign in mode */}
              {!isSignUp && (
                <Pressable onPress={handleForgotPassword} disabled={isLoading}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Google Button - hide during password recovery */}
          {!isPasswordRecovery && (
            <Pressable
              onPress={handleGoogleLogin}
              android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.googleButton,
                Platform.OS === 'ios' && pressed && { opacity: 0.85 },
                isLoading && { opacity: 0.7 }
              ]}
            >
              {/* Google Icon */}
              <Image source={GoogleIcon} style={styles.iconImage} />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </Pressable>
          )}

          {/* Email Button - hide during password recovery */}
          {!isPasswordRecovery && (
            <Pressable
              onPress={handleEmailLogin}
              android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.emailButton,
                Platform.OS === 'ios' && pressed && { opacity: 0.85 },
                isLoading && { opacity: 0.7 }
              ]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 12 }} />
              ) : (
                <Image source={EmailIcon} style={styles.iconImage} />
              )}
              <Text style={styles.emailButtonText}>
                {!showEmailForm
                  ? 'Continue with Email'
                  : isSignUp
                    ? 'Create Account'
                    : 'Sign In'}
              </Text>
            </Pressable>
          )}

          {/* Toggle between Sign In and Create Account - only when email form is shown and not in recovery */}
          {showEmailForm && !isPasswordRecovery && (
            <Pressable
              onPress={() => {
                setIsSignUp(!isSignUp);
                setFullName('');
                setError(null);
                setSuccessMessage(null);
              }}
              style={styles.toggleButton}
            >
              <Text style={styles.toggleButtonText}>
                {isSignUp
                  ? 'Already have an account? Sign In'
                  : "Don't have an account? Create one"}
              </Text>
            </Pressable>
          )}

          {/* Back button when email form is shown - not in recovery mode */}
          {showEmailForm && !isPasswordRecovery && (
            <Pressable
              onPress={() => {
                setShowEmailForm(false);
                setIsSignUp(false);
                setError(null);
              }}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </Pressable>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing, you agree to our{' '}
              <Text style={styles.linkText} onPress={openPrivacyPolicy}>
                Privacy Policy
              </Text>
              {' '}and{' '}
              <Text style={styles.linkText} onPress={openTerms}>
                Terms & Conditions
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Google Name Capture Modal */}
      <Modal
        visible={showGoogleNameModal}
        transparent
        animationType="fade"
        onRequestClose={() => !savingGoogleName && setShowGoogleNameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Complete Your Profile</Text>
            <Text style={styles.modalSubtitle}>
              What would you like to be called?
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Enter your name"
              placeholderTextColor="rgba(0, 0, 0, 0.5)"
              value={googleName}
              onChangeText={setGoogleName}
              autoCapitalize="words"
              editable={!savingGoogleName}
            />

            <View style={styles.modalButtonContainer}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowGoogleNameModal(false);
                  setGoogleName('');
                  setGoogleUserId(null);
                }}
                disabled={savingGoogleName}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleSaveGoogleName}
                disabled={savingGoogleName}
              >
                {savingGoogleName ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalButtonText}>Continue</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1a14',
  },
  glowCircle: {
    position: 'absolute',
    top: -150,
    left: '50%',
    marginLeft: -200,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(0, 200, 150, 0.08)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 120,
    paddingBottom: 40,
    justifyContent: 'flex-start',
  },
  branding: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -1,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
  spacer: {
    flex: 1,
  },
  // Google Button - White background
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  iconImage: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  // Email Button - Outline style
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  emailButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 18,
  },
  linkText: {
    color: 'rgba(0, 200, 150, 0.8)',
    textDecorationLine: 'underline',
  },
  // New styles for auth
  scrollContent: {
    flexGrow: 1,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 100, 100, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 100, 100, 0.3)',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    textAlign: 'center',
  },
  emailForm: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  backButton: {
    alignItems: 'center',
    marginBottom: 16,
  },
  backButtonText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
  successContainer: {
    backgroundColor: 'rgba(0, 200, 150, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 150, 0.3)',
  },
  successText: {
    color: '#00C896',
    fontSize: 14,
    textAlign: 'center',
  },
  forgotPasswordText: {
    color: 'rgba(0, 200, 150, 0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    textDecorationLine: 'underline',
  },
  toggleButton: {
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleButtonText: {
    color: 'rgba(0, 200, 150, 0.8)',
    fontSize: 14,
    textAlign: 'center',
  },
  recoveryTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  recoverySubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  // Google name modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#171717',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666666',
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#171717',
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
  modalButtonCancel: {
    backgroundColor: '#f5f5f5',
  },
  modalButtonCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  modalButtonPrimary: {
    backgroundColor: '#00C896',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});
