import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { LayoutDashboard, CheckCircle, Clock, List } from 'lucide-react';
import { projectService, taskService, activityService } from '../services/apiService';
import toast from 'react-hot-toast';

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total: 0, inProgress: 0, done: 0 });

  useEffect(() => {
    const loadRealData = async () => {
      try {
        const projects = await projectService.getProjects();
        // Filtrujemy ukryty projekt z logami
        const filteredProjects = projects.filter((p: any) => p.id !== '00000000-0000-0000-0000-000000000000');
        
        // POBIERAMY ZADANIA DLA WSZYSTKICH PROJEKTÓW RÓWNOLEGLE (SZYBCIEJ I BEZPIECZNIEJ)
        const allTasksResults = await Promise.all(
          filteredProjects.map((p: any) => taskService.getTasks(p.id).catch(() => []))
        );
        
        let allTasks: any[] = [];
        allTasksResults.forEach(tasks => {
          allTasks = [...allTasks, ...tasks];
        });

        const todo = allTasks.filter(t => t.status === 'todo').length;
        const inProgress = allTasks.filter(t => t.status === 'in_progress').length;
        const done = allTasks.filter(t => t.status === 'done').length;

        const data = [
          { name: 'Do zrobienia', value: todo, color: '#64748b' },
          { name: 'W trakcie', value: inProgress, color: '#4f46e5' },
          { name: 'Zrobione', value: done, color: '#10b981' },
        ];

        setStats(data);
        setSummary({ total: allTasks.length, inProgress, done });

        // Pobieramy historię aktywności
        const history = await activityService.getHistory();
        setActivities(history.slice(0, 10)); // Pokazujemy 10 ostatnich
      } catch (err) {
        console.error(err);
        toast.error('Błąd ładowania danych Dashboardu');
      } finally {
        setLoading(false);
      }
    };
    loadRealData();
  }, []);

  if (loading) return <div className="container">Obliczanie statystyk...</div>;

  return (
    <div className="container fade-in">
      <h2 className="flex items-center gap-2 mb-8">
        <LayoutDashboard className="text-primary" /> Dashboard Twoich Projektów
      </h2>

      <div className="stats-grid">
        <div className="stat-card card">
          <List className="text-muted" />
          <div>
            <span className="label">Wszystkie Zadania</span>
            <span className="value">{summary.total}</span>
          </div>
        </div>
        <div className="stat-card card">
          <Clock className="text-primary" />
          <div>
            <span className="label">W realizacji</span>
            <span className="value">{summary.inProgress}</span>
          </div>
        </div>
        <div className="stat-card card">
          <CheckCircle className="text-success" />
          <div>
            <span className="label">Zakończone</span>
            <span className="value">{summary.done}</span>
          </div>
        </div>
      </div>

      <div className="charts-container mt-12">
        <div className="chart-box card">
          <h3>Statusy Zadań (Realne dane)</h3>
          <div style={{ width: '100%', height: 300, minHeight: 300 }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value">
                  {stats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-box card">
          <h3>Rozkład statusów (%)</h3>
          <div style={{ width: '100%', height: 300, minHeight: 300 }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie 
                  data={stats} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={100} 
                  fill="#8884d8" 
                  label 
                >
                  {stats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="activity-section card mt-12">
        <h3>Ostatnia aktywność (Historia)</h3>
        <div className="activity-list">
          {activities.length === 0 && <p className="text-muted">Brak zarejestrowanej aktywności.</p>}
          {activities.map((act, i) => (
            <div key={i} className="activity-item py-3 border-b last:border-0">
              <span className="font-bold">{act.profiles?.email || 'System'}</span>
              <span className="mx-2">—</span>
              <span>{act.action}</span>
              <div className="text-sm text-muted">
                {new Date(act.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
