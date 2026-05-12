import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../config/supabase';

// Repozytorium teraz przyjmuje klienta 'supabase' jako argument.
// Dzięki temu wykonuje operacje w imieniu konkretnego, zalogowanego użytkownika.
export class ProjectRepository {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async getAllByOwner(userId: string) {
    // 1. Sprawdzamy rolę użytkownika (używamy admina)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    // 2. Jeśli root lub admin - zwracamy wszystko
    if (['root', 'admin'].includes(profile?.role || '')) {
      const { data, error } = await supabaseAdmin
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }

    // 3. Dla reszty (Moderator, User) - musimy pobrać projekty, w których są właścicielami
    // LUB projekty przypisane do zespołów, do których należą.
    
    // Najpierw pobierzmy ID zespołów użytkownika
    const { data: teamMemberships } = await supabaseAdmin
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId)
      .eq('status', 'accepted');
    
    const teamIds = (teamMemberships || []).map(tm => tm.team_id);

    // Teraz pobieramy projekty (używając admina, aby pominąć RLS, ale filtrując ręcznie)
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .or(`owner_id.eq.${userId},team_id.in.(${teamIds.length > 0 ? teamIds.join(',') : '00000000-0000-0000-0000-000000000000'})`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getById(id: string) {
    // Używamy supabaseAdmin, aby uniknąć błędów RLS
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async create(projectData: { name: string; description: string; owner_id: string; team_id?: string | null }) {
    // Używamy supabaseAdmin, aby uniknąć błędów rekurencji RLS przy tworzeniu
    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert([projectData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async update(id: string, updateData: any) {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async delete(id: string) {
    const { error } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
}
