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
    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        profiles:user_id ( email, full_name )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data;
  }
}
