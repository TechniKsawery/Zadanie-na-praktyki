import { supabaseAdmin } from '../config/supabase';

export class TeamRepository {

  // TWORZENIE ZESPOŁU (używamy admin client - pomija RLS)
  async create(name: string, ownerId: string) {
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .insert([{ name, owner_id: ownerId }])
      .select()
      .single();

    if (teamError) {
      console.error('Błąd tworzenia zespołu:', teamError);
      throw new Error(teamError.message);
    }

    // Automatycznie dodajemy twórcę jako właściciela
    const { error: memberError } = await supabaseAdmin
      .from('team_members')
      .insert([{ team_id: team.id, user_id: ownerId, role_in_team: 'owner' }]);

    if (memberError) {
      console.error('Błąd dodawania właściciela:', memberError);
      // Nie przerywamy — zespół już istnieje
    }

    return team;
  }

  // POBIERANIE ZESPOŁÓW UŻYTKOWNIKA
  async getUserTeams(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('team_members')
      .select(`
        team_id,
        teams ( id, name, created_at, owner_id )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Błąd pobierania zespołów:', error);
      throw new Error(error.message);
    }
    return (data || []).map((item: any) => item.teams).filter(Boolean);
  }

  // DODAWANIE CZŁONKA DO ZESPOŁU
  async addMember(teamId: string, userId: string, role: string = 'member') {
    const { data, error } = await supabaseAdmin
      .from('team_members')
      .insert([{ team_id: teamId, user_id: userId, role_in_team: role }])
      .select()
      .single();

    if (error) {
      console.error('Błąd dodawania członka:', error);
      throw new Error(error.message);
    }
    return data;
  }

  // POBIERANIE CZŁONKÓW ZESPOŁU
  async getMembers(teamId: string) {
    const { data, error } = await supabaseAdmin
      .from('team_members')
      .select(`
        role_in_team,
        user_id
      `)
      .eq('team_id', teamId);

    if (error) {
      console.error('Błąd pobierania członków:', error);
      throw new Error(error.message);
    }
    return data || [];
  }
}
