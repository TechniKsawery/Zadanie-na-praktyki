import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// --- DEFINICJA DANYCH ---
// Opisujemy jak wygląda jedna notatka w naszej bazie.
interface Note {
  id: string;          // Unikalny identyfikator
  content: string;     // Treść notatki
  created_at: string;  // Data utworzenia
}

// --- KOMPONENT PANELU GŁÓWNEGO ---
export default function Dashboard() {
  const [loading, setLoading] = useState(true);        // Czy dane są właśnie pobierane?
  const [notes, setNotes] = useState<Note[]>([]);     // Lista notatek z bazy
  const [newNote, setNewNote] = useState('');          // Tekst wpisywany w okienku
  const [error, setError] = useState<string | null>(null); // Miejsce na ewentualne błędy

  // useEffect: Pobiera notatki zaraz po tym, jak użytkownik wejdzie do panelu.
  useEffect(() => {
    fetchNotes();
  }, []);

  // FUNKCJA: ODCZYT (READ)
  // Pobiera wszystkie notatki należące do zalogowanego użytkownika.
  const fetchNotes = async () => {
    try {
      setLoading(true);
      // Łączymy się z tabelą 'notes', pobieramy wszystko (*)
      // i sortujemy od najnowszych (descending: false oznacza rosnąco, więc order 'created_at' z false da nam najnowsze na górze przy odpowiednim sortowaniu).
      // Uwaga: order('created_at', { ascending: false }) daje najnowsze na początku.
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []); // Zapisujemy pobrane dane do stanu 'notes'
    } catch (error: any) {
      setError("Błąd podczas pobierania: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // FUNKCJA: ZAPIS (CREATE)
  // Dodaje nową notatkę do bazy danych.
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return; // Nie zapisuj pustych notatek

    try {
      setError(null);
      // Wstawiamy nową treść do tabeli 'notes'.
      // Supabase sam wie, kto jest zalogowany i dopisze poprawne user_id (dzięki Row Level Security).
      const { error } = await supabase
        .from('notes')
        .insert([{ content: newNote }]);

      if (error) throw error;
      
      setNewNote(''); // Czyścimy pole wpisywania
      fetchNotes();   // Odświeżamy listę, żeby nowa notatka się pojawiła
    } catch (error: any) {
      setError("Błąd podczas zapisywania: " + error.message);
    }
  };

  // FUNKCJA: USUWANIE (DELETE)
  // Kasuje wybraną notatkę po jej ID.
  const handleDeleteNote = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id); // "Usuń tam, gdzie id zgadza się z tym klikniętym"

      if (error) throw error;
      fetchNotes(); // Odświeżamy listę po usunięciu
    } catch (error: any) {
      setError("Błąd podczas usuwania: " + error.message);
    }
  };

  // FUNKCJA: WYLOGOWANIE
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="container fade-in">
      {/* Nagłówek i przycisk wylogowania */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Panel Użytkownika</h1>
        <button onClick={handleLogout} className="btn btn-secondary">Wyloguj się</button>
      </div>

      {/* Formularz dodawania nowej notatki */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3>Dodaj nową notatkę</h3>
        <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            placeholder="Wpisz coś ciekawego..." 
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">Zapisz w bazie</button>
        </form>
        {error && <p style={{ color: 'var(--error)', marginTop: '0.5rem' }}>{error}</p>}
      </div>

      {/* Lista notatek pobranych z bazy */}
      <h2>Twoje dane z bazy:</h2>
      {loading ? (
        <p>Ładowanie Twoich notatek...</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {notes.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Twoja baza jest pusta. Dodaj pierwszą notatkę!</p>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem' }}>
                <p style={{ margin: 0 }}>{note.content}</p>
                <button 
                  onClick={() => handleDeleteNote(note.id)}
                  className="btn-delete"
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
