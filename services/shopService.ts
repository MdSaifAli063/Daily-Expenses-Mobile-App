import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { CreateShopInput, Shop, UpdateShopInput } from '../types/shop';
import { withRetry } from '../utils/networkResilience';

// In-memory cache and promise deduplication
let cachedShop: Shop | null = null;
let currentShopPromise: Promise<{ data: Shop | null; error: Error | null }> | null = null;

/**
 * Service handling database operations for the shops table.
 * All queries are strictly scoped by user_id and enforced by PostgreSQL Row Level Security (RLS).
 * Includes in-memory caching and request deduplication to prevent repeated network queries.
 */
export const shopService = {
  /**
   * Clears the in-memory shop cache (e.g. on logout or when switching users).
   */
  invalidateShopCache(): void {
    cachedShop = null;
    currentShopPromise = null;
  },

  /**
   * Retrieves the currently cached shop profile synchronously (if available).
   */
  getCachedShop(): Shop | null {
    return cachedShop;
  },

  /**
   * Retrieves the shop profile belonging to the specified authenticated user.
   * Utilizes in-memory cache and promise deduplication to prevent request storms.
   */
  async getCurrentShop(
    userId: string,
    forceRefresh: boolean = false
  ): Promise<{ data: Shop | null; error: Error | null }> {
    // Return cached shop if valid and not forcing a refresh
    if (!forceRefresh && cachedShop && cachedShop.user_id === userId) {
      return { data: cachedShop, error: null };
    }

    // Return in-flight promise if another request is already active
    if (currentShopPromise) {
      return currentShopPromise;
    }

    currentShopPromise = (async () => {
      try {
        const result = await withRetry(async () => {
          const { data, error } = await supabase
            .from('shops')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

          if (error) {
            throw error;
          }
          return data as Shop | null;
        });

        if (result) {
          cachedShop = result;
        }

        return { data: result, error: null };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch shop profile';
        console.error('[shopService.getCurrentShop] Database error:', message);
        return { data: null, error: new Error(message) };
      } finally {
        currentShopPromise = null;
      }
    })();

    return currentShopPromise;
  },

  /**
   * Creates a new shop profile for the authenticated user.
   * Handles duplicate creation safely (e.g. if profile already exists).
   */
  async createShop(shopInput: CreateShopInput): Promise<{ data: Shop | null; error: Error | null }> {
    try {
      // Check cached or existing profile first
      if (cachedShop && cachedShop.user_id === shopInput.user_id) {
        return { data: cachedShop, error: null };
      }

      const { data: existingShop } = await supabase
        .from('shops')
        .select('*')
        .eq('user_id', shopInput.user_id)
        .maybeSingle();

      if (existingShop) {
        cachedShop = existingShop as Shop;
        return { data: cachedShop, error: null };
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
        if (error.code === '23505') {
          return this.getCurrentShop(shopInput.user_id, true);
        }
        console.error('[shopService.createShop] Insert error:', error.message);
        return { data: null, error: new Error(error.message) };
      }

      const created = data as Shop;
      cachedShop = created;
      return { data: created, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create shop profile';
      return { data: null, error: new Error(message) };
    }
  },

  /**
   * Safe getter/fallback creator for post-email-confirmation logins.
   * If a user logs in and the shops row does not exist yet, creates it from signup metadata.
   */
  async getOrCreateShopForUser(
    user: User,
    forceRefresh: boolean = false
  ): Promise<{ data: Shop | null; error: Error | null }> {
    const { data: existingShop, error: fetchError } = await this.getCurrentShop(user.id, forceRefresh);
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
   * Updates the shop profile belonging to the current user and refreshes cache.
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

      const updated = data as Shop;
      cachedShop = updated;
      return { data: updated, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update shop profile';
      return { data: null, error: new Error(message) };
    }
  },
};
