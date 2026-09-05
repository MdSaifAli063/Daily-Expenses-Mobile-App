import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { LedgerBackground } from '../../components/LedgerBackground';
import { BottomNavigation } from '../../components/BottomNavigation';
import { useAuth } from '../../context/AuthContext';
import { dailyEntryService } from '../../services/dailyEntryService';
import { DailyEntry } from '../../types/dailyEntry';
import {
  calculateEntryFinancials,
  formatCurrency,
  formatEntryDate,
  getDayOfWeek,
} from '../../utils/entryCalculations';

export default function EntryDetailScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [entry, setEntry] = useState<DailyEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch or refresh entry details on screen focus
  const loadEntry = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const { data, error } = await dailyEntryService.getEntryById(id);
      if (error) {
        setErrorMessage('Unable to load entry details. Please try again.');
      } else if (!data) {
        setErrorMessage('Entry not found or has been deleted.');
      } else {
        setEntry(data);
      }
    } catch (err) {
      setErrorMessage('Unable to load entry details. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadEntry();
    }, [loadEntry])
  );

  // Back button handler
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/entries');
    }
  };

  // Edit button handler -> navigate to add-entry in edit mode
  const handleEdit = () => {
    if (!entry) return;
    router.push({
      pathname: '/add-entry',
      params: {
        entryId: entry.id,
        date: entry.entry_date,
      },
    });
  };

  // Delete button handler with native confirmation
  const handleDelete = () => {
    if (!entry || isDeleting) return;

    Alert.alert(
      'Delete entry?',
      'Are you sure you want to delete this daily entry? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const { success, error } = await dailyEntryService.deleteEntry(entry.id);
              if (error || !success) {
                Alert.alert('Error', 'Unable to delete this entry. Please try again.');
                setIsDeleting(false);
                return;
              }

              // Navigate back to entries list
              router.replace('/entries');
            } catch (err) {
              Alert.alert('Error', 'Unable to delete this entry. Please try again.');
              setIsDeleting(false);
            }
          },
        },
      ]
    );
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
      router.push('/reports');
      return;
    }
    if (tab === 'profile') {
      router.push('/profile');
      return;
    }
  };

  const handleFloatingAdd = () => {
    router.push('/add-entry');
  };

  // Render loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <LedgerBackground />
        <View style={styles.navHeader}>
          <Pressable
            style={styles.backBtn}
            onPress={handleBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.primaryText} />
          </Pressable>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color="#0E5B42" />
          <Text style={styles.loadingText}>Loading entry details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render error / not found state
  if (errorMessage || !entry) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <LedgerBackground />
        <View style={styles.navHeader}>
          <Pressable
            style={styles.backBtn}
            onPress={handleBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.primaryText} />
          </Pressable>
        </View>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={40} color={Colors.expenseRed} />
          <Text style={styles.errorText}>
            {errorMessage || 'Entry details could not be found.'}
          </Text>
          <Pressable style={styles.backActionButton} onPress={handleBack}>
            <Text style={styles.backActionButtonText}>Back to Entries</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate detailed financial metrics
  const financials = calculateEntryFinancials(entry);
  const formattedDate = formatEntryDate(entry.entry_date);
  const dayName = getDayOfWeek(entry.entry_date);
  const isHoliday = entry.day_type === 'holiday';
  const otherExpensesList = entry.other_expenses || [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <LedgerBackground />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation Header: ← Date & Day */}
        <View style={styles.navHeader}>
          <Pressable
            style={styles.backBtn}
            onPress={handleBack}
            hitSlop={{ top: 10, bottom: 10, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Back to entries"
          >
            <Ionicons name="arrow-back" size={24} color={Colors.primaryText} />
          </Pressable>

          <View style={styles.headerTitleCol}>
            <Text style={styles.headerDateText}>{formattedDate}</Text>
            <View style={styles.headerDayRow}>
              <Text style={styles.headerDayText}>{dayName}</Text>
              {isHoliday && (
                <View style={styles.holidayPill}>
                  <Text style={styles.holidayPillText}>Holiday</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Large Financial Breakdown Card matching Screen 3 */}
        <View style={styles.breakdownCard}>
          {/* Collection */}
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Collection</Text>
            <Text style={[styles.metricValue, styles.collectionText]}>
              {formatCurrency(financials.collection)}
            </Text>
          </View>

          {/* Business expense */}
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Business expense</Text>
            <Text style={[styles.metricValue, styles.expenseText]}>
              {formatCurrency(financials.businessExpense)}
            </Text>
          </View>

          {/* Other business expense */}
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Other business expense</Text>
            <Text style={[styles.metricValue, styles.expenseText]}>
              {formatCurrency(financials.otherBusinessExpense)}
            </Text>
          </View>

          {/* Home expense */}
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Home expense</Text>
            <Text style={[styles.metricValue, styles.expenseText]}>
              {formatCurrency(financials.homeExpense)}
            </Text>
          </View>

          {/* Other home expense */}
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Other home expense</Text>
            <Text style={[styles.metricValue, styles.expenseText]}>
              {formatCurrency(financials.otherHomeExpense)}
            </Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Profit */}
          <View style={[styles.metricRow, styles.profitMetricRow]}>
            <Text style={styles.profitLabel}>Profit</Text>
            <Text
              style={[
                styles.profitValue,
                financials.profit < 0 ? styles.expenseText : styles.collectionText,
              ]}
            >
              {formatCurrency(financials.profit)}
            </Text>
          </View>
        </View>

        {/* Individual Other Expenses Breakdown (if any exist) */}
        {otherExpensesList.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Other Expenses Details</Text>
            <View style={styles.otherExpensesList}>
              {otherExpensesList.map((item, idx) => (
                <View key={item.id || idx} style={styles.otherExpenseItemRow}>
                  <View style={styles.otherExpenseLeft}>
                    <Text style={styles.otherExpenseName}>{item.expense_name}</Text>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>
                        {item.category || 'Business'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.otherExpenseAmount}>
                    {formatCurrency(Number(item.amount) || 0)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Notes Section (if notes exist) */}
        {entry.notes && entry.notes.trim().length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{entry.notes}</Text>
          </View>
        )}

        {/* Action Buttons: Edit and Delete */}
        <View style={styles.actionsContainer}>
          {/* Edit Button */}
          <Pressable
            style={({ pressed }) => [
              styles.editButton,
              pressed && styles.editButtonPressed,
            ]}
            onPress={handleEdit}
            accessibilityRole="button"
            accessibilityLabel="Edit entry"
          >
            <Ionicons name="create-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.editButtonText}>Edit</Text>
          </Pressable>

          {/* Delete Button */}
          <Pressable
            style={({ pressed }) => [
              styles.deleteButton,
              (pressed || isDeleting) && styles.deleteButtonPressed,
            ]}
            onPress={handleDelete}
            disabled={isDeleting}
            accessibilityRole="button"
            accessibilityLabel="Delete entry"
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#DC2626" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={18} color="#DC2626" style={{ marginRight: 6 }} />
                <Text style={styles.deleteButtonText}>Delete</Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>

      {/* Fixed Bottom Navigation with floating '+' creating a new entry */}
      <BottomNavigation
        activeTab="entries"
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
    paddingTop: 12,
    paddingBottom: 110,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 2,
  },
  backBtn: {
    padding: 6,
    marginRight: 10,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerDateText: {
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
  headerDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerDayText: {
    fontSize: 13,
    color: Colors.secondaryText,
    fontWeight: '500',
  },
  holidayPill: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  holidayPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7E22CE',
  },
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E6EBE4',
    shadowColor: '#15211B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 13.5,
    color: Colors.secondaryText,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  collectionText: {
    color: '#0E5B42',
  },
  expenseText: {
    color: '#DC2626',
  },
  divider: {
    height: 1,
    backgroundColor: '#E8ECE6',
    marginVertical: 4,
  },
  profitMetricRow: {
    paddingTop: 4,
  },
  profitLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primaryText,
  },
  profitValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E6EBE4',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryText,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  otherExpensesList: {
    gap: 10,
  },
  otherExpenseItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  otherExpenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  otherExpenseName: {
    fontSize: 13.5,
    color: Colors.inputText,
    fontWeight: '500',
  },
  categoryBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryBadgeText: {
    fontSize: 10.5,
    color: '#475569',
    fontWeight: '500',
  },
  otherExpenseAmount: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#DC2626',
  },
  notesText: {
    fontSize: 13.5,
    color: Colors.inputText,
    lineHeight: 20,
  },
  actionsContainer: {
    marginTop: 8,
    gap: 12,
  },
  editButton: {
    height: 46,
    backgroundColor: '#0E5B42',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0E5B42',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  editButtonPressed: {
    backgroundColor: '#093E2D',
    opacity: 0.92,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  deleteButton: {
    height: 46,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonPressed: {
    backgroundColor: '#FEE2E2',
  },
  deleteButtonText: {
    color: '#DC2626',
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: Colors.secondaryText,
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.secondaryText,
    textAlign: 'center',
    marginBottom: 16,
  },
  backActionButton: {
    backgroundColor: '#0E5B42',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backActionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
