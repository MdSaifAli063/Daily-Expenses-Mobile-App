import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { LedgerBackground } from '../components/LedgerBackground';
import { Input } from '../components/Input';
import { PasswordInput } from '../components/PasswordInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { height } = useWindowDimensions();

  // Responsive top space calculation ensuring intentional empty top ledger area
  const topSpace = Math.max(height * 0.14, 50);

  const handleSignIn = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setAuthError('Please enter your email address.');
      return;
    }
    if (!password) {
      setAuthError('Please enter your password.');
      return;
    }

    setAuthError(null);
    setIsSubmitting(true);

    try {
      const { error } = await signIn({ email: trimmedEmail, password });
      if (error) {
        setAuthError(error.message);
      } else {
        router.replace('/home');
      }
    } catch {
      setAuthError('Something went wrong. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = () => {
    router.push('/register');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Background ruled ledger lines */}
      <LedgerBackground />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Intentional large empty area at top */}
          <View style={{ height: topSpace }} />

          {/* Main Login Content Area */}
          <View style={styles.contentContainer}>
            {/* Brand / Category Text */}
            <Text style={styles.categoryText}>EXPENSES</Text>

            {/* Main Heading */}
            <Text style={styles.heading}>Welcome back</Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>Sign in to your shop's ledger</Text>

            {/* Form Fields */}
            <View style={styles.formContainer}>
              {/* Global Auth Error Notice */}
              {authError && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{authError}</Text>
                </View>
              )}

              {/* Email Address Field (Updated from Mobile number for Supabase Auth) */}
              <Input
                label="Email address"
                required
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  if (authError) setAuthError(null);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
              />

              {/* Password Field with Interactive Eye Toggle */}
              <View style={styles.fieldSpacer}>
                <PasswordInput
                  label="Password"
                  required
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (authError) setAuthError(null);
                  }}
                  autoComplete="password"
                  textContentType="password"
                  returnKeyType="done"
                  onSubmitEditing={handleSignIn}
                />
              </View>

              {/* Sign In Button with Supabase Loading State */}
              <View style={styles.buttonSpacer}>
                <PrimaryButton
                  title="Sign in"
                  loading={isSubmitting}
                  onPress={handleSignIn}
                />
              </View>
            </View>

            {/* Register Section */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerPrompt}>New shop? </Text>
              <Pressable
                onPress={handleRegister}
                hitSlop={8}
                accessibilityRole="link"
                accessibilityLabel="Register here"
              >
                <Text style={styles.registerLink}>Register here</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingBottom: 32,
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 3.5,
    color: Colors.brandTeal,
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  heading: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primaryText,
    textAlign: 'center',
    marginBottom: 6,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'serif',
    }),
  },
  subtitle: {
    fontSize: 14,
    color: Colors.secondaryText,
    textAlign: 'center',
    marginBottom: 34,
  },
  formContainer: {
    width: '100%',
  },
  errorBanner: {
    backgroundColor: 'rgba(184, 50, 50, 0.08)',
    borderWidth: 1,
    borderColor: Colors.inputBorderError,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorBannerText: {
    fontSize: 13,
    color: Colors.errorText,
    textAlign: 'center',
    fontWeight: '500',
  },
  fieldSpacer: {
    marginTop: 18,
  },
  buttonSpacer: {
    marginTop: 22,
  },
  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  registerPrompt: {
    fontSize: 13.5,
    color: Colors.secondaryText,
  },
  registerLink: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.accentGreen,
    textDecorationLine: 'underline',
  },
});
