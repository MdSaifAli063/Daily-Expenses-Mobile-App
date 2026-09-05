import React, { useState } from 'react';
import {
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '../constants/colors';

export interface TodayEntryCardProps {
  dayOfWeek?: string;
  date?: string;
  emptyMessage?: string;
  onAddEntry?: () => void;
  hasEntry?: boolean;
  collectionAmount?: number;
  businessExpenseAmount?: number;
  homeExpenseAmount?: number;
  profitAmount?: number;
  expenseAmount?: number; // legacy fallback
  dayType?: 'working' | 'holiday';
}

const TOOTH_SIZE = 10;

/**
 * TodayEntryCard renders the daily expense entry card styled like a fresh sheet of paper
 * sitting on the ledger notebook, complete with an authentic subtle zig-zag torn paper bottom edge.
 */
export function TodayEntryCard({
  dayOfWeek = 'SATURDAY',
  date = '05 Sept 2026',
  emptyMessage = 'No entry recorded for today yet.',
  onAddEntry,
  hasEntry = false,
  collectionAmount = 0,
  businessExpenseAmount = 0,
  homeExpenseAmount = 0,
  profitAmount = 0,
  dayType = 'working',
}: TodayEntryCardProps) {
  const [cardWidth, setCardWidth] = useState(0);

  const handleLayout = (e: LayoutChangeEvent) => {
    setCardWidth(e.nativeEvent.layout.width);
  };

  const toothCount = cardWidth > 0 ? Math.ceil(cardWidth / TOOTH_SIZE) + 2 : 35;
  const teeth = Array.from({ length: toothCount }, (_, i) => i);

  const handlePress = () => {
    if (onAddEntry) {
      onAddEntry();
    }
  };

  return (
    <View style={styles.cardContainer} onLayout={handleLayout}>
      {/* Paper Body */}
      <View style={styles.paperBody}>
        {/* Header row: Day of Week & Day Type pill if recorded */}
        <View style={styles.headerRow}>
          <Text style={styles.dayLabel}>{dayOfWeek}</Text>
          {hasEntry && (
            <View style={styles.dayTypeBadge}>
              <Text style={styles.dayTypeBadgeText}>
                {dayType === 'holiday' ? 'Holiday' : 'Working day'}
              </Text>
            </View>
          )}
        </View>

        {/* Date Display */}
        <Text style={styles.dateText}>{date}</Text>

        {/* Content depending on entry existence */}
        {hasEntry ? (
          <View style={styles.breakdownContainer}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Collection</Text>
              <Text style={[styles.breakdownValue, styles.collectionValue]}>
                ₹{collectionAmount.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Business expense</Text>
              <Text style={[styles.breakdownValue, styles.expenseValue]}>
                ₹{businessExpenseAmount.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Home expense</Text>
              <Text style={[styles.breakdownValue, styles.expenseValue]}>
                ₹{homeExpenseAmount.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={[styles.breakdownRow, styles.profitRow]}>
              <Text style={[styles.breakdownLabel, styles.profitLabel]}>Profit</Text>
              <Text style={[styles.breakdownValue, styles.profitValue]}>
                ₹{profitAmount.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        )}

        {/* Action Button */}
        <View style={styles.buttonRow}>
          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              hasEntry && styles.editButton,
              pressed && styles.addButtonPressed,
            ]}
            onPress={handlePress}
            accessibilityRole="button"
            accessibilityLabel={hasEntry ? 'View or edit this entry' : "Add today's entry"}
          >
            <Text style={styles.addButtonText}>
              {hasEntry ? 'View or edit this entry' : "Add today's entry"}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Subtle Torn-Paper Zig-Zag Edge */}
      <View style={styles.tornEdgeWrapper} pointerEvents="none">
        <View style={styles.teethRow}>
          {teeth.map((i) => (
            <View key={i} style={styles.tooth} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    shadowColor: '#15211B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  paperBody: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dayLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: Colors.secondaryText,
    textTransform: 'uppercase',
  },
  dayTypeBadge: {
    backgroundColor: '#E4EAE0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dayTypeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.accentGreen,
  },
  dateText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.primaryText,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'serif',
    }),
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 12.5,
    color: Colors.secondaryText,
    marginBottom: 14,
  },
  breakdownContainer: {
    backgroundColor: '#F8FAF6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E8EFE5',
    gap: 6,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 12.5,
    color: Colors.secondaryText,
    fontWeight: '500',
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryText,
  },
  collectionValue: {
    color: '#0E5B42',
  },
  expenseValue: {
    color: Colors.expenseRed,
  },
  profitRow: {
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E2E9DF',
  },
  profitLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryText,
  },
  profitValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0E5B42',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    height: 32,
    backgroundColor: Colors.accentGreen,
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#0E5B42',
  },
  addButtonPressed: {
    backgroundColor: Colors.accentGreenPressed,
    opacity: 0.9,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  tornEdgeWrapper: {
    height: 6,
    width: '100%',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  teethRow: {
    flexDirection: 'row',
    height: 6,
    overflow: 'hidden',
  },
  tooth: {
    width: TOOTH_SIZE,
    height: TOOTH_SIZE,
    backgroundColor: Colors.cardBackground,
    transform: [{ rotate: '45deg' }],
    marginTop: -5,
  },
});
