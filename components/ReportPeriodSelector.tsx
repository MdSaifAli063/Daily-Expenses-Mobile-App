import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { DatePickerModal } from './DatePickerModal';
import {
  DaySubPeriod,
  MonthSubPeriod,
  ReportFilterTab,
  WeekSubPeriod,
} from '../types/report';
import { formatDisplayDate, getLocalDateString } from '../services/dailyEntryService';

export interface ReportPeriodSelectorProps {
  activeTab: ReportFilterTab;
  daySubPeriod: DaySubPeriod;
  onSelectDaySubPeriod: (val: DaySubPeriod) => void;
  weekSubPeriod: WeekSubPeriod;
  onSelectWeekSubPeriod: (val: WeekSubPeriod) => void;
  monthSubPeriod: MonthSubPeriod;
  onSelectMonthSubPeriod: (val: MonthSubPeriod) => void;
  customStartDate: string;
  onSelectCustomStartDate: (val: string) => void;
  customEndDate: string;
  onSelectCustomEndDate: (val: string) => void;
  formattedRange: string;
  isCustomRangeValid: boolean;
}

export function ReportPeriodSelector({
  activeTab,
  daySubPeriod,
  onSelectDaySubPeriod,
  weekSubPeriod,
  onSelectWeekSubPeriod,
  monthSubPeriod,
  onSelectMonthSubPeriod,
  customStartDate,
  onSelectCustomStartDate,
  customEndDate,
  onSelectCustomEndDate,
  formattedRange,
  isCustomRangeValid,
}: ReportPeriodSelectorProps) {
  // Modal state for custom date pickers
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  return (
    <View style={styles.wrapper}>
      {/* Sub-period toggle based on selected tab */}
      {activeTab === 'day' && (
        <View style={styles.subPeriodRow}>
          <Pressable
            style={[
              styles.subPeriodBtn,
              daySubPeriod === 'this_day' && styles.subPeriodBtnActive,
            ]}
            onPress={() => onSelectDaySubPeriod('this_day')}
          >
            <Text
              style={[
                styles.subPeriodText,
                daySubPeriod === 'this_day' && styles.subPeriodTextActive,
              ]}
            >
              This day
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.subPeriodBtn,
              daySubPeriod === 'prev_day' && styles.subPeriodBtnActive,
            ]}
            onPress={() => onSelectDaySubPeriod('prev_day')}
          >
            <Text
              style={[
                styles.subPeriodText,
                daySubPeriod === 'prev_day' && styles.subPeriodTextActive,
              ]}
            >
              Previous day
            </Text>
          </Pressable>
        </View>
      )}

      {activeTab === 'week' && (
        <View style={styles.subPeriodRow}>
          <Pressable
            style={[
              styles.subPeriodBtn,
              weekSubPeriod === 'this_week' && styles.subPeriodBtnActive,
            ]}
            onPress={() => onSelectWeekSubPeriod('this_week')}
          >
            <Text
              style={[
                styles.subPeriodText,
                weekSubPeriod === 'this_week' && styles.subPeriodTextActive,
              ]}
            >
              This week
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.subPeriodBtn,
              weekSubPeriod === 'last_week' && styles.subPeriodBtnActive,
            ]}
            onPress={() => onSelectWeekSubPeriod('last_week')}
          >
            <Text
              style={[
                styles.subPeriodText,
                weekSubPeriod === 'last_week' && styles.subPeriodTextActive,
              ]}
            >
              Last week
            </Text>
          </Pressable>
        </View>
      )}

      {activeTab === 'month' && (
        <View style={styles.subPeriodRow}>
          <Pressable
            style={[
              styles.subPeriodBtn,
              monthSubPeriod === 'this_month' && styles.subPeriodBtnActive,
            ]}
            onPress={() => onSelectMonthSubPeriod('this_month')}
          >
            <Text
              style={[
                styles.subPeriodText,
                monthSubPeriod === 'this_month' && styles.subPeriodTextActive,
              ]}
            >
              This month
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.subPeriodBtn,
              monthSubPeriod === 'last_month' && styles.subPeriodBtnActive,
            ]}
            onPress={() => onSelectMonthSubPeriod('last_month')}
          >
            <Text
              style={[
                styles.subPeriodText,
                monthSubPeriod === 'last_month' && styles.subPeriodTextActive,
              ]}
            >
              Last month
            </Text>
          </Pressable>
        </View>
      )}

      {activeTab === 'custom' && (
        <View style={styles.customDateRow}>
          {/* Start Date Button */}
          <Pressable
            style={styles.customDateBtn}
            onPress={() => setShowStartPicker(true)}
          >
            <Text style={styles.customDateText}>
              {formatDisplayDate(customStartDate)}
            </Text>
            <Ionicons name="calendar-outline" size={17} color={Colors.primaryText} />
          </Pressable>

          {/* End Date Button */}
          <Pressable
            style={styles.customDateBtn}
            onPress={() => setShowEndPicker(true)}
          >
            <Text style={styles.customDateText}>
              {formatDisplayDate(customEndDate)}
            </Text>
            <Ionicons name="calendar-outline" size={17} color={Colors.primaryText} />
          </Pressable>
        </View>
      )}

      {/* Date Range Text Header */}
      <View style={styles.rangeContainer}>
        <Text style={styles.rangeText}>{formattedRange}</Text>
        {!isCustomRangeValid && activeTab === 'custom' && (
          <Text style={styles.rangeErrorText}>
            Start date must be before or equal to end date.
          </Text>
        )}
      </View>

      {/* Date Pickers */}
      <DatePickerModal
        visible={showStartPicker}
        value={new Date(customStartDate)}
        onChange={(d) => onSelectCustomStartDate(getLocalDateString(d))}
        onClose={() => setShowStartPicker(false)}
      />

      <DatePickerModal
        visible={showEndPicker}
        value={new Date(customEndDate)}
        onChange={(d) => onSelectCustomEndDate(getLocalDateString(d))}
        onClose={() => setShowEndPicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  subPeriodRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  subPeriodBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E6EBE4',
  },
  subPeriodBtnActive: {
    backgroundColor: '#EAEFE9',
    borderColor: '#0E5B42',
  },
  subPeriodText: {
    fontSize: 13,
    color: Colors.secondaryText,
    fontWeight: '500',
  },
  subPeriodTextActive: {
    color: '#0E5B42',
    fontWeight: '700',
  },
  customDateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  customDateBtn: {
    flex: 1,
    height: 42,
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#E6EBE4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  customDateText: {
    fontSize: 13.5,
    color: Colors.inputText,
    fontWeight: '500',
  },
  rangeContainer: {
    paddingHorizontal: 2,
    marginTop: 2,
  },
  rangeText: {
    fontSize: 12.5,
    color: Colors.secondaryText,
    fontWeight: '500',
  },
  rangeErrorText: {
    fontSize: 11.5,
    color: Colors.expenseRed,
    marginTop: 3,
    fontWeight: '500',
  },
});
