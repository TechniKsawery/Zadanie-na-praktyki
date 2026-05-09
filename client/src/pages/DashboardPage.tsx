import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { LayoutDashboard, CheckCircle, Clock, List } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // TU SYMULUJEMY POBIERANIE DANYCH DO WYKRESU
        // W prawdziwej aplikacji pobralibyśmy to z dedykowanego endpointu /api/stats
        const data = [
          { name: 'Do zrobienia', value: 12, color: '#6b7280' },
          { name: 'W trakcie', value: 7, color: '#4f46e5' },
          { name: 'Zrobione', value: 15, color: '#10b981' },
        ];
        setStats(data);
        setTotalTasks(data.reduce((acc, item) => acc + item.value, 0));
      } catch (err) {
        toast.error('Błąd ładowania statystyk');
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="container fade-in">
      <h2 className="flex items-center gap-2 mb-8">
        <LayoutDashboard className="text-primary" /> Dashboard Projektu
      </h2>

      {/* KARTY PODSUMOWANIA */}
      <div className="stats-grid">
        <div className="stat-card card">
          <List className="text-muted" />
          <div>
            <span className="label">Wszystkie Zadania</span>
            <span className="value">{totalTasks}</span>
          </div>
        </div>
        <div className="stat-card card">
          <Clock className="text-primary" />
          <div>
            <span className="label">W realizacji</span>
            <span className="value">7</span>
          </div>
        </div>
        <div className="stat-card card">
          <CheckCircle className="text-success" />
          <div>
            <span className="label">Zakończone</span>
            <span className="value">15</span>
          </div>
        </div>
      </div>

      {/* WYKRESY */}
      <div className="charts-container mt-12">
        <div className="chart-box card">
          <h3>Statusy Zadań (Wykres słupkowy)</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
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
          <h3>Rozkład pracy</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
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
    </div>
  );
};

export default DashboardPage;
