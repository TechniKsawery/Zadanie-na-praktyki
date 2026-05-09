import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <nav style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '1rem 2rem',
      background: 'var(--card-bg)',
      backdropFilter: 'blur(10px)',
      boxShadow: 'var(--shadow)',
      marginBottom: '2rem'
    }}>
      <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary)' }}>
        🚀 Mini Jira
      </div>
      <button onClick={handleLogout} className="btn btn-secondary" style={{ fontSize: '0.9rem' }}>
        Wyloguj się
      </button>
    </nav>
  );
}
