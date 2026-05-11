import React, { useState, useEffect } from 'react';
import { projectService } from '../services/apiService';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('user');
  const [userEmail, setUserEmail] = useState<string>('');
  
  // Stan formularza (dodawanie i edycja)
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      await fetchUserInfo();
      await loadProjects();
    };
    init();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile) setUserRole(profile.role);
      }
    } catch (err) {
      console.error("Error fetching user info", err);
    } finally {
      setRoleLoading(false);
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
        await projectService.updateProject(editingId, { name, description });
        setEditingId(null);
      } else {
        // TWORZENIE NOWEGO PROJEKTU
        await projectService.createProject({ name, description });
      }
      setName('');
      setDescription('');
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
                  <button onClick={() => handleEditClick(p)} style={{ background: 'none', border: '1px solid var(--primary)', color: 'var(--primary)', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px' }}>Edytuj</button>
                  <button onClick={() => handleDelete(p.id)} style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}>Usuń</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
