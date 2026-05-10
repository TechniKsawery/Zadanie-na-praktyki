import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

export class UserController {
  async getAllUsers(req: Request, res: Response) {
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name, avatar_url');
      
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
