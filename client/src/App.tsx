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
import MainLayout from './layouts/MainLayout';

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
        <Routes>
          <Route path="/login" element={!session ? <LoginPage /> : <Navigate to="/projects" />} />
          <Route path="/register" element={!session ? <RegisterPage /> : <Navigate to="/projects" />} />

          <Route path="/projects" element={session ? <MainLayout><ProjectsPage /></MainLayout> : <Navigate to="/login" />} />
          <Route path="/projects/:projectId" element={session ? <MainLayout><KanbanPage /></MainLayout> : <Navigate to="/login" />} />
          <Route path="/teams" element={session ? <MainLayout><TeamsPage /></MainLayout> : <Navigate to="/login" />} />
          <Route path="/dashboard" element={session ? <MainLayout><DashboardPage /></MainLayout> : <Navigate to="/login" />} />

          <Route path="/" element={<Navigate to={session ? "/projects" : "/login"} />} />
        </Routes>
      </BrowserRouter>
    </SocketProvider>
  );
}

export default App;
