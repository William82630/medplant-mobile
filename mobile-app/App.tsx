import React, { useState, useEffect, createContext, useContext } from 'react';
import { ActivityIndicator, View, StyleSheet, Text, Platform } from 'react-native';
import { Session, User } from '@supabase/supabase-js';
import MainApp from './src/MainApp';
import LoginScreen from './src/screens/LoginScreen';
import { supabase } from './src/lib/supabase';
import { ThemeProvider } from './src/theme';
import {
  UserSubscription,
  getOrCreateSubscription,
  useCredit as useCreditService,
  hasCredits as hasCreditsService,
  isAdmin as isAdminService,
  getRemainingCredits,
} from './src/services/SubscriptionService';

// Auth Context for app-wide access
interface AuthContextType {
  user: User | null;
  session: Session | null;
  signOut: () => Promise<void>;
  isLoading: boolean;
  // Subscription & Credits
  subscription: UserSubscription | null;
  refreshSubscription: () => Promise<void>;
  useCredit: () => Promise<{ success: boolean; remaining: number }>;
  hasCredits: () => boolean;
  isAdmin: () => boolean;
  remainingCredits: () => number | 'unlimited';
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  signOut: async () => { },
  isLoading: true,
  subscription: null,
  refreshSubscription: async () => { },
  useCredit: async () => ({ success: false, remaining: 0 }),
  hasCredits: () => false,
  isAdmin: () => false,
  remainingCredits: () => 0,
});

export const useAuth = () => useContext(AuthContext);

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);

  // Load subscription when user is authenticated
  const loadSubscription = async (userId: string) => {
    const sub = await getOrCreateSubscription(userId);
    setSubscription(sub);
  };

  // Refresh subscription (e.g., after payment)
  const refreshSubscription = async () => {
    if (session?.user?.id) {
      await loadSubscription(session.user.id);
    }
  };

  // Use a credit for AI scan/PDF
  const useCredit = async (): Promise<{ success: boolean; remaining: number }> => {
    if (!session?.user?.id) return { success: false, remaining: 0 };
    const result = await useCreditService(session.user.id);
    if (result.success) {
      // Refresh subscription to update UI
      await refreshSubscription();
    }
    return result;
  };

  // Check if user has credits
  const hasCredits = (): boolean => {
    return hasCreditsService(subscription);
  };

  // Check if user is admin
  const isAdmin = (): boolean => {
    return isAdminService(subscription);
  };

  // Get remaining credits
  const remainingCredits = (): number | 'unlimited' => {
    return getRemainingCredits(subscription);
  };

  useEffect(() => {
    let mounted = true;
    let recoveryDetected = false;

    // Check URL for recovery token on web - just set a flag, wait for auth event
    if (Platform.OS === 'web') {
      const hash = window.location.hash;
      if (hash && hash.includes('type=recovery')) {
        console.log('Password recovery detected from URL hash');
        recoveryDetected = true;
        // Don't set isPasswordRecovery yet - wait for auth state change with session
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
          // Clear the URL hash to prevent issues on refresh
          if (Platform.OS === 'web') {
            window.history.replaceState(null, '', window.location.pathname);
          }
          return;
        }

        // Also handle SIGNED_IN event when coming from recovery link
        if (event === 'SIGNED_IN' && recoveryDetected && newSession) {
          console.log('SIGNED_IN with recovery flag - treating as recovery');
          setIsPasswordRecovery(true);
          setSession(newSession);
          setIsLoading(false);
          // Clear the URL hash
          if (Platform.OS === 'web') {
            window.history.replaceState(null, '', window.location.pathname);
          }
          return;
        }

        setSession(newSession);
        setIsLoading(false);

        // Load subscription when user signs in
        if (newSession?.user?.id) {
          loadSubscription(newSession.user.id);
        }

        // Clear recovery mode on regular sign in
        if (event === 'SIGNED_IN' && !recoveryDetected) {
          setIsPasswordRecovery(false);
        }
      }
    );

    // Check initial session AFTER setting up listener
    const checkSession = async () => {
      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          await supabase.auth.signOut();
        }

        if (mounted && !isPasswordRecovery) {
          setSession(currentSession);
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error('Error checking session:', err);
        if (mounted) {
          setError(err.message || 'Failed to check session');
          setIsLoading(false);
        }
      }
    };

    // Small delay to let auth state change fire first if there are URL tokens
    setTimeout(() => {
      if (mounted && isLoading) {
        checkSession();
      }
    }, 100);

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setSubscription(null);
      setIsPasswordRecovery(false);
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  const handleLoginSuccess = async () => {
    // After login, refresh session and clear recovery mode
    setIsPasswordRecovery(false);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
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
      <LoginScreen
        onLogin={handleLoginSuccess}
        isPasswordRecovery={isPasswordRecovery}
        recoverySession={isPasswordRecovery ? session : null}
      />
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
          subscription,
          refreshSubscription,
          useCredit,
          hasCredits,
          isAdmin,
          remainingCredits,
        }}
      >
        <MainApp />
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

