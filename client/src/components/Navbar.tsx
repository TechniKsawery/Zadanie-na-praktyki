import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { LogOut, FolderKanban, Moon, Sun } from 'lucide-react';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(localStorage.getItem('theme') === 'dark');
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', session.user.id)
          .single();
        if (profile) {
          setRole(profile.role);
          setFullName(profile.full_name || '');
        }
      }
    };
    getSession();

    if (isDark) {
      document.documentElement.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <nav className="navbar fade-in">
      <div className="navbar-brand">
        <FolderKanban className="logo-icon" />
        <span>Mini Jira <strong>SaaS</strong></span>
      </div>
      
      <div className="navbar-links">
        <Link to="/projects" className="nav-link">Projekty</Link>
        <Link to="/teams" className="nav-link">Zespoły</Link>
        <Link to="/dashboard" className="nav-link">Dashboard</Link>
        <Link to="/settings" className="nav-link">Ustawienia</Link>
        {['root', 'admin'].includes(role) && (
          <Link to="/users" className="nav-link">Uzytkownicy</Link>
        )}
      </div>

      <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        {user && (
          <div className="user-info" style={{ textAlign: 'right', fontSize: '0.8rem' }}>
            <div className="font-bold">{fullName || user.email}</div>
            {!fullName && <div style={{ color: 'var(--text-muted)' }}>{user.email}</div>}
            <div className={`role-badge ${role}`} style={{ 
              textTransform: 'uppercase', 
              fontSize: '0.6rem', 
              background: role === 'admin' ? '#ef4444' : role === 'moderator' ? '#f59e0b' : '#3b82f6',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              marginTop: '2px'
            }}>{role}</div>
          </div>
        )}
        <button 
          className="theme-toggle-btn" 
          onClick={() => setIsDark(!isDark)}
          title="Przełącz tryb"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button onClick={handleLogout} className="btn-logout">
          <LogOut size={18} />
          <span>Wyloguj</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
