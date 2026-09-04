import { Shop } from './shop';
import { DailyEntry, OtherExpenseItem } from './dailyEntry';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      shops: {
        Row: Shop;
        Insert: {
          id?: string;
          user_id: string;
          shop_name: string;
          owner_name: string;
          email?: string | null;
          mobile?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          shop_name?: string;
          owner_name?: string;
          email?: string | null;
          mobile?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'shops_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      daily_entries: {
        Row: DailyEntry;
        Insert: {
          id?: string;
          shop_id: string;
          user_id: string;
          entry_date: string;
          day_type?: 'working' | 'holiday';
          collection?: number;
          milk_expense?: number;
          vimal_expense?: number;
          home_expense?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          user_id?: string;
          entry_date?: string;
          day_type?: 'working' | 'holiday';
          collection?: number;
          milk_expense?: number;
          vimal_expense?: number;
          home_expense?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'daily_entries_shop_id_fkey';
            columns: ['shop_id'];
            isOneToOne: false;
            referencedRelation: 'shops';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'daily_entries_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      other_expenses: {
        Row: OtherExpenseItem & {
          id: string;
          daily_entry_id: string;
          shop_id: string;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          daily_entry_id: string;
          shop_id: string;
          user_id: string;
          expense_name: string;
          amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          daily_entry_id?: string;
          shop_id?: string;
          user_id?: string;
          expense_name?: string;
          amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'other_expenses_daily_entry_id_fkey';
            columns: ['daily_entry_id'];
            isOneToOne: false;
            referencedRelation: 'daily_entries';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'other_expenses_shop_id_fkey';
            columns: ['shop_id'];
            isOneToOne: false;
            referencedRelation: 'shops';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'other_expenses_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      save_daily_entry: {
        Args: {
          p_entry_date: string;
          p_day_type: string;
          p_collection: number;
          p_milk_expense: number;
          p_vimal_expense: number;
          p_home_expense: number;
          p_notes: string | null;
          p_other_expenses: Json;
        };
        Returns: Json;
      };
      get_auth_email_for_mobile: {
        Args: {
          p_mobile: string;
        };
        Returns: string | null;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
