
// Supabase client: uses public NEXT_PUBLIC_* env vars (safe for client-side).
// Do NOT hardcode secrets here; Vercel environment variables should be used.
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Defensive runtime check to provide clearer error during build/dev
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env vars");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
