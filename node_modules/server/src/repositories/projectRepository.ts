import { SupabaseClient } from '@supabase/supabase-js';

// Repozytorium teraz przyjmuje klienta 'supabase' jako argument.
// Dzięki temu wykonuje operacje w imieniu konkretnego, zalogowanego użytkownika.
export class ProjectRepository {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async getAllByOwner(_ownerId: string) {
    // Nie musimy już filtrować po owner_id, bo RLS (zabezpieczenia bazy) 
    // samo dopilnuje, żebyśmy widzieli tylko swoje dane.
    const { data, error } = await this.supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async getById(id: string) {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async create(projectData: { name: string; description: string; owner_id: string }) {
    // Ważne: baza sama przypisze owner_id dzięki naszym politykom RLS
    const { data, error } = await this.supabase
      .from('projects')
      .insert([projectData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async update(id: string, updateData: any) {
    const { data, error } = await this.supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async delete(id: string) {
    const { error } = await this.supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
}
