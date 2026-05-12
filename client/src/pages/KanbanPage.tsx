import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { taskService, projectService, uploadService, commentService } from '../services/apiService';
import { Paperclip, MessageSquare, Trash2, Send } from 'lucide-react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

export default function KanbanPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pola formularza
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskAssigned, setNewTaskAssigned] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');

  // Komentarze
  const [activeCommentsTaskId, setActiveCommentsTaskId] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');

  // TU POBIERAMY DZISIEJSZĄ DATĘ W FORMACIE RRRR-MM-DD
  const today = new Date().toISOString().split('T')[0];

  const [userRole, setUserRole] = useState<string>('user');
  
  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    if (!projectId) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single();
      if (profile) setUserRole(profile.role);

      const [pData, tData] = await Promise.all([
        projectService.getProject(projectId),
        taskService.getTasks(projectId)
      ]);
      setProject(pData);
      setTasks(tData);

      // Jeśli projekt ma przypisany zespół, pobieramy jego członków
      if (pData.team_id) {
        const { teamService } = await import('../services/apiService');
        const members = await teamService.getMembers(pData.team_id);
        const accepted = (members || []).filter((m: any) => m.status === 'accepted');
        setTeamMembers(accepted);
        setNewTaskAssigned('');
      } else {
        // Jeśli nie ma zespołu, pozwalamy przypisać zadanie tylko twórcy (lub zostawić puste)
        setTeamMembers([{
          user_id: pData.owner_id,
          profiles: { email: 'Ty (Właściciel)', role: 'owner' }
        }]);
        setNewTaskAssigned(pData.owner_id);
      }
    } catch (err) {
      console.error("Błąd ładowania danych", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !newTaskTitle.trim()) return;

    if (!newTaskAssigned) {
      alert('Wybierz osobe z listy.');
      return;
    }

    if (newTaskDeadline && newTaskDeadline < today) {
      alert("Termin nie może być datą z przeszłości!");
      return;
    }

    try {
      await taskService.createTask(projectId, { 
        title: newTaskTitle, 
        description: newTaskDescription,
        status: 'todo',
        assigned_to: newTaskAssigned,
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

  const handleFileUpload = async (taskId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await uploadService.uploadFile(file);
      // Pobieramy aktualne zadanie
      const task = tasks.find(t => t.id === taskId);
      const newDesc = `${task?.description || ''}\n\n📎 [${file.name}](${data.url})`.trim();
      
      await taskService.updateTask(taskId, { description: newDesc });
      toast.success(`Plik ${file.name} dodany do zadania!`);
      loadData();
    } catch (err) {
      toast.error("Błąd wgrywania pliku");
    }
  };

  const toggleComments = async (taskId: string) => {
    if (activeCommentsTaskId === taskId) {
      setActiveCommentsTaskId(null);
      setComments([]);
    } else {
      setActiveCommentsTaskId(taskId);
      setComments([]); // Czyścimy stare komentarze
      try {
        const data = await commentService.getComments(taskId);
        setComments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Błąd ładowania komentarzy", err);
        setComments([]);
      }
    }
  };

  const handleAddComment = async (taskId: string) => {
    if (!newComment.trim()) return;
    try {
      await commentService.addComment(taskId, newComment);
      setNewComment('');
      const data = await commentService.getComments(taskId);
      setComments(Array.isArray(data) ? data : []);
      toast.success('Komentarz dodany!');
    } catch (err: any) {
      console.error("Błąd dodawania komentarza", err);
      toast.error('Błąd: ' + (err.response?.data?.error || 'Tabela comments może nie istnieć'));
    }
  };

  if (loading) return <div className="container">Ładowanie...</div>;

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  const approveTask = async (taskId: string) => {
    try {
      await taskService.approveTask(taskId);
      toast.success('Zadanie zatwierdzone!');
      loadData();
    } catch (err) {
      toast.error('Błąd zatwierdzania');
    }
  };

  const approveReassignment = async (taskId: string) => {
    try {
      await taskService.approveReassignment(taskId);
      toast.success('Zmiana osoby zatwierdzona!');
      loadData();
    } catch (err) {
      toast.error('Błąd zatwierdzania zmiany');
    }
  };

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
              className="custom-textarea"
            />
          </div>
          <div className="input-group">
            <label>Osoba przypisana</label>
            <select 
              value={newTaskAssigned} 
              onChange={e => setNewTaskAssigned(e.target.value)}
              required
              style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-color)' }}
            >
              <option value="" disabled>Wybierz czlonka zespolu...</option>
              {(teamMembers || []).map((m: any) => (
                <option key={m.user_id} value={m.user_id}>
                  {(m.profiles?.full_name || m.profiles?.email)} ({m.profiles?.role || 'user'})
                </option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label>Priorytet</label>
            <select value={newTaskPriority} onChange={e => setNewTaskPriority(e.target.value)}>
              <option value="low">Niski</option>
              <option value="medium">Średni</option>
              <option value="high">Wysoki</option>
            </select>
          </div>
          <div className="input-group">
            <label>Termin (Deadline)</label>
            <input 
              type="date" 
              value={newTaskDeadline} 
              min={today} 
              onChange={e => setNewTaskDeadline(e.target.value)} 
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ gridColumn: 'span 2' }}>Utwórz Zadanie</button>
        </form>
      </div>

      <div className="kanban-board">
        {[
          { title: '📌 Do zrobienia', tasks: todoTasks, nextStatus: 'in_progress', nextLabel: '👉 Rozpocznij' },
          { title: '⏳ W trakcie', tasks: inProgressTasks, nextStatus: 'done', nextLabel: '✔️ Zakończ', prevStatus: 'todo', prevLabel: '← Cofnij' },
          { title: '✅ Zrobione', tasks: doneTasks, prevStatus: 'in_progress', prevLabel: '← Wróć' }
        ].map(col => (
          <div key={col.title} className="kanban-column">
            <h2 className="column-title">{col.title}</h2>
            {col.tasks.map(t => (
              <div key={t.id} className={`task-card card ${t.priority}`}>
                <div className="task-header">
                  <h4>{t.title}</h4>
                  <span className={`priority-badge ${t.priority}`}>{t.priority}</span>
                </div>
                {t.description && <p className="task-desc">{t.description}</p>}
                
                {t.is_approved === false && (
                  <div style={{ background: '#fff3cd', color: '#856404', padding: '0.5rem', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                    ⚠️ Oczekiwanie na zatwierdzenie zadania
                    {['root', 'admin', 'moderator'].includes(userRole) && (
                      <button onClick={() => approveTask(t.id)} className="btn btn-primary-mini" style={{ width: '100%', marginTop: '0.5rem' }}>Zatwierdź</button>
                    )}
                  </div>
                )}

                {t.pending_assignee_name && (
                  <div style={{ background: '#d1ecf1', color: '#0c5460', padding: '0.5rem', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                    🔄 Prośba o przypisanie: {t.pending_assignee_name}
                    {['root', 'admin', 'moderator'].includes(userRole) && (
                      <button onClick={() => approveReassignment(t.id)} className="btn btn-secondary-mini" style={{ width: '100%', marginTop: '0.5rem' }}>Zatwierdź zmianę</button>
                    )}
                  </div>
                )}

                {t.assigned_to_name && <p className="task-assignee">👤 {t.assigned_to_name}</p>}
                {t.deadline && <p className="task-deadline">📅 {new Date(t.deadline).toLocaleDateString()}</p>}
                
                <div className="task-actions">
                  {(col.prevStatus && t.is_approved !== false) && <button onClick={() => updateStatus(t.id, col.prevStatus!)} className="btn-mini">{col.prevLabel}</button>}
                  {(col.nextStatus && t.is_approved !== false) && <button onClick={() => updateStatus(t.id, col.nextStatus!)} className="btn-mini btn-primary-mini">{col.nextLabel}</button>}
                  
                  <label className="btn-mini btn-icon" title="Załącz plik">
                    <Paperclip size={14} />
                    <input type="file" hidden onChange={(e) => handleFileUpload(t.id, e)} />
                  </label>

                  <button onClick={() => toggleComments(t.id)} className="btn-mini btn-icon" title="Komentarze">
                    <MessageSquare size={14} />
                  </button>

                  <button onClick={() => deleteTask(t.id)} className="btn-mini btn-icon text-error" title="Usuń">
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* SEKCJA KOMENTARZY */}
                {activeCommentsTaskId === t.id && (
                  <div className="comments-section fade-in">
                    <hr />
                    <div className="comments-list">
                      {comments.map((c, i) => (
                        <div key={i} className="comment-item">
                          <span className="comment-user">
                            {c.profiles?.full_name || c.profiles?.email?.split('@')[0]}:
                          </span>
                          <span className="comment-content">{c.content}</span>
                        </div>
                      ))}
                      {comments.length === 0 && <p className="no-comments">Brak komentarzy.</p>}
                    </div>
                    <div className="comment-input-wrapper">
                      <input 
                        value={newComment} 
                        onChange={e => setNewComment(e.target.value)} 
                        placeholder="Napisz komentarz..."
                        onKeyDown={e => e.key === 'Enter' && handleAddComment(t.id)}
                      />
                      <button onClick={() => handleAddComment(t.id)}><Send size={14} /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
