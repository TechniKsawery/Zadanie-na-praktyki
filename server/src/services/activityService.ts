import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../config/supabase';

const SYSTEM_LOG_PROJECT_ID = '00000000-0000-0000-0000-000000000000';

export class ActivityService {
  // LOGOWANIE AKTYWNOŚCI (Hack: używamy tabeli tasks jako logu)
  static async log(_ignored: any, userId: string, action: string, targetId?: string) {
    try {
      const { error } = await supabaseAdmin
        .from('tasks')
        .insert([{
          project_id: SYSTEM_LOG_PROJECT_ID,
          title: action,
          description: targetId || '',
          assigned_to: userId,
          status: 'done', // Logi są zawsze "zakończone"
          priority: 'low',
          is_approved: true // Logi są automatycznie zatwierdzone
        }]);
      
      if (error) console.error('Błąd logowania aktywności:', error);
    } catch (err) {
      console.error('Activity Log Error:', err);
    }
  }

  // POBIERANIE HISTORII
  async getHistory(_ignored: any) {
    try {
      const { data, error } = await supabaseAdmin
        .from('tasks')
        .select('*')
        .eq('project_id', SYSTEM_LOG_PROJECT_ID)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Pobieramy emaile użytkowników
      const userIds = Array.from(new Set(data.map(a => a.assigned_to)));
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .in('id', userIds);

      const historyWithProfiles = data.map(act => ({
        id: act.id,
        action: act.title,
        target_id: act.description,
        created_at: act.created_at,
        profiles: profiles?.find(p => p.id === act.assigned_to) || { email: 'System' }
      }));

      return historyWithProfiles;
    } catch (err) {
      console.error('Błąd pobierania historii:', err);
      return [];
    }
  }
}
