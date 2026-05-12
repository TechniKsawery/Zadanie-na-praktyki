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

    // Automatycznie dodajemy twórcę jako członka (rola pochodzi z profilu, nie z team_members)
    const { error: memberError } = await supabaseAdmin
      .from('team_members')
      .insert([{ team_id: team.id, user_id: ownerId, status: 'accepted' }]);

    if (memberError) {
      console.error('Błąd dodawania właściciela:', memberError);
      // Nie przerywamy — zespół już istnieje
    }

    return team;
  }

  // POBIERANIE ZESPOŁÓW UŻYTKOWNIKA (tylko zaakceptowane)
  async getUserTeams(userId: string) {
    // 1. Sprawdzamy rolę użytkownika
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    // 2. Jeśli root lub admin - zwracamy wszystko
    if (['root', 'admin'].includes(profile?.role || '')) {
      const { data, error } = await supabaseAdmin
        .from('teams')
        .select('*')
        .order('name');
      if (error) throw new Error(error.message);
      return data || [];
    }

    // 3. Dla reszty - tylko ich zespoły
    const { data, error } = await supabaseAdmin
      .from('team_members')
      .select(`
        team_id,
        status,
        teams ( id, name, created_at, owner_id )
      `)
      .eq('user_id', userId)
      .eq('status', 'accepted');

    if (error) {
      console.error('Błąd pobierania zespołów:', error);
      throw new Error(error.message);
    }
    return (data || []).map((item: any) => item.teams).filter(Boolean);
  }

  // POBIERANIE ZAPROSZEŃ
  async getPendingInvitations(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('team_members')
      .select(`
        team_id,
        teams ( id, name, created_at )
      `)
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (error) throw new Error(error.message);
    return data || [];
  }

  // DODAWANIE CZŁONKA DO ZESPOŁU (rola pochodzi z profilu)
  async addMember(teamId: string, userId: string, status: string = 'accepted') {
    const { data, error } = await supabaseAdmin
      .from('team_members')
      .insert([{ team_id: teamId, user_id: userId, status }])
      .select()
      .single();

    if (error) {
      console.error('Błąd dodawania członka:', error);
      throw new Error(error.message);
    }
    return data;
  }

  // AKCEPTACJA ZAPROSZENIA
  async updateMemberStatus(teamId: string, userId: string, status: string) {
    const { data, error } = await supabaseAdmin
      .from('team_members')
      .update({ status })
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // POBIERANIE CZŁONKÓW ZESPOŁU (z detalami użytkowników i ich rolami)
  async getMembers(teamId: string) {
    try {
      console.log(`[TeamRepository.getMembers] START: pobieranie członków dla teamId=${teamId}`);
      
      // Krok 1: Pobierz team_members
      const { data: members, error: membersError } = await supabaseAdmin
        .from('team_members')
        .select('user_id, status')
        .eq('team_id', teamId);

      console.log(`[TeamRepository.getMembers] members response:`, { membersError, membersCount: members?.length });

      if (membersError) {
        console.error('Błąd pobierania team_members:', membersError);
        return [];
      }

      if (!members || members.length === 0) {
        console.log(`[TeamRepository.getMembers] Brak członków dla teamId=${teamId}`);
        return [];
      }

      // Krok 2: Pobierz profili dla wszystkich user_id
      const userIds = members.map((m: any) => m.user_id);
      console.log(`[TeamRepository.getMembers] userIds to fetch:`, userIds);
      
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('id, email, role, full_name')
        .in('id', userIds);

      console.log(`[TeamRepository.getMembers] profiles response:`, { profilesError, profilesCount: profiles?.length });

      if (profilesError) {
        console.error('Błąd pobierania profiles:', profilesError);
        // Zwróć members bez profili - fallback
        return members.map((m: any) => ({
          user_id: m.user_id,
          status: m.status,
          profiles: { email: 'unknown', role: 'user' }
        }));
      }

      // Krok 3: Połącz team_members z profiles (rola z profilu, nie z team_members)
      const result = members.map((m: any) => {
        const profile = profiles?.find((p: any) => p.id === m.user_id);
        return {
          user_id: m.user_id,
          status: m.status,
          role_in_team: profile?.role || 'user',
          profiles: profile || { email: `Użytkownik [${m.user_id.substring(0,8)}]`, role: 'user' }
        };
      });

      console.log(`[TeamRepository.getMembers] SUCCESS: ${result.length} członków dla ${teamId}`);
      return result;
    } catch (err) {
      console.error('Nieoczekiwany błąd podczas pobierania członków zespołu:', err);
      return [];
    }
  }

  async deleteTeam(teamId: string) {
    const { error } = await supabaseAdmin
      .from('teams')
      .delete()
      .eq('id', teamId);

    if (error) throw new Error(error.message);
    return true;
  }

  async deleteMember(teamId: string, userId: string) {
    const { error } = await supabaseAdmin
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return true;
  }
}
