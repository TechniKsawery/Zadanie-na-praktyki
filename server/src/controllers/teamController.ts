import { Request, Response } from 'express';
import { TeamService } from '../services/teamService';

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
      const { ActivityService } = await import('../services/activityService');
      await ActivityService.log(supabase, userId, `stworzył zespół: ${name}`, team.id);

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

      const member = await teamService.inviteMember(supabase, teamId as string, email);

      // LOGUJEMY AKTYWNOŚĆ (ETAP 4)
      const userId = (req as any).user.id;
      const { ActivityService } = await import('../services/activityService');
      await ActivityService.log(supabase, userId, `zaprosił użytkownika ${email} do zespołu`, teamId as string);

      res.json({ message: 'Użytkownik zaproszony pomyślnie', member });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  // GET /api/teams/:teamId/members
  async getMembers(req: Request, res: Response) {
    try {
      const { teamId } = req.params;
      const supabase = (req as any).supabase;

      const details = await teamService.getTeamDetails(supabase, teamId as string);
      res.json(details);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
