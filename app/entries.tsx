import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { LedgerBackground } from '../components/LedgerBackground';
import { BottomNavigation } from '../components/BottomNavigation';
import { EntryListCard } from '../components/EntryListCard';
import { useAuth } from '../context/AuthContext';
import { shopService } from '../services/shopService';
import { dailyEntryService } from '../services/dailyEntryService';
import { DailyEntry } from '../types/dailyEntry';
import { Shop } from '../types/shop';
import { formatMonthTitle } from '../utils/entryCalculations';

export default function EntriesScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  // Shop state
  const [shop, setShop] = useState<Shop | null>(null);
  const [loadingShop, setLoadingShop] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Month navigation state (defaults to current device month and year)
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1); // 1 to 12

  // Entries & Search state
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Load shop profile
  useEffect(() => {
    let isMounted = true;
    if (!user) {
      setLoadingShop(false);
      return;
    }

    setLoadingShop(true);
    shopService
      .getOrCreateShopForUser(user)
      .then(({ data }) => {
        if (isMounted && data) {
          setShop(data);
        }
      })
      .catch((err) => {
        console.error('[EntriesScreen] Error loading shop:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingShop(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Fetch entries for the selected month
  const fetchMonthEntries = useCallback(
    async (isRefresh = false) => {
      if (!shop?.id) return;
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoadingEntries(true);
      }
      setErrorMessage(null);

      try {
        const { data, error } = await dailyEntryService.getEntriesByMonth(
          selectedYear,
          selectedMonth,
          shop.id
        );

        if (error) {
          setErrorMessage('Unable to load entries. Please check your connection and try again.');
        } else {
          setEntries(data || []);
        }
      } catch (err) {
        setErrorMessage('Unable to load entries. Please check your connection and try again.');
      } finally {
        setLoadingEntries(false);
        setRefreshing(false);
      }
    },
    [shop?.id, selectedYear, selectedMonth]
  );

  // Auto-refresh entries on screen focus (e.g. returning from edit or delete)
  useFocusEffect(
    useCallback(() => {
      fetchMonthEntries();
    }, [fetchMonthEntries])
  );

  // Pull-to-refresh handler
  const handleRefresh = () => {
    fetchMonthEntries(true);
  };

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  // Filter entries by notes search query (case-insensitive)
  const filteredEntries = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) {
      return entries;
    }
    return entries.filter((entry) => {
      const notes = entry.notes?.toLowerCase() || '';
      return notes.includes(trimmed);
    });
  }, [entries, searchQuery]);

  // Card click: open detail screen
  const handleOpenDetail = (entry: DailyEntry) => {
    router.push({
      pathname: `/entry/[id]`,
      params: { id: entry.id },
    });
  };

  // Floating '+' / Add entry click
  const handleOpenAddEntry = () => {
    router.push('/add-entry');
  };

  // Bottom navigation tab click
  const handleTabPress = async (tab: string) => {
    if (tab === 'home') {
      router.replace('/home');
      return;
    }
    if (tab === 'entries') {
      // Already on entries screen
      return;
    }
    if (tab === 'reports') {
      router.push('/reports');
      return;
    }
    if (tab === 'profile') {
      router.push('/profile');
      return;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <LedgerBackground />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#0E5B42']}
            tintColor="#0E5B42"
          />
        }
      >
        {/* Header matching screenshot */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Entries</Text>
          <Text style={styles.headerSubtitle}>All your daily records</Text>
        </View>

        {/* Month Navigation Row: ← Month Year → */}
        <View style={styles.monthNavRow}>
          <Pressable
            style={styles.monthArrowBtn}
            onPress={handlePrevMonth}
            hitSlop={{ top: 10, bottom: 10, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
          >
            <Ionicons name="arrow-back" size={20} color={Colors.primaryText} />
          </Pressable>

          <Text style={styles.monthTitleText}>
            {formatMonthTitle(selectedYear, selectedMonth)}
          </Text>

          <Pressable
            style={styles.monthArrowBtn}
            onPress={handleNextMonth}
            hitSlop={{ top: 10, bottom: 10, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Next month"
          >
            <Ionicons name="arrow-forward" size={20} color={Colors.primaryText} />
          </Pressable>
        </View>

        {/* Search Notes Input */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={18}
            color={Colors.secondaryText}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes..."
            placeholderTextColor={Colors.inputPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.clearSearchBtn}
            >
              <Ionicons name="close-circle" size={16} color={Colors.secondaryText} />
            </Pressable>
          )}
        </View>

        {/* Entries List or States */}
        {loadingEntries && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="small" color="#0E5B42" />
            <Text style={styles.loadingText}>Loading records...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={36} color={Colors.expenseRed} />
            <Text style={styles.errorText}>{errorMessage}</Text>
            <Pressable style={styles.retryButton} onPress={() => fetchMonthEntries()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : filteredEntries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons
                name={searchQuery ? 'search-outline' : 'receipt-outline'}
                size={32}
                color="#64748B"
              />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No matching entries' : 'No entries yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Try searching with different keywords.'
                : 'No daily records found for this month.'}
            </Text>
            {!searchQuery && (
              <Pressable style={styles.addEntryActionBtn} onPress={handleOpenAddEntry}>
                <Text style={styles.addEntryActionBtnText}>+ Add entry</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filteredEntries.map((entry) => (
              <EntryListCard
                key={entry.id}
                entry={entry}
                onPress={handleOpenDetail}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Fixed Bottom Navigation with Entries Tab Active */}
      <BottomNavigation
        activeTab="entries"
        onTabPress={handleTabPress}
        onAddPress={handleOpenAddEntry}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110, // Avoid bottom navigation overlap
  },
  header: {
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primaryText,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'serif',
    }),
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.secondaryText,
    fontWeight: '500',
  },
  monthNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E6EBE4',
    shadowColor: '#15211B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  monthArrowBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primaryText,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'serif',
    }),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 13.5,
    color: Colors.inputText,
    padding: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  listContainer: {
    marginTop: 2,
  },
  centerContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12.5,
    color: Colors.secondaryText,
  },
  errorContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    marginTop: 10,
    fontSize: 13,
    color: Colors.expenseRed,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#0E5B42',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F1F5F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primaryText,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: Colors.secondaryText,
    textAlign: 'center',
    marginBottom: 18,
  },
  addEntryActionBtn: {
    backgroundColor: '#0E5B42',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
  },
  addEntryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
