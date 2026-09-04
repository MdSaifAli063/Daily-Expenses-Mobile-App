import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

export interface PasswordInputProps extends TextInputProps {
  label: string;
  required?: boolean;
  helperText?: string;
  error?: string;
}

/**
 * Secure password input with integrated eye visibility toggle.
 * Styled identically to standard Input for visual consistency,
 * with support for helper text and inline validation errors.
 */
export function PasswordInput({
  label,
  required = false,
  helperText,
  error,
  style,
  ...props
}: PasswordInputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const toggleVisibility = () => {
    setIsPasswordVisible((prev) => !prev);
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.asterisk}> *</Text>}
        </Text>
      </View>
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapperFocused,
          error ? styles.inputWrapperError : null,
        ]}
      >
        <TextInput
          style={[styles.input, style]}
          secureTextEntry={!isPasswordVisible}
          placeholderTextColor={Colors.inputPlaceholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          accessibilityLabel={label}
          autoCapitalize="none"
          autoCorrect={false}
          {...props}
        />
        <Pressable
          onPress={toggleVisibility}
          hitSlop={12}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
          accessibilityHint="Toggles whether your password is shown or hidden"
        >
          <Ionicons
            name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
            size={19}
            color={Colors.iconMuted}
          />
        </Pressable>
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.primaryText,
    letterSpacing: -0.1,
  },
  asterisk: {
    color: Colors.requiredAsterisk,
    fontWeight: '600',
  },
  inputWrapper: {
    height: 48,
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  inputWrapperFocused: {
    borderColor: Colors.inputBorderFocused,
  },
  inputWrapperError: {
    borderColor: Colors.inputBorderError,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: Colors.inputText,
    paddingRight: 8,
  },
  iconButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helperText: {
    fontSize: 12,
    color: Colors.secondaryText,
    marginTop: 5,
    paddingLeft: 2,
  },
  errorText: {
    fontSize: 12,
    color: Colors.errorText,
    marginTop: 5,
    paddingLeft: 2,
  },
});
