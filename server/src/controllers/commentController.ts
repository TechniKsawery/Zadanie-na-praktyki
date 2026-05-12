import { Request, Response } from 'express';
import { CommentService } from '../services/commentService';
import { ActivityService } from '../services/activityService';
import { supabaseAdmin } from '../config/supabase';

const commentService = new CommentService();

export class CommentController {
  async getByTask(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      const comments = await commentService.getComments(taskId as string);
      res.json(comments);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { content } = req.body;
      const { taskId } = req.params;
      
      const newComment = await commentService.addComment(taskId as string, userId, content);
      
      // Log activity
      const supabase = (req as any).supabase;
      await ActivityService.log(supabase, userId, `skomentował zadanie`, taskId as string);

      const io = (req as any).io;
      if (io) {
        const { data: task } = await supabaseAdmin
          .from('tasks')
          .select('assigned_to, projects(team_id)')
          .eq('id', taskId)
          .single();

        const taskRow = task as any;
        const projectTeamId = Array.isArray(taskRow?.projects)
          ? taskRow?.projects?.[0]?.team_id
          : taskRow?.projects?.team_id;
        const teamId = projectTeamId || null;
        if (teamId) {
          io.to(`team_${teamId}`).emit('receive_notification', {
            title: 'Komentarz',
            content: 'Dodano nowy komentarz do zadania.'
          });
        }

        if (task?.assigned_to) {
          io.to(`user_${task.assigned_to}`).emit('receive_notification', {
            title: 'Komentarz',
            content: 'Dodano komentarz do Twojego zadania.'
          });
        }
      }

      res.status(201).json(newComment);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
