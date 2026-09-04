import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '../constants/colors';

export interface MonthlySummaryCardProps {
  collection?: string;
  expense?: string;
  profit?: string;
  workingDays?: string;
  holidays?: string;
  onFullReport?: () => void;
}

/**
 * MonthlySummaryCard renders the "This month" overview card,
 * displaying key financial metrics (Collection, Expense, Profit)
 * and working days / holiday metrics.
 */
export function MonthlySummaryCard({
  collection = '₹0',
  expense = '₹0',
  profit = '₹0',
  workingDays = '0 working days',
  holidays = '0 holidays',
  onFullReport,
}: MonthlySummaryCardProps) {
  const handleFullReportPress = () => {
    if (onFullReport) {
      onFullReport();
    } else {
      console.log('Full report pressed');
    }
  };

  return (
    <View style={styles.card}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text style={styles.heading}>This month</Text>
        <Pressable
          onPress={handleFullReportPress}
          hitSlop={8}
          accessibilityRole="link"
          accessibilityLabel="Full report"
        >
          <Text style={styles.fullReportLink}>Full report</Text>
        </Pressable>
      </View>

      {/* Summary Columns */}
      <View style={styles.columnsRow}>
        {/* Collection */}
        <View style={styles.column}>
          <Text style={styles.columnLabel}>Collection</Text>
          <Text style={[styles.columnAmount, styles.collectionText]}>{collection}</Text>
        </View>

        {/* Expense */}
        <View style={styles.column}>
          <Text style={styles.columnLabel}>Expense</Text>
          <Text style={[styles.columnAmount, styles.expenseText]}>{expense}</Text>
        </View>

        {/* Profit */}
        <View style={styles.column}>
          <Text style={styles.columnLabel}>Profit</Text>
          <Text style={[styles.columnAmount, styles.profitText]}>{profit}</Text>
        </View>
      </View>

      {/* Subtle Divider */}
      <View style={styles.divider} />

      {/* Working Days / Holidays Footer */}
      <View style={styles.daysRow}>
        <Text style={styles.dayStatusText}>{workingDays}</Text>
        <Text style={styles.dayStatusText}>{holidays}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    shadowColor: '#15211B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heading: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryText,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'serif',
    }),
  },
  fullReportLink: {
    fontSize: 11.5,
    fontWeight: '600',
    color: Colors.accentGreen,
    textDecorationLine: 'underline',
  },
  columnsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  columnLabel: {
    fontSize: 11,
    color: Colors.secondaryText,
    marginBottom: 6,
  },
  columnAmount: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  collectionText: {
    color: Colors.collectionGreen,
  },
  expenseText: {
    color: Colors.expenseRed,
  },
  profitText: {
    color: Colors.profitGreen,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.cardDivider,
    marginBottom: 12,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayStatusText: {
    fontSize: 11,
    color: Colors.secondaryText,
  },
});
