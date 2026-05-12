import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import { userService } from '../services/apiService';
import toast from 'react-hot-toast';

const UsersPage: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<string>('user');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const loadCurrentRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile?.role) setCurrentRole(profile.role);
  };

  const loadUsers = async () => {
    try {
      const data = await userService.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Blad ladowania uzytkownikow');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadCurrentRole();
      if (['root', 'admin'].includes(currentRole)) {
        await loadUsers();
      } else {
        setLoading(false);
      }
    };
    init();
  }, [currentRole]);

  const roleOrder = ['root', 'admin', 'moderator', 'user'];

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      String(u.email || '').toLowerCase().includes(q) ||
      String(u.full_name || '').toLowerCase().includes(q)
    );
  }, [query, users]);

  const groupedUsers = useMemo(() => {
    const groups: Record<string, any[]> = {};
    roleOrder.forEach((role) => {
      groups[role] = [];
    });

    filteredUsers.forEach((u) => {
      const role = roleOrder.includes(u.role) ? u.role : 'user';
      groups[role] = groups[role] || [];
      groups[role].push(u);
    });

    return roleOrder
      .map((role) => ({ role, users: groups[role] || [] }))
      .filter((group) => group.users.length > 0);
  }, [filteredUsers]);

  const canPromoteToModerator = (targetRole: string) => {
    if (currentRole === 'admin') return targetRole === 'user';
    if (currentRole === 'root') return ['user', 'moderator', 'admin'].includes(targetRole);
    return false;
  };

  const canPromoteToAdmin = (targetRole: string) => {
    return currentRole === 'root' && ['user', 'moderator'].includes(targetRole);
  };

  const canDemoteToUser = (targetRole: string) => {
    if (currentRole === 'admin') return targetRole === 'moderator';
    if (currentRole === 'root') return ['moderator', 'admin'].includes(targetRole);
    return false;
  };

  const canDemoteToModerator = (targetRole: string) => {
    return currentRole === 'root' && targetRole === 'admin';
  };

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      const updated = await userService.updateRole(userId, role);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      toast.success('Zmieniono role');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Blad zmiany roli');
    }
  };

  if (loading) return <div className="container">Ladowanie uzytkownikow...</div>;

  if (!['root', 'admin'].includes(currentRole)) {
    return (
      <div className="container">
        <div className="card">
          <h2>Brak uprawnien</h2>
          <p>Ta sekcja jest dostepna tylko dla administratora i roota.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container fade-in">
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2>Uzytkownicy aplikacji</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Lista uzytkownikow z podzialem na role oraz akcje awansu i degradacji.
        </p>
        <div style={{ marginTop: '1rem' }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Wyszukaj po nazwie lub emailu..."
            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
          />
        </div>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '0.75rem 0.5rem', wordBreak: 'break-word', whiteSpace: 'normal' }}>Uzytkownik</th>
                <th style={{ padding: '0.75rem 0.5rem', wordBreak: 'break-word', whiteSpace: 'normal' }}>Rola</th>
                <th style={{ padding: '0.75rem 0.5rem', wordBreak: 'break-word', whiteSpace: 'normal' }}>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ padding: '1rem', color: 'var(--text-muted)', wordBreak: 'break-word', whiteSpace: 'normal' }}>
                    Brak wynikow.
                  </td>
                </tr>
              )}
              {groupedUsers.map((group) => (
                <React.Fragment key={group.role}>
                  <tr>
                    <td colSpan={3} style={{ padding: '0.75rem 0.5rem', fontWeight: 700, wordBreak: 'break-word', whiteSpace: 'normal' }}>
                      {group.role.toUpperCase()}
                    </td>
                  </tr>
                  {group.users.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                        {u.full_name ? (
                          <div style={{ fontWeight: 600 }}>{u.full_name}</div>
                        ) : null}
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{u.email}</div>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', wordBreak: 'break-word', whiteSpace: 'normal' }}>
                        <span className="badge" style={{ textTransform: 'uppercase' }}>{u.role}</span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', wordBreak: 'break-word', whiteSpace: 'normal' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {canPromoteToModerator(u.role) && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleRoleChange(u.id, 'moderator')}
                            >
                              Awansuj na moderatora
                            </button>
                          )}
                          {canPromoteToAdmin(u.role) && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleRoleChange(u.id, 'admin')}
                            >
                              Awansuj na admina
                            </button>
                          )}
                          {canDemoteToModerator(u.role) && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleRoleChange(u.id, 'moderator')}
                            >
                              Degraduj do moderatora
                            </button>
                          )}
                          {canDemoteToUser(u.role) && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleRoleChange(u.id, 'user')}
                            >
                              Degraduj do usera
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
