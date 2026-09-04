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
    } else {
      console.log("Add today's entry pressed");
    }
  };

  return (
    <View style={styles.cardContainer} onLayout={handleLayout}>
      {/* Paper Body */}
      <View style={styles.paperBody}>
        {/* Day of Week */}
        <Text style={styles.dayLabel}>{dayOfWeek}</Text>

        {/* Date Display */}
        <Text style={styles.dateText}>{date}</Text>

        {/* Empty State Message */}
        <Text style={styles.emptyText}>{emptyMessage}</Text>

        {/* Compact Action Button */}
        <View style={styles.buttonRow}>
          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed,
            ]}
            onPress={handlePress}
            accessibilityRole="button"
            accessibilityLabel="Add today's entry"
          >
            <Text style={styles.addButtonText}>Add today's entry</Text>
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
  dayLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: Colors.secondaryText,
    textTransform: 'uppercase',
    marginBottom: 4,
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
    marginBottom: 14,
  },
  emptyText: {
    fontSize: 12.5,
    color: Colors.secondaryText,
    marginBottom: 14,
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
