import { Request, Response } from 'express';
import { TeamService } from '../services/teamService';
import { ActivityService } from '../services/activityService';
import { supabaseAdmin } from '../config/supabase';

const teamService = new TeamService();

export class TeamController {
  // POST /api/teams
  async create(req: Request, res: Response) {
    try {
      const { name } = req.body;
      const userId = (req as any).user.id;
      const supabase = (req as any).supabase;

      const team = await teamService.createTeam(supabase, name, userId);
      
      // LOGUJEMY AKTYWNOŚĆ (ETAP 4)
      await ActivityService.log(supabase, userId, `stworzył zespół: ${name}`, team.id);

      const io = (req as any).io;
      if (io) {
        io.to(`user_${userId}`).emit('receive_notification', {
          title: 'Zespol',
          content: `Utworzono zespol: ${name}`
        });
      }

      res.status(201).json(team);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // GET /api/teams
  async listMyTeams(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const supabase = (req as any).supabase;

      const teams = await teamService.getMyTeams(supabase, userId);
      res.json(teams);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // POST /api/teams/:teamId/invite
  async invite(req: Request, res: Response) {
    try {
      const { email } = req.body;
      const { teamId } = req.params;
      const supabase = (req as any).supabase;
      const inviterId = (req as any).user.id;

      const member = await teamService.inviteMember(supabase, teamId as string, email, inviterId);

      // LOGUJEMY AKTYWNOŚĆ (ETAP 4)
      await ActivityService.log(supabase, inviterId, `zaprosił/dodał użytkownika ${email} do zespołu`, teamId as string);

      const io = (req as any).io;
      if (io && member?.user_id) {
        io.to(`user_${member.user_id}`).emit('receive_notification', {
          title: 'Zaproszenie',
          content: 'Masz nowe zaproszenie do zespolu.'
        });
      }

      res.json({ message: 'Akcja wykonana pomyślnie', member });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  // GET /api/teams/invitations
  async listInvitations(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const invitations = await teamService.getInvitations(userId);
      res.json(invitations);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // POST /api/teams/invitations/:teamId/accept
  async acceptInvitation(req: Request, res: Response) {
    try {
      const { teamId } = req.params;
      const userId = (req as any).user.id;
      const supabase = (req as any).supabase;

      await teamService.acceptInvitation(teamId as string, userId);
      
      await ActivityService.log(supabase, userId, `zaakceptował zaproszenie do zespołu`, teamId as string);

      const io = (req as any).io;
      if (io) {
        const { data: team } = await supabaseAdmin
          .from('teams')
          .select('owner_id, name')
          .eq('id', teamId)
          .single();
        if (team?.owner_id) {
          io.to(`user_${team.owner_id}`).emit('receive_notification', {
            title: 'Zespol',
            content: `Uzytkownik zaakceptowal zaproszenie do zespolu ${team?.name || ''}`.trim()
          });
        }
      }

      res.json({ message: 'Zaproszenie zaakceptowane' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // GET /api/teams/:teamId/members
  async getMembers(req: Request, res: Response) {
    try {
      const { teamId } = req.params;
      const supabase = (req as any).supabase;
      const members = await teamService.getTeamDetails(supabase, teamId as string);
      // Zwracamy bezpośrednio tablicę członków
      res.json(members);
    } catch (err: any) {
      console.error('Błąd w TeamController.getMembers:', err);
      // Zwracamy pustą tablicę zamiast 500 — frontend spodziewa się tablicy
      res.json([]);
    }
  }

  // DELETE /api/teams/:teamId
  async deleteTeam(req: Request, res: Response) {
    try {
      const { teamId } = req.params;
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;
      const supabase = (req as any).supabase;

      await teamService.deleteTeam(teamId as string, userId, userRole);
      
      await ActivityService.log(supabase, userId, `usunął zespół o ID: ${teamId}`);

      const io = (req as any).io;
      if (io) {
        io.to(`team_${teamId}`).emit('receive_notification', {
          title: 'Zespol',
          content: 'Zespol zostal usuniety.'
        });
      }

      res.json({ message: 'Zespół usunięty' });
    } catch (err: any) {
      res.status(403).json({ error: err.message });
    }
  }

  // DELETE /api/teams/:teamId/members/:userId
  async removeMember(req: Request, res: Response) {
    try {
      const { teamId, userId: targetUserId } = req.params;
      const requesterId = (req as any).user.id;
      const requesterRole = (req as any).user.role;
      const supabase = (req as any).supabase;

      await teamService.removeMember(teamId as string, targetUserId as string, requesterId, requesterRole);
      
      await ActivityService.log(supabase, requesterId, `usunął użytkownika ${targetUserId} z zespołu ${teamId}`);

      const io = (req as any).io;
      if (io) {
        io.to(`user_${targetUserId}`).emit('receive_notification', {
          title: 'Zespol',
          content: 'Zostales usuniety z zespolu.'
        });
      }

      res.json({ message: 'Członek usunięty' });
    } catch (err: any) {
      res.status(403).json({ error: err.message });
    }
  }
}
