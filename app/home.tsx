import React, { useCallback, useEffect, useState } from 'react';
import {
  Platform,
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
import { dailyEntryService, getLocalDateString } from '../services/dailyEntryService';
import { DailyEntry } from '../types/dailyEntry';
import { Shop } from '../types/shop';

export default function HomeScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loadingShop, setLoadingShop] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Today's entry state
  const [todayEntry, setTodayEntry] = useState<DailyEntry | null>(null);
  const [loadingTodayEntry, setLoadingTodayEntry] = useState(false);

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

  // Refresh today's entry on focus (so saving in AddEntry immediately updates Home)
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      if (!shop?.id) return;

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

      return () => {
        isMounted = false;
      };
    }, [shop?.id, todayDateStr])
  );

  // Navigation handlers
  const handleOpenAddEntry = () => {
    router.push({
      pathname: '/add-entry',
      params: { date: todayDateStr },
    });
  };

  const handleFullReport = () => {
    console.log('Full report pressed');
  };

  const handleTabPress = async (tab: string) => {
    if (tab === 'entries') {
      handleOpenAddEntry();
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
    console.log(`${tab.charAt(0).toUpperCase() + tab.slice(1)} pressed`);
  };

  // Header texts
  const displayedShopName = shop?.shop_name || (loadingShop ? 'Loading...' : 'Your Shop');
  const displayedOwnerGreeting = shop?.owner_name
    ? `Hi, ${shop.owner_name}`
    : loadingShop
    ? 'Hi, loading...'
    : 'Hi, there';

  // Calculate today's total expenses if entry exists
  const otherExpensesSum = (todayEntry?.other_expenses || []).reduce(
    (acc, oe) => acc + (Number(oe.amount) || 0),
    0
  );
  const totalTodayExpense = todayEntry
    ? (Number(todayEntry.milk_expense) || 0) +
      (Number(todayEntry.vimal_expense) || 0) +
      (Number(todayEntry.home_expense) || 0) +
      otherExpensesSum
    : 0;

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

        {/* Today's Entry Card with live Supabase data */}
        <View style={styles.cardWrapper}>
          <TodayEntryCard
            dayOfWeek={dayOfWeekName}
            date={formattedTodayDate}
            emptyMessage="No entry recorded for today yet."
            onAddEntry={handleOpenAddEntry}
            hasEntry={!!todayEntry}
            collectionAmount={Number(todayEntry?.collection) || 0}
            expenseAmount={totalTodayExpense}
            dayType={todayEntry?.day_type || 'working'}
          />
        </View>

        {/* Monthly Summary Card */}
        <View style={styles.cardWrapper}>
          <MonthlySummaryCard
            collection={`₹${(Number(todayEntry?.collection) || 0).toLocaleString('en-IN')}`}
            expense={`₹${totalTodayExpense.toLocaleString('en-IN')}`}
            profit={`₹${((Number(todayEntry?.collection) || 0) - totalTodayExpense).toLocaleString('en-IN')}`}
            workingDays={todayEntry?.day_type === 'working' ? '1 working day' : '0 working days'}
            holidays={todayEntry?.day_type === 'holiday' ? '1 holiday' : '0 holidays'}
            onFullReport={handleFullReport}
          />
        </View>
      </ScrollView>

      {/* Fixed Bottom Navigation Bar */}
      <BottomNavigation
        activeTab="home"
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
    paddingBottom: 110, // Generous clearance so content never overlaps fixed bottom navigation
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
});
