import { Request, Response } from 'express';
import { ActivityService } from '../services/activityService';
import { supabaseAdmin } from '../config/supabase';

const activityService = new ActivityService();

export class ActivityController {
  async getHistory(req: Request, res: Response) {
    try {
      const history = await activityService.getHistory(supabaseAdmin);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
