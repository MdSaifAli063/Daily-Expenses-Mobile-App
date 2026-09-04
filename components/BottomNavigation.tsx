import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';

export interface BottomNavigationProps {
  activeTab?: 'home' | 'entries' | 'reports' | 'logout';
  onTabPress?: (tab: string) => void;
  onAddPress?: () => void;
}

/**
 * Fixed Bottom Navigation Bar with 4 tabs and a centered elevated floating "+" action button.
 */
export function BottomNavigation({
  activeTab = 'home',
  onTabPress,
  onAddPress,
}: BottomNavigationProps) {
  const insets = useSafeAreaInsets();

  const handleTabPress = (tab: string) => {
    if (onTabPress) {
      onTabPress(tab);
    } else {
      console.log(`${tab.charAt(0).toUpperCase() + tab.slice(1)} pressed`);
    }
  };

  const handleAddPress = () => {
    if (onAddPress) {
      onAddPress();
    } else {
      console.log('Add expense pressed');
    }
  };

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {/* Floating Add Button */}
      <View style={styles.floatingButtonContainer} pointerEvents="box-none">
        <Pressable
          style={({ pressed }) => [
            styles.floatingButton,
            pressed && styles.floatingButtonPressed,
          ]}
          onPress={handleAddPress}
          accessibilityRole="button"
          accessibilityLabel="Add expense"
          accessibilityHint="Opens expense entry creation"
        >
          <Ionicons name="add" size={26} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Tabs Container */}
      <View style={styles.navBar}>
        {/* Home Tab (Active) */}
        <Pressable
          style={styles.tabItem}
          onPress={() => handleTabPress('home')}
          accessibilityRole="tab"
          accessibilityLabel="Home"
          accessibilityState={{ selected: activeTab === 'home' }}
        >
          <Ionicons
            name={activeTab === 'home' ? 'home' : 'home-outline'}
            size={21}
            color={activeTab === 'home' ? Colors.navActive : Colors.navInactive}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'home' ? styles.activeTabLabel : styles.inactiveTabLabel,
            ]}
          >
            Home
          </Text>
        </Pressable>

        {/* Entries Tab */}
        <Pressable
          style={styles.tabItem}
          onPress={() => handleTabPress('entries')}
          accessibilityRole="tab"
          accessibilityLabel="Entries"
          accessibilityState={{ selected: activeTab === 'entries' }}
        >
          <Ionicons
            name={activeTab === 'entries' ? 'receipt' : 'receipt-outline'}
            size={21}
            color={activeTab === 'entries' ? Colors.navActive : Colors.navInactive}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'entries' ? styles.activeTabLabel : styles.inactiveTabLabel,
            ]}
          >
            Entries
          </Text>
        </Pressable>

        {/* Spacer for centered floating button */}
        <View style={styles.centerSpacer} pointerEvents="none" />

        {/* Reports Tab */}
        <Pressable
          style={styles.tabItem}
          onPress={() => handleTabPress('reports')}
          accessibilityRole="tab"
          accessibilityLabel="Reports"
          accessibilityState={{ selected: activeTab === 'reports' }}
        >
          <Ionicons
            name={activeTab === 'reports' ? 'bar-chart' : 'bar-chart-outline'}
            size={21}
            color={activeTab === 'reports' ? Colors.navActive : Colors.navInactive}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'reports' ? styles.activeTabLabel : styles.inactiveTabLabel,
            ]}
          >
            Reports
          </Text>
        </Pressable>

        {/* Logout Tab */}
        <Pressable
          style={styles.tabItem}
          onPress={() => handleTabPress('logout')}
          accessibilityRole="tab"
          accessibilityLabel="Logout"
          accessibilityState={{ selected: activeTab === 'logout' }}
        >
          <Ionicons
            name={activeTab === 'logout' ? 'log-out' : 'log-out-outline'}
            size={21}
            color={activeTab === 'logout' ? Colors.navActive : Colors.navInactive}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'logout' ? styles.activeTabLabel : styles.inactiveTabLabel,
            ]}
          >
            Logout
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.navBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.navBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 8,
  },
  floatingButtonContainer: {
    position: 'absolute',
    top: -22,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  floatingButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accentGreen,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#15211B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 6,
  },
  floatingButtonPressed: {
    backgroundColor: Colors.accentGreenPressed,
    transform: [{ scale: 0.95 }],
  },
  navBar: {
    flexDirection: 'row',
    height: 52,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  centerSpacer: {
    width: 50,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 3,
    fontWeight: '500',
  },
  activeTabLabel: {
    color: Colors.navActive,
    fontWeight: '600',
  },
  inactiveTabLabel: {
    color: Colors.navInactive,
  },
});
