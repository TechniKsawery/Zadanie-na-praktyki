import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { taskService, projectService } from '../services/apiService';

export default function KanbanPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pola formularza
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskAssigned, setNewTaskAssigned] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');

  // TU POBIERAMY DZISIEJSZĄ DATĘ W FORMACIE RRRR-MM-DD
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    if (!projectId) return;
    try {
      const [pData, tData] = await Promise.all([
        projectService.getProject(projectId),
        taskService.getTasks(projectId)
      ]);
      setProject(pData);
      setTasks(tData);
    } catch (err) {
      console.error("Błąd ładowania danych", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !newTaskTitle.trim()) return;

    // --- WALIDACJA DATY ---
    if (newTaskDeadline && newTaskDeadline < today) {
      alert("Termin nie może być datą z przeszłości!");
      return;
    }

    try {
      await taskService.createTask(projectId, { 
        title: newTaskTitle, 
        description: newTaskDescription,
        status: 'todo',
        assigned_to_name: newTaskAssigned,
        priority: newTaskPriority,
        deadline: newTaskDeadline || null
      });
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskAssigned('');
      setNewTaskPriority('medium');
      setNewTaskDeadline('');
      loadData();
    } catch (err) {
      alert("Błąd dodawania zadania");
    }
  };

  const updateStatus = async (taskId: string, newStatus: string) => {
    try {
      await taskService.updateTask(taskId, { status: newStatus });
      loadData();
    } catch (err) {
      alert("Błąd zmiany statusu");
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!window.confirm("Czy na pewno usunąć?")) return;
    try {
      await taskService.deleteTask(taskId);
      loadData();
    } catch (err) {
      alert("Błąd usuwania zadania");
    }
  };

  if (loading) return <div className="container">Ładowanie...</div>;

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  return (
    <div className="container fade-in" style={{ maxWidth: '1200px' }}>
      <button onClick={() => navigate('/projects')} className="btn btn-secondary" style={{ marginBottom: '1rem' }}>
        ← Powrót do projektów
      </button>
      
      <h1>Projekt: {project?.name}</h1>
      <p style={{ color: 'var(--text-muted)' }}>{project?.description}</p>

      {/* FORMULARZ ZADANIA */}
      <div className="card" style={{ margin: '2rem 0' }}>
        <h3>Dodaj nowe zadanie</h3>
        <form onSubmit={handleAddTask} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
          <div className="input-group" style={{ gridColumn: 'span 2' }}>
            <label>Tytuł</label>
            <input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder="Co jest do zrobienia?" required />
          </div>
          <div className="input-group" style={{ gridColumn: 'span 2' }}>
            <label>Opis zadania</label>
            <textarea 
              value={newTaskDescription} 
              onChange={e => setNewTaskDescription(e.target.value)} 
              placeholder="Dokładny opis zadania..." 
              style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--primary)', background: 'var(--bg-alt)', color: 'var(--text)' }}
            />
          </div>
          <div className="input-group">
            <label>Osoba przypisana</label>
            <input value={newTaskAssigned} onChange={e => setNewTaskAssigned(e.target.value)} placeholder="Kto ma to zrobić?" />
          </div>
          <div className="input-group">
            <label>Priorytet</label>
            <select value={newTaskPriority} onChange={e => setNewTaskPriority(e.target.value)}>
              <option value="low">Niski (Low)</option>
              <option value="medium">Średni (Medium)</option>
              <option value="high">Wysoki (High)</option>
            </select>
          </div>
          <div className="input-group">
            <label>Termin (Deadline)</label>
            <input 
              type="date" 
              value={newTaskDeadline} 
              min={today} // TU BLOKUJEMY WYBÓR DATY Z PRZESZŁOŚCI W KALENDARZU
              onChange={e => setNewTaskDeadline(e.target.value)} 
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ gridColumn: 'span 2' }}>Utwórz Zadanie</button>
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {[
          { title: '📌 Do zrobienia', tasks: todoTasks, nextStatus: 'in_progress', nextLabel: '👉 Rozpocznij' },
          { title: '⏳ W trakcie', tasks: inProgressTasks, nextStatus: 'done', nextLabel: '✔️ Zakończ', prevStatus: 'todo', prevLabel: '← Cofnij' },
          { title: '✅ Zrobione', tasks: doneTasks, prevStatus: 'in_progress', prevLabel: '← Wróć' }
        ].map(col => (
          <div key={col.title} className="kanban-column">
            <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>{col.title}</h2>
            {col.tasks.map(t => (
              <div key={t.id} className="card" style={{ marginBottom: '1rem', padding: '1rem', borderLeft: t.priority === 'high' ? '5px solid var(--error)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <h4>{t.title}</h4>
                  <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-alt)', textTransform: 'uppercase' }}>{t.priority}</span>
                </div>
                {t.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.5rem 0' }}>{t.description}</p>}
                {t.assigned_to_name && <p style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '0.5rem' }}>👤 {t.assigned_to_name}</p>}
                {t.deadline && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📅 {new Date(t.deadline).toLocaleDateString()}</p>}
                
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {col.prevStatus && <button onClick={() => updateStatus(t.id, col.prevStatus!)} className="btn btn-secondary" style={{ fontSize: '0.7rem', padding: '4px 8px' }}>{col.prevLabel}</button>}
                  {col.nextStatus && <button onClick={() => updateStatus(t.id, col.nextStatus!)} className="btn btn-primary" style={{ fontSize: '0.7rem', padding: '4px 8px' }}>{col.nextLabel}</button>}
                  <button onClick={() => deleteTask(t.id)} style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>Usuń</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
