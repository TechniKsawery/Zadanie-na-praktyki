import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Funkcja obsługująca logowanie i rejestrację
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isRegistering) {
        // Rejestracja nowego użytkownika
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage({ text: 'Rejestracja pomyślna! Sprawdź e-mail (jeśli wymagane) lub zaloguj się.', type: 'success' });
      } else {
        // Logowanie istniejącego użytkownika
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Supabase automatycznie zaktualizuje sesję, App.tsx to wykryje
      }
    } catch (error: any) {
      setMessage({ text: error.message || 'Wystąpił błąd podczas autoryzacji', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '400px', marginTop: '10vh' }}>
      <div className="card fade-in">
        <h2 style={{ textAlign: 'center' }}>{isRegistering ? 'Stwórz konto' : 'Witaj ponownie'}</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          {isRegistering ? 'Zarejestruj się, aby zacząć' : 'Zaloguj się do swojego panelu'}
        </p>

        {message && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleAuth}>
          <div className="input-group">
            <label className="input-label">E-mail</label>
            <input 
              type="email" 
              placeholder="twoj@email.pl" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="input-group">
            <label className="input-label">Hasło (min. 6 znaków)</label>
            <input 
              type="password" 
              placeholder="********" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginBottom: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Przetwarzanie...' : (isRegistering ? 'Zarejestruj się' : 'Zaloguj się')}
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="btn btn-secondary"
            style={{ fontSize: '0.9rem', border: 'none' }}
          >
            {isRegistering ? 'Masz już konto? Zaloguj się' : 'Nie masz konta? Zarejestruj się'}
          </button>
        </div>
      </div>
    </div>
  );
}
