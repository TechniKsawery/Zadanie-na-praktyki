import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

export class UserController {
  async getPublicUsers(req: Request, res: Response) {
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name, role');

      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAllUsers(req: Request, res: Response) {
    try {
      const requesterRole = (req as any).user?.role || 'user';
      if (!['root', 'admin'].includes(requesterRole)) {
        return res.status(403).json({ error: 'Brak uprawnień.' });
      }

      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name, avatar_url, role');
      
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateUserRole(req: Request, res: Response) {
    try {
      const requesterRole = (req as any).user?.role || 'user';
      const requesterId = (req as any).user?.id;
      const { id: targetUserId } = req.params;
      const { role: newRole } = req.body;

      if (!['root', 'admin'].includes(requesterRole)) {
        return res.status(403).json({ error: 'Brak uprawnień.' });
      }

      if (!['user', 'moderator', 'admin'].includes(newRole)) {
        return res.status(400).json({ error: 'Nieprawidłowa rola.' });
      }

      if (requesterId === targetUserId) {
        return res.status(400).json({ error: 'Nie możesz zmienić własnej roli.' });
      }

      const { data: targetProfile, error: targetError } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', targetUserId)
        .single();

      if (targetError || !targetProfile) {
        return res.status(404).json({ error: 'Użytkownik nie istnieje.' });
      }

      const targetRole = targetProfile.role || 'user';

      if (targetRole === 'root') {
        return res.status(403).json({ error: 'Nie można zmieniać roli Roota.' });
      }

      if (requesterRole === 'admin') {
        if (!['user', 'moderator'].includes(targetRole)) {
          return res.status(403).json({ error: 'Admin nie może zmieniać tej roli.' });
        }
        if (!['user', 'moderator'].includes(newRole)) {
          return res.status(403).json({ error: 'Admin może ustawić tylko user/moderator.' });
        }
      }

      const { data: updated, error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ role: newRole })
        .eq('id', targetUserId)
        .select('id, email, full_name, avatar_url, role')
        .single();

      if (updateError) throw updateError;

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteMe(req: Request, res: Response) {
    try {
      const requesterId = (req as any).user?.id;
      if (!requesterId) {
        return res.status(401).json({ error: 'Brak autoryzacji.' });
      }

      const { error } = await supabaseAdmin.auth.admin.deleteUser(requesterId);
      if (error) throw error;

      res.json({ message: 'Konto usuniete' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
