import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Plus, Mail, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const TeamsPage: React.FC = () => {
  const [teams, setTeams] = useState<any[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [inviteEmail, setInviteEmail] = useState<{ [key: string]: string }>({});

  const fetchTeams = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/teams', {
        headers: { Authorization: `Bearer ${(await axios.get('http://localhost:5000/api/auth/token')).data.token}` } 
      });
      // Uwaga: używamy apiService w prawdziwym kodzie, tu uproszczenie dla czytelności
    } catch (err) {}
  };

  // UŻYJEMY NASZEGO apiService DLA BEZPIECZEŃSTWA
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/teams', {
          headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('sb-vjlbpsnkvmzhsczypyyt-auth-token') || '{}').access_token}` }
        });
        setTeams(data);
      } catch (err) {
        toast.error('Błąd podczas ładowania zespołów');
      }
    };
    loadData();
  }, []);

  const handleCreateTeam = async () => {
    if (!newTeamName) return;
    try {
      await axios.post('http://localhost:5000/api/teams', { name: newTeamName }, {
        headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('sb-vjlbpsnkvmzhsczypyyt-auth-token') || '{}').access_token}` }
      });
      setNewTeamName('');
      toast.success('Zespół utworzony!');
      // Ponowne ładowanie...
    } catch (err) {
      toast.error('Błąd tworzenia zespołu');
    }
  };

  const handleInvite = async (teamId: string) => {
    const email = inviteEmail[teamId];
    if (!email) return;
    try {
      await axios.post(`http://localhost:5000/api/teams/${teamId}/invite`, { email }, {
        headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('sb-vjlbpsnkvmzhsczypyyt-auth-token') || '{}').access_token}` }
      });
      setInviteEmail({ ...inviteEmail, [teamId]: '' });
      toast.success('Zaproszenie wysłane!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Błąd zapraszania');
    }
  };

  return (
    <div className="container fade-in">
      <div className="card">
        <h2 className="flex items-center gap-2 mb-6">
          <Users className="text-primary" /> Moje Zespoły
        </h2>

        <div className="create-team-box mb-8">
          <input 
            type="text" 
            placeholder="Nazwa nowego zespołu..." 
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
          />
          <button className="btn btn-primary" onClick={handleCreateTeam}>
            <Plus size={18} /> Stwórz Zespół
          </button>
        </div>

        <div className="teams-list">
          {teams.map((team) => (
            <div key={team.id} className="team-card card mb-4">
              <div className="team-info">
                <h3>{team.name}</h3>
                <span className="badge">Właściciel</span>
              </div>
              
              <div className="invite-box mt-4">
                <input 
                  type="email" 
                  placeholder="Email użytkownika..." 
                  value={inviteEmail[team.id] || ''}
                  onChange={(e) => setInviteEmail({ ...inviteEmail, [team.id]: e.target.value })}
                />
                <button className="btn btn-secondary btn-sm" onClick={() => handleInvite(team.id)}>
                  <Mail size={16} /> Zaproś
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamsPage;
