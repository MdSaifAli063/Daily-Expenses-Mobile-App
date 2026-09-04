export type DayType = 'working' | 'holiday';

export interface OtherExpenseItem {
  id?: string;
  daily_entry_id?: string;
  shop_id?: string;
  user_id?: string;
  expense_name: string;
  amount: number;
  category?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DailyEntry {
  id: string;
  shop_id: string;
  user_id: string;
  entry_date: string;
  day_type: DayType;
  collection: number;
  milk_expense: number;
  vimal_expense: number;
  home_expense: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  other_expenses?: OtherExpenseItem[];
}

export interface SaveDailyEntryInput {
  entry_date: string; // YYYY-MM-DD
  day_type: DayType;
  collection: number;
  milk_expense?: number;
  vimal_expense?: number;
  home_expense: number;
  notes: string | null;
  other_expenses: Array<{ expense_name: string; amount: number; category?: string }>;
}

export interface SaveDailyEntryResult {
  success: boolean;
  daily_entry_id: string;
  entry_date: string;
}
