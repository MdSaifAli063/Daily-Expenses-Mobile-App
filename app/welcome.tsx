import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { LedgerBackground } from '../components/LedgerBackground';
import { BrandLogoHeader } from '../components/BrandLogoHeader';
import { WelcomeLogo } from '../components/WelcomeLogo';
import { WelcomeFinanceIllustration } from '../components/WelcomeFinanceIllustration';
import { PrimaryButton } from '../components/PrimaryButton';

export default function WelcomeScreen() {
  const router = useRouter();

  // Entrance animations: subtle fade and gentle slide upward
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleGetStarted = () => {
    // Navigate directly to the Login screen
    router.push('/');
  };

  const handleOpenSoftTricksCode = async () => {
    try {
      const url = 'https://www.softtrickscode.com';
      await Linking.openURL(url);
    } catch (err) {
      console.warn('[WelcomeScreen] Could not open link:', err);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Background ruled ledger lines */}
      <LedgerBackground />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Top Branding Section */}
        <Animated.View
          style={[
            styles.topSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Enhanced Dailydoubt Brand Lockup */}
          <BrandLogoHeader variant="landing" tagline="SMART SHOP LEDGER" />

          <Text style={styles.mainHeading}>
            Your shop.{'\n'}Your numbers.{'\n'}In one place.
          </Text>

          <Text style={styles.subtitle}>
            Track collections, expenses and profits effortlessly.
          </Text>
        </Animated.View>

        {/* Center Visual Section: Illustration Card */}
        <Animated.View
          style={[
            styles.visualSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Decorative Shop Finance Illustration */}
          <View style={styles.illustrationContainer}>
            <WelcomeFinanceIllustration />
          </View>
        </Animated.View>

        {/* Bottom Call-to-Action Section */}
        <Animated.View
          style={[
            styles.bottomSection,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <PrimaryButton
            title="Get started"
            onPress={handleGetStarted}
            style={styles.getStartedButton}
            accessibilityLabel="Get started with Dailydoubt"
          />

          <Text style={styles.footerText}>
            Simple. Private. Built for your shop.
          </Text>

          {/* Powered by Soft Tricks Code */}
          <Pressable
            onPress={handleOpenSoftTricksCode}
            hitSlop={8}
            style={styles.poweredByContainer}
            accessibilityRole="link"
            accessibilityLabel="Powered by Soft Tricks Code"
          >
            <Text style={styles.poweredByText}>
              Powered by <Text style={styles.poweredByBrand}>Soft Tricks Code</Text>
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  brandLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accentGreen,
    letterSpacing: 3.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  mainHeading: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primaryText,
    textAlign: 'center',
    lineHeight: 36,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'serif',
    }),
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.secondaryText,
    textAlign: 'center',
    lineHeight: 21,
    fontWeight: '500',
    paddingHorizontal: 12,
  },
  visualSection: {
    alignItems: 'center',
    width: '100%',
    marginVertical: 10,
  },
  logoContainer: {
    marginBottom: 18,
  },
  illustrationContainer: {
    width: '100%',
    maxWidth: 340,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  getStartedButton: {
    width: '100%',
    height: 52,
    borderRadius: 13,
    backgroundColor: Colors.accentGreen,
    shadowColor: '#15211B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 4,
  },
  footerText: {
    marginTop: 12,
    fontSize: 12,
    color: Colors.secondaryText,
    fontWeight: '500',
    textAlign: 'center',
  },
  poweredByContainer: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  poweredByText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
  },
  poweredByBrand: {
    color: '#0E5B42',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
