import { createClient } from '@supabase/supabase-js';

// --- KONFIGURACJA SUPABASE ---
// Te stałe pobierają dane z Twojego ukrytego pliku .env.local.
// Dzięki temu nie wpisujesz haseł bezpośrednio w kodzie, co jest bezpieczniejsze.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Sprawdzamy czy klucze w ogóle istnieją. Jeśli nie, wyświetlamy ostrzeżenie w konsoli (F12).
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("UWAGA: Brakuje kluczy Supabase! Upewnij się, że plik .env.local zawiera poprawne dane.");
}

// Tworzymy "klienta" Supabase. To nasz główny obiekt, przez który będziemy:
// 1. Logować użytkowników
// 2. Pobierać dane z bazy
// 3. Zapisywać nowe notatki
// Używamy 'as any', aby TypeScript nie krzyczał o brakujące typy - to ułatwia naukę na początku.
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '') as any;
export const SUPABASE_CONFIGURED = !!(supabaseUrl && supabaseAnonKey);
