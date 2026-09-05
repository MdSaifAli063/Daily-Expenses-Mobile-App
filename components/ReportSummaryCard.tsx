import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/colors';
import { ReportSummary } from '../types/report';
import { formatCurrency } from '../utils/entryCalculations';

export interface ReportSummaryCardProps {
  summary: ReportSummary;
}

export function ReportSummaryCard({ summary }: ReportSummaryCardProps) {
  const workingDaysLabel = `${summary.workingDays} ${
    summary.workingDays === 1 ? 'working day' : 'working days'
  }`;
  const holidaysLabel = `${summary.holidays} ${
    summary.holidays === 1 ? 'holiday' : 'holidays'
  }`;

  return (
    <View style={styles.card}>
      {/* Metrics list */}
      <View style={styles.rowsContainer}>
        {/* Total collection */}
        <View style={styles.row}>
          <Text style={styles.label}>Total collection</Text>
          <Text style={[styles.value, styles.collectionVal]}>
            {formatCurrency(summary.totalCollection)}
          </Text>
        </View>

        {/* Business expense */}
        <View style={styles.row}>
          <Text style={styles.label}>Business expense</Text>
          <Text style={[styles.value, styles.expenseVal]}>
            {formatCurrency(summary.businessExpense)}
          </Text>
        </View>

        {/* Home expense */}
        <View style={styles.row}>
          <Text style={styles.label}>Home expense</Text>
          <Text style={[styles.value, styles.expenseVal]}>
            {formatCurrency(summary.homeExpense)}
          </Text>
        </View>

        {/* Total cash outflow */}
        <View style={styles.row}>
          <Text style={[styles.label, styles.boldLabel]}>Total cash outflow</Text>
          <Text style={[styles.value, styles.expenseVal, styles.boldValue]}>
            {formatCurrency(summary.totalCashOutflow)}
          </Text>
        </View>

        {/* Business profit */}
        <View style={styles.row}>
          <Text style={[styles.label, styles.boldLabel]}>Business profit</Text>
          <Text
            style={[
              styles.value,
              summary.businessProfit < 0 ? styles.expenseVal : styles.collectionVal,
              styles.boldValue,
            ]}
          >
            {formatCurrency(summary.businessProfit)}
          </Text>
        </View>

        {/* Average daily collection */}
        <View style={styles.row}>
          <Text style={styles.label}>Average daily collection</Text>
          <Text style={[styles.value, styles.avgVal]}>
            {formatCurrency(summary.averageDailyCollection)}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Days & Holidays Footer */}
      <View style={styles.daysRow}>
        <View style={styles.dayPill}>
          <Text style={styles.dayPillText}>{workingDaysLabel}</Text>
        </View>
        <View style={[styles.dayPill, styles.holidayPill]}>
          <Text style={[styles.dayPillText, styles.holidayPillText]}>
            {holidaysLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E6EBE4',
    shadowColor: '#15211B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  rowsContainer: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    color: Colors.secondaryText,
    fontWeight: '500',
  },
  boldLabel: {
    color: Colors.primaryText,
    fontWeight: '700',
  },
  value: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  boldValue: {
    fontWeight: '700',
    fontSize: 14,
  },
  collectionVal: {
    color: '#0E5B42',
  },
  expenseVal: {
    color: '#DC2626',
  },
  avgVal: {
    color: Colors.primaryText,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#EAEFE8',
    marginVertical: 14,
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayPill: {
    backgroundColor: '#E8EFE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dayPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0E5B42',
  },
  holidayPill: {
    backgroundColor: '#F3E8FF',
  },
  holidayPillText: {
    color: '#7E22CE',
  },
});
