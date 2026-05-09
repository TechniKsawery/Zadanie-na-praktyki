import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

// TU POBIERAMY ADRES BAZY I KLUCZ, KTÓRE SĄ UKRYTE W PLIKU .ENV DLA BEZPIECZEŃSTWA
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

// TO JEST "STRAŻNIK" KAŻDEGO ZAPYTANIA – SPRAWDZA, CZY UŻYTKOWNIK JEST ZALOGOWANY
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // TU POZWALAMY NA ZAPYTANIA "OPTIONS" (PRE-FLIGHT) BEZ SPRAWDZANIA TOKENA.
  // BEZ TEGO PRZEGLĄDARKA ZABLOKUJE USUWANIE (DELETE).
  if (req.method === 'OPTIONS') return next();

  // TU WYCIĄGAMY TOKEN Z NAGŁÓWKA "Authorization", KTÓRY PRZYSŁAŁ NAM FRONTEND
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Brak tokena autoryzacji' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // TU TWORZYMY KLIENTA SUPABASE, ŻEBY ZWERYFIKOWAĆ TEN TOKEN
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // TU PYTAMY SUPABASE: "CZY TEN TOKEN NALEŻY DO ŻYWEGO CZŁOWIEKA?"
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error("Błąd weryfikacji tokena:", error?.message);
      return res.status(401).json({ error: 'Nieprawidłowy token' });
    }

    // TU DZIEJE SIĘ MAGIA: TWORZYMY NOWEGO KLIENTA Z TOKENEM UŻYTKOWNIKA.
    // DZIĘKI TEMU BAZA DANYCH BĘDZIE WIEDZIAŁA, ŻE TO TEN KONKRETNY UŻYTKOWNIK CHCE COŚ ZROBIĆ (RLS).
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    // TU ZAPISUJEMY DANE UŻYTKOWNIKA I JEGO POŁĄCZENIE DO OBIEKTU "req"
    (req as any).user = user;
    (req as any).supabase = userClient;

    // ETAP 4: POBIERAMY ROLĘ UŻYTKOWNIKA Z TABELI PROFILES
    const { data: profile } = await userClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profile) {
      (req as any).user.role = profile.role;
    }
    
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Błąd autoryzacji' });
  }
};
