import { supabase } from '../lib/supabase';
import { Shop, UpdateShopInput } from '../types/shop';
import { shopService } from './shopService';

/**
 * Service handling database operations for user/shop profile.
 * All operations interact directly with public.shops and are scoped by user_id
 * under PostgreSQL Row Level Security (RLS).
 */
export const profileService = {
  /**
   * Fetches the shop profile belonging to the authenticated user.
   */
  async getProfile(userId: string): Promise<{ data: Shop | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('[profileService.getProfile] Database error:', error.message);
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as Shop | null, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load profile';
      return { data: null, error: new Error(message) };
    }
  },

  /**
   * Updates the shop profile details (shop name, owner name, mobile, email).
   */
  async updateProfile(
    userId: string,
    updates: UpdateShopInput
  ): Promise<{ data: Shop | null; error: Error | null }> {
    try {
      const payload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.shop_name !== undefined) {
        payload.shop_name = updates.shop_name.trim();
      }
      if (updates.owner_name !== undefined) {
        payload.owner_name = updates.owner_name.trim();
      }
      if (updates.mobile !== undefined) {
        payload.mobile = updates.mobile ? updates.mobile.trim() : null;
      }
      if (updates.email !== undefined) {
        payload.email = updates.email ? updates.email.trim().toLowerCase() : null;
      }

      const { data, error } = await supabase
        .from('shops')
        .update(payload)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('[profileService.updateProfile] Database error:', error.message);
        return { data: null, error: new Error(error.message) };
      }

      shopService.invalidateShopCache();
      return { data: data as Shop, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      return { data: null, error: new Error(message) };
    }
  },
};
