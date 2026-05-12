import { Request, Response } from 'express';
import { MessageService } from '../services/messageService';

const messageService = new MessageService();

export class MessageController {
  async getGlobal(req: Request, res: Response) {
    try {
      const supabase = (req as any).supabase;
      const data = await messageService.getGlobalHistory(supabase);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async getPrivate(req: Request, res: Response) {
    try {
      const supabase = (req as any).supabase;
      const requesterId = (req as any).user.id;
      const otherUserId = req.params.userId as string;

      const data = await messageService.getPrivateHistory(supabase, requesterId, otherUserId);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
