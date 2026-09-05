export type ReportFilterTab = 'day' | 'week' | 'month' | 'custom';
export type DaySubPeriod = 'this_day' | 'prev_day';
export type WeekSubPeriod = 'this_week' | 'last_week';
export type MonthSubPeriod = 'this_month' | 'last_month';

export type ReportType = 'day' | 'week' | 'month' | 'custom';
export type ReportFileType = 'pdf' | 'xlsx';

export interface ReportSummary {
  totalCollection: number;
  businessExpense: number;
  homeExpense: number;
  totalCashOutflow: number;
  businessProfit: number;
  averageDailyCollection: number;
  workingDays: number;
  holidays: number;
  startDate: string;
  endDate: string;
}

export interface ReportExpense {
  id: string;
  daily_entry_id?: string;
  expense_name: string;
  category: string;
  amount: number;
  entry_date: string;
}

export interface ReportDayEntry {
  id: string;
  entry_date: string;
  day_type: 'working' | 'holiday';
  collection: number;
  totalExpense: number;
  profit: number;
  notes: string | null;
}

export interface ReportData {
  summary: ReportSummary;
  expenses: ReportExpense[];
  dayEntries: ReportDayEntry[];
  periodLabel: string;
  reportType: ReportType;
}

export interface ReportExportRecord {
  id: string;
  user_id: string;
  shop_id: string;
  report_type: ReportType;
  start_date: string;
  end_date: string;
  file_type: ReportFileType;
  storage_path: string;
  file_name: string;
  created_at: string;
}
