import { Request, Response } from 'express';
import { TaskService } from '../services/taskService';

const taskService = new TaskService();

export class TaskController {
  // GET /api/projects/:projectId/tasks
  async getByProject(req: Request, res: Response) {
    try {
      const supabase = (req as any).supabase;
      const tasks = await taskService.getTasksByProject(supabase, req.params.projectId as string);
      res.json(tasks);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // POST /api/projects/:projectId/tasks
  async create(req: Request, res: Response) {
    try {
      const supabase = (req as any).supabase;
      const taskData = { ...req.body, project_id: req.params.projectId };
      const newTask = await taskService.createNewTask(supabase, taskData);
      res.status(201).json(newTask);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // PATCH /api/tasks/:id
  async update(req: Request, res: Response) {
    try {
      const supabase = (req as any).supabase;
      const updated = await taskService.updateTask(supabase, req.params.id as string, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // DELETE /api/tasks/:id
  async delete(req: Request, res: Response) {
    try {
      const supabase = (req as any).supabase;
      await taskService.deleteTask(supabase, req.params.id as string);
      res.json({ message: 'Zadanie usunięte' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
