import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { LedgerBackground } from '../components/LedgerBackground';
import { BottomNavigation } from '../components/BottomNavigation';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/profileService';
import { Shop } from '../types/shop';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  // Load shop profile from Supabase using authenticated user's ID
  const loadProfileData = useCallback(async () => {
    if (!user?.id) return;
    setError(null);

    try {
      const { data, error: fetchError } = await profileService.getProfile(user.id);
      if (fetchError || !data) {
        setError('Unable to load your profile. Please try again.');
      } else {
        setShop(data);
      }
    } catch (err: unknown) {
      console.error('[ProfileScreen] Error loading profile:', err);
      setError('Unable to load your profile. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  // Re-fetch profile data whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [loadProfileData])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadProfileData();
  };

  const handleEditProfile = () => {
    router.push('/edit-profile');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            if (loggingOut) return;
            setLoggingOut(true);
            try {
              const { error: signOutError } = await signOut();
              if (signOutError) {
                Alert.alert('Logout Failed', signOutError.message);
              } else {
                router.replace('/');
              }
            } catch (err: unknown) {
              console.error('[ProfileScreen] Logout error:', err);
              Alert.alert('Logout Failed', 'An unexpected error occurred during logout.');
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleTabPress = (tab: string) => {
    if (tab === 'home') {
      router.push('/home');
      return;
    }
    if (tab === 'entries') {
      router.push('/entries');
      return;
    }
    if (tab === 'reports') {
      router.push('/reports');
      return;
    }
    if (tab === 'profile') {
      // Already on profile
      return;
    }
  };

  const handleFloatingAdd = () => {
    router.push('/add-entry');
  };

  // Resolved display values
  const displayedOwner = shop?.owner_name || 'Shop Owner';
  const displayedShopName = shop?.shop_name || 'Shop Name';
  const displayedMobile = shop?.mobile || user?.user_metadata?.mobile || 'Not available';
  const displayedEmail = shop?.email || user?.email || 'Not added';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Background ruled ledger lines */}
      <LedgerBackground />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.terracotta]}
            tintColor={Colors.terracotta}
          />
        }
      >
        {/* Screen Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <Text style={styles.headerSubtitle}>Manage your shop and account</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.terracotta} />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={44} color={Colors.expenseRed} />
            <Text style={styles.errorTitle}>Unable to load your profile.</Text>
            <Text style={styles.errorSubtitle}>Please check your connection and try again.</Text>
            <Pressable style={styles.retryButton} onPress={loadProfileData}>
              <Text style={styles.retryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* User Avatar & Header Card */}
            <View style={styles.avatarCard}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={38} color={Colors.terracotta} />
              </View>
              <Text style={styles.avatarOwnerName}>{displayedOwner}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>Shop owner</Text>
              </View>
            </View>

            {/* Shop Information Card */}
            <View style={styles.infoCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Shop information</Text>
              </View>
              <View style={styles.cardDivider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Shop name</Text>
                <Text style={styles.infoValue}>{displayedShopName}</Text>
              </View>

              <View style={styles.rowDivider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Owner name</Text>
                <Text style={styles.infoValue}>{displayedOwner}</Text>
              </View>

              <View style={styles.rowDivider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mobile number</Text>
                <Text style={styles.infoValue}>{displayedMobile}</Text>
              </View>

              <View style={styles.rowDivider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={[styles.infoValue, displayedEmail === 'Not added' && styles.mutedValue]}>
                  {displayedEmail}
                </Text>
              </View>
            </View>

            {/* Account Information Card */}
            <View style={styles.infoCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Account</Text>
              </View>
              <View style={styles.cardDivider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Account status</Text>
                <View style={styles.statusPill}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Active</Text>
                </View>
              </View>

              <View style={styles.rowDivider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mobile number</Text>
                <Text style={styles.infoValue}>{displayedMobile}</Text>
              </View>

              <View style={styles.rowDivider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={[styles.infoValue, displayedEmail === 'Not added' && styles.mutedValue]}>
                  {displayedEmail}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              {/* Edit Profile Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.editButton,
                  pressed && styles.editButtonPressed,
                ]}
                onPress={handleEditProfile}
                accessibilityRole="button"
                accessibilityLabel="Edit profile"
              >
                <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                <Text style={styles.editButtonText}>Edit profile</Text>
              </Pressable>

              {/* Logout Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.logoutButton,
                  pressed && styles.logoutButtonPressed,
                  loggingOut && styles.buttonDisabled,
                ]}
                onPress={handleLogout}
                disabled={loggingOut}
                accessibilityRole="button"
                accessibilityLabel="Logout"
              >
                {loggingOut ? (
                  <ActivityIndicator size="small" color={Colors.expenseRed} />
                ) : (
                  <>
                    <Ionicons name="log-out-outline" size={18} color={Colors.expenseRed} />
                    <Text style={styles.logoutButtonText}>Logout</Text>
                  </>
                )}
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>

      {/* Fixed Bottom Navigation with Profile Tab Active */}
      <BottomNavigation
        activeTab="profile"
        onTabPress={handleTabPress}
        onAddPress={handleFloatingAdd}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
  },
  header: {
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  headerTitle: {
    fontSize: 22,
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
    fontWeight: '500',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.secondaryText,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2D5BE',
    marginVertical: 20,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primaryText,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'serif',
    }),
    marginTop: 8,
    marginBottom: 4,
  },
  errorSubtitle: {
    fontSize: 13,
    color: Colors.secondaryText,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: Colors.accentGreen,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  avatarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2D5BE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F4EAE1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2D5BE',
  },
  avatarOwnerName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primaryText,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'serif',
    }),
    marginBottom: 4,
  },
  roleBadge: {
    backgroundColor: '#EFE8D8',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.ledgerBrown,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2D5BE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.primaryText,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'serif',
    }),
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F0E7D5',
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#FAF5EB',
    marginVertical: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.secondaryText,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryText,
  },
  mutedValue: {
    color: Colors.warmGray,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F7F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D2E7D2',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.profitGreen,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.profitGreen,
  },
  actionsContainer: {
    marginTop: 8,
    gap: 12,
  },
  editButton: {
    backgroundColor: Colors.terracotta,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  editButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#FECDCA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  logoutButtonPressed: {
    backgroundColor: '#FEF3F2',
    opacity: 0.85,
  },
  logoutButtonText: {
    color: Colors.expenseRed,
    fontSize: 14,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
