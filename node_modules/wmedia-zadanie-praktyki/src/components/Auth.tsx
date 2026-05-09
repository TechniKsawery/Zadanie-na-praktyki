import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

// --- KOMPONENT AUTORYZACJI (LOGOWANIE / REJESTRACJA) ---
export default function Auth() {
  // Stany formularza (to co wpisuje użytkownik)
  const [loading, setLoading] = useState(false); // Czy trwa właśnie wysyłanie danych?
  const [email, setEmail] = useState('');       // Wpisany email
  const [password, setPassword] = useState(''); // Wpisane hasło
  // Wiadomość o błędzie lub sukcesie (czerwona/zielona ramka)
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);
  // Przełącznik: true = rejestracja, false = logowanie
  const [isRegistering, setIsRegistering] = useState(false);

  // Funkcja, która uruchamia się po kliknięciu przycisku "Zaloguj" lub "Zarejestruj"
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault(); // Blokujemy przeładowanie całej strony
    setLoading(true);   // Włączamy animację ładowania
    setMessage(null);   // Czyścimy stare wiadomości

    try {
      if (isRegistering) {
        // --- OPCJA: REJESTRACJA ---
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error; // Jeśli baza zwróci błąd, przejdź do sekcji 'catch'
        setMessage({ 
          text: 'Rejestracja pomyślna! Możesz się teraz zalogować.', 
          type: 'success' 
        });
      } else {
        // --- OPCJA: LOGOWANIE ---
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Po udanym logowaniu Supabase zmieni sesję, a App.tsx automatycznie nas przełączy.
      }
    } catch (error: any) {
      // Wyświetlamy błąd użytkownikowi (np. "złe hasło" lub "użytkownik już istnieje")
      setMessage({ text: error.message || 'Wystąpił błąd podczas autoryzacji', type: 'error' });
    } finally {
      setLoading(false); // Wyłączamy ładowanie niezależnie od wyniku
    }
  };

  return (
    <div className="container" style={{ maxWidth: '400px', marginTop: '10vh' }}>
      <div className="card fade-in">
        <h2 style={{ textAlign: 'center' }}>
          {isRegistering ? 'Stwórz konto' : 'Witaj ponownie'}
        </h2>
        
        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          {isRegistering ? 'Zarejestruj się, aby zacząć' : 'Zaloguj się do swojego panelu'}
        </p>

        {/* Wyświetlanie alertów (komunikatów) */}
        {message && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleAuth}>
          {/* Pole Email */}
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

          {/* Pole Hasło */}
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

          {/* Przycisk wysyłający */}
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginBottom: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Przetwarzanie...' : (isRegistering ? 'Zarejestruj się' : 'Zaloguj się')}
          </button>
        </form>

        {/* Przycisk do przełączania trybu (Logowanie <-> Rejestracja) */}
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
