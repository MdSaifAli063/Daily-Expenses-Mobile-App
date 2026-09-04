import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (
  !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseUrl === 'YOUR_SUPABASE_URL' ||
  supabaseAnonKey === 'YOUR_SUPABASE_PUBLISHABLE_KEY'
) {
  console.warn(
    '[Supabase Configuration] Missing or placeholder EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Please configure them in your .env file.'
  );
}

// Fallback to empty string for safe initialization during builds/tests
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
