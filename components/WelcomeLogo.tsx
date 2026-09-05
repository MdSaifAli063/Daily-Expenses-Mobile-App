import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface WelcomeLogoProps {
  size?: number;
}

/**
 * Professional custom brand logo mark for Daily Expenses.
 * Uses native React Native Views and vector icons for instant,
 * high-resolution rendering without external image dependencies.
 */
export const WelcomeLogo: React.FC<WelcomeLogoProps> = ({ size = 88 }) => {
  const iconSize = Math.round(size * 0.48);
  const borderRadius = Math.round(size * 0.28);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius,
        },
      ]}
      accessibilityRole="image"
      accessibilityLabel="Daily Expenses brand logo"
    >
      {/* Outer subtle ring */}
      <View
        style={[
          styles.innerBadge,
          {
            borderRadius: borderRadius - 2,
          },
        ]}
      >
        <Ionicons name="receipt-outline" size={iconSize} color="#FFFFFF" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.accentGreen,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#15211B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  innerBadge: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
