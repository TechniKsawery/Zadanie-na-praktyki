import { Server, Socket } from 'socket.io';
import { supabaseAdmin } from '../config/supabase';

export const registerChatHandlers = (io: Server, socket: Socket) => {
  
  // DOŁĄCZANIE DO POKOJU ZESPOŁU
  socket.on('join_team', (teamId: string) => {
    socket.join(`team_${teamId}`);
  });

  // WYSYŁANIE WIADOMOŚCI
  socket.on('send_message', async (data: {
    token: string;
    teamId?: string;
    receiverId?: string;
    content: string;
  }) => {
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(data.token);
      if (error || !user) return;

      const messagePayload = {
        sender_id: user.id,
        sender_email: user.email,
        content: data.content,
        team_id: data.teamId || null,
        receiver_id: data.receiverId || null,
        created_at: new Date().toISOString()
      };

      if (data.teamId && data.teamId !== 'global') {
        // Wiadomość do pokoju zespołu
        io.to(`team_${data.teamId}`).emit('new_message', messagePayload);
      } else {
        // Wiadomość globalna — broadcast do wszystkich
        io.emit('new_message', messagePayload);
      }

      if (data.receiverId) {
        // Wiadomość prywatna
        io.to(`user_${data.receiverId}`).emit('new_private_message', messagePayload);
      }

    } catch (err) {
      console.error('Błąd socket:', err);
    }
  });

  // IDENTYFIKACJA UŻYTKOWNIKA (dla powiadomień prywatnych)
  socket.on('identify', (userId: string) => {
    socket.join(`user_${userId}`);
    console.log(`Użytkownik ${userId} zidentyfikowany na sockecie ${socket.id}`);
  });
};
