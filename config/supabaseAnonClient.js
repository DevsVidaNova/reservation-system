import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

export function createSupabaseAnonClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
}
