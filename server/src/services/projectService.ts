import { ProjectRepository } from '../repositories/projectRepository';
import { SupabaseClient } from '@supabase/supabase-js';

export class ProjectService {
  async listUserProjects(supabase: SupabaseClient, userId: string) {
    const projectRepo = new ProjectRepository(supabase);
    return await projectRepo.getAllByOwner(userId);
  }

  async getProject(supabase: SupabaseClient, id: string) {
    const projectRepo = new ProjectRepository(supabase);
    return await projectRepo.getById(id);
  }

  async createNewProject(supabase: SupabaseClient, name: string, description: string, userId: string) {
    const projectRepo = new ProjectRepository(supabase);
    return await projectRepo.create({ name, description, owner_id: userId });
  }

  async updateProject(supabase: SupabaseClient, id: string, updateData: any) {
    const projectRepo = new ProjectRepository(supabase);
    return await projectRepo.update(id, updateData);
  }

  async deleteProject(supabase: SupabaseClient, id: string) {
    const projectRepo = new ProjectRepository(supabase);
    return await projectRepo.delete(id);
  }
}
