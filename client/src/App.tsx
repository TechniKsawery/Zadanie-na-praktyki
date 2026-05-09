import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProjectsPage from './pages/ProjectsPage';
import KanbanPage from './pages/KanbanPage';
import TeamsPage from './pages/TeamsPage';
import DashboardPage from './pages/DashboardPage';
import Navbar from './components/Navbar';
import { SocketProvider } from './context/SocketContext';
import { Toaster } from 'react-hot-toast';
import ChatSidebar from './components/ChatSidebar';

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
    <SocketProvider userId={session?.user?.id}>
      <BrowserRouter>
        <Toaster />
        {/* TU POKAZUJEMY NAWIGACJĘ I CZAT TYLKO WTEDY, GDY KTOŚ JEST ZALOGOWANY */}
        {session && <Navbar />}
        {session && <ChatSidebar />}
        
        <Routes>
          {/* TRASY PUBLICZNE */}
          <Route path="/login" element={!session ? <LoginPage /> : <Navigate to="/projects" />} />
          <Route path="/register" element={!session ? <RegisterPage /> : <Navigate to="/projects" />} />

          {/* TRASY CHRONIONE */}
          <Route path="/projects" element={session ? <ProjectsPage /> : <Navigate to="/login" />} />
          <Route path="/projects/:projectId" element={session ? <KanbanPage /> : <Navigate to="/login" />} />
          <Route path="/teams" element={session ? <TeamsPage /> : <Navigate to="/login" />} />
          <Route path="/dashboard" element={session ? <DashboardPage /> : <Navigate to="/login" />} />

          {/* DOMYŚLNE PRZEKIEROWANIE */}
          <Route path="/" element={<Navigate to={session ? "/projects" : "/login"} />} />
        </Routes>
      </BrowserRouter>
    </SocketProvider>
  );
}

export default App;
