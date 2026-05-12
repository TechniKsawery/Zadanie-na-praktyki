import { SupabaseClient } from '@supabase/supabase-js';
import { MessageRepository } from '../repositories/messageRepository';

export class MessageService {
  async createMessage(supabase: SupabaseClient, data: { sender_id: string; receiver_id?: string | null; team_id?: string | null; content: string }) {
    const repo = new MessageRepository(supabase);
    return repo.saveMessage(data);
  }

  async getGlobalHistory(supabase: SupabaseClient) {
    const repo = new MessageRepository(supabase);
    return repo.getGlobalMessages();
  }

  async getPrivateHistory(supabase: SupabaseClient, userId: string, otherUserId: string) {
    const repo = new MessageRepository(supabase);
    return repo.getPrivateMessages(userId, otherUserId);
  }
}
