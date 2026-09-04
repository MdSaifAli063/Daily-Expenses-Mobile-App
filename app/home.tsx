import React, { useEffect, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { LedgerBackground } from '../components/LedgerBackground';
import { TodayEntryCard } from '../components/TodayEntryCard';
import { MonthlySummaryCard } from '../components/MonthlySummaryCard';
import { BottomNavigation } from '../components/BottomNavigation';
import { useAuth } from '../context/AuthContext';
import { shopService } from '../services/shopService';
import { Shop } from '../types/shop';

// Static mock data for financial and date placeholders in Phase 4
const STATIC_PLACEHOLDER_DATA = {
  dayOfWeek: 'FRIDAY',
  date: '04 Sept 2026',
  emptyMessage: 'No entry recorded for today yet.',
  collection: '₹0',
  expense: '₹0',
  profit: '₹0',
  workingDays: '0 working days',
  holidays: '0 holidays',
};

export default function HomeScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loadingShop, setLoadingShop] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Load authenticated user's shop profile from Supabase PostgreSQL
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

  const handleAddTodayEntry = () => {
    console.log("Add today's entry pressed");
  };

  const handleFullReport = () => {
    console.log('Full report pressed');
  };

  const handleAddExpense = () => {
    console.log('Add expense pressed');
  };

  const handleTabPress = async (tab: string) => {
    if (tab === 'logout') {
      if (isLoggingOut) return;
      setIsLoggingOut(true);
      console.log('Logout pressed - executing Supabase signOut');
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

  // Dynamic user & shop greeting derived from Supabase PostgreSQL
  const displayedShopName = shop?.shop_name || (loadingShop ? 'Loading...' : 'Your Shop');
  const displayedOwnerGreeting = shop?.owner_name
    ? `Hi, ${shop.owner_name}`
    : loadingShop
    ? 'Hi, loading...'
    : 'Hi, there';

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

        {/* Today's Entry Card (Phase 3 visual design preserved) */}
        <View style={styles.cardWrapper}>
          <TodayEntryCard
            dayOfWeek={STATIC_PLACEHOLDER_DATA.dayOfWeek}
            date={STATIC_PLACEHOLDER_DATA.date}
            emptyMessage={STATIC_PLACEHOLDER_DATA.emptyMessage}
            onAddEntry={handleAddTodayEntry}
          />
        </View>

        {/* Monthly Summary Card (Phase 3 visual design preserved) */}
        <View style={styles.cardWrapper}>
          <MonthlySummaryCard
            collection={STATIC_PLACEHOLDER_DATA.collection}
            expense={STATIC_PLACEHOLDER_DATA.expense}
            profit={STATIC_PLACEHOLDER_DATA.profit}
            workingDays={STATIC_PLACEHOLDER_DATA.workingDays}
            holidays={STATIC_PLACEHOLDER_DATA.holidays}
            onFullReport={handleFullReport}
          />
        </View>
      </ScrollView>

      {/* Fixed Bottom Navigation Bar */}
      <BottomNavigation
        activeTab="home"
        onTabPress={handleTabPress}
        onAddPress={handleAddExpense}
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
