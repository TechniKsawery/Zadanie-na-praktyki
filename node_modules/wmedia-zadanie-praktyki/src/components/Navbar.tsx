import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { LogOut, FolderKanban, Users, LayoutDashboard } from 'lucide-react';

const Navbar: React.FC = () => {
  const navigate = useNavigate();

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
        <button onClick={handleLogout} className="btn-logout">
          <LogOut size={18} />
          <span>Wyloguj</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
