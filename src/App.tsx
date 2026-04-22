import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    // 1. Sprawdź czy użytkownik jest już zalogowany (pobierz sesję)
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Słuchaj zmian w stanie autoryzacji (login/logout/token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session);
    });


    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '20vh' }}>
        <p>Inicjalizacja aplikacji...</p>
      </div>
    );
  }

  return (
    <>
      {!session ? (
        // Jeśli nie ma sesji -> pokaż formularz logowania
        <Auth />
      ) : (
        // Jeśli użytkownik jest zalogowany -> pokaż Dashboard
        <Dashboard />
      )}
    </>
  );
}

export default App;
