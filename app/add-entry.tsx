import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { LedgerBackground } from '../components/LedgerBackground';
import { BottomNavigation } from '../components/BottomNavigation';
import { DatePickerModal } from '../components/DatePickerModal';
import { useAuth } from '../context/AuthContext';
import {
  dailyEntryService,
  formatDisplayDate,
  getLocalDateString,
} from '../services/dailyEntryService';
import { shopService } from '../services/shopService';
import { DayType, OtherExpenseItem } from '../types/dailyEntry';
import { Shop } from '../types/shop';

const CATEGORY_OPTIONS = [
  'Business',
  'Personal',
  'Household',
  'Staff',
  'Transport',
  'Utilities',
  'Other',
];

export default function AddEntryScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const params = useLocalSearchParams<{ date?: string; entryId?: string }>();

  // Shop state
  const [shop, setShop] = useState<Shop | null>(null);
  const [loadingShop, setLoadingShop] = useState(true);

  // Form State
  const initialDate = params.date ? new Date(params.date) : new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(
    isNaN(initialDate.getTime()) ? new Date() : initialDate
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dayType, setDayType] = useState<DayType>('working');

  const [collection, setCollection] = useState('0');
  const [homeExpense, setHomeExpense] = useState('0');

  const [otherExpenses, setOtherExpenses] = useState<
    Array<{ id?: string; expense_name: string; amount: string; category: string }>
  >([]);
  const [notes, setNotes] = useState('');

  // Category selection modal state
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [activeExpenseIndexForCategory, setActiveExpenseIndexForCategory] = useState<number | null>(null);

  // Status state
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(params.entryId || null);
  const [isEditMode, setIsEditMode] = useState(!!params.entryId);
  const [loadingEntry, setLoadingEntry] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [collectionError, setCollectionError] = useState<string | null>(null);

  // Load user shop
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
        console.error('[AddEntryScreen] Shop load error:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingShop(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Load existing entry whenever date, entryId, or shop changes
  useEffect(() => {
    let isMounted = true;
    const dateStr = getLocalDateString(selectedDate);

    if (!shop?.id) return;

    setLoadingEntry(true);
    setErrorMessage(null);
    setCollectionError(null);

    const loadData = async () => {
      // If entryId was provided initially and dates match, load by ID or date
      if (params.entryId && isMounted) {
        const { data: idData, error: idError } = await dailyEntryService.getEntryById(params.entryId);
        if (!isMounted) return;
        if (idData) {
          setCurrentEntryId(idData.id);
          setIsEditMode(true);
          const entryDateObj = new Date(idData.entry_date);
          if (!isNaN(entryDateObj.getTime())) {
            setSelectedDate(entryDateObj);
          }
          setDayType(idData.day_type || 'working');
          setCollection(String(idData.collection));
          setHomeExpense(String(idData.home_expense));
          setNotes(idData.notes || '');
          setOtherExpenses(
            (idData.other_expenses || []).map((oe) => ({
              id: oe.id,
              expense_name: oe.expense_name,
              amount: String(oe.amount),
              category: oe.category || 'Business',
            }))
          );
          setLoadingEntry(false);
          return;
        }
      }

      // Query by date
      const { data, error } = await dailyEntryService.getEntryByDate(dateStr, shop.id);
      if (!isMounted) return;

      if (error) {
        console.warn('[AddEntryScreen] Check entry error:', error);
      }

      if (data) {
        // Entry exists for this date -> Edit Mode
        setCurrentEntryId(data.id);
        setIsEditMode(true);
        setDayType(data.day_type || 'working');
        setCollection(String(data.collection));
        setHomeExpense(String(data.home_expense));
        setNotes(data.notes || '');
        setOtherExpenses(
          (data.other_expenses || []).map((oe) => ({
            id: oe.id,
            expense_name: oe.expense_name,
            amount: String(oe.amount),
            category: oe.category || 'Business',
          }))
        );
      } else {
        // Fresh entry for this date -> Defaults
        if (!params.entryId) {
          setCurrentEntryId(null);
          setIsEditMode(false);
        }
        setDayType('working');
        setCollection('0');
        setHomeExpense('0');
        setNotes('');
        setOtherExpenses([]);
      }
      setLoadingEntry(false);
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [selectedDate, shop?.id, params.entryId]);

  // Date selection handler
  const handleDatePicked = (newDate: Date) => {
    setSelectedDate(newDate);
  };

  // Currency input sanitization: allow only digits and single decimal point
  const sanitizeNumericInput = (text: string): string => {
    let cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    return cleaned;
  };

  // Other expenses handlers
  const handleAddOtherExpense = () => {
    setOtherExpenses((prev) => [
      ...prev,
      { expense_name: '', amount: '0', category: 'Business' },
    ]);
  };

  const handleUpdateOtherExpenseName = (index: number, name: string) => {
    setOtherExpenses((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], expense_name: name };
      return updated;
    });
  };

  const handleUpdateOtherExpenseAmount = (index: number, amountText: string) => {
    const cleaned = sanitizeNumericInput(amountText);
    setOtherExpenses((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], amount: cleaned };
      return updated;
    });
  };

  const handleSelectCategory = (category: string) => {
    if (activeExpenseIndexForCategory !== null) {
      setOtherExpenses((prev) => {
        const updated = [...prev];
        updated[activeExpenseIndexForCategory] = {
          ...updated[activeExpenseIndexForCategory],
          category,
        };
        return updated;
      });
    }
    setCategoryModalVisible(false);
    setActiveExpenseIndexForCategory(null);
  };

  const handleRemoveOtherExpense = (index: number) => {
    setOtherExpenses((prev) => prev.filter((_, i) => i !== index));
  };

  // Save handler
  const handleSaveEntry = async () => {
    if (isSaving) return;
    setErrorMessage(null);
    setCollectionError(null);

    // Validate collection
    const collectionNum = parseFloat(collection);
    if (isNaN(collectionNum) || collection.trim() === '' || collectionNum < 0) {
      setCollectionError('Collection is required and must be 0 or greater.');
      return;
    }

    // Validate other expenses
    for (let i = 0; i < otherExpenses.length; i++) {
      const item = otherExpenses[i];
      if (!item.expense_name || item.expense_name.trim().length === 0) {
        setErrorMessage(`Please enter a name for other expense #${i + 1}.`);
        return;
      }
      const amt = parseFloat(item.amount);
      if (isNaN(amt) || amt < 0) {
        setErrorMessage(`Please enter a valid amount for "${item.expense_name}".`);
        return;
      }
    }

    const dateStr = getLocalDateString(selectedDate);
    const parsedHome = parseFloat(homeExpense) || 0;

    setIsSaving(true);

    try {
      // Check date collision if editing an existing entry and date is altered
      if (currentEntryId && shop?.id) {
        const { hasCollision } = await dailyEntryService.checkDateCollision(
          dateStr,
          currentEntryId,
          shop.id
        );
        if (hasCollision) {
          setErrorMessage('An entry already exists for this date.');
          setIsSaving(false);
          return;
        }
      }

      const { data, error } = await dailyEntryService.saveDailyEntry({
        entry_date: dateStr,
        day_type: dayType,
        collection: collectionNum,
        milk_expense: 0,
        vimal_expense: 0,
        home_expense: parsedHome,
        notes: notes.trim() || null,
        other_expenses: otherExpenses.map((oe) => ({
          expense_name: oe.expense_name.trim(),
          amount: parseFloat(oe.amount) || 0,
          category: oe.category || 'Business',
        })),
      });

      if (error) {
        console.error('[AddEntryScreen] Save failed:', error);
        setErrorMessage(
          error.message.includes('network')
            ? 'Unable to save entry. Please check your connection and try again.'
            : error.message || 'Failed to save entry. Please try again.'
        );
        return;
      }

      // Success -> navigate to entry detail if editing, otherwise Home
      if (currentEntryId) {
        router.replace({
          pathname: '/entry/[id]',
          params: { id: data?.daily_entry_id || currentEntryId },
        });
      } else {
        router.replace('/home');
      }
    } catch (err: any) {
      console.error('[AddEntryScreen] Unexpected save error:', err);
      setErrorMessage('An unexpected error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  // Bottom navigation handlers
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
    if (tab === 'logout') {
      await signOut();
      router.replace('/');
      return;
    }
  };

  const handleFloatingAdd = () => {
    // Already on Add Entry
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <LedgerBackground />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Header matching reference */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={22} color={Colors.primaryText} />
          </Pressable>
          <Text style={styles.headerTitle}>Add entry</Text>
        </View>

        {/* Loading Indicator for existing entry lookup */}
        {loadingEntry && (
          <View style={styles.loadingBanner}>
            <ActivityIndicator size="small" color={Colors.accentGreen} />
            <Text style={styles.loadingBannerText}>Loading entry for date...</Text>
          </View>
        )}

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* General Error Banner */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={Colors.errorText} />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          {/* 1. Date Field */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>
              Date <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <Pressable
              style={styles.dateInputContainer}
              onPress={() => setShowDatePicker(true)}
              accessibilityRole="button"
              accessibilityLabel="Select date"
            >
              <Text style={styles.dateText}>
                {formatDisplayDate(selectedDate)}
              </Text>
              <Ionicons name="calendar-outline" size={19} color="#15211B" />
            </Pressable>
          </View>

          {/* Date Picker Modal */}
          <DatePickerModal
            value={selectedDate}
            visible={showDatePicker}
            onChange={handleDatePicked}
            onClose={() => setShowDatePicker(false)}
          />

          {/* 2. Day Type Segmented Selector */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>Day type</Text>
            <View style={styles.dayTypeContainer}>
              <Pressable
                style={[
                  styles.dayTypeOption,
                  dayType === 'working' && styles.dayTypeOptionSelected,
                ]}
                onPress={() => setDayType('working')}
              >
                <Text
                  style={[
                    styles.dayTypeOptionText,
                    dayType === 'working' && styles.dayTypeOptionTextSelected,
                  ]}
                >
                  Working day
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.dayTypeOption,
                  dayType === 'holiday' && styles.dayTypeOptionSelected,
                ]}
                onPress={() => setDayType('holiday')}
              >
                <Text
                  style={[
                    styles.dayTypeOptionText,
                    dayType === 'holiday' && styles.dayTypeOptionTextSelected,
                  ]}
                >
                  Holiday
                </Text>
              </Pressable>
            </View>
          </View>

          {/* 3. Today's collection */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>
              Today's collection <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <View
              style={[
                styles.currencyInputContainer,
                collectionError ? styles.inputContainerError : null,
              ]}
            >
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.currencyTextInput}
                value={collection}
                onChangeText={(text) => {
                  setCollection(sanitizeNumericInput(text));
                  setCollectionError(null);
                }}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={Colors.inputPlaceholder}
              />
            </View>
            {collectionError && (
              <Text style={styles.fieldErrorText}>{collectionError}</Text>
            )}
          </View>


          {/* 5. Home expense */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>Home expense</Text>
            <View style={styles.currencyInputContainer}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.currencyTextInput}
                value={homeExpense}
                onChangeText={(text) =>
                  setHomeExpense(sanitizeNumericInput(text))
                }
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={Colors.inputPlaceholder}
              />
            </View>
          </View>

          {/* 6. Other expenses Section */}
          <View style={styles.fieldSection}>
            <View style={styles.otherExpensesHeader}>
              <Text style={styles.otherExpensesTitle}>Other expenses</Text>
              <Pressable
                style={styles.addExpenseButton}
                onPress={handleAddOtherExpense}
                accessibilityRole="button"
                accessibilityLabel="Add extra expense"
              >
                <Text style={styles.addExpenseButtonText}>+ Add expense</Text>
              </Pressable>
            </View>

            {otherExpenses.length === 0 ? (
              <Text style={styles.noExtraExpensesText}>
                No extra expenses added.
              </Text>
            ) : (
              <View style={styles.otherExpensesList}>
                {otherExpenses.map((item, index) => (
                  <View key={index} style={styles.otherExpenseCard}>
                    {/* Top Row: Name label + Input with Trash */}
                    <Text style={styles.expenseCardLabel}>Name</Text>
                    <View style={styles.expenseNameRow}>
                      <TextInput
                        style={styles.expenseNameInput}
                        value={item.expense_name}
                        onChangeText={(val) =>
                          handleUpdateOtherExpenseName(index, val)
                        }
                        placeholder="e.g. Sugar"
                        placeholderTextColor={Colors.inputPlaceholder}
                      />
                      <Pressable
                        style={styles.trashBtn}
                        onPress={() => handleRemoveOtherExpense(index)}
                        accessibilityRole="button"
                        accessibilityLabel="Delete expense"
                      >
                        <Ionicons
                          name="trash-outline"
                          size={19}
                          color="#94A3B8"
                        />
                      </Pressable>
                    </View>

                    {/* Bottom Row: Amount & Category side by side */}
                    <View style={styles.expenseCardBottomRow}>
                      {/* Left Column: Amount */}
                      <View style={styles.expenseCardHalfCol}>
                        <Text style={styles.expenseCardLabel}>Amount</Text>
                        <View style={styles.expenseAmountBox}>
                          <Text style={styles.expenseCurrencySymbol}>₹</Text>
                          <TextInput
                            style={styles.expenseAmountInput}
                            value={item.amount}
                            onChangeText={(val) =>
                              handleUpdateOtherExpenseAmount(index, val)
                            }
                            keyboardType="decimal-pad"
                            placeholder="0"
                            placeholderTextColor={Colors.inputPlaceholder}
                          />
                        </View>
                      </View>

                      {/* Right Column: Category */}
                      <View style={styles.expenseCardHalfCol}>
                        <Text style={styles.expenseCardLabel}>Category</Text>
                        <Pressable
                          style={styles.categoryPickerBtn}
                          onPress={() => {
                            setActiveExpenseIndexForCategory(index);
                            setCategoryModalVisible(true);
                          }}
                          accessibilityRole="button"
                          accessibilityLabel="Select expense category"
                        >
                          <Text
                            style={styles.categoryPickerText}
                            numberOfLines={1}
                          >
                            {item.category || 'Business'}
                          </Text>
                          <Ionicons
                            name="chevron-down"
                            size={16}
                            color="#64748B"
                          />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 7. Notes Field */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>Notes</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any extra notes..."
              placeholderTextColor={Colors.inputPlaceholder}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <Text style={styles.optionalSubtitle}>Optional</Text>
          </View>

          {/* 8. Save / Update Entry Button */}
          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              (pressed || isSaving) && styles.saveButtonPressed,
            ]}
            onPress={handleSaveEntry}
            disabled={isSaving}
            accessibilityRole="button"
            accessibilityLabel={isEditMode ? 'Update entry' : 'Save entry'}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>
                {isEditMode ? 'Update entry' : 'Save entry'}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Fixed Bottom Navigation matching screenshot */}
      <BottomNavigation
        activeTab="entries"
        onTabPress={handleTabPress}
        onAddPress={handleFloatingAdd}
      />

      {/* Category Selection Modal */}
      <Modal
        visible={categoryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setCategoryModalVisible(false);
          setActiveExpenseIndexForCategory(null);
        }}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => {
            setCategoryModalVisible(false);
            setActiveExpenseIndexForCategory(null);
          }}
        >
          <Pressable
            style={styles.categoryModalCard}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.categoryModalHeader}>
              <Text style={styles.categoryModalTitle}>Select Category</Text>
              <Pressable
                onPress={() => {
                  setCategoryModalVisible(false);
                  setActiveExpenseIndexForCategory(null);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Close category modal"
              >
                <Ionicons name="close" size={20} color={Colors.secondaryText} />
              </Pressable>
            </View>

            <View style={styles.categoryOptionsList}>
              {CATEGORY_OPTIONS.map((cat) => {
                const currentCat =
                  activeExpenseIndexForCategory !== null
                    ? otherExpenses[activeExpenseIndexForCategory]?.category || 'Business'
                    : 'Business';
                const isSelected = currentCat === cat;

                return (
                  <Pressable
                    key={cat}
                    style={[
                      styles.categoryOptionItem,
                      isSelected && styles.categoryOptionItemSelected,
                    ]}
                    onPress={() => handleSelectCategory(cat)}
                    accessibilityRole="button"
                    accessibilityLabel={`Category ${cat}`}
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        isSelected && styles.categoryOptionTextSelected,
                      ]}
                    >
                      {cat}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color="#0E5B42"
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    padding: 6,
    marginRight: 8,
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
  },
  loadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  loadingBannerText: {
    fontSize: 12,
    color: Colors.secondaryText,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 120, // Clearance for bottom navigation
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDECEC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 14,
    gap: 8,
  },
  errorBannerText: {
    color: Colors.errorText,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  fieldSection: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryText,
    marginBottom: 6,
  },
  requiredAsterisk: {
    color: '#C84B31',
    fontWeight: '700',
  },
  dateInputContainer: {
    height: 48,
    backgroundColor: Colors.inputBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.primaryText,
  },
  dayTypeContainer: {
    height: 44,
    backgroundColor: '#E4EAE0',
    borderRadius: 10,
    flexDirection: 'row',
    padding: 3,
  },
  dayTypeOption: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  dayTypeOptionSelected: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  dayTypeOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.secondaryText,
  },
  dayTypeOptionTextSelected: {
    color: Colors.primaryText,
    fontWeight: '600',
  },
  currencyInputContainer: {
    height: 48,
    backgroundColor: Colors.inputBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  inputContainerError: {
    borderColor: Colors.inputBorderError,
  },
  currencySymbol: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primaryText,
    marginRight: 6,
  },
  currencyTextInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontWeight: '500',
    color: Colors.inputText,
    padding: 0,
  },
  fieldErrorText: {
    fontSize: 11.5,
    color: Colors.errorText,
    marginTop: 4,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfColumn: {
    flex: 1,
  },
  otherExpensesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  otherExpensesTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.primaryText,
  },
  addExpenseButton: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  addExpenseButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0E5B42',
  },
  noExtraExpensesText: {
    fontSize: 12.5,
    fontStyle: 'italic',
    color: Colors.secondaryText,
    marginTop: 2,
  },
  otherExpensesList: {
    gap: 12,
    marginTop: 6,
  },
  otherExpenseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6ECE4',
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  expenseCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 5,
  },
  expenseNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expenseNameInput: {
    flex: 1,
    height: 42,
    backgroundColor: '#FAFDF9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    fontSize: 13.5,
    color: Colors.inputText,
  },
  trashBtn: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expenseCardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  expenseCardHalfCol: {
    flex: 1,
  },
  expenseAmountBox: {
    height: 42,
    backgroundColor: '#FAFDF9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  expenseCurrencySymbol: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.primaryText,
    marginRight: 4,
  },
  expenseAmountInput: {
    flex: 1,
    height: '100%',
    fontSize: 13.5,
    color: Colors.inputText,
    padding: 0,
  },
  categoryPickerBtn: {
    height: 42,
    backgroundColor: '#FAFDF9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  categoryPickerText: {
    fontSize: 13.5,
    color: Colors.inputText,
    fontWeight: '500',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  categoryModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  categoryModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 8,
  },
  categoryModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primaryText,
  },
  categoryOptionsList: {
    gap: 4,
  },
  categoryOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  categoryOptionItemSelected: {
    backgroundColor: '#EBF4F0',
  },
  categoryOptionText: {
    fontSize: 14,
    color: Colors.inputText,
    fontWeight: '500',
  },
  categoryOptionTextSelected: {
    color: '#0E5B42',
    fontWeight: '700',
  },
  notesInput: {
    minHeight: 84,
    backgroundColor: Colors.inputBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 14,
    color: Colors.inputText,
  },
  optionalSubtitle: {
    fontSize: 11.5,
    color: Colors.secondaryText,
    marginTop: 4,
  },
  saveButton: {
    height: 48,
    backgroundColor: '#0E5B42',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#0E5B42',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonPressed: {
    backgroundColor: '#093E2D',
    opacity: 0.92,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
