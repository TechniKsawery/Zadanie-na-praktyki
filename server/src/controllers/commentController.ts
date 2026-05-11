import { Request, Response } from 'express';
import { CommentService } from '../services/commentService';
import { ActivityService } from '../services/activityService';

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

      res.status(201).json(newComment);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
