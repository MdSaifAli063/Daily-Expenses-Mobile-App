import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { Colors } from '../constants/colors';

export interface InputProps extends TextInputProps {
  label: string;
  required?: boolean;
  helperText?: string;
  error?: string;
}

/**
 * Clean, minimal text input matching the shop ledger design.
 * Features rounded corners, subtle borders, accessible labeling,
 * and support for helper text and inline validation errors.
 */
export function Input({
  label,
  required = false,
  helperText,
  error,
  style,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.asterisk}> *</Text>}
        </Text>
      </View>
      <TextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error ? styles.inputError : null,
          style,
        ]}
        placeholderTextColor={Colors.inputPlaceholder}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        accessibilityLabel={label}
        {...props}
      />
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
  input: {
    height: 48,
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 13,
    paddingHorizontal: 16,
    fontSize: 15,
    color: Colors.inputText,
  },
  inputFocused: {
    borderColor: Colors.inputBorderFocused,
  },
  inputError: {
    borderColor: Colors.inputBorderError,
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
