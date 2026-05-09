import { SupabaseClient } from '@supabase/supabase-js';
import { TeamRepository } from '../repositories/teamRepository';

export class TeamService {
  async createTeam(supabase: SupabaseClient, name: string, ownerId: string) {
    const teamRepo = new TeamRepository(supabase);
    return await teamRepo.create(name, ownerId);
  }

  async getMyTeams(supabase: SupabaseClient, userId: string) {
    const teamRepo = new TeamRepository(supabase);
    return await teamRepo.getUserTeams(userId);
  }

  async inviteMember(supabase: SupabaseClient, teamId: string, userEmail: string) {
    const teamRepo = new TeamRepository(supabase);
    
    // 1. Szukamy użytkownika po emailu w profilach
    const { data: profile, error: searchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (searchError || !profile) {
      throw new Error('Nie znaleziono użytkownika o podanym adresie email.');
    }

    // 2. Dodajemy go do zespołu
    return await teamRepo.addMember(teamId, profile.id);
  }

  async getTeamDetails(supabase: SupabaseClient, teamId: string) {
    const teamRepo = new TeamRepository(supabase);
    const members = await teamRepo.getMembers(teamId);
    return { members };
  }
}
