import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/colors';
import { ReportFilterTab } from '../types/report';

export interface ReportFilterTabsProps {
  activeTab: ReportFilterTab;
  onSelectTab: (tab: ReportFilterTab) => void;
}

const TABS: Array<{ key: ReportFilterTab; label: string }> = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'custom', label: 'Custom' },
];

export function ReportFilterTabs({ activeTab, onSelectTab }: ReportFilterTabsProps) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            style={[styles.tabBtn, isActive && styles.activeTabBtn]}
            onPress={() => onSelectTab(tab.key)}
            accessibilityRole="tab"
            accessibilityLabel={`${tab.label} filter`}
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.tabText, isActive && styles.activeTabText]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#EAEFE9',
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  activeTabBtn: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#15211B',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.secondaryText,
  },
  activeTabText: {
    fontWeight: '700',
    color: '#0E5B42',
  },
});
