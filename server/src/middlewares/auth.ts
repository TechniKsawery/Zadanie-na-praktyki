import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin, supabasePublic } from '../config/supabase';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'OPTIONS') return next();

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Brak tokena' });

  const token = authHeader.split(' ')[1];

  try {
    // UŻYWAMY PUBLICZNEGO KLIENTA DO WERYFIKACJI TOKENA
    const { data: { user }, error } = await supabasePublic.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Nieautoryzowany' });
    }

    // TWORZYMY KLIENTA Z TOKENEM UŻYTKOWNIKA DLA RLS
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    (req as any).user = user;
    (req as any).supabase = userClient;

    // POBIERAMY ROLĘ (Z CACHEM LUB FALLBACKIEM)
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      (req as any).user.role = profile?.role || 'user';
    } catch {
      (req as any).user.role = 'user';
    }
    
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Błąd sesji' });
  }
};
