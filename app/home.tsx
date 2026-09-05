import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { LedgerBackground } from '../components/LedgerBackground';
import { TodayEntryCard } from '../components/TodayEntryCard';
import { MonthlySummaryCard } from '../components/MonthlySummaryCard';
import { BottomNavigation } from '../components/BottomNavigation';
import { useAuth } from '../context/AuthContext';
import { shopService } from '../services/shopService';
import {
  dailyEntryService,
  getLocalDateString,
  MonthSummaryData,
} from '../services/dailyEntryService';
import { DailyEntry } from '../types/dailyEntry';
import { Shop } from '../types/shop';
import {
  calculateEntryFinancials,
  formatCurrency,
  formatRecentEntryDate,
  getDayOfWeek,
} from '../utils/entryCalculations';

export default function HomeScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loadingShop, setLoadingShop] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Today's entry state
  const [todayEntry, setTodayEntry] = useState<DailyEntry | null>(null);
  const [loadingTodayEntry, setLoadingTodayEntry] = useState(false);

  // Monthly summary state
  const [monthSummary, setMonthSummary] = useState<MonthSummaryData | null>(null);
  const [loadingMonthSummary, setLoadingMonthSummary] = useState(false);

  // Recent entries state
  const [recentEntries, setRecentEntries] = useState<DailyEntry[]>([]);
  const [loadingRecentEntries, setLoadingRecentEntries] = useState(false);

  // Current local device date details
  const today = new Date();
  const dayOfWeekName = today
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toUpperCase();
  const formattedTodayDate = today.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const todayDateStr = getLocalDateString(today);

  // Load authenticated user's shop profile from Supabase
  useEffect(() => {
    let isMounted = true;

    if (!user) {
      setShop(null);
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
        console.error('[HomeScreen] Error loading shop:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingShop(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Refresh home data on focus (today entry, monthly totals, recent entries)
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      if (!shop?.id) return;

      // 1. Fetch today's entry
      setLoadingTodayEntry(true);
      dailyEntryService
        .getEntryByDate(todayDateStr, shop.id)
        .then(({ data }) => {
          if (isMounted) {
            setTodayEntry(data);
          }
        })
        .catch((err) => {
          console.error('[HomeScreen] Error fetching today entry:', err);
        })
        .finally(() => {
          if (isMounted) setLoadingTodayEntry(false);
        });

      // 2. Fetch current month's summary
      setLoadingMonthSummary(true);
      dailyEntryService
        .getMonthSummary(today.getFullYear(), today.getMonth() + 1, shop.id)
        .then(({ data }) => {
          if (isMounted && data) {
            setMonthSummary(data);
          }
        })
        .catch((err) => {
          console.error('[HomeScreen] Error fetching month summary:', err);
        })
        .finally(() => {
          if (isMounted) setLoadingMonthSummary(false);
        });

      // 3. Fetch recent 5 entries
      setLoadingRecentEntries(true);
      dailyEntryService
        .getRecentEntries(5, shop.id)
        .then(({ data }) => {
          if (isMounted && data) {
            setRecentEntries(data);
          }
        })
        .catch((err) => {
          console.error('[HomeScreen] Error fetching recent entries:', err);
        })
        .finally(() => {
          if (isMounted) setLoadingRecentEntries(false);
        });

      return () => {
        isMounted = false;
      };
    }, [shop?.id, todayDateStr])
  );

  // Navigation handlers
  const handleOpenTodayAction = () => {
    if (todayEntry) {
      router.push({
        pathname: '/entry/[id]',
        params: { id: todayEntry.id },
      });
    } else {
      router.push({
        pathname: '/add-entry',
        params: { date: todayDateStr },
      });
    }
  };

  const handleFloatingAdd = () => {
    router.push({
      pathname: '/add-entry',
      params: { date: todayDateStr },
    });
  };

  const handleSeeAllEntries = () => {
    router.push('/entries');
  };

  const handleTabPress = async (tab: string) => {
    if (tab === 'entries') {
      router.push('/entries');
      return;
    }
    if (tab === 'logout') {
      if (isLoggingOut) return;
      setIsLoggingOut(true);
      try {
        await signOut();
        router.replace('/');
      } catch (err) {
        console.error('[HomeScreen] Logout error:', err);
      } finally {
        setIsLoggingOut(false);
      }
      return;
    }
  };

  // Header texts
  const displayedShopName = shop?.shop_name || (loadingShop ? 'Loading...' : 'Your Shop');
  const displayedOwnerGreeting = shop?.owner_name
    ? `Hi, ${shop.owner_name}`
    : loadingShop
    ? 'Hi, loading...'
    : 'Hi, there';

  // Calculate today's financials if entry exists
  const todayFinancials = todayEntry ? calculateEntryFinancials(todayEntry) : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Background ruled ledger lines */}
      <LedgerBackground />

      {/* Main Scrollable Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Top Greeting Header (Dynamic from Supabase) */}
        <View style={styles.greetingHeader}>
          <Text style={styles.shopName}>{displayedShopName}</Text>
          <Text style={styles.ownerGreeting}>{displayedOwnerGreeting}</Text>
        </View>

        {/* Today's Entry Card with live Supabase data matching Screen 1 */}
        <View style={styles.cardWrapper}>
          <TodayEntryCard
            dayOfWeek={dayOfWeekName}
            date={formattedTodayDate}
            emptyMessage="No entry recorded for today yet."
            onAddEntry={handleOpenTodayAction}
            hasEntry={!!todayEntry}
            collectionAmount={todayFinancials?.collection || 0}
            businessExpenseAmount={
              (todayFinancials?.businessExpense || 0) +
              (todayFinancials?.otherBusinessExpense || 0)
            }
            homeExpenseAmount={
              (todayFinancials?.homeExpense || 0) +
              (todayFinancials?.otherHomeExpense || 0)
            }
            profitAmount={todayFinancials?.profit || 0}
            dayType={todayEntry?.day_type || 'working'}
          />
        </View>

        {/* Monthly Summary Card with live monthly Supabase calculations */}
        <View style={styles.cardWrapper}>
          <MonthlySummaryCard
            collection={
              monthSummary ? formatCurrency(monthSummary.totalCollection) : '₹0'
            }
            expense={
              monthSummary ? formatCurrency(monthSummary.totalExpense) : '₹0'
            }
            profit={
              monthSummary ? formatCurrency(monthSummary.totalProfit) : '₹0'
            }
            workingDays={
              monthSummary
                ? `${monthSummary.workingDays} ${
                    monthSummary.workingDays === 1 ? 'working day' : 'working days'
                  }`
                : '0 working days'
            }
            holidays={
              monthSummary
                ? `${monthSummary.holidays} ${
                    monthSummary.holidays === 1 ? 'holiday' : 'holidays'
                  }`
                : '0 holidays'
            }
            onFullReport={handleSeeAllEntries}
          />
        </View>

        {/* Recent entries Section matching Screen 1 */}
        <View style={styles.cardWrapper}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent entries</Text>
            <Pressable
              onPress={handleSeeAllEntries}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="link"
              accessibilityLabel="See all recent entries"
            >
              <Text style={styles.seeAllLink}>See all</Text>
            </Pressable>
          </View>

          {loadingRecentEntries && recentEntries.length === 0 ? (
            <View style={styles.recentLoadingBox}>
              <ActivityIndicator size="small" color="#0E5B42" />
            </View>
          ) : recentEntries.length === 0 ? (
            <View style={styles.emptyRecentCard}>
              <Text style={styles.emptyRecentText}>No recent entries yet.</Text>
            </View>
          ) : (
            <View style={styles.recentEntriesCard}>
              {recentEntries.map((entry, index) => {
                const entryFin = calculateEntryFinancials(entry);
                const dateShort = formatRecentEntryDate(entry.entry_date);
                const dayName = getDayOfWeek(entry.entry_date);
                const isLast = index === recentEntries.length - 1;

                return (
                  <Pressable
                    key={entry.id}
                    style={({ pressed }) => [
                      styles.recentEntryRow,
                      !isLast && styles.recentEntryBorder,
                      pressed && styles.recentEntryRowPressed,
                    ]}
                    onPress={() =>
                      router.push({
                        pathname: '/entry/[id]',
                        params: { id: entry.id },
                      })
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`${dateShort} ${dayName}, profit ${formatCurrency(
                      entryFin.profit
                    )}`}
                  >
                    <View style={styles.recentEntryLeft}>
                      <Text style={styles.recentEntryDate}>{dateShort}</Text>
                      <Text style={styles.recentEntryDay}>{dayName}</Text>
                    </View>

                    <Text
                      style={[
                        styles.recentEntryProfit,
                        entryFin.profit < 0 ? styles.lossColor : styles.profitColor,
                      ]}
                    >
                      {formatCurrency(entryFin.profit)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fixed Bottom Navigation Bar */}
      <BottomNavigation
        activeTab="home"
        onTabPress={handleTabPress}
        onAddPress={handleFloatingAdd}
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
    paddingBottom: 110, // Avoid overlapping fixed bottom navigation
  },
  greetingHeader: {
    marginBottom: 20,
    paddingHorizontal: 2,
  },
  shopName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primaryText,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'serif',
    }),
    marginBottom: 2,
  },
  ownerGreeting: {
    fontSize: 11,
    color: Colors.secondaryText,
    fontWeight: '500',
  },
  cardWrapper: {
    marginBottom: 18,
    width: '100%',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.primaryText,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'serif',
    }),
  },
  seeAllLink: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0E5B42',
    textDecorationLine: 'underline',
  },
  recentEntriesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6EBE4',
    shadowColor: '#15211B',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  recentEntryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  recentEntryRowPressed: {
    backgroundColor: '#F7FAF5',
  },
  recentEntryBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4EE',
  },
  recentEntryLeft: {
    flex: 1,
  },
  recentEntryDate: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryText,
    marginBottom: 2,
  },
  recentEntryDay: {
    fontSize: 11.5,
    color: Colors.secondaryText,
    fontWeight: '500',
  },
  recentEntryProfit: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  profitColor: {
    color: '#0E5B42',
  },
  lossColor: {
    color: Colors.expenseRed,
  },
  emptyRecentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6EBE4',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyRecentText: {
    fontSize: 12.5,
    color: Colors.secondaryText,
    fontStyle: 'italic',
  },
  recentLoadingBox: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
