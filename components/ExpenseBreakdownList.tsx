import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { ReportExpense } from '../types/report';
import { formatCurrency, formatRecentEntryDate } from '../utils/entryCalculations';

export interface ExpenseBreakdownListProps {
  expenses: ReportExpense[];
}

export function ExpenseBreakdownList({ expenses }: ExpenseBreakdownListProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Expense breakdown</Text>

      {expenses.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="receipt-outline" size={28} color="#64748B" />
          </View>
          <Text style={styles.emptyTitle}>No expenses yet</Text>
          <Text style={styles.emptySubtitle}>
            Expenses recorded in this period will be grouped here.
          </Text>
        </View>
      ) : (
        <View style={styles.listCard}>
          {expenses.map((item, index) => {
            const isLast = index === expenses.length - 1;
            const isHomeCategory = ['Personal', 'Household'].includes(item.category);
            const isBusinessCategory = ['Business', 'Staff', 'Transport', 'Utilities'].includes(
              item.category
            );

            return (
              <View
                key={item.id || index}
                style={[styles.row, !isLast && styles.rowBorder]}
              >
                <View style={styles.leftCol}>
                  <Text style={styles.expenseName}>{item.expense_name}</Text>
                  <View style={styles.badgeAndDateRow}>
                    <View
                      style={[
                        styles.badge,
                        isHomeCategory && styles.homeBadge,
                        isBusinessCategory && styles.businessBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          isHomeCategory && styles.homeBadgeText,
                          isBusinessCategory && styles.businessBadgeText,
                        ]}
                      >
                        {item.category}
                      </Text>
                    </View>
                    <Text style={styles.dateLabel}>
                      {formatRecentEntryDate(item.entry_date)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.amountText}>{formatCurrency(item.amount)}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.primaryText,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E6EBE4',
    shadowColor: '#15211B',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4EE',
  },
  leftCol: {
    flex: 1,
  },
  expenseName: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.inputText,
    marginBottom: 4,
  },
  badgeAndDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#475569',
  },
  businessBadge: {
    backgroundColor: '#E8EFE5',
  },
  businessBadgeText: {
    color: '#0E5B42',
  },
  homeBadge: {
    backgroundColor: '#FEF3C7',
  },
  homeBadgeText: {
    color: '#92400E',
  },
  dateLabel: {
    fontSize: 11,
    color: Colors.secondaryText,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
    paddingLeft: 10,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E6EBE4',
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F1F5F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primaryText,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.secondaryText,
    textAlign: 'center',
    maxWidth: 240,
  },
});
