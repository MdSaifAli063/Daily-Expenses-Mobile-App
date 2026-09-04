import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { shopService } from '../services/shopService';

export interface SignUpParams {
  email: string;
  password: string;
  shopName: string;
  ownerName: string;
  mobile?: string;
}

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (credentials: { email: string; password: string }) => Promise<{ error: Error | null }>;
  signUp: (params: SignUpParams) => Promise<{
    session: Session | null;
    user: User | null;
    needsEmailConfirmation: boolean;
    error: Error | null;
  }>;
  signOut: () => Promise<{ error: Error | null }>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize and listen for Supabase auth state changes
  useEffect(() => {
    let isMounted = true;

    // 1. Fetch initial session from storage
    supabase.auth
      .getSession()
      .then(({ data: { session: initialSession }, error }) => {
        if (!isMounted) return;
        if (error) {
          console.error('[AuthContext] getSession error:', error.message);
        }
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('[AuthContext] getSession exception:', err);
        setLoading(false);
      });

    // 2. Subscribe to auth events (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, INITIAL_SESSION)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const {
        data: { session: refreshedSession },
        error,
      } = await supabase.auth.refreshSession();
      if (!error && refreshedSession) {
        setSession(refreshedSession);
        setUser(refreshedSession.user);
      }
    } catch (err) {
      console.error('[AuthContext.refreshSession] Error:', err);
    }
  }, []);

  const signIn = useCallback(async ({ email, password }: { email: string; password: string }) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        let friendlyMessage = 'Invalid email or password.';
        if (error.message.toLowerCase().includes('email not confirmed')) {
          friendlyMessage = 'Please confirm your email address before signing in.';
        } else if (error.message.toLowerCase().includes('network') || error.message.toLowerCase().includes('failed to fetch')) {
          friendlyMessage = 'Network error. Please check your connection and try again.';
        } else if (error.status === 429) {
          friendlyMessage = 'Too many attempts. Please wait a few moments and try again.';
        }
        return { error: new Error(friendlyMessage) };
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        // Ensure shop profile is populated
        if (data.session.user) {
          await shopService.getOrCreateShopForUser(data.session.user);
        }
      }

      return { error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      return { error: new Error(message) };
    }
  }, []);

  const signUp = useCallback(async ({ email, password, shopName, ownerName, mobile }: SignUpParams) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const trimmedShopName = shopName.trim();
      const trimmedOwnerName = ownerName.trim();
      const trimmedMobile = mobile?.trim() || null;

      // 1. Create auth user with shop profile in user metadata
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            shop_name: trimmedShopName,
            owner_name: trimmedOwnerName,
            mobile: trimmedMobile,
          },
        },
      });

      if (error) {
        let friendlyMessage = error.message;
        if (error.message.toLowerCase().includes('already registered')) {
          friendlyMessage = 'An account with this email already exists. Please sign in.';
        } else if (error.message.toLowerCase().includes('password')) {
          friendlyMessage = 'Password should be at least 6 characters.';
        }
        return {
          session: null,
          user: null,
          needsEmailConfirmation: false,
          error: new Error(friendlyMessage),
        };
      }

      const activeUser = data.user;
      const activeSession = data.session;
      const needsEmailConfirmation = !activeSession;

      // 2. If session is immediately active (email confirmation disabled or auto-confirmed), insert into shops table
      if (activeUser && activeSession) {
        const { error: profileError } = await shopService.createShop({
          user_id: activeUser.id,
          shop_name: trimmedShopName,
          owner_name: trimmedOwnerName,
          email: normalizedEmail,
          mobile: trimmedMobile,
        });

        if (profileError) {
          console.error('[AuthContext.signUp] Profile creation failed:', profileError.message);
          // Return error so user is notified and can safely retry
          return {
            session: activeSession,
            user: activeUser,
            needsEmailConfirmation: false,
            error: new Error('Account created, but failed to setup shop profile. Please try logging in.'),
          };
        }

        setSession(activeSession);
        setUser(activeUser);
      }

      return {
        session: activeSession,
        user: activeUser,
        needsEmailConfirmation,
        error: null,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      return {
        session: null,
        user: null,
        needsEmailConfirmation: false,
        error: new Error(message),
      };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      setSession(null);
      setUser(null);

      if (error) {
        console.error('[AuthContext.signOut] Error:', error.message);
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (err: unknown) {
      setSession(null);
      setUser(null);
      const message = err instanceof Error ? err.message : 'Sign out failed';
      return { error: new Error(message) };
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        signIn,
        signUp,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
