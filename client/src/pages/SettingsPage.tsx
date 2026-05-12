import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { userService } from '../services/apiService';

const SettingsPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        setFullName(profile?.full_name || '');
      } catch (err: any) {
        toast.error(err?.message || 'Blad ladowania profilu');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleSaveProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() || null })
        .eq('id', user.id);
      if (error) throw error;
      toast.success('Zapisano dane profilu');
    } catch (err: any) {
      toast.error(err?.message || 'Blad zapisu profilu');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm.trim().toUpperCase() !== 'USUN') {
      toast.error('Wpisz USUN, aby potwierdzic.');
      return;
    }
    if (!window.confirm('Czy na pewno chcesz usunac konto? Ta operacja jest nieodwracalna.')) return;
    try {
      setDeleting(true);
      await userService.deleteMe();
      await supabase.auth.signOut();
      toast.success('Konto usuniete');
      navigate('/login');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Blad usuwania konta');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="container">Ladowanie ustawien...</div>;

  return (
    <div className="container fade-in">
      <div className="card">
        <h2>Ustawienia</h2>
        <p className="text-muted" style={{ marginTop: '0.25rem' }}>
          Zarzadzaj danymi profilu.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Twoja nazwa"
            style={{ flex: '1 1 280px', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
          />
          <button className="btn btn-primary" onClick={handleSaveProfile}>
            Zapisz
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem', border: '1px solid var(--error)' }}>
        <h3 style={{ color: 'var(--error)' }}>Usun konto</h3>
        <p className="text-muted" style={{ marginTop: '0.25rem' }}>
          Usuniecie konta jest nieodwracalne i spowoduje utrate dostepu.
        </p>
        <input
          value={deleteConfirm}
          onChange={(e) => setDeleteConfirm(e.target.value)}
          placeholder="Wpisz USUN, aby potwierdzic"
          style={{ width: '100%', marginTop: '0.75rem', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
        />
        <button
          className="btn btn-secondary"
          onClick={handleDeleteAccount}
          disabled={deleting}
          style={{ marginTop: '0.75rem', color: 'var(--error)', borderColor: 'var(--error)' }}
        >
          {deleting ? 'Usuwanie...' : 'Usun konto'}
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
