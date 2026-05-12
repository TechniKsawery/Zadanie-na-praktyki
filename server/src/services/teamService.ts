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

  async inviteMember(_supabase: any, teamId: string, userEmail: string, inviterId: string) {
    // 1. Pobieramy profil zapraszającego, aby znać jego rolę
    const { data: inviter } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', inviterId)
      .single();

    // 2. Szukamy profilu zapraszanego
    const { data: target, error } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('email', userEmail)
      .maybeSingle();

    if (error) throw new Error('Błąd wyszukiwania: ' + error.message);
    if (!target) throw new Error('Nie znaleziono użytkownika o podanym adresie email.');

    // 3. Sprawdzamy czy już nie jest w zespole (żeby uniknąć błędu duplicate key)
    const { data: existing } = await supabaseAdmin
      .from('team_members')
      .select('status')
      .eq('team_id', teamId)
      .eq('user_id', target.id)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'pending') throw new Error('Użytkownik ma już oczekujące zaproszenie.');
      throw new Error('Użytkownik jest już członkiem tego zespołu.');
    }

    // 4. Logika hierarchii: Root > Admin > Moderator > User
    const rolesOrder: { [key: string]: number } = { 'root': 3, 'admin': 2, 'moderator': 1, 'user': 0 };
    const inviterRole = inviter?.role || 'user';
    const targetRole = target?.role || 'user';
    
    let status = 'pending';
    
    if (inviterRole === 'root') {
      // Root dodaje każdego bezpośrednio
      status = 'accepted';
    } else if (inviterRole === 'admin') {
      // Admin dodaje moderatora i usera bez pytania
      if (rolesOrder[targetRole] < 2) status = 'accepted';
    } else if (inviterRole === 'moderator') {
      // Moderator dodaje usera bez pytania
      if (rolesOrder[targetRole] < 1) status = 'accepted';
    }

    return await this.teamRepo.addMember(teamId, target.id, status);
  }

  async getInvitations(userId: string) {
    return await this.teamRepo.getPendingInvitations(userId);
  }

  async acceptInvitation(teamId: string, userId: string) {
    return await this.teamRepo.updateMemberStatus(teamId, userId, 'accepted');
  }

  async getTeamDetails(_supabase: any, teamId: string) {
    const members = await this.teamRepo.getMembers(teamId);
    return members;
  }

  async deleteTeam(teamId: string, userId: string, userRole: string) {
    // 1. Pobieramy dane zespołu, aby sprawdzić właściciela
    const { data: team } = await supabaseAdmin
      .from('teams')
      .select('owner_id')
      .eq('id', teamId)
      .single();

    if (!team) throw new Error('Nie znaleziono zespołu.');

    // 2. Logika uprawnień
    if (userRole === 'root') {
      // Root może wszystko
    } else if (userRole === 'admin') {
      // Admin może wszystko, chyba że właściciel to Root lub Admin
      const { data: owner } = await supabaseAdmin.from('profiles').select('role').eq('id', team.owner_id).single();
      if (owner?.role === 'root') throw new Error('Admin nie może usuwać zasobów Roota.');
      if (owner?.role === 'admin') throw new Error('Admin nie może usuwać zasobów Admina.');
    } else if (userRole === 'moderator') {
      // Moderator może tylko swoje
      if (team.owner_id !== userId) throw new Error('Moderator może usuwać tylko swoje zespoły.');
    } else {
      throw new Error('Brak uprawnień do usuwania zespołu.');
    }

    return await this.teamRepo.deleteTeam(teamId);
  }

  async removeMember(teamId: string, targetUserId: string, requesterId: string, requesterRole: string) {
    // 1. Pobieramy dane zespołu i członka
    const [{ data: team }, { data: targetProfile }] = await Promise.all([
      supabaseAdmin.from('teams').select('owner_id').eq('id', teamId).single(),
      supabaseAdmin.from('profiles').select('role').eq('id', targetUserId).single()
    ]);

    if (!team) throw new Error('Zespół nie istnieje.');
    if (!targetProfile) throw new Error('Użytkownik nie istnieje.');

    const targetRole = targetProfile.role || 'user';
    const rolesOrder: { [key: string]: number } = { 'root': 3, 'admin': 2, 'moderator': 1, 'user': 0 };

    // 2. Logika uprawnień
    if (requesterRole === 'root') {
      // Root może usuwać każdego
    } else if (requesterRole === 'admin') {
      // Admin nie może usuwać Roota ani Admina
      if (['root', 'admin'].includes(targetRole)) {
        throw new Error('Admin nie może usuwać Admina ani Roota.');
      }
    } else if (requesterRole === 'moderator') {
      // Moderator może usuwać tylko jeśli jest właścicielem zespołu i target ma niższą/równą rangę (ale nie admin/root)
      if (team.owner_id !== requesterId) throw new Error('Tylko właściciel zespołu może usuwać członków.');
      if (rolesOrder[targetRole] >= 2) throw new Error('Moderator nie może usuwać Admina ani Roota.');
    } else {
      // Zwykły użytkownik może usunąć tylko siebie samego
      if (requesterId !== targetUserId) throw new Error('Brak uprawnień.');
    }

    return await this.teamRepo.deleteMember(teamId, targetUserId);
  }
}
