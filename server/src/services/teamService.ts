import { TeamRepository } from '../repositories/teamRepository';
import { supabaseAdmin } from '../config/supabase';

export class TeamService {
  private teamRepo = new TeamRepository();

  async createTeam(_supabase: any, name: string, ownerId: string) {
    return await this.teamRepo.create(name, ownerId);
  }

  async getMyTeams(_supabase: any, userId: string) {
    return await this.teamRepo.getUserTeams(userId);
  }

  async inviteMember(_supabase: any, teamId: string, userEmail: string) {
    // Szukamy profilu po emailu (profiles musi mieć kolumnę email)
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', userEmail)
      .maybeSingle();

    if (error) throw new Error('Błąd wyszukiwania: ' + error.message);
    if (!profile) throw new Error('Nie znaleziono użytkownika o podanym adresie email.');

    return await this.teamRepo.addMember(teamId, profile.id);
  }

  async getTeamDetails(_supabase: any, teamId: string) {
    const members = await this.teamRepo.getMembers(teamId);
    return { members };
  }
}
