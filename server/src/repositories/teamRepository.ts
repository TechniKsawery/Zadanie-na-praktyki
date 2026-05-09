import { SupabaseClient } from '@supabase/supabase-js';

export class TeamRepository {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // TWORZENIE ZESPOŁU
  async create(name: string, ownerId: string) {
    // 1. Dodajemy zespół
    const { data: team, error: teamError } = await this.supabase
      .from('teams')
      .insert([{ name, owner_id: ownerId }])
      .select()
      .single();

    if (teamError) throw teamError;

    // 2. Automatycznie dodajemy twórcę jako członka (admina zespołu)
    const { error: memberError } = await this.supabase
      .from('team_members')
      .insert([{ team_id: team.id, user_id: ownerId, role_in_team: 'owner' }]);

    if (memberError) throw memberError;

    return team;
  }

  // POBIERANIE ZESPOŁÓW UŻYTKOWNIKA
  async getUserTeams(userId: string) {
    const { data, error } = await this.supabase
      .from('team_members')
      .select(`
        team_id,
        teams ( id, name, created_at, owner_id )
      `)
      .eq('user_id', userId);

    if (error) throw error;
    return data.map((item: any) => item.teams);
  }

  // DODAWANIE CZŁONKA DO ZESPOŁU
  async addMember(teamId: string, userId: string, role: string = 'member') {
    const { data, error } = await this.supabase
      .from('team_members')
      .insert([{ team_id: teamId, user_id: userId, role_in_team: role }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // POBIERANIE CZŁONKÓW ZESPOŁU
  async getMembers(teamId: string) {
    const { data, error } = await this.supabase
      .from('team_members')
      .select(`
        role_in_team,
        profiles:user_id ( id, email, full_name, avatar_url )
      `)
      .eq('team_id', teamId);

    if (error) throw error;
    return data;
  }
}
