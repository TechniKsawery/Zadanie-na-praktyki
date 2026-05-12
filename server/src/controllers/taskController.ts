import { Request, Response } from 'express';
import { TaskService } from '../services/taskService';
import { supabaseAdmin } from '../config/supabase';

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
      const userRole = (req as any).user.role;
      const userId = (req as any).user.id;
      const supabase = (req as any).supabase;

      // Jeśli nie jest adminem/moderatorem, zadanie wymaga zatwierdzenia
      const isApproved = ['admin', 'moderator'].includes(userRole);
      
      const taskData = { 
        ...req.body, 
        project_id: req.params.projectId,
        is_approved: isApproved
      };

      const newTask = await taskService.createNewTask(supabase, taskData);
      const io = (req as any).io;
      if (io) {
        const { data: project } = await supabaseAdmin
          .from('projects')
          .select('team_id, name')
          .eq('id', req.params.projectId)
          .single();

        if (project?.team_id) {
          io.to(`team_${project.team_id}`).emit('receive_notification', {
            title: 'Zadanie',
            content: `Nowe zadanie w projekcie: ${project.name}`
          });
        }

        if (newTask?.assigned_to) {
          io.to(`user_${newTask.assigned_to}`).emit('receive_notification', {
            title: 'Zadanie',
            content: 'Zostales przypisany do nowego zadania.'
          });
        }
      }
      res.status(201).json(newTask);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // PATCH /api/tasks/:id
  async update(req: Request, res: Response) {
    try {
      const userRole = (req as any).user.role;
      const supabase = (req as any).supabase;
      const updateData = { ...req.body };

      // Jeśli użytkownik zmienia osobę przypisaną a nie jest adminem/modem
      if (updateData.assigned_to !== undefined && !['admin', 'moderator'].includes(userRole)) {
        // Przenosimy to do pola "pending", żeby admin musiał zaakceptować
        updateData.pending_assignee = updateData.assigned_to;
        delete updateData.assigned_to;
      }
      
      const updated = await taskService.updateTask(supabase, req.params.id as string, updateData);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // POST /api/tasks/:id/approve
  async approve(req: Request, res: Response) {
    try {
      const userRole = (req as any).user.role;
      const userId = (req as any).user.id;
      const supabase = (req as any).supabase;

      if (!['root', 'admin', 'moderator'].includes(userRole)) {
        return res.status(403).json({ error: 'Brak uprawnień do zatwierdzania.' });
      }

      // Jeśli moderator, sprawdź czy jest w zespole tego zadania
      if (userRole === 'moderator') {
        const { data: taskTeam } = await supabase
          .from('tasks')
          .select('id, projects(team_id)')
          .eq('id', req.params.id)
          .single();
          
        const teamId = taskTeam?.projects?.team_id;
        if (!teamId) {
          return res.status(403).json({ error: 'Tylko Admin może zatwierdzić zadanie nieprzypisane do zespołu.' });
        }

        const { data: isMember } = await supabase
          .from('team_members')
          .select('*')
          .eq('team_id', teamId)
          .eq('user_id', userId)
          .eq('status', 'accepted')
          .maybeSingle();

        if (!isMember) {
          return res.status(403).json({ error: 'Moderator może zatwierdzać tylko zadania w swoim zespole.' });
        }
      }

      const updated = await taskService.updateTask(supabase, req.params.id as string, { is_approved: true });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // POST /api/tasks/:id/approve-reassignment
  async approveReassignment(req: Request, res: Response) {
    try {
      const userRole = (req as any).user.role;
      const userId = (req as any).user.id;
      const supabase = (req as any).supabase;

      if (!['root', 'admin', 'moderator'].includes(userRole)) {
        return res.status(403).json({ error: 'Brak uprawnień do zatwierdzania zmian.' });
      }

      // Jeśli moderator, sprawdź zespół
      if (userRole === 'moderator') {
        const { data: taskTeam } = await supabase
          .from('tasks')
          .select('id, projects(team_id)')
          .eq('id', req.params.id)
          .single();
          
        const teamId = taskTeam?.projects?.team_id;
        if (!teamId) {
          return res.status(403).json({ error: 'Tylko Admin może zatwierdzić zmianę w zadaniu bez zespołu.' });
        }

        const { data: isMember } = await supabase
          .from('team_members')
          .select('*')
          .eq('team_id', teamId)
          .eq('user_id', userId)
          .eq('status', 'accepted')
          .maybeSingle();

        if (!isMember) {
          return res.status(403).json({ error: 'Moderator może zatwierdzać tylko zmiany w swoim zespole.' });
        }
      }

      const { data: currentTask } = await supabase.from('tasks').select('*').eq('id', req.params.id).single();

      if (!currentTask.pending_assignee) {
        return res.status(400).json({ error: 'Brak oczekującej zmiany osoby.' });
      }

      const updated = await taskService.updateTask(supabase, req.params.id as string, {
        assigned_to: currentTask.pending_assignee,
        pending_assignee: null
      });

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
