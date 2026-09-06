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
  'Others',
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
  const [shop, setShop] = useState<Shop | null>(shopService.getCachedShop());
  const [loadingShop, setLoadingShop] = useState(!shop);

  // Helper to parse YYYY-MM-DD safely into local timezone Date
  const parseDateStringToLocalDate = (str?: string): Date => {
    if (!str) return new Date();
    const parts = str.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return new Date(y, m, d);
    }
    return new Date(str);
  };

  // Synchronously retrieve cached entry if already fetched (e.g. from Detail screen or Month list)
  const cachedInitialEntry = params.entryId
    ? dailyEntryService.getCachedEntryById(params.entryId)
    : params.date
    ? dailyEntryService.getCachedEntryByDate(params.date, shop?.id)
    : null;

  // Form State
  const initialDate = cachedInitialEntry
    ? parseDateStringToLocalDate(cachedInitialEntry.entry_date)
    : parseDateStringToLocalDate(params.date);

  const [selectedDate, setSelectedDate] = useState<Date>(
    isNaN(initialDate.getTime()) ? new Date() : initialDate
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dayType, setDayType] = useState<DayType>(cachedInitialEntry?.day_type || 'working');

  const [collection, setCollection] = useState<string>(
    cachedInitialEntry ? String(cachedInitialEntry.collection) : '0'
  );
  const [homeExpense, setHomeExpense] = useState<string>(
    cachedInitialEntry ? String(cachedInitialEntry.home_expense) : '0'
  );

  const [otherExpenses, setOtherExpenses] = useState<
    Array<{ id?: string; expense_name: string; amount: string; category: string }>
  >(
    cachedInitialEntry?.other_expenses
      ? cachedInitialEntry.other_expenses.map((oe) => ({
          id: oe.id,
          expense_name: oe.expense_name,
          amount: String(oe.amount),
          category: oe.category || 'Business',
        }))
      : []
  );
  const [notes, setNotes] = useState<string>(cachedInitialEntry?.notes || '');

  // Inline category selector state (zero touch conflicts)
  const [expandedCategoryIndex, setExpandedCategoryIndex] = useState<number | null>(null);

  // Category selection modal state
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [activeExpenseIndexForCategory, setActiveExpenseIndexForCategory] = useState<number | null>(null);

  // Status state
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(
    cachedInitialEntry?.id || params.entryId || null
  );
  const [isEditMode, setIsEditMode] = useState(!!(cachedInitialEntry || params.entryId));
  const [loadingEntry, setLoadingEntry] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [collectionError, setCollectionError] = useState<string | null>(null);

  // Ref tracking what entry/date has been loaded so we don't duplicate loads
  const loadedKeyRef = React.useRef<string | null>(
    cachedInitialEntry ? (params.entryId ? `id_${params.entryId}` : `date_${params.date}`) : null
  );
  const initialEntryDateRef = React.useRef<string | null>(
    cachedInitialEntry?.entry_date || params.date || null
  );

  // Load user shop
  useEffect(() => {
    let isMounted = true;
    if (!user) {
      setLoadingShop(false);
      return;
    }

    const cached = shopService.getCachedShop();
    if (cached) {
      setShop(cached);
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

  // Load existing entry (by entryId or initial date)
  useEffect(() => {
    let isMounted = true;
    const currentKey = params.entryId
      ? `id_${params.entryId}`
      : `date_${params.date || getLocalDateString(selectedDate)}`;

    if (loadedKeyRef.current === currentKey) return;

    // If querying by date (no entryId), ensure shop is loaded first
    if (!params.entryId && !shop?.id) return;

    loadedKeyRef.current = currentKey;
    setLoadingEntry(!cachedInitialEntry);
    setErrorMessage(null);
    setCollectionError(null);

    const loadInitialData = async () => {
      // 1. If entryId was provided (edit mode from detail card)
      if (params.entryId) {
        const { data: idData } = await dailyEntryService.getEntryById(params.entryId);
        if (!isMounted) return;
        if (idData) {
          setCurrentEntryId(idData.id);
          setIsEditMode(true);
          initialEntryDateRef.current = idData.entry_date;
          setSelectedDate(parseDateStringToLocalDate(idData.entry_date));
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

      // 2. Query by initial date
      const activeShopId = shop?.id || shopService.getCachedShop()?.id;
      if (!activeShopId) {
        setLoadingEntry(false);
        return;
      }

      const dateStr = params.date || getLocalDateString(selectedDate);
      const { data } = await dailyEntryService.getEntryByDate(dateStr, activeShopId);
      if (!isMounted) return;

      if (data) {
        setCurrentEntryId(data.id);
        setIsEditMode(true);
        initialEntryDateRef.current = data.entry_date;
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
        setCurrentEntryId(null);
        setIsEditMode(false);
      }
      setLoadingEntry(false);
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [shop?.id, params.entryId, params.date]);

  // Date selection handler: explicitly checks entry for newly chosen date
  const handleDatePicked = async (newDate: Date) => {
    setSelectedDate(newDate);
    const dateStr = getLocalDateString(newDate);
    const activeShopId = shop?.id || shopService.getCachedShop()?.id;
    if (!activeShopId) return;

    setLoadingEntry(true);
    setErrorMessage(null);
    setCollectionError(null);

    try {
      const { data } = await dailyEntryService.getEntryByDate(dateStr, activeShopId);
      if (data) {
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
        setCurrentEntryId(null);
        setIsEditMode(false);
        setDayType('working');
        setCollection('0');
        setHomeExpense('0');
        setNotes('');
        setOtherExpenses([]);
      }
    } catch (err) {
      console.warn('[AddEntryScreen] Date change load error:', err);
    } finally {
      setLoadingEntry(false);
    }
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
    const targetIdx = activeExpenseIndexForCategory;
    if (targetIdx !== null && targetIdx >= 0) {
      setOtherExpenses((prev) => {
        if (!prev[targetIdx]) return prev;
        const updated = [...prev];
        updated[targetIdx] = {
          ...updated[targetIdx],
          category: category.trim(),
        };
        return updated;
      });
    }
    setCategoryModalVisible(false);
    setActiveExpenseIndexForCategory(null);
  };

  const handleSelectCategoryForIndex = (index: number, category: string) => {
    setOtherExpenses((prev) => {
      if (!prev[index]) return prev;
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        category: category.trim(),
      };
      return updated;
    });
    setExpandedCategoryIndex(null);
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
      // Check date collision only if editing an existing entry and date was actually altered
      if (
        currentEntryId &&
        shop?.id &&
        initialEntryDateRef.current &&
        initialEntryDateRef.current !== dateStr
      ) {
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
      router.replace('/reports');
      return;
    }
    if (tab === 'profile') {
      router.replace('/profile');
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
                  <View key={item.id || `oe_${index}`} style={styles.otherExpenseCard}>
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
                          style={[
                            styles.categoryPickerBtn,
                            expandedCategoryIndex === index && styles.categoryPickerBtnActive,
                          ]}
                          onPress={() => {
                            setExpandedCategoryIndex((curr) => (curr === index ? null : index));
                          }}
                          accessibilityRole="button"
                          accessibilityLabel="Select expense category"
                        >
                          <Text
                            style={[
                              styles.categoryPickerText,
                              expandedCategoryIndex === index && styles.categoryPickerTextActive,
                            ]}
                            numberOfLines={1}
                          >
                            {item.category || 'Business'}
                          </Text>
                          <Ionicons
                            name={expandedCategoryIndex === index ? 'chevron-up' : 'chevron-down'}
                            size={16}
                            color={expandedCategoryIndex === index ? '#0E5B42' : '#64748B'}
                          />
                        </Pressable>
                      </View>
                    </View>

                    {/* Inline Category Pills Selector (Instant tap, 0 touch bugs) */}
                    {expandedCategoryIndex === index && (
                      <View style={styles.inlineCategoryContainer}>
                        <Text style={styles.inlineCategoryHeading}>Tap to change category:</Text>
                        <View style={styles.inlineCategoryPillsRow}>
                          {CATEGORY_OPTIONS.map((cat) => {
                            const isSelected = (item.category || 'Business') === cat;
                            return (
                              <Pressable
                                key={cat}
                                style={[
                                  styles.inlineCategoryPill,
                                  isSelected && styles.inlineCategoryPillSelected,
                                ]}
                                onPress={() => {
                                  handleSelectCategoryForIndex(index, cat);
                                }}
                                accessibilityRole="button"
                                accessibilityLabel={`Select category ${cat}`}
                              >
                                <Text
                                  style={[
                                    styles.inlineCategoryPillText,
                                    isSelected && styles.inlineCategoryPillTextSelected,
                                  ]}
                                >
                                  {cat}
                                </Text>
                                {isSelected && (
                                  <Ionicons
                                    name="checkmark-circle"
                                    size={13}
                                    color="#FFFFFF"
                                    style={{ marginLeft: 3 }}
                                  />
                                )}
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    )}
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
        statusBarTranslucent
        onRequestClose={() => {
          setCategoryModalVisible(false);
          setActiveExpenseIndexForCategory(null);
        }}
      >
        <View style={styles.modalOverlay}>
          {/* Backdrop layer */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              setCategoryModalVisible(false);
              setActiveExpenseIndexForCategory(null);
            }}
            accessibilityRole="button"
            accessibilityLabel="Close modal backdrop"
          />

          {/* Modal Content Card */}
          <View style={styles.categoryModalCard}>
            <View style={styles.categoryModalHeader}>
              <Text style={styles.categoryModalTitle}>Select Category</Text>
              <Pressable
                onPress={() => {
                  setCategoryModalVisible(false);
                  setActiveExpenseIndexForCategory(null);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
                    style={({ pressed }) => [
                      styles.categoryOptionItem,
                      isSelected && styles.categoryOptionItemSelected,
                      pressed && styles.categoryOptionItemPressed,
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
          </View>
        </View>
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
  categoryPickerBtnActive: {
    borderColor: '#0E5B42',
    backgroundColor: '#F0F8F4',
  },
  categoryPickerTextActive: {
    color: '#0E5B42',
    fontWeight: '700',
  },
  inlineCategoryContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F6',
  },
  inlineCategoryHeading: {
    fontSize: 11.5,
    fontWeight: '600',
    color: Colors.secondaryText,
    marginBottom: 7,
  },
  inlineCategoryPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  inlineCategoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inlineCategoryPillSelected: {
    backgroundColor: '#0E5B42',
    borderColor: '#0E5B42',
  },
  inlineCategoryPillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
  },
  inlineCategoryPillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalOverlay: {
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
    zIndex: 1,
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
  categoryOptionItemPressed: {
    backgroundColor: '#E2ECE6',
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
