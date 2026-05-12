import { ProjectRepository } from '../repositories/projectRepository';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../config/supabase';

export class ProjectService {
  async listUserProjects(supabase: SupabaseClient, userId: string) {
    const projectRepo = new ProjectRepository(supabase);
    return await projectRepo.getAllByOwner(userId);
  }

  async getProject(supabase: SupabaseClient, id: string) {
    const projectRepo = new ProjectRepository(supabase);
    return await projectRepo.getById(id);
  }

  async createNewProject(
    supabase: SupabaseClient, 
    name: string, 
    description: string, 
    userId: string,
    team_id?: string | null
  ) {
    const projectRepo = new ProjectRepository(supabase);
    return await projectRepo.create({ 
      name, 
      description, 
      owner_id: userId, 
      team_id: team_id || null 
    });
  }

  async updateProject(supabase: SupabaseClient, id: string, updateData: any, userId: string, userRole: string) {
    const projectRepo = new ProjectRepository(supabase);
    const project = await projectRepo.getById(id);
    if (!project) throw new Error('Projekt nie istnieje.');

    const { data: ownerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', project.owner_id)
      .single();

    const ownerRole = ownerProfile?.role || 'user';

    if (userRole === 'root') {
      // Root może wszystko
    } else if (userRole === 'admin') {
      if (ownerRole === 'root') throw new Error('Admin nie może edytować projektów Roota.');
      if (ownerRole === 'admin') throw new Error('Admin nie może edytować projektów Admina.');
    } else if (userRole === 'moderator') {
      const isOwner = project.owner_id === userId;
      let isMember = false;
      if (project.team_id) {
        const { data: membership } = await supabaseAdmin
          .from('team_members')
          .select('id')
          .eq('team_id', project.team_id)
          .eq('user_id', userId)
          .eq('status', 'accepted')
          .maybeSingle();
        isMember = !!membership;
      }

      if (!isOwner && !isMember) {
        throw new Error('Moderator może edytować tylko swoje projekty lub projekty w swoich zespołach.');
      }
      if (ownerRole === 'root') throw new Error('Moderator nie może edytować projektów Roota.');
    } else {
      if (project.owner_id !== userId) {
        throw new Error('Brak uprawnień do edycji projektu.');
      }
    }

    return await projectRepo.update(id, updateData);
  }

  async deleteProject(supabase: SupabaseClient, id: string, userId: string, userRole: string) {
    const projectRepo = new ProjectRepository(supabase);
    
    // 1. Pobieramy projekt, aby sprawdzić właściciela
    const project = await projectRepo.getById(id);
    if (!project) throw new Error('Projekt nie istnieje.');

    // 2. Logika uprawnień
    if (userRole === 'root') {
      // Root może wszystko
    } else if (userRole === 'admin') {
      // Admin może wszystko, chyba że właściciel to Root lub Admin
      const { data: owner } = await supabaseAdmin.from('profiles').select('role').eq('id', project.owner_id).single();
      if (owner?.role === 'root') throw new Error('Admin nie może usuwać projektów Roota.');
      if (owner?.role === 'admin') throw new Error('Admin nie może usuwać projektów Admina.');
    } else if (userRole === 'moderator') {
      // Moderator może swoje lub zespołowe, w których jest członkiem
      let isMember = false;
      if (project.team_id) {
        const { data: membership } = await supabaseAdmin
          .from('team_members')
          .select('id')
          .eq('team_id', project.team_id)
          .eq('user_id', userId)
          .eq('status', 'accepted')
          .maybeSingle();
        isMember = !!membership;
      }

      if (!isMember && project.owner_id !== userId) {
        throw new Error('Moderator może usuwać tylko swoje projekty lub projekty w swoich zespołach.');
      }

      const { data: owner } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', project.owner_id)
        .single();

      if (owner?.role === 'root') throw new Error('Moderator nie może usuwać projektów Roota.');
    } else {
      throw new Error('Brak uprawnień do usunięcia projektu.');
    }

    return await projectRepo.delete(id);
  }
}
