import React, { useState, useEffect, createContext, useContext } from 'react';
import { ActivityIndicator, View, StyleSheet, Text, Platform } from 'react-native';
import { Session, User } from '@supabase/supabase-js';
import MainApp from './src/MainApp';
import LoginScreen from './src/screens/LoginScreen';
import { supabase } from './src/lib/supabase';
import { ThemeProvider } from './src/theme';

// Auth Context for app-wide access
interface AuthContextType {
  user: User | null;
  session: Session | null;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  signOut: async () => { },
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

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

