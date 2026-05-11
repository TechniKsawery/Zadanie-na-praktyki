import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { LogOut, FolderKanban, Moon, Sun } from 'lucide-react';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(localStorage.getItem('theme') === 'dark');

  useEffect(() => {
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
      </div>

      <div className="navbar-actions">
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
