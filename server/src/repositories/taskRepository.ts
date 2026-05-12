import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../config/supabase';

export class TaskRepository {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async getByProject(projectId: string) {
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  }

  async create(taskData: any) {
    // Jeśli zadanie ma assigned_to (ID użytkownika), pobierz jego email i ustaw assigned_to_name
    if (taskData.assigned_to) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('email, full_name')
        .eq('id', taskData.assigned_to)
        .single();
      
      if (profile) {
        taskData.assigned_to_name = profile.full_name || profile.email;
      }
    }

    // Jeśli ma pending_assignee, również pobierz email dla podglądu (opcjonalnie w name lub innym polu)
    if (taskData.pending_assignee) {
      const { data: pProfile } = await supabaseAdmin
        .from('profiles')
        .select('email, full_name')
        .eq('id', taskData.pending_assignee)
        .single();
      if (pProfile) {
        taskData.pending_assignee_name = pProfile.full_name || pProfile.email;
      }
    }

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .insert([taskData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async update(id: string, updateData: any) {
    // Jeśli update zmienia assigned_to, również ustaw assigned_to_name
    if (updateData.assigned_to !== undefined) {
      if (updateData.assigned_to) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('email, full_name')
          .eq('id', updateData.assigned_to)
          .single();
        
        if (profile) {
          updateData.assigned_to_name = profile.full_name || profile.email;
        }
      } else {
        // Jeśli assigned_to = null, też wyczyść assigned_to_name
        updateData.assigned_to_name = null;
      }
    }

    // Obsługa pending_assignee
    if (updateData.pending_assignee !== undefined) {
      if (updateData.pending_assignee) {
        const { data: pProfile } = await supabaseAdmin
          .from('profiles')
          .select('email, full_name')
          .eq('id', updateData.pending_assignee)
          .single();
        if (pProfile) {
          updateData.pending_assignee_name = pProfile.full_name || pProfile.email;
        }
      } else {
        updateData.pending_assignee_name = null;
      }
    }

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async delete(id: string) {
    const { error } = await supabaseAdmin
      .from('tasks')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
}
