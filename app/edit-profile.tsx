import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { LedgerBackground } from '../components/LedgerBackground';
import { Input } from '../components/Input';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/profileService';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{
    shopName?: string;
    ownerName?: string;
    mobile?: string;
    email?: string;
  }>({});

  // Fetch current shop details to prefill the form
  useEffect(() => {
    let isMounted = true;
    if (!user?.id) {
      setLoading(false);
      return;
    }

    profileService
      .getProfile(user.id)
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error || !data) {
          Alert.alert('Error', 'Could not load existing shop details.');
        } else {
          setShopName(data.shop_name || '');
          setOwnerName(data.owner_name || '');
          setMobile(data.mobile || user.user_metadata?.mobile || '');
          setEmail(data.email || '');
        }
      })
      .catch((err) => {
        console.error('[EditProfileScreen] Error loading profile:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    // 1. Shop name validation
    if (!shopName.trim()) {
      newErrors.shopName = 'Shop name is required.';
    }

    // 2. Owner name validation
    if (!ownerName.trim()) {
      newErrors.ownerName = 'Owner name is required.';
    }

    // 3. Mobile number validation (strictly 10 digits)
    const digitsOnly = mobile.replace(/\D/g, '');
    const cleanMobile = digitsOnly.length > 10 ? digitsOnly.slice(-10) : digitsOnly;
    if (!cleanMobile || cleanMobile.length !== 10) {
      newErrors.mobile = 'Enter a valid 10-digit mobile number.';
    }

    // 4. Email validation (optional)
    const trimmedEmail = email.trim();
    if (trimmedEmail.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        newErrors.email = 'Enter a valid email address.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!user?.id || saving) return;

    if (!validate()) return;

    setSaving(true);
    try {
      const digitsOnly = mobile.replace(/\D/g, '');
      const cleanMobile = digitsOnly.length > 10 ? digitsOnly.slice(-10) : digitsOnly;
      const trimmedEmail = email.trim();

      const { data, error } = await profileService.updateProfile(user.id, {
        shop_name: shopName.trim(),
        owner_name: ownerName.trim(),
        mobile: cleanMobile,
        email: trimmedEmail.length > 0 ? trimmedEmail.toLowerCase() : null,
      });

      if (error || !data) {
        Alert.alert('Update Failed', error?.message || 'Failed to update profile. Please try again.');
        return;
      }

      // Navigate back to profile
      router.back();
    } catch (err: unknown) {
      console.error('[EditProfileScreen] Save error:', err);
      Alert.alert('Error', 'An unexpected error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <LedgerBackground />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Navigation Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={22} color={Colors.primaryText} />
          </Pressable>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <Text style={styles.headerSubtitle}>Update your shop and account details</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.terracotta} />
            <Text style={styles.loadingText}>Loading details...</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formCard}>
              {/* Shop Name Field */}
              <Input
                label="Shop Name"
                required
                value={shopName}
                onChangeText={(text) => {
                  setShopName(text);
                  if (errors.shopName) setErrors((prev) => ({ ...prev, shopName: undefined }));
                }}
                placeholder="e.g. Gupta General Store"
                error={errors.shopName}
                autoCapitalize="words"
              />

              {/* Owner Name Field */}
              <Input
                label="Owner Name"
                required
                value={ownerName}
                onChangeText={(text) => {
                  setOwnerName(text);
                  if (errors.ownerName) setErrors((prev) => ({ ...prev, ownerName: undefined }));
                }}
                placeholder="e.g. Ramesh Gupta"
                error={errors.ownerName}
                autoCapitalize="words"
              />

              {/* Mobile Number Field */}
              <Input
                label="Mobile Number"
                required
                value={mobile}
                onChangeText={(text) => {
                  const cleaned = text.replace(/\D/g, '').slice(0, 10);
                  setMobile(cleaned);
                  if (errors.mobile) setErrors((prev) => ({ ...prev, mobile: undefined }));
                }}
                placeholder="10-digit mobile number"
                keyboardType="numeric"
                maxLength={10}
                error={errors.mobile}
                helperText="Must be a valid 10-digit mobile number."
              />

              {/* Email Field (Optional) */}
              <Input
                label="Email (Optional)"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder="e.g. owner@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
                helperText="Optional - used for notifications and receipts."
              />
            </View>

            {/* Save Button */}
            <View style={styles.saveContainer}>
              <PrimaryButton
                title={saving ? 'Saving...' : 'Save Changes'}
                loading={saving}
                disabled={saving}
                onPress={handleSave}
                style={styles.saveButton}
              />
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2D5BE',
    backgroundColor: Colors.parchment,
  },
  backButton: {
    padding: 6,
    marginRight: 10,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primaryText,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'serif',
    }),
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.secondaryText,
    marginTop: 1,
    fontWeight: '500',
  },
  loadingContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.secondaryText,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2D5BE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 20,
  },
  saveContainer: {
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: Colors.terracotta,
    height: 50,
    borderRadius: 12,
  },
});
