import { TaskRepository } from '../repositories/taskRepository';
import { SupabaseClient } from '@supabase/supabase-js';

export class TaskService {
  async getTasksByProject(supabase: SupabaseClient, projectId: string) {
    const taskRepo = new TaskRepository(supabase);
    return await taskRepo.getByProject(projectId);
  }

  async createNewTask(supabase: SupabaseClient, taskData: any) {
    const taskRepo = new TaskRepository(supabase);
    return await taskRepo.create(taskData);
  }

  async updateTask(supabase: SupabaseClient, id: string, updateData: any) {
    const taskRepo = new TaskRepository(supabase);
    return await taskRepo.update(id, updateData);
  }

  async deleteTask(supabase: SupabaseClient, id: string) {
    const taskRepo = new TaskRepository(supabase);
    return await taskRepo.delete(id);
  }
}
