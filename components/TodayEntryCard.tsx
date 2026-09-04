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
  expenseAmount?: number;
  dayType?: 'working' | 'holiday';
}

const TOOTH_SIZE = 10;

/**
 * TodayEntryCard renders the daily expense entry card styled like a fresh sheet of paper
 * sitting on the ledger notebook, complete with an authentic subtle zig-zag torn paper bottom edge.
 */
export function TodayEntryCard({
  dayOfWeek = 'FRIDAY',
  date = '04 Sept 2026',
  emptyMessage = 'No entry recorded for today yet.',
  onAddEntry,
  hasEntry = false,
  collectionAmount = 0,
  expenseAmount = 0,
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
          <View style={styles.recordedContainer}>
            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Collection</Text>
                <Text style={styles.incomeValue}>
                  ₹ {collectionAmount.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Total Expense</Text>
                <Text style={styles.expenseValue}>
                  ₹ {expenseAmount.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        )}

        {/* Compact Action Button */}
        <View style={styles.buttonRow}>
          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              hasEntry && styles.editButton,
              pressed && styles.addButtonPressed,
            ]}
            onPress={handlePress}
            accessibilityRole="button"
            accessibilityLabel={hasEntry ? "Edit today's entry" : "Add today's entry"}
          >
            <Text style={styles.addButtonText}>
              {hasEntry ? "Edit today's entry" : "Add today's entry"}
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
    fontSize: 16,
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
  recordedContainer: {
    backgroundColor: '#F7FAF5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E8EFE5',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#D7E0D3',
  },
  metricLabel: {
    fontSize: 10.5,
    fontWeight: '500',
    color: Colors.secondaryText,
    marginBottom: 2,
  },
  incomeValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.accentGreen,
  },
  expenseValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.expenseRed,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    height: 30,
    backgroundColor: Colors.accentGreen,
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#2E5343',
  },
  addButtonPressed: {
    backgroundColor: Colors.accentGreenPressed,
    opacity: 0.9,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 11.5,
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
