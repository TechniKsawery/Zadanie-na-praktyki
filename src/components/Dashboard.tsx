import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// Typ danych dla naszych notatek
interface Note {
  id: string;
  content: string;
  created_at: string;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Pobierz dane przy starcie komponentu
  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      // Pobieramy notatki posortowane od najnowszych
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      setError(null);
      // Zapisujemy nową notatkę do bazy
      // Supabase automatycznie przypisze user_id dzięki RLS (jeśli tak skonfigurujemy bazę)
      const { error } = await supabase
        .from('notes')
        .insert([{ content: newNote }]);

      if (error) throw error;
      
      setNewNote('');
      fetchNotes(); // Odświeżamy listę
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchNotes();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="container fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Panel Użytkownika</h1>
        <button onClick={handleLogout} className="btn btn-secondary">Wyloguj się</button>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3>Dodaj nową notatkę</h3>
        <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            placeholder="Wpisz coś..." 
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">Zapisz</button>
        </form>
        {error && <p style={{ color: 'var(--error)', marginTop: '0.5rem' }}>{error}</p>}
      </div>

      <h2>Twoje dane z bazy:</h2>
      {loading ? (
        <p>Ładowanie danych...</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {notes.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Brak danych. Dodaj pierwszą notatkę!</p>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem' }}>
                <p style={{ margin: 0 }}>{note.content}</p>
                <button 
                  onClick={() => handleDeleteNote(note.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Usuń
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
