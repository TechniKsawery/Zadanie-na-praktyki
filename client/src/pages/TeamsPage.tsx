import React, { useState, useEffect } from 'react';
import api, { teamService } from '../services/apiService';
import { supabase } from '../supabaseClient';
import { Users, Plus, Mail, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const TeamsPage: React.FC = () => {
  const [teams, setTeams] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [inviteEmail, setInviteEmail] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const loadTeamsData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id).single();
      setCurrentUser(profile);

      const [teamsData, invData] = await Promise.all([
        teamService.getTeams(),
        teamService.getInvitations()
      ]);

      // Pobieramy członków dla każdego zespołu
      const teamsWithMembers = await Promise.all(
        teamsData.map(async (t: any) => {
          try {
            const members = await teamService.getMembers(t.id);
            console.log(`[TeamsPage] Członkowie dla zespołu ${t.id}:`, members);
            return {
              ...t,
              members: Array.isArray(members) ? members : []
            };
          } catch (err) {
            console.error(`[TeamsPage] Błąd ładowania członków dla ${t.id}:`, err);
            return { ...t, members: [] };
          }
        })
      );

      setTeams(teamsWithMembers);
      setInvitations(invData);
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.error || err?.message || 'Nieznany błąd';
      setErrorMsg(msg);
      toast.error('Błąd podczas ładowania danych');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeamsData();
  }, []);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    try {
      await teamService.createTeam({ name: newTeamName });
      setNewTeamName('');
      toast.success('Zespół utworzony!');
      loadTeamsData();
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
      toast.success('Akcja wykonana pomyślnie!');
      loadTeamsData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Błąd');
    }
  };

  const handleAccept = async (teamId: string) => {
    try {
      await teamService.acceptInvitation(teamId);
      toast.success('Dołączono do zespołu!');
      loadTeamsData();
    } catch (err) {
      toast.error('Błąd akceptacji');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!window.confirm('Czy na pewno chcesz usunąć ten zespół i wszystkich jego członków?')) return;
    try {
      await api.delete(`/teams/${teamId}`);
      toast.success('Zespół usunięty');
      loadTeamsData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Błąd usuwania zespołu');
    }
  };

  const handleRemoveMember = async (teamId: string, memberId: string) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tego członka?')) return;
    try {
      await api.delete(`/teams/${teamId}/members/${memberId}`);
      toast.success('Członek usunięty');
      loadTeamsData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Błąd usuwania członka');
    }
  };

  // Helper do tekstu przycisku (zgodnie z hierarchią)
  const getInviteButtonText = (role: string) => {
    if (role === 'root') return 'Dodaj bezpośrednio';
    if (role === 'admin' || role === 'moderator') return 'Dodaj / Zaproś';
    return 'Zaproś';
  };

  if (loading) return <div className="container">Ładowanie zespołów...</div>;

  return (
    <div className="container fade-in">
      {errorMsg && (
        <div style={{ marginBottom: '1rem', color: 'var(--error)', background: '#fff6f6', padding: '0.75rem', borderRadius: '8px' }}>
          <strong>Szczegóły błędu:</strong> {String(errorMsg)}
        </div>
      )}
      {/* SEKCJA ZAPROSZEŃ */}
      {invitations.length > 0 && (
        <div className="card mb-8" style={{ border: '2px solid var(--primary-color)', background: 'var(--bg-card)' }}>
          <h3 className="flex items-center gap-2 mb-4">
            <Mail className="text-primary" /> Otrzymane Zaproszenia
          </h3>
          <div className="invitations-list">
            {invitations.map((inv) => (
              <div key={inv.team_id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg mb-2 shadow-sm">
                <div>
                  <span className="font-bold">{inv.teams.name}</span>
                  <p className="text-xs text-muted" style={{ margin: 0 }}>Zostałeś zaproszony do tego zespołu</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => handleAccept(inv.team_id)}>
                  Akceptuj
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="flex items-center gap-2 mb-6">
          <Users className="text-primary" /> Zarządzanie Zespołami
        </h2>

        {/* Każdy użytkownik może tworzyć zespoły */}
        <div className="create-team-box mb-8" style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="Nazwa nowego zespołu..." 
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            className="flex-grow"
          />
          <button className="btn btn-primary" onClick={handleCreateTeam}>
            <Plus size={18} /> Stwórz
          </button>
        </div>

        <div className="teams-list">
          {teams.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p className="text-muted">Nie należysz jeszcze do żadnego zespołu.</p>
            </div>
          ) : (
            teams.map((team) => (
              <div key={team.id} className="team-card card mb-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>{team.name}</h3>
                    {/* PRZYCISK USUWANIA ZESPOŁU */}
                    {(currentUser?.role === 'root' || 
                      (currentUser?.role === 'admin' && team.owner_id === currentUser.id) || 
                      (currentUser?.role === 'moderator' && team.owner_id === currentUser.id)) && (
                      <button 
                        onClick={() => handleDeleteTeam(team.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '5px' }}
                        title="Usuń zespół"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Utworzono: {new Date(team.created_at).toLocaleDateString()}
                  </span>

                <div className="members-list mt-4" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Członkowie ({team.members?.length || 0}):</h4>
                  {Array.isArray(team.members) && team.members.length > 0 ? (
                    team.members.map((m: any) => (
                      <div key={m.user_id} className="flex justify-between items-center text-sm py-1">
                        <span className={m.status === 'pending' ? 'text-muted' : ''}>
                          {m.profiles?.full_name || m.profiles?.email}
                          {m.profiles?.full_name && m.profiles?.email ? ` (${m.profiles?.email})` : ''}
                          {m.status === 'pending' && <span style={{ fontSize: '0.7rem' }}>(oczekuje)</span>}
                        </span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span className="badge" style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                            {m.profiles?.role === 'root' ? 'ROOT' : m.profiles?.role === 'admin' ? 'Admin' : m.profiles?.role === 'moderator' ? 'Moderator' : 'User'}
                          </span>
                          {/* PRZYCISK USUWANIA CZŁONKA */}
                          {(currentUser?.role === 'root' || 
                            (currentUser?.role === 'admin' && !['root', 'admin'].includes(m.profiles?.role)) || 
                            (currentUser?.role === 'moderator' && team.owner_id === currentUser.id && !['root', 'admin'].includes(m.profiles?.role))) && 
                            m.user_id !== currentUser.id && (
                            <button 
                              onClick={() => handleRemoveMember(team.id, m.user_id)}
                              style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '2px' }}
                              title="Usuń członka"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Brak członków</p>
                  )}
                </div>
                
                {/* Sekcja zapraszania dostępna dla ROOT, ADMIN, MODERATOR */}
                {['root', 'admin', 'moderator'].includes(currentUser?.role) && (
                  <div className="invite-box mt-4" style={{ display: 'flex', gap: '10px', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    <input 
                      type="email" 
                      placeholder="Email użytkownika..." 
                      value={inviteEmail[team.id] || ''}
                      onChange={(e) => setInviteEmail({ ...inviteEmail, [team.id]: e.target.value })}
                      className="flex-grow"
                    />
                    <button className="btn btn-secondary btn-sm" onClick={() => handleInvite(team.id)}>
                      <Mail size={16} /> {getInviteButtonText(currentUser?.role)}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamsPage;
