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

interface FormErrors {
  shopName?: string;
  ownerName?: string;
  mobile?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { height } = useWindowDimensions();

  // Form field state
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status & validation states
  const [errors, setErrors] = useState<FormErrors>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Responsive top space calculation
  const topSpace = Math.max(height * 0.07, 28);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // 1. Shop name (required, trimmed)
    if (!shopName.trim()) {
      newErrors.shopName = 'Shop name is required';
    }

    // 2. Owner name (required, trimmed)
    if (!ownerName.trim()) {
      newErrors.ownerName = 'Owner name is required';
    }

    // 3. Mobile number (REQUIRED for shopkeeper account)
    const cleanMobile = mobile.replace(/\D/g, '');
    if (!cleanMobile) {
      newErrors.mobile = 'Mobile number is required';
    } else if (cleanMobile.length < 10) {
      newErrors.mobile = 'Please enter a valid 10-digit mobile number';
    }

    // 4. Email (optional)
    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    // 5. Password (required, minimum 6 characters)
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // 6. Confirm password (required & must match exactly)
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required';
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateAccount = async () => {
    setAuthError(null);
    setConfirmationMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const { session, needsEmailConfirmation, error } = await signUp({
        mobile: mobile.trim(),
        password,
        shopName: shopName.trim(),
        ownerName: ownerName.trim(),
        email: email.trim() || undefined,
      });

      if (error) {
        setAuthError(error.message);
        setIsSubmitting(false);
        return;
      }

      // If email confirmation is required by Supabase project settings
      if (needsEmailConfirmation) {
        setConfirmationMessage(
          'Account registered! Please sign in with your mobile number and password.'
        );
        setIsSubmitting(false);
        return;
      }

      // Immediate active session
      if (session) {
        router.replace('/home');
      }
    } catch {
      setAuthError('Registration failed. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNavigateToLogin = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  // Helper to clear errors on change
  const handleFieldChange = (field: keyof FormErrors, setter: (val: string) => void) => (val: string) => {
    setter(val);
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (authError) {
      setAuthError(null);
    }
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
          {/* Intentional ledger top spacing */}
          <View style={{ height: topSpace }} />

          {/* Main Content Area */}
          <View style={styles.contentContainer}>
            {/* Brand / Category Text */}
            <Text style={styles.categoryText}>EXPENSES</Text>

            {/* Main Heading */}
            <Text style={styles.heading}>Open your ledger</Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>Set up your shop in under a minute</Text>

            {/* Form Fields */}
            <View style={styles.formContainer}>
              {/* Error Notice */}
              {authError && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{authError}</Text>
                </View>
              )}

              {/* Confirmation Notice */}
              {confirmationMessage && (
                <View style={styles.successBanner}>
                  <Text style={styles.successBannerText}>{confirmationMessage}</Text>
                </View>
              )}

              {/* 1. Shop Name Field */}
              <Input
                label="Shop name"
                required
                value={shopName}
                onChangeText={handleFieldChange('shopName', setShopName)}
                error={errors.shopName}
                autoCapitalize="words"
                returnKeyType="next"
              />

              {/* 2. Owner Name Field */}
              <View style={styles.fieldSpacer}>
                <Input
                  label="Owner name"
                  required
                  value={ownerName}
                  onChangeText={handleFieldChange('ownerName', setOwnerName)}
                  error={errors.ownerName}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>

              {/* 3. Mobile Number Field (Required for Login) */}
              <View style={styles.fieldSpacer}>
                <Input
                  label="Mobile number"
                  required
                  value={mobile}
                  onChangeText={handleFieldChange('mobile', setMobile)}
                  helperText="Used to log in to your account"
                  error={errors.mobile}
                  placeholder="10-digit mobile number"
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                  returnKeyType="next"
                />
              </View>

              {/* 4. Email Field (Optional) */}
              <View style={styles.fieldSpacer}>
                <Input
                  label="Email"
                  value={email}
                  onChangeText={handleFieldChange('email', setEmail)}
                  helperText="Optional for reports & recovery"
                  error={errors.email}
                  placeholder="Optional email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                />
              </View>

              {/* 5. Password Field */}
              <View style={styles.fieldSpacer}>
                <PasswordInput
                  label="Password"
                  required
                  value={password}
                  onChangeText={handleFieldChange('password', setPassword)}
                  error={errors.password}
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="next"
                />
              </View>

              {/* 6. Confirm Password Field */}
              <View style={styles.fieldSpacer}>
                <PasswordInput
                  label="Confirm password"
                  required
                  value={confirmPassword}
                  onChangeText={handleFieldChange('confirmPassword', setConfirmPassword)}
                  error={errors.confirmPassword}
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="done"
                  onSubmitEditing={handleCreateAccount}
                />
              </View>

              {/* Create Account Primary Button */}
              <View style={styles.buttonSpacer}>
                <PrimaryButton
                  title="Create account"
                  loading={isSubmitting}
                  onPress={handleCreateAccount}
                />
              </View>
            </View>

            {/* Footer: Already registered? Sign in */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerPrompt}>Already registered? </Text>
              <Pressable
                onPress={handleNavigateToLogin}
                hitSlop={8}
                accessibilityRole="link"
                accessibilityLabel="Sign in"
              >
                <Text style={styles.footerLink}>Sign in</Text>
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
    paddingBottom: 36,
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
    marginBottom: 28,
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
  successBanner: {
    backgroundColor: 'rgba(35, 71, 57, 0.08)',
    borderWidth: 1,
    borderColor: Colors.accentGreen,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  successBannerText: {
    fontSize: 13,
    color: Colors.accentGreen,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 18,
  },
  fieldSpacer: {
    marginTop: 18,
  },
  buttonSpacer: {
    marginTop: 26,
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerPrompt: {
    fontSize: 13.5,
    color: Colors.secondaryText,
  },
  footerLink: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.accentGreen,
    textDecorationLine: 'underline',
  },
});
