import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { LedgerBackground } from '../components/LedgerBackground';
import { BottomNavigation } from '../components/BottomNavigation';
import { ReportFilterTabs } from '../components/ReportFilterTabs';
import { ReportPeriodSelector } from '../components/ReportPeriodSelector';
import { ReportSummaryCard } from '../components/ReportSummaryCard';
import { ExpenseBreakdownList } from '../components/ExpenseBreakdownList';
import { useAuth } from '../context/AuthContext';
import { shopService } from '../services/shopService';
import { reportService } from '../services/reportService';
import {
  DaySubPeriod,
  MonthSubPeriod,
  ReportData,
  ReportFilterTab,
  WeekSubPeriod,
} from '../types/report';
import { Shop } from '../types/shop';
import {
  formatCurrency,
  formatEntryDate,
  getDayOfWeek,
} from '../utils/entryCalculations';
import {
  formatDateRange,
  getDayRange,
  getMonthRange,
  getWeekRange,
} from '../utils/reportCalculations';
import { getLocalDateString } from '../services/dailyEntryService';

export default function ReportsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  // Shop state
  const [shop, setShop] = useState<Shop | null>(null);
  const [loadingShop, setLoadingShop] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Filter state (default: Week)
  const [activeTab, setActiveTab] = useState<ReportFilterTab>('week');
  const [daySubPeriod, setDaySubPeriod] = useState<DaySubPeriod>('this_day');
  const [weekSubPeriod, setWeekSubPeriod] = useState<WeekSubPeriod>('this_week');
  const [monthSubPeriod, setMonthSubPeriod] = useState<MonthSubPeriod>('this_month');

  // Custom date state (defaults to today)
  const todayStr = getLocalDateString(new Date());
  const [customStartDate, setCustomStartDate] = useState<string>(todayStr);
  const [customEndDate, setCustomEndDate] = useState<string>(todayStr);

  // Report data state
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loadingReport, setLoadingReport] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Export state
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

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
        console.error('[ReportsScreen] Error loading shop:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingShop(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Compute active date range based on filters
  const { startDate, endDate, isCustomRangeValid } = useMemo(() => {
    if (activeTab === 'day') {
      const range = getDayRange(daySubPeriod);
      return { ...range, isCustomRangeValid: true };
    }
    if (activeTab === 'week') {
      const range = getWeekRange(weekSubPeriod);
      return { ...range, isCustomRangeValid: true };
    }
    if (activeTab === 'month') {
      const range = getMonthRange(monthSubPeriod);
      return { ...range, isCustomRangeValid: true };
    }

    // Custom
    const isValid = customStartDate <= customEndDate;
    return {
      startDate: customStartDate,
      endDate: customEndDate,
      isCustomRangeValid: isValid,
    };
  }, [activeTab, daySubPeriod, weekSubPeriod, monthSubPeriod, customStartDate, customEndDate]);

  const formattedRange = formatDateRange(startDate, endDate);

  // Fetch report data
  const fetchReport = useCallback(
    async (isRefresh = false) => {
      if (!shop?.id || !isCustomRangeValid) return;

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoadingReport(true);
      }
      setErrorMessage(null);

      try {
        const { data, error } = await reportService.getReportData(
          startDate,
          endDate,
          shop.id,
          activeTab
        );

        if (error) {
          setErrorMessage('Unable to load report. Please check your connection and try again.');
        } else {
          setReportData(data);
        }
      } catch (err) {
        setErrorMessage('Unable to load report. Please check your connection and try again.');
      } finally {
        setLoadingReport(false);
        setRefreshing(false);
      }
    },
    [shop?.id, startDate, endDate, isCustomRangeValid, activeTab]
  );

  // Auto-refresh when tab, date range, or screen focus changes
  useFocusEffect(
    useCallback(() => {
      fetchReport();
    }, [fetchReport])
  );

  const handleRefresh = () => {
    fetchReport(true);
  };

  // Export handlers
  const handleDownloadPdf = async () => {
    if (!reportData || !shop || isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const { success, error } = await reportService.generateAndSavePdf(reportData, shop);
      if (!success || error) {
        Alert.alert('Export Error', 'Unable to generate PDF report. Please try again.');
      }
    } catch (err) {
      Alert.alert('Export Error', 'Unable to generate PDF report. Please try again.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!reportData || !shop || isExportingExcel) return;
    setIsExportingExcel(true);
    try {
      const { success, error } = await reportService.generateAndSaveExcel(reportData, shop);
      if (!success || error) {
        Alert.alert('Export Error', 'Unable to generate Excel report. Please try again.');
      }
    } catch (err) {
      Alert.alert('Export Error', 'Unable to generate Excel report. Please try again.');
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Bottom navigation tab click
  const handleTabPress = async (tab: string) => {
    if (tab === 'home') {
      router.replace('/home');
      return;
    }
    if (tab === 'entries') {
      router.replace('/entries');
      return;
    }
    if (tab === 'reports') {
      // Already on reports
      return;
    }
    if (tab === 'logout') {
      if (isLoggingOut) return;
      setIsLoggingOut(true);
      try {
        await signOut();
        router.replace('/');
      } catch (err) {
        console.error('[ReportsScreen] Logout error:', err);
      } finally {
        setIsLoggingOut(false);
      }
      return;
    }
  };

  const handleFloatingAdd = () => {
    router.push('/add-entry');
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
          <Text style={styles.headerTitle}>Reports</Text>
          <Text style={styles.headerSubtitle}>See how the shop is doing</Text>
        </View>

        {/* Filter Tabs: Day | Week | Month | Custom */}
        <ReportFilterTabs activeTab={activeTab} onSelectTab={setActiveTab} />

        {/* Period Selector Controls */}
        <ReportPeriodSelector
          activeTab={activeTab}
          daySubPeriod={daySubPeriod}
          onSelectDaySubPeriod={setDaySubPeriod}
          weekSubPeriod={weekSubPeriod}
          onSelectWeekSubPeriod={setWeekSubPeriod}
          monthSubPeriod={monthSubPeriod}
          onSelectMonthSubPeriod={setMonthSubPeriod}
          customStartDate={customStartDate}
          onSelectCustomStartDate={setCustomStartDate}
          customEndDate={customEndDate}
          onSelectCustomEndDate={setCustomEndDate}
          formattedRange={formattedRange}
          isCustomRangeValid={isCustomRangeValid}
        />

        {/* Content States */}
        {!isCustomRangeValid ? (
          <View style={styles.centerContainer}>
            <Ionicons name="calendar-outline" size={36} color={Colors.expenseRed} />
            <Text style={styles.errorText}>
              Start date must be before or equal to end date.
            </Text>
          </View>
        ) : loadingReport && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="small" color="#0E5B42" />
            <Text style={styles.loadingText}>Calculating report...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle-outline" size={36} color={Colors.expenseRed} />
            <Text style={styles.errorText}>{errorMessage}</Text>
            <Pressable style={styles.retryBtn} onPress={() => fetchReport()}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
          </View>
        ) : reportData ? (
          <>
            {/* 1. Summary Card */}
            <ReportSummaryCard summary={reportData.summary} />

            {/* 2. Export Buttons (PDF & Excel) */}
            <View style={styles.exportButtonsRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.exportBtn,
                  pressed && styles.exportBtnPressed,
                  isExportingPdf && styles.exportBtnDisabled,
                ]}
                onPress={handleDownloadPdf}
                disabled={isExportingPdf}
                accessibilityRole="button"
                accessibilityLabel="Download PDF report"
              >
                {isExportingPdf ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name="document-text-outline"
                      size={18}
                      color="#FFFFFF"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.exportBtnText}>Download PDF</Text>
                  </>
                )}
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.exportBtn,
                  styles.excelExportBtn,
                  pressed && styles.exportBtnPressed,
                  isExportingExcel && styles.exportBtnDisabled,
                ]}
                onPress={handleDownloadExcel}
                disabled={isExportingExcel}
                accessibilityRole="button"
                accessibilityLabel="Download Excel report"
              >
                {isExportingExcel ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name="grid-outline"
                      size={18}
                      color="#FFFFFF"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.exportBtnText}>Download Excel</Text>
                  </>
                )}
              </Pressable>
            </View>

            {/* 3. Expense Breakdown */}
            <ExpenseBreakdownList expenses={reportData.expenses} />

            {/* 4. Day-by-Day Section */}
            <View style={styles.dayByDaySection}>
              <Text style={styles.sectionTitle}>Day by day</Text>
              {reportData.dayEntries.length === 0 ? (
                <View style={styles.emptyDayByDayCard}>
                  <Text style={styles.emptyDayByDayText}>
                    No daily records found for this period.
                  </Text>
                </View>
              ) : (
                <View style={styles.dayEntriesList}>
                  {reportData.dayEntries.map((d) => (
                    <Pressable
                      key={d.id}
                      style={({ pressed }) => [
                        styles.dayCard,
                        pressed && styles.dayCardPressed,
                      ]}
                      onPress={() =>
                        router.push({
                          pathname: '/entry/[id]',
                          params: { id: d.id },
                        })
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`Entry for ${formatEntryDate(d.entry_date)}`}
                    >
                      <View style={styles.dayCardLeft}>
                        <Text style={styles.dayCardDate}>
                          {formatEntryDate(d.entry_date)}
                        </Text>
                        <View style={styles.dayCardRow}>
                          <Text style={styles.dayCardDay}>
                            {getDayOfWeek(d.entry_date)}
                          </Text>
                          {d.day_type === 'holiday' && (
                            <View style={styles.holidayBadge}>
                              <Text style={styles.holidayBadgeText}>Holiday</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <View style={styles.dayCardRight}>
                        <Text
                          style={[
                            styles.dayCardProfit,
                            d.profit < 0 ? styles.lossColor : styles.profitColor,
                          ]}
                        >
                          {formatCurrency(d.profit)}
                        </Text>
                        <Text style={styles.profitCaption}>
                          {d.profit < 0 ? 'loss' : 'profit'}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </>
        ) : null}
      </ScrollView>

      {/* Fixed Bottom Navigation with Reports Tab Active */}
      <BottomNavigation
        activeTab="reports"
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
    paddingBottom: 110, // Generous clearance for bottom navigation
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
  exportButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  exportBtn: {
    flex: 1,
    height: 44,
    backgroundColor: '#0E5B42',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0E5B42',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  excelExportBtn: {
    backgroundColor: '#1E4032',
  },
  exportBtnPressed: {
    opacity: 0.88,
  },
  exportBtnDisabled: {
    opacity: 0.65,
  },
  exportBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  dayByDaySection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.primaryText,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  dayEntriesList: {
    gap: 10,
  },
  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6EBE4',
    shadowColor: '#15211B',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1.5,
  },
  dayCardPressed: {
    backgroundColor: '#F9FBF8',
  },
  dayCardLeft: {
    flex: 1,
  },
  dayCardDate: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primaryText,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'serif',
    }),
    marginBottom: 3,
  },
  dayCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dayCardDay: {
    fontSize: 12,
    color: Colors.secondaryText,
    fontWeight: '500',
  },
  holidayBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  holidayBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#7E22CE',
  },
  dayCardRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 12,
  },
  dayCardProfit: {
    fontSize: 16,
    fontWeight: '700',
  },
  profitColor: {
    color: '#0E5B42',
  },
  lossColor: {
    color: '#DC2626',
  },
  profitCaption: {
    fontSize: 11,
    color: Colors.secondaryText,
    marginTop: 2,
    textTransform: 'lowercase',
  },
  emptyDayByDayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6EBE4',
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDayByDayText: {
    fontSize: 12.5,
    color: Colors.secondaryText,
    fontStyle: 'italic',
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
  errorText: {
    marginTop: 10,
    fontSize: 13,
    color: Colors.expenseRed,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: '#0E5B42',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
