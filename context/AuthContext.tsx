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

export interface SignInCredentials {
  mobileOrEmail: string;
  password: string;
}

export interface SignUpParams {
  mobile: string;
  password: string;
  shopName: string;
  ownerName: string;
  email?: string;
}

export interface ResetWithShopVerificationParams {
  mobile: string;
  shopOrOwnerName: string;
  newPassword: string;
}

export interface ResetWithOtpParams {
  email: string;
  token: string;
  newPassword: string;
}

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (credentials: SignInCredentials) => Promise<{ error: Error | null }>;
  signUp: (params: SignUpParams) => Promise<{
    session: Session | null;
    user: User | null;
    needsEmailConfirmation: boolean;
    error: Error | null;
  }>;
  signOut: () => Promise<{ error: Error | null }>;
  refreshSession: () => Promise<void>;
  resetPasswordWithShopVerification: (
    params: ResetWithShopVerificationParams
  ) => Promise<{ success: boolean; error: Error | null }>;
  sendPasswordResetEmail: (
    mobileOrEmail: string
  ) => Promise<{ success: boolean; emailSentTo?: string; error: Error | null }>;
  verifyOtpAndResetPassword: (
    params: ResetWithOtpParams
  ) => Promise<{ success: boolean; error: Error | null }>;
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

  const signIn = useCallback(
    async ({ mobileOrEmail, password }: SignInCredentials) => {
      try {
        const trimmed = mobileOrEmail.trim();
        if (!trimmed) {
          return { error: new Error('Please enter your mobile number.') };
        }
        if (!password) {
          return { error: new Error('Please enter your password.') };
        }

        let authEmail: string;

        // If user typed an email directly with @, use it
        if (trimmed.includes('@')) {
          authEmail = trimmed.toLowerCase();
        } else {
          // Normalize mobile number: extract digits and take the last 10
          const digits = trimmed.replace(/\D/g, '');
          const cleanMobile = digits.length > 10 ? digits.slice(-10) : digits;

          if (!cleanMobile || cleanMobile.length < 10) {
            return { error: new Error('Please enter a valid 10-digit mobile number.') };
          }

          // 1. Try resolving mobile number to registered auth email using database RPC
          try {
            const { data: resolvedEmail, error: rpcError } = await supabase.rpc(
              'get_auth_email_for_mobile',
              { p_mobile: cleanMobile }
            );

            if (!rpcError && resolvedEmail && typeof resolvedEmail === 'string') {
              authEmail = resolvedEmail;
            } else {
              authEmail = `${cleanMobile}@dailyexpenses.app`;
            }
          } catch {
            authEmail = `${cleanMobile}@dailyexpenses.app`;
          }
        }

        // Authenticate with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password,
        });

        if (error) {
          let friendlyMessage = 'Invalid mobile number or password.';
          if (error.message.toLowerCase().includes('email not confirmed')) {
            friendlyMessage = 'Please confirm your account email before signing in.';
          } else if (
            error.message.toLowerCase().includes('network') ||
            error.message.toLowerCase().includes('failed to fetch')
          ) {
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
        const message =
          err instanceof Error ? err.message : 'Something went wrong. Please try again.';
        return { error: new Error(message) };
      }
    },
    []
  );

  const signUp = useCallback(
    async ({ mobile, password, shopName, ownerName, email }: SignUpParams) => {
      try {
        const digits = mobile.replace(/\D/g, '');
        const cleanMobile = digits.length > 10 ? digits.slice(-10) : digits;

        if (!cleanMobile || cleanMobile.length < 10) {
          return {
            session: null,
            user: null,
            needsEmailConfirmation: false,
            error: new Error('Please enter a valid 10-digit mobile number.'),
          };
        }

        const trimmedEmail = email?.trim().toLowerCase();
        // If an email was provided, use it; otherwise, use deterministic phone email
        const authEmail = trimmedEmail || `${cleanMobile}@dailyexpenses.app`;
        const trimmedShopName = shopName.trim();
        const trimmedOwnerName = ownerName.trim();

        // 1. Create auth user with shop profile in user metadata
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password,
          options: {
            data: {
              shop_name: trimmedShopName,
              owner_name: trimmedOwnerName,
              mobile: cleanMobile,
              contact_email: trimmedEmail || null,
            },
          },
        });

        if (error) {
          let friendlyMessage = error.message;
          if (
            error.message.toLowerCase().includes('already registered') ||
            error.message.toLowerCase().includes('already exists')
          ) {
            friendlyMessage =
              'An account with this mobile number already exists. Please sign in.';
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

        // 2. If session is immediately active, insert into shops table
        if (activeUser && activeSession) {
          const { error: profileError } = await shopService.createShop({
            user_id: activeUser.id,
            shop_name: trimmedShopName,
            owner_name: trimmedOwnerName,
            email: trimmedEmail || null,
            mobile: cleanMobile,
          });

          if (profileError) {
            console.error(
              '[AuthContext.signUp] Profile creation failed:',
              profileError.message
            );
            return {
              session: activeSession,
              user: activeUser,
              needsEmailConfirmation: false,
              error: new Error(
                'Account created, but failed to setup shop profile. Please sign in.'
              ),
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
        const message =
          err instanceof Error ? err.message : 'Registration failed. Please try again.';
        return {
          session: null,
          user: null,
          needsEmailConfirmation: false,
          error: new Error(message),
        };
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    try {
      shopService.invalidateShopCache();
      const { error } = await supabase.auth.signOut();
      setSession(null);
      setUser(null);

      if (error) {
        console.error('[AuthContext.signOut] Error:', error.message);
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (err: unknown) {
      shopService.invalidateShopCache();
      setSession(null);
      setUser(null);
      const message = err instanceof Error ? err.message : 'Sign out failed';
      return { error: new Error(message) };
    }
  }, []);

  const resetPasswordWithShopVerification = useCallback(
    async ({ mobile, shopOrOwnerName, newPassword }: ResetWithShopVerificationParams) => {
      try {
        const digits = mobile.replace(/\D/g, '');
        const cleanMobile = digits.length > 10 ? digits.slice(-10) : digits;

        if (!cleanMobile || cleanMobile.length < 10) {
          return { success: false, error: new Error('Please enter a valid 10-digit mobile number.') };
        }

        const trimmedName = shopOrOwnerName.trim();
        if (!trimmedName) {
          return { success: false, error: new Error('Please enter your registered Shop Name or Owner Name.') };
        }

        if (!newPassword || newPassword.length < 6) {
          return { success: false, error: new Error('New password must be at least 6 characters.') };
        }

        const { data, error } = await supabase.rpc('reset_password_with_shop_verification', {
          p_mobile: cleanMobile,
          p_shop_verification: trimmedName,
          p_new_password: newPassword,
        });

        if (error) {
          console.error('[AuthContext.resetPasswordWithShopVerification] RPC error:', error);
          let msg = error.message;
          if (msg.includes('function') || msg.includes('not found')) {
            msg = 'Password reset function is being updated. Please try again or contact support.';
          }
          return { success: false, error: new Error(msg) };
        }

        if (data && data.success === false) {
          return { success: false, error: new Error(data.error || 'Verification failed. Please check your shop details.') };
        }

        return { success: true, error: null };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Password reset failed. Please try again.';
        return { success: false, error: new Error(message) };
      }
    },
    []
  );

  const sendPasswordResetEmail = useCallback(
    async (mobileOrEmail: string) => {
      try {
        const trimmed = mobileOrEmail.trim();
        if (!trimmed) {
          return { success: false, error: new Error('Please enter your mobile number or registered email.') };
        }

        let targetEmail: string;

        if (trimmed.includes('@')) {
          targetEmail = trimmed.toLowerCase();
        } else {
          const digits = trimmed.replace(/\D/g, '');
          const cleanMobile = digits.length > 10 ? digits.slice(-10) : digits;
          if (!cleanMobile || cleanMobile.length < 10) {
            return { success: false, error: new Error('Please enter a valid 10-digit mobile number.') };
          }

          try {
            const { data: resolvedEmail } = await supabase.rpc('get_auth_email_for_mobile', {
              p_mobile: cleanMobile,
            });
            if (resolvedEmail && typeof resolvedEmail === 'string') {
              targetEmail = resolvedEmail;
            } else {
              targetEmail = `${cleanMobile}@dailyexpenses.app`;
            }
          } catch {
            targetEmail = `${cleanMobile}@dailyexpenses.app`;
          }
        }

        if (targetEmail.endsWith('@dailyexpenses.app') || targetEmail.endsWith('@dailydoubt.app')) {
          return {
            success: false,
            error: new Error(
              'No external email is associated with this account. Please use the Shop Verification option to reset your password.'
            ),
          };
        }

        const { error } = await supabase.auth.resetPasswordForEmail(targetEmail);
        if (error) {
          console.error('[AuthContext.sendPasswordResetEmail] Supabase error:', error);
          return { success: false, error: new Error(error.message) };
        }

        return { success: true, emailSentTo: targetEmail, error: null };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to send reset email.';
        return { success: false, error: new Error(message) };
      }
    },
    []
  );

  const verifyOtpAndResetPassword = useCallback(
    async ({ email, token, newPassword }: ResetWithOtpParams) => {
      try {
        const cleanEmail = email.trim().toLowerCase();
        const cleanToken = token.trim();

        if (!cleanEmail || !cleanToken) {
          return { success: false, error: new Error('Please enter the verification code and your email.') };
        }

        if (!newPassword || newPassword.length < 6) {
          return { success: false, error: new Error('New password must be at least 6 characters.') };
        }

        const { data, error: otpError } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanToken,
          type: 'recovery',
        });

        if (otpError || !data.session) {
          return {
            success: false,
            error: new Error(otpError?.message || 'Invalid or expired verification code.'),
          };
        }

        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (updateError) {
          return { success: false, error: new Error(updateError.message) };
        }

        await supabase.auth.signOut();

        return { success: true, error: null };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to reset password.';
        return { success: false, error: new Error(message) };
      }
    },
    []
  );

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
        resetPasswordWithShopVerification,
        sendPasswordResetEmail,
        verifyOtpAndResetPassword,
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
