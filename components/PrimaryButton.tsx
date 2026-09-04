import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { Colors } from '../constants/colors';

export interface PrimaryButtonProps extends PressableProps {
  title: string;
  loading?: boolean;
  style?: ViewStyle;
}

/**
 * Modern full-width primary button styled in dark muted teal-green.
 * Supports optional loading indicator for async Supabase actions.
 */
export function PrimaryButton({
  title,
  loading = false,
  style,
  disabled,
  ...props
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        isDisabled && styles.buttonDisabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 48,
    backgroundColor: Colors.accentGreen,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPressed: {
    backgroundColor: Colors.accentGreenPressed,
    opacity: 0.92,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
