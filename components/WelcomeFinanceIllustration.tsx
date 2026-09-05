import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

/**
 * Decorative financial summary illustration for the Welcome screen.
 * Visually illustrates the app's core value proposition: daily collection,
 * expense tracking, and profit visibility in an authentic shop ledger aesthetic.
 */
export const WelcomeFinanceIllustration: React.FC = () => {
  return (
    <View style={styles.cardContainer}>
      {/* Card Header Pill */}
      <View style={styles.headerRow}>
        <View style={styles.summaryTag}>
          <Text style={styles.summaryTagText}>DAILY SUMMARY</Text>
        </View>
        <View style={styles.statusDotRow}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Today</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* 1. Collection Row */}
      <View style={styles.metricRow}>
        <View style={styles.labelCol}>
          <Text style={styles.metricLabel}>Collection</Text>
          <Text style={styles.metricHint}>Shop sales</Text>
        </View>
        <Text style={[styles.metricValue, styles.collectionText]}>+₹2,000</Text>
      </View>

      {/* 2. Expenses Row */}
      <View style={styles.metricRow}>
        <View style={styles.labelCol}>
          <Text style={styles.metricLabel}>Expenses</Text>
          <Text style={styles.metricHint}>Supplies & home</Text>
        </View>
        <Text style={[styles.metricValue, styles.expenseText]}>-₹1,100</Text>
      </View>

      {/* Mid Divider */}
      <View style={styles.innerDivider} />

      {/* 3. Profit Row with Upward Trend Indicator */}
      <View style={styles.profitRow}>
        <View style={styles.labelCol}>
          <Text style={styles.profitLabel}>Net Profit</Text>
          <Text style={styles.profitHint}>Cash in hand</Text>
        </View>
        <View style={styles.profitRightCol}>
          <Text style={styles.profitValue}>+₹900</Text>
          <View style={styles.trendBadge}>
            <Ionicons name="trending-up" size={14} color={Colors.emeraldGreen} />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#E6EBE4',
    shadowColor: '#15211B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTag: {
    backgroundColor: '#F4F6F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E4E9E0',
  },
  summaryTagText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: Colors.accentGreen,
    letterSpacing: 1.2,
  },
  statusDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.profitGreen,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.secondaryText,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0E7D5',
    marginVertical: 10,
  },
  innerDivider: {
    height: 1,
    backgroundColor: '#FAF5EB',
    marginVertical: 8,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  labelCol: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.primaryText,
  },
  metricHint: {
    fontSize: 11,
    color: Colors.secondaryText,
    marginTop: 1,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  collectionText: {
    color: Colors.profitGreen,
  },
  expenseText: {
    color: Colors.terracotta,
  },
  profitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  profitLabel: {
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.primaryText,
  },
  profitHint: {
    fontSize: 11,
    color: Colors.secondaryText,
    marginTop: 1,
  },
  profitRightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profitValue: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.profitGreen,
  },
  trendBadge: {
    backgroundColor: '#EBF5EF',
    padding: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D4EBDC',
  },
});
