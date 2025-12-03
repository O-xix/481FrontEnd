import { createClient } from '@supabase/supabase-js';

// Access Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Best practice: Ensure the variables are defined before creating the client
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and/or anon key are missing from .env file.");
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
