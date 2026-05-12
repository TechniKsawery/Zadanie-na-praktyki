import React, { useState, useEffect } from 'react';
import { projectService, teamService } from '../services/apiService';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('user');
  const [userId, setUserId] = useState<string>('');

  // Stan formularza (dodawanie i edycja)
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  // brakujące stany używane w JSX — zapobiegają błędom referencji
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [userTeams, setUserTeams] = useState<any[]>([]);

  const userTeamIds = new Set(userTeams.map((t) => t.id));

  useEffect(() => {
    const init = async () => {
      await fetchUserInfo();
      await loadUserTeams();
      await loadProjects();
    };
    init();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile) setUserRole(profile.role);
      }
    } catch (err) {
      console.error("Error fetching user info", err);
    } finally {
      setRoleLoading(false);
    }
  };

  const loadUserTeams = async () => {
    try {
      const teams = await teamService.getTeams();
      setUserTeams(teams);
    } catch (err) {
      console.error("Błąd ładowania zespołów", err);
    }
  };

  const loadProjects = async () => {
    try {
      const data = await projectService.getProjects();
      const filtered = data.filter((p: any) => p.id !== '00000000-0000-0000-0000-000000000000');
      setProjects(filtered);
    } catch (err) {
      console.error("Błąd ładowania projektów", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        // EDYCJA ISTNIEJĄCEGO PROJEKTU
        await projectService.updateProject(editingId, { name, description, team_id: selectedTeamId || null });
        setEditingId(null);
      } else {
        // TWORZENIE NOWEGO PROJEKTU
        await projectService.createProject({
          name,
          description,
          team_id: selectedTeamId || undefined
        });
      }
      setName('');
      setDescription('');
      setSelectedTeamId('');
      loadProjects();
    } catch (err) {
      alert("Błąd zapisu projektu");
    }
  };

  const handleEditClick = (p: any) => {
    setEditingId(p.id);
    setName(p.name);
    setDescription(p.description || '');
    window.scrollTo(0, 0); // Przewiń do formularza
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Czy na pewno usunąć ten projekt i wszystkie jego zadania?")) return;
    try {
      await projectService.deleteProject(id);
      loadProjects();
    } catch (err) {
      alert("Błąd usuwania projektu");
    }
  };

  return (
    <div className="container fade-in">
      <h1>Moje Projekty</h1>
      {roleLoading && <p>Sprawdzanie uprawnień...</p>}

      {/* FORMULARZ (DODAWANIE / EDYCJA) - DOSTĘPNY DLA WSZYSTKICH DLA CELÓW TESTOWYCH */}
      {!roleLoading && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>{editingId ? 'Edytuj Projekt' : 'Nowy Projekt'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Nazwa projektu"
                required
              />
            </div>
            <div className="input-group">
              <input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Opis (opcjonalnie)"
              />
            </div>
            <div className="input-group">
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Przypisz do zespołu (opcjonalnie)</label>
              <select
                value={selectedTeamId}
                onChange={e => setSelectedTeamId(e.target.value)}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-color)' }}
              >
                <option value="">Brak zespołu (prywatny)</option>
                {userTeams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Zapisz zmiany' : 'Dodaj Projekt'}
              </button>
              {editingId && (
                <button type="button" className="btn btn-secondary" onClick={() => { setEditingId(null); setName(''); setDescription(''); }}>
                  Anuluj
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Lista projektów */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {loading ? <p>Ładowanie...</p> : projects.map(p => (
          <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3>{p.name}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', minHeight: '3rem' }}>{p.description || 'Brak opisu'}</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Dodano: {new Date(p.created_at).toLocaleDateString()}</p>
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Link to={`/projects/${p.id}`} className="btn btn-secondary" style={{ flex: '1', textAlign: 'center', textDecoration: 'none' }}>Otwórz Tablicę</Link>

              {/* TYLKO ADMIN I MODERATOR LUB AUDYTOR MOGĄ EDYTOWAĆ/USUWAĆ */}
              {!roleLoading && (
                <>
                  {/* Edycja: Root, Admin, Moderator (swoje) */}
                  {(userRole === 'root' || 
                    (userRole === 'admin' && p.owner_id === userId) || 
                    (userRole === 'moderator' && (p.owner_id === userId || (p.team_id && userTeamIds.has(p.team_id))))) && (
                    <button onClick={() => handleEditClick(p)} style={{ background: 'none', border: '1px solid var(--primary)', color: 'var(--primary)', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px' }}>Edytuj</button>
                  )}
                  
                  {/* Usuwanie: Root, Admin, Moderator (swoje) */}
                  {(userRole === 'root' || 
                    (userRole === 'admin' && p.owner_id === userId) || 
                    (userRole === 'moderator' && (p.owner_id === userId || (p.team_id && userTeamIds.has(p.team_id))))) && (
                    <button onClick={() => handleDelete(p.id)} style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}>Usuń</button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
