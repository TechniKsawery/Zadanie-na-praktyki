import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProjectsPage from './pages/ProjectsPage';
import KanbanPage from './pages/KanbanPage';
import Navbar from './components/Navbar';

function App() {
  // TU TRZYMAMY INFORMACJĘ, CZY KTOŚ JEST ZALOGOWANY (SESJA)
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TU PYTAMY SUPABASE PRZY STARCIE: "CZY MAMY JAKIEGOŚ ZALOGOWANEGO UŻYTKOWNIKA W PAMIĘCI?"
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // TU USTALAMY "SŁUCHACZA" – JEŚLI UŻYTKOWNIK SIĘ WYLOGUJE LUB ZALOGUJE, 
    // TA FUNKCJA OD RAZU ZAKTUALIZUJE STAN APLIKACJI.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // TU POKAZUJEMY NAPIS "ŁADOWANIE", DOPÓKI NIE DOWIEMY SIĘ, CZY UŻYTKOWNIK JEST ZALOGOWANY
  if (loading) return <div className="container">Ładowanie...</div>;

  return (
    <BrowserRouter>
      {/* TU POKAZUJEMY NAWIGACJĘ TYLKO WTEDY, GDY KTOŚ JEST ZALOGOWANY */}
      {session && <Navbar />}
      
      <Routes>
        {/* TRASY PUBLICZNE: JEŚLI JESTEŚ ZALOGOWANY, PRZEKIERUJEMY CIĘ DO PROJEKTÓW */}
        <Route path="/login" element={!session ? <LoginPage /> : <Navigate to="/projects" />} />
        <Route path="/register" element={!session ? <RegisterPage /> : <Navigate to="/projects" />} />

        {/* TRASY CHRONIONE: JEŚLI NIE JESTEŚ ZALOGOWANY, PRZEKIERUJEMY CIĘ DO LOGOWANIA */}
        <Route path="/projects" element={session ? <ProjectsPage /> : <Navigate to="/login" />} />
        <Route path="/projects/:projectId" element={session ? <KanbanPage /> : <Navigate to="/login" />} />

        {/* DOMYŚLNE PRZEKIEROWANIE: JEŚLI WPISZESZ ZŁY ADRES, TRAFISZ TAM, GDZIE POWINIENEŚ */}
        <Route path="/" element={<Navigate to={session ? "/projects" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
