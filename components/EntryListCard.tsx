import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '../constants/colors';
import { DailyEntry } from '../types/dailyEntry';
import {
  calculateEntryFinancials,
  formatCurrency,
  formatEntryDate,
  getDayOfWeek,
} from '../utils/entryCalculations';

export interface EntryListCardProps {
  entry: DailyEntry;
  onPress: (entry: DailyEntry) => void;
}

export function EntryListCard({ entry, onPress }: EntryListCardProps) {
  const { profit } = calculateEntryFinancials(entry);
  const formattedDate = formatEntryDate(entry.entry_date);
  const dayName = getDayOfWeek(entry.entry_date);
  const isHoliday = entry.day_type === 'holiday';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={() => onPress(entry)}
      accessibilityRole="button"
      accessibilityLabel={`Entry for ${formattedDate}, profit ${formatCurrency(profit)}`}
    >
      {/* Left Column: Date & Day */}
      <View style={styles.leftCol}>
        <Text style={styles.dateText}>{formattedDate}</Text>
        <View style={styles.dayRow}>
          <Text style={styles.dayText}>{dayName}</Text>
          {isHoliday && (
            <View style={styles.holidayBadge}>
              <Text style={styles.holidayBadgeText}>Holiday</Text>
            </View>
          )}
        </View>
      </View>

      {/* Right Column: Profit Amount & caption */}
      <View style={styles.rightCol}>
        <Text
          style={[
            styles.profitAmount,
            profit < 0 ? styles.lossAmount : styles.positiveAmount,
          ]}
        >
          {formatCurrency(profit)}
        </Text>
        <Text style={styles.profitCaption}>
          {profit < 0 ? 'loss' : 'profit'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6EBE4',
    shadowColor: '#15211B',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1.5,
    marginBottom: 10,
  },
  cardPressed: {
    backgroundColor: '#F9FBF8',
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  leftCol: {
    flex: 1,
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primaryText,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'serif',
    }),
    marginBottom: 3,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dayText: {
    fontSize: 12,
    color: Colors.secondaryText,
    fontWeight: '500',
  },
  holidayBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  holidayBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#7E22CE',
  },
  rightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 12,
  },
  profitAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  positiveAmount: {
    color: '#0E5B42',
  },
  lossAmount: {
    color: Colors.expenseRed,
  },
  profitCaption: {
    fontSize: 11,
    color: Colors.secondaryText,
    marginTop: 2,
    textTransform: 'lowercase',
  },
});
