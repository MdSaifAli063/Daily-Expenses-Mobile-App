import React from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/colors';

export interface BrandLogoHeaderProps {
  variant?: 'landing' | 'compact';
  tagline?: string;
}

/**
 * Unified, premium Dailydoubt brand header used across
 * the Landing (Welcome), Login, and Register screens.
 */
export const BrandLogoHeader: React.FC<BrandLogoHeaderProps> = ({
  variant = 'compact',
  tagline,
}) => {
  if (variant === 'landing') {
    return (
      <View style={styles.landingContainer}>
        {/* Brand Icon + Name Badge */}
        <View style={styles.landingLogoRow}>
          <View style={styles.landingIconBox}>
            <Image
              source={require('../assets/icon.png')}
              style={styles.landingIcon}
              resizeMode="contain"
            />
          </View>
          <View style={styles.landingTitleCol}>
            <Text style={styles.landingBrandName}>Dailydoubt</Text>
            <View style={styles.landingPill}>
              <Text style={styles.landingPillText}>
                {tagline || 'SMART SHOP LEDGER'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Compact variant for Login and Register pages
  return (
    <View style={styles.compactContainer}>
      <View style={styles.compactRow}>
        <View style={styles.compactIconBox}>
          <Image
            source={require('../assets/icon.png')}
            style={styles.compactIcon}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.compactBrandName}>Dailydoubt</Text>
      </View>
      {tagline ? <Text style={styles.compactTagline}>{tagline}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  // Landing Variant Styles
  landingContainer: {
    alignItems: 'center',
    marginBottom: 14,
  },
  landingLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2ECE6',
    shadowColor: '#0E5B42',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  landingIconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F3F8F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  landingIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
  },
  landingTitleCol: {
    justifyContent: 'center',
  },
  landingBrandName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0E5B42',
    letterSpacing: -0.3,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'serif',
    }),
  },
  landingPill: {
    backgroundColor: '#EAF4EF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  landingPillText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#0E5B42',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  // Compact Variant Styles (for Login & Register upside)
  compactContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E3ECE6',
    shadowColor: '#0E5B42',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  compactIconBox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: '#F3F8F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  compactIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  compactBrandName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0E5B42',
    letterSpacing: -0.2,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'serif',
    }),
  },
  compactTagline: {
    fontSize: 11,
    color: Colors.secondaryText,
    marginTop: 3,
    fontWeight: '500',
  },
});
