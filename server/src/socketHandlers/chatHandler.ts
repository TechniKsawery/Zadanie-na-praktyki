import { Server, Socket } from 'socket.io';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

export const registerChatHandlers = (io: Server, socket: Socket) => {
  
  // DOŁĄCZANIE DO POKOJU ZESPOŁU
  socket.on('join_team', (teamId: string) => {
    socket.join(`team_${teamId}`);
    console.log(`Socket ${socket.id} dołączył do pokoju zespołu: ${teamId}`);
  });

  // WYSYŁANIE WIADOMOŚCI PRZEZ SOCKET
  socket.on('send_message', async (data: {
    token: string;
    teamId?: string;
    receiverId?: string;
    content: string;
  }) => {
    try {
      // 1. Weryfikujemy użytkownika przez token (bezpieczeństwo!)
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${data.token}` } }
      });
      const { data: { user } } = await supabase.auth.getUser(data.token);
      
      if (!user) return;

      const messagePayload = {
        sender_id: user.id,
        content: data.content,
        team_id: data.teamId,
        receiver_id: data.receiverId
      };

      // 2. Emitujemy do odpowiedniego pokoju (real-time)
      if (data.teamId) {
        io.to(`team_${data.teamId}`).emit('new_message', {
          ...messagePayload,
          sender_email: user.email,
          created_at: new Date().toISOString()
        });
      } else if (data.receiverId) {
        // Wiadomość prywatna (prosty mechanizm pokoi po ID użytkownika)
        io.to(`user_${data.receiverId}`).emit('new_private_message', {
          ...messagePayload,
          sender_email: user.email
        });
      }

      console.log(`Wiadomość wysłana przez ${user.email}`);
    } catch (err) {
      console.error('Socket error:', err);
    }
  });

  // DOŁĄCZANIE DO WŁASNEGO POKOJU (DLA POWIADOMIEŃ I WIADOMOŚCI PRYWATNYCH)
  socket.on('identify', (userId: string) => {
    socket.join(`user_${userId}`);
    console.log(`Użytkownik ${userId} zidentyfikowany na sockecie ${socket.id}`);
  });
};
