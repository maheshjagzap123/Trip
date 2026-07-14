/**
 * Typed environment variable reader.
 * All env vars must be prefixed with EXPO_PUBLIC_ to be available in the client bundle.
 * Never put service_role key here — it belongs only in Edge Functions.
 */

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase environment variables. Copy .env.example to .env and fill in your values.'
  );
}

export const env = {
  supabaseUrl: SUPABASE_URL,
  supabaseAnonKey: SUPABASE_ANON_KEY,
} as const;
