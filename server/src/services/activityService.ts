import { SupabaseClient } from '@supabase/supabase-js';

export class ActivityService {
  // LOGOWANIE AKTYWNOŚCI
  static async log(supabase: SupabaseClient, userId: string, action: string, targetId?: string) {
    try {
      const { error } = await supabase
        .from('activities')
        .insert([{
          user_id: userId,
          action: action,
          target_id: targetId
        }]);
      
      if (error) console.error('Błąd logowania aktywności:', error);
    } catch (err) {
      console.error('Activity Log Error:', err);
    }
  }

  // POBIERANIE HISTORII
  async getHistory(supabase: SupabaseClient) {
    try {
      // Pobieramy aktywności
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Pobieramy emaile użytkowników osobno (bezpieczniejszy join manualny)
      const userIds = Array.from(new Set(data.map(a => a.user_id)));
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);

      const historyWithProfiles = data.map(act => ({
        ...act,
        profiles: profiles?.find(p => p.id === act.user_id) || { email: 'System' }
      }));

      return historyWithProfiles;
    } catch (err) {
      console.error('Błąd pobierania historii:', err);
      return [];
    }
  }
}
