import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase, SUPABASE_CONFIGURED } from './supabaseClient';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProjectsPage from './pages/ProjectsPage';
import KanbanPage from './pages/KanbanPage';
import TeamsPage from './pages/TeamsPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import { SocketProvider } from './context/SocketContext';
import { Toaster } from 'react-hot-toast';
import MainLayout from './layouts/MainLayout';

function App() {
  // TU TRZYMAMY INFORMACJĘ, CZY KTOŚ JEST ZALOGOWANY (SESJA)
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TU PYTAMY SUPABASE PRZY STARCIE: "CZY MAMY JAKIEGOŚ ZALOGOWANEGO UŻYTKOWNIKA W PAMIĘCI?"
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setSession(session);
      setLoading(false);
    });

    // TU USTALAMY "SŁUCHACZA" – JEŚLI UŻYTKOWNIK SIĘ WYLOGUJE LUB ZALOGUJE, 
    // TA FUNKCJA OD RAZU ZAKTUALIZUJE STAN APLIKACJI.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // TU POKAZUJEMY NAPIS "ŁADOWANIE", DOPÓKI NIE DOWIEMY SIĘ, CZY UŻYTKOWNIK JEST ZALOGOWANY
  if (loading) return <div className="container">Ładowanie...</div>;

  if (!SUPABASE_CONFIGURED) return (
    <div className="container">
      <div style={{ padding: '2rem', background: '#fff6f6', borderRadius: 8 }}>
        <h2 style={{ color: 'var(--error)' }}>Brakuje konfiguracji Supabase</h2>
        <p>Skopiuj plik <strong>.env.example</strong> do <strong>client/.env.local</strong> i uzupełnij <code>VITE_SUPABASE_URL</code> oraz <code>VITE_SUPABASE_ANON_KEY</code>, następnie uruchom serwer deweloperski ponownie.</p>
      </div>
    </div>
  );

  return (
    <SocketProvider userId={session?.user?.id}>
      <BrowserRouter>
        <Toaster />
        <Routes>
          <Route path="/login" element={!session ? <LoginPage /> : <Navigate to="/projects" />} />
          <Route path="/register" element={!session ? <RegisterPage /> : <Navigate to="/projects" />} />

          <Route path="/projects" element={session ? <MainLayout><ProjectsPage /></MainLayout> : <Navigate to="/login" />} />
          <Route path="/projects/:projectId" element={session ? <MainLayout><KanbanPage /></MainLayout> : <Navigate to="/login" />} />
          <Route path="/teams" element={session ? <MainLayout><TeamsPage /></MainLayout> : <Navigate to="/login" />} />
          <Route path="/dashboard" element={session ? <MainLayout><DashboardPage /></MainLayout> : <Navigate to="/login" />} />
          <Route path="/users" element={session ? <MainLayout><UsersPage /></MainLayout> : <Navigate to="/login" />} />
          <Route path="/settings" element={session ? <MainLayout><SettingsPage /></MainLayout> : <Navigate to="/login" />} />

          <Route path="/" element={<Navigate to={session ? "/projects" : "/login"} />} />
        </Routes>
      </BrowserRouter>
    </SocketProvider>
  );
}

export default App;
