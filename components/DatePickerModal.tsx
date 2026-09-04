import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { getLocalDateString } from '../services/dailyEntryService';

export interface DatePickerModalProps {
  value: Date;
  visible: boolean;
  onChange: (date: Date) => void;
  onClose: () => void;
}

/**
 * Cross-platform date picker modal.
 * Uses native @react-native-community/datetimepicker on Android/iOS,
 * and HTML5 date picker on Web for seamless development and zero crashes.
 */
export function DatePickerModal({
  value,
  visible,
  onChange,
  onClose,
}: DatePickerModalProps) {
  if (!visible) return null;

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        <input
          type="date"
          style={{
            fontSize: 16,
            padding: 8,
            borderRadius: 8,
            border: '1px solid #D7DFD6',
            backgroundColor: '#FFFFFF',
          }}
          value={getLocalDateString(value)}
          onChange={(e) => {
            if (e.target.value) {
              const [y, m, d] = e.target.value.split('-').map(Number);
              onChange(new Date(y, m - 1, d));
            }
            onClose();
          }}
          onBlur={onClose}
          autoFocus
        />
      </View>
    );
  }

  // Native Android and iOS
  const DateTimePicker = require('@react-native-community/datetimepicker').default;
  return (
    <DateTimePicker
      value={value}
      mode="date"
      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
      onChange={(event: any, selectedDate?: Date) => {
        onClose();
        if (event?.type === 'set' && selectedDate) {
          onChange(selectedDate);
        } else if (Platform.OS === 'ios' && selectedDate) {
          onChange(selectedDate);
        }
      }}
    />
  );
}

const styles = StyleSheet.create({
  webContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 9999,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
    alignItems: 'center',
  },
});
