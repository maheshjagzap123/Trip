import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { env } from './env';

/**
 * Supabase client for use throughout the app.
 * Uses the anon key + RLS as the security gate.
 * Never use the service_role key in client code.
 * 
 * NOTE: We're not passing Database generic for now.
 * Once schema is stable, generate types with:
 * npx supabase gen types typescript --project-id kfqoleqlppvtmnzojgim > src/types/database.ts
 */
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
