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
 * Google Sign In - Mobile-optimized using Supabase
 * Handles both mobile and web, but optimized for mobile-first approach
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
        skipBrowserRedirect: Platform.OS === 'web' ? false : true,
      },
    });

    if (error) {
      console.error('[AuthService] Google OAuth error:', error);
      return { success: false, error: error.message || 'Google sign in failed' };
    }

    // On mobile, OAuth will handle the redirect
    // Session should be available after user returns from Google
    console.log('[AuthService] Google OAuth initiated successfully');
    return { success: true };
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
