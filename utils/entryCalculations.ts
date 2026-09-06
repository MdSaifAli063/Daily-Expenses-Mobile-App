import { DailyEntry, OtherExpenseItem } from '../types/dailyEntry';

export const BUSINESS_CATEGORIES = ['Business', 'Staff', 'Transport', 'Utilities'];
export const HOME_CATEGORIES = ['Personal', 'Household'];
export const GENERAL_CATEGORIES = ['Other', 'Others'];

export interface EntryFinancialBreakdown {
  collection: number;
  businessExpense: number;
  otherBusinessExpense: number;
  otherExpense: number;
  homeExpense: number;
  otherHomeExpense: number;
  totalOtherExpense: number;
  totalHomeExpense: number;
  totalExpense: number;
  profit: number;
}

/**
 * Calculates the complete, consistent financial breakdown for an entry
 * based on current Phase 5 schema (no fixed milk/vimal expenses).
 */
export function calculateEntryFinancials(entry: DailyEntry): EntryFinancialBreakdown {
  const collection = Number(entry.collection) || 0;
  const fixedHomeExpense = Number(entry.home_expense) || 0;
  const otherExpenses: OtherExpenseItem[] = entry.other_expenses || [];

  let businessExpense = 0;
  let otherHomeExpense = 0;
  let otherExpense = 0;

  for (const item of otherExpenses) {
    const amount = Number(item.amount) || 0;
    const cat = item.category || 'Business';

    if (BUSINESS_CATEGORIES.includes(cat)) {
      businessExpense += amount;
    } else if (HOME_CATEGORIES.includes(cat)) {
      otherHomeExpense += amount;
    } else {
      // General or 'Others' category
      otherExpense += amount;
    }
  }

  const totalOtherExpense = businessExpense + otherHomeExpense + otherExpense;
  const totalHomeExpense = fixedHomeExpense + otherHomeExpense;
  const totalExpense = fixedHomeExpense + totalOtherExpense;
  const profit = collection - totalExpense;

  return {
    collection,
    businessExpense,
    otherBusinessExpense: otherExpense, // backwards-compatible alias
    otherExpense,
    homeExpense: fixedHomeExpense,
    otherHomeExpense,
    totalOtherExpense,
    totalHomeExpense,
    totalExpense,
    profit,
  };
}

/**
 * Formats a number with the Indian currency symbol and commas.
 * Example: 2000 -> "₹2,000", -500 -> "-₹500", 0 -> "₹0"
 */
export function formatCurrency(amount: number): string {
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString('en-IN');
  if (amount < 0) {
    return `-₹${formatted}`;
  }
  return `₹${formatted}`;
}

const MONTH_NAMES_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sept',
  'Oct',
  'Nov',
  'Dec',
];

const MONTH_NAMES_FULL = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/**
 * Parses YYYY-MM-DD safely into year, month (1-12), day without UTC shifting.
 */
export function parseDateParts(dateStr: string): { year: number; month: number; day: number } {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return {
      year: parseInt(parts[0], 10),
      month: parseInt(parts[1], 10),
      day: parseInt(parts[2], 10),
    };
  }
  const d = new Date(dateStr);
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
  };
}

/**
 * Formats YYYY-MM-DD into "DD MMM YYYY" (e.g. "05 Sept 2026").
 */
export function formatEntryDate(dateStr: string): string {
  const { year, month, day } = parseDateParts(dateStr);
  const dayStr = String(day).padStart(2, '0');
  const monthStr = MONTH_NAMES_SHORT[month - 1] || '';
  return `${dayStr} ${monthStr} ${year}`;
}

/**
 * Formats YYYY-MM-DD into "DD MMM" (e.g. "05 Sept").
 */
export function formatRecentEntryDate(dateStr: string): string {
  const { month, day } = parseDateParts(dateStr);
  const dayStr = String(day).padStart(2, '0');
  const monthStr = MONTH_NAMES_SHORT[month - 1] || '';
  return `${dayStr} ${monthStr}`;
}

/**
 * Returns the day of the week (e.g. "Saturday") for a YYYY-MM-DD string.
 */
export function getDayOfWeek(dateStr: string): string {
  const { year, month, day } = parseDateParts(dateStr);
  // Month is 0-indexed in JS Date constructor
  const d = new Date(year, month - 1, day);
  return DAY_NAMES[d.getDay()] || '';
}

/**
 * Returns formatted month title (e.g. "September 2026") for year & month (1-12).
 */
export function formatMonthTitle(year: number, month: number): string {
  const monthStr = MONTH_NAMES_FULL[month - 1] || '';
  return `${monthStr} ${year}`;
}
