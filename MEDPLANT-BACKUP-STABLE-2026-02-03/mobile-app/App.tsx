import React, { useState, useEffect, createContext, useContext } from 'react';
import { ActivityIndicator, View, StyleSheet, Text, Platform, Linking } from 'react-native';
import { Session, User } from '@supabase/supabase-js';
import MainApp from './src/MainApp';
import LoginScreen from './src/screens/LoginScreen';
import { supabase } from './src/lib/supabase';
import { ThemeProvider } from './src/theme';
import {
  UserProfile,
  getUserProfile,
  hasProAccess,
  canPerformScan,
  isAdmin as isAdminService,
  getRemainingCredits,
} from './src/services/ProfileService';
import { useCredit as useCreditService } from './src/services/SubscriptionService';

// Auth Context for app-wide access
interface AuthContextType {
  user: User | null;
  session: Session | null;
  signOut: () => Promise<void>;
  isLoading: boolean;
  // Profile & Credits (from user_profiles table)
  profile: UserProfile | null;
  refreshProfile: () => Promise<void>;
  hasCredits: () => boolean;
  isAdmin: () => boolean;
  remainingCredits: () => number | 'unlimited';
  canAccessPro: () => boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  signOut: async () => { },
  isLoading: true,
  profile: null,
  refreshProfile: async () => { },
  hasCredits: () => false,
  isAdmin: () => false,
  remainingCredits: () => 0,
  canAccessPro: () => false,
});

export const useAuth = () => useContext(AuthContext);

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Load profile when user is authenticated
  const loadProfile = async (userId: string) => {
    const userProfile = await getUserProfile(userId);
    setProfile(userProfile);
  };

  // Refresh profile (e.g., after payment)
  // STRICT: Fetches user from Supabase directly to ensure ID match
  const refreshProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        // Only load if user exists and matches
        await loadProfile(user.id);
      } else {
        console.warn('refreshProfile: No active Supabase user found');
        setProfile(null);
      }
    } catch (e) {
      console.error('refreshProfile error:', e);
    }
  };

  // Check if user has credits available
  const hasCredits = (): boolean => {
    return canPerformScan(profile);
  };

  // Check if user is admin
  const isAdmin = (): boolean => {
    return isAdminService(profile);
  };

  // Get remaining credits
  const remainingCredits = (): number | 'unlimited' => {
    return getRemainingCredits(profile);
  };

  // Check if user can access Pro features
  const canAccessPro = (): boolean => {
    return hasProAccess(profile);
  };

  const handleUseCredit = async () => {
    if (!session?.user?.id) return { success: false, remaining: 0 };
    const result = await useCreditService(session.user.id);
    if (result.success) {
      await refreshProfile();
    }
    return result;
  };

  useEffect(() => {
    let mounted = true;
    let recoveryDetected = false;
    let deepLinkUnsubscribe: (() => void) | null = null;

    // Set up deep link listener for OAuth redirect on mobile
    if (Platform.OS !== 'web') {
      console.log('[App] Setting up deep link listener for mobile OAuth');

      const handleDeepLink = ({ url }: { url: string }) => {
        console.log('[App] 🔗 Deep link received:', url);

        if (url.includes('medplant://auth/callback')) {
          console.log('[App] ✅ OAUTH CALLBACK DETECTED - stopping loading immediately');
          // IMMEDIATELY stop loading - OAuth callback means auth is processing
          setIsLoading(false);

          // Small delay to ensure AsyncStorage has the session
          setTimeout(() => {
            console.log('[App] Checking for session after deep link...');
            supabase.auth.getSession().then(({ data: { session } }) => {
              if (mounted && session) {
                console.log('[App] ✓ Session found after OAuth:', session.user?.email);
                setSession(session);
                if (session.user?.id) {
                  loadProfile(session.user.id);
                }
              } else if (mounted) {
                console.warn('[App] ⚠️ No session found after OAuth callback');
                setSession(null);
              }
            }).catch((err) => {
              console.error('[App] Error getting session after OAuth:', err);
            });
          }, 500);
        }
      };

      deepLinkUnsubscribe = Linking.addEventListener('url', handleDeepLink).remove;

      // Also check for initial URL if app was launched from deep link
      Linking.getInitialURL().then((url) => {
        console.log('[App] Initial URL check:', url || 'none');
        if (url != null && url.includes('medplant://auth/callback')) {
          console.log('[App] App launched from deep link:', url);
          handleDeepLink({ url });
        }
      }).catch((err) => {
        console.error('[App] Error checking initial URL:', err);
      });
    }

    // Check URL for recovery token on web - just set a flag, wait for auth event
    if (Platform.OS === 'web') {
      const hash = window.location.hash;
      if (hash && hash.includes('type=recovery')) {
        console.log('Password recovery detected from URL hash');
        recoveryDetected = true;
      }
    }

    // Listen for auth state changes FIRST (before checking session)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event, newSession ? 'has session' : 'no session');

        if (!mounted) return;

        // Detect password recovery event from Supabase
        if (event === 'PASSWORD_RECOVERY') {
          console.log('PASSWORD_RECOVERY event received');
          setIsPasswordRecovery(true);
          setSession(newSession);
          setIsLoading(false);
          if (Platform.OS === 'web') {
            window.history.replaceState(null, '', window.location.pathname);
          }
          return;
        }

        // Handle SIGNED_IN event when coming from recovery link
        if (event === 'SIGNED_IN' && recoveryDetected && newSession) {
          console.log('SIGNED_IN with recovery flag - treating as recovery');
          setIsPasswordRecovery(true);
          setSession(newSession);
          setIsLoading(false);
          if (Platform.OS === 'web') {
            window.history.replaceState(null, '', window.location.pathname);
          }
          return;
        }

        setSession(newSession);
        setIsLoading(false);

        // Load profile when user signs in
        if (newSession?.user?.id) {
          loadProfile(newSession.user.id);
        } else {
          setProfile(null);
        }

        // Clear recovery mode on regular sign in
        if (event === 'SIGNED_IN' && !recoveryDetected) {
          setIsPasswordRecovery(false);
        }
      }
    );

    // Check initial session AFTER setting up listener
    const checkSession = async () => {
      console.log('[App] Starting session check...');
      try {
        // Add timeout to prevent hanging indefinitely
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session check timeout')), 5000)
        );

        const { data: { session: currentSession }, error: sessionError } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;

        if (sessionError) {
          console.error('[App] Session error:', sessionError);
          if (mounted) {
            await supabase.auth.signOut().catch(() => { });
          }
        }

        if (mounted && !isPasswordRecovery) {
          console.log('[App] Setting session and stopping loading');
          setSession(currentSession);
          setIsLoading(false);

          // Load profile for existing session
          if (currentSession?.user?.id) {
            console.log('[App] Loading profile for user:', currentSession.user.id);
            loadProfile(currentSession.user.id);
          }
        }
      } catch (err: any) {
        console.error('[App] Error checking session:', err);
        if (mounted) {
          console.warn('[App] Session check failed, proceeding to login screen');
          // Don't show error, just stop loading
          setSession(null);
          setIsLoading(false);
        }
      }
    };

    // SHORT delay (300ms) to let auth state change fire first if there are URL tokens
    setTimeout(() => {
      if (mounted && isLoading) {
        console.log('[App] Checking session after listener setup delay');
        checkSession();
      }
    }, 300);

    // SAFETY TIMEOUT: If still loading after 3 seconds, force stop loading
    // This prevents infinite loading if session check hangs
    const safetyTimeout = setTimeout(() => {
      if (mounted && isLoading) {
        console.warn('[App] Safety timeout triggered after 3s - forcing loading to stop');
        setIsLoading(false);
      }
    }, 3000);

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
      if (deepLinkUnsubscribe) {
        deepLinkUnsubscribe();
      }
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setProfile(null);
      setIsPasswordRecovery(false);
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  const handleLoginSuccess = async () => {
    setIsPasswordRecovery(false);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);

      // Load profile after login
      if (currentSession?.user?.id) {
        loadProfile(currentSession.user.id);
      }
    } catch (err: any) {
      console.error('Error refreshing session:', err);
    }
  };

  // Show error state
  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Text style={styles.errorSubtext}>Please restart the app</Text>
      </View>
    );
  }

  // Show loading indicator while checking auth
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00C896" />
      </View>
    );
  }

  // Show login screen if not authenticated OR if in password recovery mode
  if (!session?.user || isPasswordRecovery) {
    return (
      <ThemeProvider>
        <LoginScreen
          onLogin={handleLoginSuccess}
          isPasswordRecovery={isPasswordRecovery}
          recoverySession={isPasswordRecovery ? session : null}
        />
      </ThemeProvider>
    );
  }

  // Show main app if authenticated
  return (
    <ThemeProvider>
      <AuthContext.Provider
        value={{
          user: session.user,
          session,
          signOut: handleSignOut,
          isLoading,
          profile,
          refreshProfile,
          hasCredits,
          isAdmin,
          remainingCredits,
          canAccessPro,
        }}
      >
        <MainApp
          session={session}
          subscription={profile}
          signOut={handleSignOut}
          refreshSubscription={refreshProfile}
          useCredit={handleUseCredit}
          hasCredits={hasCredits}
          isAdmin={isAdmin}
          remainingCredits={remainingCredits}
        />
      </AuthContext.Provider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a1a14',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    marginBottom: 8,
  },
  errorSubtext: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
});
