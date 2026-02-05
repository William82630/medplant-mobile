/**
 * AuthService - Handles authentication with Supabase
 * Supports Email/Password and Google OAuth
 */

import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { Platform } from 'react-native';

export interface AuthResult {
  success: boolean;
  user?: User | null;
  error?: string;
  needsSignUp?: boolean;
}

/**
 * Sign in with email and password.
 * Returns specific error if password is wrong vs user doesn't exist.
 */
export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (data?.user) {
      return { success: true, user: data.user };
    }

    if (error) {
      // Check if user doesn't exist - suggest sign up
      if (error.message?.includes('Invalid login credentials')) {
        return {
          success: false,
          error: 'Invalid email or password. If you\'re new, tap "Create Account" below.',
          needsSignUp: true
        };
      }
      return { success: false, error: error.message };
    }

    return { success: false, error: 'Authentication failed' };
  } catch (error: any) {
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

/**
 * Sign up with email and password (create new account)
 * Optionally saves full_name to user_profiles table
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  fullName?: string
): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Check if email is already registered
    if (data?.user?.identities?.length === 0) {
      return {
        success: false,
        error: 'This email is already registered. Try signing in or reset your password.'
      };
    }

    // If full_name provided, update user_profiles table
    if (data?.user && fullName?.trim()) {
      try {
        await supabase
          .from('user_profiles')
          .update({ full_name: fullName.trim() })
          .eq('id', data.user.id);
      } catch (updateError) {
        console.warn('[AuthService] Failed to save full_name:', updateError);
        // Don't fail signup just because full_name save failed
      }
    }

    // Check if email confirmation is required
    if (data?.user && !data.session) {
      return {
        success: true,
        user: data.user,
        error: 'Account created! Check your email to confirm.'
      };
    }

    return { success: true, user: data.user };
  } catch (error: any) {
    return { success: false, error: error.message || 'Sign up failed' };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Sign out failed' };
  }
}

/**
 * Get the current session
 */
export async function getSession(): Promise<Session | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch {
    return null;
  }
}

/**
 * Get the current user
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (session: Session | null) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session);
  });
}

/**
 * Google Sign In - Mobile-optimized using Supabase + expo-web-browser
 * Opens the Google OAuth page in a browser and handles the redirect back to the app
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    console.log('[AuthService] Starting Google OAuth...');
    console.log('[AuthService] Platform:', Platform.OS);

    // For mobile: Use the app's custom scheme
    // For web: Use window origin
    const redirectTo = Platform.OS === 'web'
      ? window.location.origin
      : 'medplant://auth/callback';

    console.log('[AuthService] OAuth redirectTo:', redirectTo);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: Platform.OS !== 'web', // Skip auto-redirect on mobile so we can use WebBrowser
      },
    });

    if (error) {
      console.error('[AuthService] Google OAuth error:', error);
      return { success: false, error: error.message || 'Google sign in failed' };
    }

    // On web, the redirect happens automatically
    if (Platform.OS === 'web') {
      console.log('[AuthService] Web OAuth - redirect will happen automatically');
      return { success: true };
    }

    // On mobile, we need to open the URL manually using expo-web-browser
    if (data?.url) {
      console.log('[AuthService] Opening OAuth URL in browser...');

      // Dynamically import WebBrowser to avoid issues on web
      const WebBrowser = require('expo-web-browser');

      // Open the auth session - this will open the browser and wait for redirect
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        'medplant' // The scheme to listen for (matches app.json scheme)
      );

      console.log('[AuthService] WebBrowser result:', result.type);

      if (result.type === 'success' && result.url) {
        console.log('[AuthService] OAuth redirect received:', result.url);

        // Parse tokens from the redirect URL
        // URL format: medplant://auth/callback#access_token=xxx&refresh_token=yyy&...
        const url = result.url;
        const hashIndex = url.indexOf('#');

        if (hashIndex !== -1) {
          const hashParams = new URLSearchParams(url.substring(hashIndex + 1));
          const access_token = hashParams.get('access_token');
          const refresh_token = hashParams.get('refresh_token');

          console.log('[AuthService] Tokens found:', {
            hasAccessToken: !!access_token,
            hasRefreshToken: !!refresh_token
          });

          if (access_token && refresh_token) {
            // Set the session in Supabase - this persists the session
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });

            if (sessionError) {
              console.error('[AuthService] Failed to set session:', sessionError);
              return { success: false, error: sessionError.message || 'Failed to save session' };
            }

            console.log('[AuthService] Session set successfully:', sessionData.user?.email);

            // Sync Google Display Name if available and profile name is missing
            const fullName = sessionData.user?.user_metadata?.full_name || sessionData.user?.user_metadata?.name;
            if (fullName) {
              console.log('[AuthService] Found Google display name:', fullName);
              // We don't await this to keep login fast, it runs in background
              saveGoogleDisplayName(sessionData.user.id, fullName);
            }

            return { success: true, user: sessionData.user };
          } else {
            console.error('[AuthService] Missing tokens in redirect URL');
            return { success: false, error: 'Authentication tokens not found' };
          }
        } else {
          console.error('[AuthService] No hash fragment in redirect URL');
          return { success: false, error: 'Invalid authentication response' };
        }
      } else if (result.type === 'cancel' || result.type === 'dismiss') {
        return { success: false, error: 'Google sign in was cancelled' };
      } else {
        return { success: false, error: 'Google sign in failed to complete' };
      }
    } else {
      console.error('[AuthService] No OAuth URL returned from Supabase');
      return { success: false, error: 'Failed to get Google sign in URL' };
    }
  } catch (error: any) {
    console.error('[AuthService] Google OAuth exception:', error);
    return { success: false, error: error.message || 'Google sign in failed' };
  }
}



/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<AuthResult> {
  try {
    // Use web URL for password reset redirect
    const redirectTo = Platform.OS === 'web'
      ? window.location.origin
      : 'medplant://auth/reset-password';

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to send reset email' };
  }
}

/**
 * Update password (used after clicking password reset link)
 */
export async function updatePassword(newPassword: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, user: data.user };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update password' };
  }
}

/**
 * Save Google displayName to user_profiles after OAuth signin
 * Used to ensure every Google user has a display name
 */
export async function saveGoogleDisplayName(userId: string, displayName?: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!displayName || !displayName.trim()) {
      return { success: false, error: 'Display name is required' };
    }

    const { error } = await supabase
      .from('user_profiles')
      .update({ full_name: displayName.trim() })
      .eq('id', userId);

    if (error) {
      console.error('[AuthService] Failed to save displayName:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('[AuthService] Unexpected error saving displayName:', error);
    return { success: false, error: error.message || 'Failed to save display name' };
  }
}
