import { SupabaseClient } from '@supabase/supabase-js';

export class MessageRepository {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // ZAPISYWANIE WIADOMOŚCI (PRYWATNEJ LUB ZESPOŁOWEJ)
  async saveMessage(messageData: {
    sender_id: string;
    receiver_id?: string | null;
    team_id?: string | null;
    sender_email?: string | null;
    content: string;
    file_url?: string;
  }) {
    const { data, error } = await this.supabase
      .from('messages')
      .insert([messageData])
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  // POBIERANIE HISTORII CZATU ZESPOŁOWEGO
  async getTeamMessages(teamId: string) {
    const { data, error } = await this.supabase
      .from('messages')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  // POBIERANIE HISTORII CZATU GLOBALNEGO
  async getGlobalMessages() {
    const { data, error } = await this.supabase
      .from('messages')
      .select('*')
      .is('team_id', null)
      .is('receiver_id', null)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  // POBIERANIE CZATU PRYWATNEGO (MIĘDZY DWOMA OSOBAMI)
  async getPrivateMessages(user1: string, user2: string) {
    const { data, error } = await this.supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user1},receiver_id.eq.${user2}),and(sender_id.eq.${user2},receiver_id.eq.${user1})`)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }
}
