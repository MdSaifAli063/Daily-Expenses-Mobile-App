import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface WelcomeLogoProps {
  size?: number;
}

/**
 * Official Dailydoubt brand icon for the Welcome / Landing page.
 * Uses the high-resolution transparent master icon asset.
 */
export const WelcomeLogo: React.FC<WelcomeLogoProps> = ({ size = 96 }) => {
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
        },
      ]}
      accessibilityRole="image"
      accessibilityLabel="Dailydoubt brand logo"
    >
      <Image
        source={require('../assets/icon.png')}
        style={[styles.image, { width: size, height: size }]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#15211B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 5,
  },
  image: {
    borderRadius: 22,
  },
});
