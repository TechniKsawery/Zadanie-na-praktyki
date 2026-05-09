import React, { useState, useEffect } from 'react';
import { teamService } from '../services/apiService';
import { Users, Plus, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/apiService';

const TeamsPage: React.FC = () => {
  const [teams, setTeams] = useState<any[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [inviteEmail, setInviteEmail] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);

  const loadTeams = async () => {
    try {
      const data = await teamService.getTeams();
      setTeams(data);
    } catch (err) {
      console.error(err);
      toast.error('Błąd podczas ładowania zespołów');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    try {
      await teamService.createTeam({ name: newTeamName });
      setNewTeamName('');
      toast.success('Zespół utworzony!');
      loadTeams();
    } catch (err) {
      toast.error('Błąd tworzenia zespołu');
    }
  };

  const handleInvite = async (teamId: string) => {
    const email = inviteEmail[teamId];
    if (!email) return;
    try {
      await teamService.inviteMember(teamId, email);
      setInviteEmail({ ...inviteEmail, [teamId]: '' });
      toast.success('Zaproszenie wysłane!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Błąd zapraszania');
    }
  };

  if (loading) return <div className="container">Ładowanie zespołów...</div>;

  return (
    <div className="container fade-in">
      <div className="card">
        <h2 className="flex items-center gap-2 mb-6">
          <Users className="text-primary" /> Zarządzanie Zespołami
        </h2>

        <div className="create-team-box mb-8" style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="Nazwa nowego zespołu..." 
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
          />
          <button className="btn btn-primary" onClick={handleCreateTeam}>
            <Plus size={18} /> Stwórz
          </button>
        </div>

        <div className="teams-list">
          {teams.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p className="text-muted">Nie masz jeszcze żadnych zespołów.</p>
              <p style={{ fontSize: '0.9rem' }}>Stwórz swój pierwszy zespół powyżej!</p>
            </div>
          ) : (
            teams.map((team) => (
              <div key={team.id} className="team-card card mb-4" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0 }}>{team.name}</h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Utworzono: {new Date(team.created_at).toLocaleDateString()}</span>
                </div>
                
                <div className="invite-box mt-4" style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
                  <input 
                    type="email" 
                    placeholder="Email użytkownika, którego chcesz zaprosić" 
                    value={inviteEmail[team.id] || ''}
                    onChange={(e) => setInviteEmail({ ...inviteEmail, [team.id]: e.target.value })}
                  />
                  <button className="btn btn-secondary btn-sm" onClick={() => handleInvite(team.id)}>
                    <Mail size={16} /> Zaproś
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamsPage;
