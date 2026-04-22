import { createClient } from '@supabase/supabase-js';

// Te dane pobierane są z pliku .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Jeśli brakuje danych, aplikacja wyświetli błąd w konsoli (pomocne przy debugowaniu)
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Brakuje kluczy Supabase! Sprawdź plik .env.local");
}

// Eksportujemy klienta jako 'any', aby uniknąć problemów z typami w tym prostym zadaniu
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '') as any;


