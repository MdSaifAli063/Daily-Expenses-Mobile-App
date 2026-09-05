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
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { LedgerBackground } from '../components/LedgerBackground';
import { Input } from '../components/Input';
import { PasswordInput } from '../components/PasswordInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';

type RecoveryMethod = 'shop' | 'email';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const {
    resetPasswordWithShopVerification,
    sendPasswordResetEmail,
    verifyOtpAndResetPassword,
  } = useAuth();
  const { height } = useWindowDimensions();

  // Recovery method mode: 'shop' (Shop verification) or 'email' (Email OTP)
  const [method, setMethod] = useState<RecoveryMethod>('shop');

  // Shop Verification State
  const [mobile, setMobile] = useState('');
  const [shopOrOwnerName, setShopOrOwnerName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Email OTP State
  const [emailOrMobile, setEmailOrMobile] = useState('');
  const [resolvedEmail, setResolvedEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [emailStep, setEmailStep] = useState<'request' | 'verify'>('request');

  // Status & Feedback States
  const [statusError, setStatusError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Responsive top space
  const topSpace = Math.max(height * 0.06, 24);

  const handleBackToLogin = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  // 1. Submit Shop Verification Reset
  const handleShopVerificationReset = async () => {
    setStatusError(null);
    setSuccessMessage(null);

    const cleanMobile = mobile.replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length < 10) {
      setStatusError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!shopOrOwnerName.trim()) {
      setStatusError('Please enter your registered Shop Name or Owner Name.');
      return;
    }

    if (!newPassword) {
      setStatusError('Please enter your new password.');
      return;
    }

    if (newPassword.length < 6) {
      setStatusError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { success, error } = await resetPasswordWithShopVerification({
        mobile: cleanMobile,
        shopOrOwnerName: shopOrOwnerName.trim(),
        newPassword,
      });

      if (!success || error) {
        setStatusError(
          error?.message || 'Verification failed. Please check your mobile and shop details.'
        );
      } else {
        setSuccessMessage('Password reset successfully! Redirecting to sign in...');
        setTimeout(() => {
          router.replace('/');
        }, 1500);
      }
    } catch {
      setStatusError('Unable to reset password. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Request Email OTP
  const handleRequestEmailOtp = async () => {
    setStatusError(null);
    setSuccessMessage(null);

    const input = emailOrMobile.trim();
    if (!input) {
      setStatusError('Please enter your registered email address or mobile number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { success, emailSentTo, error } = await sendPasswordResetEmail(input);

      if (!success || error) {
        setStatusError(error?.message || 'Could not find a registered email for this account.');
      } else {
        setResolvedEmail(emailSentTo || input);
        setEmailStep('verify');
        setSuccessMessage(
          `Verification code sent to ${emailSentTo || input}. Please check your inbox.`
        );
      }
    } catch {
      setStatusError('Failed to send reset code. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Verify OTP & Set New Password
  const handleVerifyOtpAndReset = async () => {
    setStatusError(null);
    setSuccessMessage(null);

    if (!otpCode.trim()) {
      setStatusError('Please enter the 6-digit verification code.');
      return;
    }

    if (!newPassword) {
      setStatusError('Please enter your new password.');
      return;
    }

    if (newPassword.length < 6) {
      setStatusError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { success, error } = await verifyOtpAndResetPassword({
        email: resolvedEmail,
        token: otpCode.trim(),
        newPassword,
      });

      if (!success || error) {
        setStatusError(error?.message || 'Invalid or expired code. Please try again.');
      } else {
        setSuccessMessage('Password reset successfully! Redirecting to sign in...');
        setTimeout(() => {
          router.replace('/');
        }, 1500);
      }
    } catch {
      setStatusError('Failed to reset password. Please try again.');
    } finally {
      setIsSubmitting(false);
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
          {/* Top Header Navigation */}
          <View style={styles.topNavRow}>
            <Pressable
              onPress={handleBackToLogin}
              hitSlop={12}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Back to sign in"
            >
              <Ionicons name="arrow-back" size={22} color={Colors.primaryText} />
            </Pressable>
          </View>

          {/* Spacing */}
          <View style={{ height: topSpace }} />

          {/* Main Content Area */}
          <View style={styles.contentContainer}>
            <Text style={styles.categoryText}>SECURITY</Text>
            <Text style={styles.heading}>Reset password</Text>
            <Text style={styles.subtitle}>
              Recover access to your shop's ledger
            </Text>

            {/* Error Banner */}
            {statusError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{statusError}</Text>
              </View>
            )}

            {/* Success Banner */}
            {successMessage && (
              <View style={styles.successBanner}>
                <Text style={styles.successBannerText}>{successMessage}</Text>
              </View>
            )}

            {/* Method Tabs: Shop Verification (Default) vs Email Code */}
            <View style={styles.tabSelector}>
              <Pressable
                style={[
                  styles.tabButton,
                  method === 'shop' && styles.tabButtonActive,
                ]}
                onPress={() => {
                  setMethod('shop');
                  setStatusError(null);
                  setSuccessMessage(null);
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected: method === 'shop' }}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    method === 'shop' && styles.tabButtonTextActive,
                  ]}
                >
                  Shop Verification
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.tabButton,
                  method === 'email' && styles.tabButtonActive,
                ]}
                onPress={() => {
                  setMethod('email');
                  setStatusError(null);
                  setSuccessMessage(null);
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected: method === 'email' }}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    method === 'email' && styles.tabButtonTextActive,
                  ]}
                >
                  Email Code
                </Text>
              </Pressable>
            </View>

            {/* Form Area */}
            <View style={styles.formContainer}>
              {method === 'shop' ? (
                /* Method 1: Shop Verification Form */
                <>
                  <Input
                    label="Mobile number"
                    required
                    value={mobile}
                    onChangeText={(val) => {
                      setMobile(val);
                      if (statusError) setStatusError(null);
                    }}
                    placeholder="10-digit mobile number"
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                    returnKeyType="next"
                  />

                  <View style={styles.fieldSpacer}>
                    <Input
                      label="Shop name or Owner name"
                      required
                      value={shopOrOwnerName}
                      onChangeText={(val) => {
                        setShopOrOwnerName(val);
                        if (statusError) setStatusError(null);
                      }}
                      placeholder="e.g. Gupta General Store"
                      helperText="Enter the name you registered with"
                      autoCapitalize="words"
                      returnKeyType="next"
                    />
                  </View>

                  <View style={styles.fieldSpacer}>
                    <PasswordInput
                      label="New password"
                      required
                      value={newPassword}
                      onChangeText={(val) => {
                        setNewPassword(val);
                        if (statusError) setStatusError(null);
                      }}
                      autoComplete="new-password"
                      textContentType="newPassword"
                      returnKeyType="next"
                    />
                  </View>

                  <View style={styles.fieldSpacer}>
                    <PasswordInput
                      label="Confirm new password"
                      required
                      value={confirmPassword}
                      onChangeText={(val) => {
                        setConfirmPassword(val);
                        if (statusError) setStatusError(null);
                      }}
                      autoComplete="new-password"
                      textContentType="newPassword"
                      returnKeyType="done"
                      onSubmitEditing={handleShopVerificationReset}
                    />
                  </View>

                  <View style={styles.buttonSpacer}>
                    <PrimaryButton
                      title="Reset password"
                      loading={isSubmitting}
                      onPress={handleShopVerificationReset}
                    />
                  </View>
                </>
              ) : (
                /* Method 2: Email OTP Form */
                <>
                  {emailStep === 'request' ? (
                    <>
                      <Input
                        label="Registered email or mobile"
                        required
                        value={emailOrMobile}
                        onChangeText={(val) => {
                          setEmailOrMobile(val);
                          if (statusError) setStatusError(null);
                        }}
                        placeholder="Email address or 10-digit mobile"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        returnKeyType="done"
                        onSubmitEditing={handleRequestEmailOtp}
                      />

                      <View style={styles.buttonSpacer}>
                        <PrimaryButton
                          title="Send verification code"
                          loading={isSubmitting}
                          onPress={handleRequestEmailOtp}
                        />
                      </View>
                    </>
                  ) : (
                    <>
                      <Input
                        label="6-digit verification code"
                        required
                        value={otpCode}
                        onChangeText={(val) => {
                          setOtpCode(val);
                          if (statusError) setStatusError(null);
                        }}
                        placeholder="Enter code from your email"
                        keyboardType="number-pad"
                        returnKeyType="next"
                      />

                      <View style={styles.fieldSpacer}>
                        <PasswordInput
                          label="New password"
                          required
                          value={newPassword}
                          onChangeText={(val) => {
                            setNewPassword(val);
                            if (statusError) setStatusError(null);
                          }}
                          autoComplete="new-password"
                          textContentType="newPassword"
                          returnKeyType="next"
                        />
                      </View>

                      <View style={styles.fieldSpacer}>
                        <PasswordInput
                          label="Confirm new password"
                          required
                          value={confirmPassword}
                          onChangeText={(val) => {
                            setConfirmPassword(val);
                            if (statusError) setStatusError(null);
                          }}
                          autoComplete="new-password"
                          textContentType="newPassword"
                          returnKeyType="done"
                          onSubmitEditing={handleVerifyOtpAndReset}
                        />
                      </View>

                      <View style={styles.buttonSpacer}>
                        <PrimaryButton
                          title="Update password"
                          loading={isSubmitting}
                          onPress={handleVerifyOtpAndReset}
                        />
                      </View>

                      <Pressable
                        style={styles.resendButton}
                        onPress={() => setEmailStep('request')}
                      >
                        <Text style={styles.resendButtonText}>
                          Use a different email or mobile
                        </Text>
                      </Pressable>
                    </>
                  )}
                </>
              )}
            </View>

            {/* Back to Login Link */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerPrompt}>Remember your password? </Text>
              <Pressable
                onPress={handleBackToLogin}
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
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E9E0',
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
    fontSize: 30,
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
    marginBottom: 24,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: '#EAEFE7',
    borderRadius: 12,
    padding: 3,
    marginBottom: 20,
    width: '100%',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#15211B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.secondaryText,
  },
  tabButtonTextActive: {
    color: Colors.accentGreen,
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
    width: '100%',
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
    width: '100%',
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
    marginTop: 22,
  },
  resendButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  resendButtonText: {
    fontSize: 13,
    color: Colors.accentGreen,
    fontWeight: '600',
    textDecorationLine: 'underline',
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
