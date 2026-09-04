import { supabase } from '../lib/supabase';
import { DailyEntry, SaveDailyEntryInput, SaveDailyEntryResult } from '../types/dailyEntry';

/**
 * Returns YYYY-MM-DD in local device timezone (avoiding UTC offset shifting).
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats YYYY-MM-DD or Date to DD/MM/YYYY for UI display.
 */
export function formatDisplayDate(dateInput: Date | string): string {
  if (typeof dateInput === 'string') {
    const parts = dateInput.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Converts DD/MM/YYYY to YYYY-MM-DD for database storage.
 */
export function parseDisplayDateToDb(displayStr: string): string {
  const parts = displayStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return displayStr;
}

export const dailyEntryService = {
  /**
   * Retrieves a single daily entry by date (YYYY-MM-DD) along with its other_expenses.
   */
  async getEntryByDate(
    dateStr: string,
    shopId?: string
  ): Promise<{ data: DailyEntry | null; error: Error | null }> {
    try {
      let query = supabase
        .from('daily_entries')
        .select(`
          id,
          shop_id,
          user_id,
          entry_date,
          day_type,
          collection,
          milk_expense,
          vimal_expense,
          home_expense,
          notes,
          created_at,
          updated_at,
          other_expenses (
            id,
            daily_entry_id,
            shop_id,
            user_id,
            expense_name,
            amount,
            category,
            created_at,
            updated_at
          )
        `)
        .eq('entry_date', dateStr);

      if (shopId) {
        query = query.eq('shop_id', shopId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      if (!data) {
        return { data: null, error: null };
      }

      const entry: DailyEntry = {
        id: data.id,
        shop_id: data.shop_id,
        user_id: data.user_id,
        entry_date: data.entry_date,
        day_type: data.day_type as 'working' | 'holiday',
        collection: Number(data.collection) || 0,
        milk_expense: Number(data.milk_expense) || 0,
        vimal_expense: Number(data.vimal_expense) || 0,
        home_expense: Number(data.home_expense) || 0,
        notes: data.notes || null,
        created_at: data.created_at,
        updated_at: data.updated_at,
        other_expenses: (data.other_expenses || []).map((oe: any) => ({
          id: oe.id,
          daily_entry_id: oe.daily_entry_id,
          shop_id: oe.shop_id,
          user_id: oe.user_id,
          expense_name: oe.expense_name,
          amount: Number(oe.amount) || 0,
          category: oe.category || 'Business',
          created_at: oe.created_at,
          updated_at: oe.updated_at,
        })),
      };

      return { data: entry, error: null };
    } catch (err: any) {
      console.error('[dailyEntryService.getEntryByDate] Unexpected error:', err);
      return { data: null, error: err };
    }
  },

  /**
   * Saves or updates a daily entry atomically using the PostgreSQL RPC save_daily_entry,
   * with automatic client-side fallback if the RPC has not yet been executed in Supabase.
   */
  async saveDailyEntry(
    input: SaveDailyEntryInput
  ): Promise<{ data: SaveDailyEntryResult | null; error: Error | null }> {
    try {
      // 1. Try atomic PostgreSQL RPC first
      const { data: rpcData, error: rpcError } = await supabase.rpc('save_daily_entry', {
        p_entry_date: input.entry_date,
        p_day_type: input.day_type,
        p_collection: input.collection,
        p_milk_expense: input.milk_expense,
        p_vimal_expense: input.vimal_expense,
        p_home_expense: input.home_expense,
        p_notes: input.notes,
        p_other_expenses: input.other_expenses,
      });

      if (!rpcError && rpcData) {
        const result = rpcData as unknown as SaveDailyEntryResult;
        return { data: result, error: null };
      }

      // If RPC failed for a reason other than missing RPC function, return error
      const isMissingRpc =
        rpcError &&
        (rpcError.message.includes('function') ||
          rpcError.message.includes('not found') ||
          rpcError.code === 'PGRST202');

      if (!isMissingRpc && rpcError) {
        console.error('[dailyEntryService.saveDailyEntry] RPC error:', rpcError);
        return { data: null, error: new Error(rpcError.message) };
      }

      // 2. Direct client fallback for resilience
      console.warn(
        '[dailyEntryService.saveDailyEntry] RPC not found or unavailable, executing direct client upsert fallback'
      );

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { data: null, error: new Error('User not authenticated') };
      }

      // Look up user's shop
      const { data: shop, error: shopError } = await supabase
        .from('shops')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (shopError || !shop) {
        return { data: null, error: new Error('Shop profile not found for user') };
      }

      // Upsert daily_entry
      const { data: entryData, error: entryError } = await supabase
        .from('daily_entries')
        .upsert(
          {
            shop_id: shop.id,
            user_id: user.id,
            entry_date: input.entry_date,
            day_type: input.day_type,
            collection: input.collection,
            milk_expense: input.milk_expense,
            vimal_expense: input.vimal_expense,
            home_expense: input.home_expense,
            notes: input.notes?.trim() || null,
          },
          {
            onConflict: 'shop_id,entry_date',
          }
        )
        .select('id')
        .single();

      if (entryError || !entryData) {
        return {
          data: null,
          error: new Error(entryError?.message || 'Failed to save daily entry'),
        };
      }

      const dailyEntryId = entryData.id;

      // Delete existing other expenses
      await supabase.from('other_expenses').delete().eq('daily_entry_id', dailyEntryId);

      // Insert new other expenses if any
      const validOtherExpenses = (input.other_expenses || [])
        .filter((oe) => oe.expense_name && oe.expense_name.trim().length > 0)
        .map((oe) => ({
          daily_entry_id: dailyEntryId,
          shop_id: shop.id,
          user_id: user.id,
          expense_name: oe.expense_name.trim(),
          amount: Number(oe.amount) || 0,
          category: oe.category || 'Business',
        }));

      if (validOtherExpenses.length > 0) {
        const { error: oeError } = await supabase
          .from('other_expenses')
          .insert(validOtherExpenses);

        if (oeError) {
          console.error('[dailyEntryService] Failed to insert other expenses:', oeError);
        }
      }

      return {
        data: {
          success: true,
          daily_entry_id: dailyEntryId,
          entry_date: input.entry_date,
        },
        error: null,
      };
    } catch (err: any) {
      console.error('[dailyEntryService.saveDailyEntry] Unexpected error:', err);
      return { data: null, error: err };
    }
  },
};
