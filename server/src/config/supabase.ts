import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
// Service role key - pomija RLS, tylko na backendzie!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('BRAK KLUCZY SUPABASE! Sprawdź plik .env');
}

// Klient admin (service role) - do zapisu danych, pomija RLS
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Klient publiczny (anon) - do weryfikacji tokenów użytkowników
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey);
