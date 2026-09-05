import { DailyEntry } from '../types/dailyEntry';
import { ReportSummary } from '../types/report';
import { calculateEntryFinancials, parseDateParts } from './entryCalculations';
import { getLocalDateString } from '../services/dailyEntryService';

/**
 * Returns the date range for Day filter ('this_day' or 'prev_day').
 */
export function getDayRange(
  type: 'this_day' | 'prev_day',
  refDate: Date = new Date()
): { startDate: string; endDate: string } {
  const d = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
  if (type === 'prev_day') {
    d.setDate(d.getDate() - 1);
  }
  const dateStr = getLocalDateString(d);
  return { startDate: dateStr, endDate: dateStr };
}

/**
 * Returns the date range for Week filter (Monday -> Sunday).
 */
export function getWeekRange(
  type: 'this_week' | 'last_week',
  refDate: Date = new Date()
): { startDate: string; endDate: string } {
  const d = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
  const day = d.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const diffToMonday = day === 0 ? 6 : day - 1;

  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - diffToMonday);
  if (type === 'last_week') {
    monday.setDate(monday.getDate() - 7);
  }
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);

  return {
    startDate: getLocalDateString(monday),
    endDate: getLocalDateString(sunday),
  };
}

/**
 * Returns the date range for Month filter (1st day to last day of month).
 */
export function getMonthRange(
  type: 'this_month' | 'last_month',
  refDate: Date = new Date()
): { startDate: string; endDate: string } {
  const year = refDate.getFullYear();
  const month = refDate.getMonth(); // 0-indexed

  let targetYear = year;
  let targetMonth = month;
  if (type === 'last_month') {
    targetMonth = month - 1;
    if (targetMonth < 0) {
      targetMonth = 11;
      targetYear -= 1;
    }
  }

  const firstDay = new Date(targetYear, targetMonth, 1);
  const lastDay = new Date(targetYear, targetMonth + 1, 0); // 0 gets last day of targetMonth

  return {
    startDate: getLocalDateString(firstDay),
    endDate: getLocalDateString(lastDay),
  };
}

/**
 * Computes the exclusive day after the given date for database queries:
 * entry_date >= startDate AND entry_date < nextDayAfterEnd
 */
export function getNextDayDate(dateStr: string): string {
  const { year, month, day } = parseDateParts(dateStr);
  const next = new Date(year, month - 1, day + 1);
  return getLocalDateString(next);
}

/**
 * Formats date range as "YYYY-MM-DD to YYYY-MM-DD"
 */
export function formatDateRange(startDate: string, endDate: string): string {
  return `${startDate} to ${endDate}`;
}

/**
 * Aggregates all entries inside a range into a ReportSummary object.
 */
export function calculateReportSummary(
  entries: DailyEntry[],
  startDate: string,
  endDate: string
): ReportSummary {
  let totalCollection = 0;
  let businessExpense = 0;
  let homeExpense = 0;
  let totalCashOutflow = 0;
  let businessProfit = 0;
  let workingDays = 0;
  let holidays = 0;

  for (const entry of entries) {
    const fin = calculateEntryFinancials(entry);
    totalCollection += fin.collection;
    businessExpense += (fin.businessExpense + fin.otherBusinessExpense);
    homeExpense += (fin.homeExpense + fin.otherHomeExpense);
    totalCashOutflow += fin.totalExpense;
    businessProfit += fin.profit;

    if (entry.day_type === 'holiday') {
      holidays += 1;
    } else {
      workingDays += 1;
    }
  }

  const averageDailyCollection =
    workingDays > 0 ? Math.round(totalCollection / workingDays) : 0;

  return {
    totalCollection,
    businessExpense,
    homeExpense,
    totalCashOutflow,
    businessProfit,
    averageDailyCollection,
    workingDays,
    holidays,
    startDate,
    endDate,
  };
}
