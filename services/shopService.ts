import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { CreateShopInput, Shop, UpdateShopInput } from '../types/shop';

/**
 * Service handling database operations for the shops table.
 * All queries are strictly scoped by user_id and enforced by PostgreSQL Row Level Security (RLS).
 */
export const shopService = {
  /**
   * Retrieves the shop profile belonging to the specified authenticated user.
   */
  async getCurrentShop(userId: string): Promise<{ data: Shop | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('[shopService.getCurrentShop] Database error:', error.message);
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as Shop | null, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch shop profile';
      return { data: null, error: new Error(message) };
    }
  },

  /**
   * Creates a new shop profile for the authenticated user.
   * Handles duplicate creation safely (e.g. if profile already exists).
   */
  async createShop(shopInput: CreateShopInput): Promise<{ data: Shop | null; error: Error | null }> {
    try {
      // First check if profile already exists for this user to avoid duplicates
      const { data: existingShop } = await supabase
        .from('shops')
        .select('*')
        .eq('user_id', shopInput.user_id)
        .maybeSingle();

      if (existingShop) {
        return { data: existingShop as Shop, error: null };
      }

      const { data, error } = await supabase
        .from('shops')
        .insert({
          user_id: shopInput.user_id,
          shop_name: shopInput.shop_name.trim(),
          owner_name: shopInput.owner_name.trim(),
          email: shopInput.email?.trim().toLowerCase() || null,
          mobile: shopInput.mobile?.trim() || null,
        })
        .select()
        .single();

      if (error) {
        // If race condition hit unique constraint (code 23505), fetch the existing row
        if (error.code === '23505') {
          return this.getCurrentShop(shopInput.user_id);
        }
        console.error('[shopService.createShop] Insert error:', error.message);
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as Shop, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create shop profile';
      return { data: null, error: new Error(message) };
    }
  },

  /**
   * Safe getter/fallback creator for post-email-confirmation logins.
   * If a user logs in and the shops row does not exist yet, creates it from signup metadata.
   */
  async getOrCreateShopForUser(user: User): Promise<{ data: Shop | null; error: Error | null }> {
    const { data: existingShop, error: fetchError } = await this.getCurrentShop(user.id);
    if (existingShop) {
      return { data: existingShop, error: null };
    }

    // Attempt to recover profile from user metadata if available
    const meta = user.user_metadata || {};
    if (meta.shop_name && meta.owner_name) {
      return this.createShop({
        user_id: user.id,
        shop_name: meta.shop_name,
        owner_name: meta.owner_name,
        email: user.email || meta.email || null,
        mobile: meta.mobile || null,
      });
    }

    return { data: null, error: fetchError };
  },

  /**
   * Updates the shop profile belonging to the current user.
   */
  async updateCurrentShop(
    userId: string,
    updates: UpdateShopInput
  ): Promise<{ data: Shop | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('shops')
        .update({
          ...(updates.shop_name && { shop_name: updates.shop_name.trim() }),
          ...(updates.owner_name && { owner_name: updates.owner_name.trim() }),
          ...(updates.email !== undefined && { email: updates.email?.trim().toLowerCase() || null }),
          ...(updates.mobile !== undefined && { mobile: updates.mobile?.trim() || null }),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('[shopService.updateCurrentShop] Update error:', error.message);
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as Shop, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update shop profile';
      return { data: null, error: new Error(message) };
    }
  },
};
