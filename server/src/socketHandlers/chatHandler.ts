import { Server, Socket } from 'socket.io';
import { supabaseAdmin } from '../config/supabase';

// PRZECHOWUJEMY ZALOGOWANYCH UŻYTKOWNIKÓW W PAMIĘCI (ID -> STATUS)
const onlineUsers = new Set<string>();

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
        io.to(`team_${data.teamId}`).emit('new_message', messagePayload);
      } else if (!data.receiverId) {
        io.emit('new_message', messagePayload);
      }

      if (data.receiverId) {
        io.to(`user_${data.receiverId}`).emit('new_private_message', messagePayload);
      }

    } catch (err) {
      console.error('Błąd socket:', err);
    }
  });

  // IDENTYFIKACJA UŻYTKOWNIKA (status online)
  socket.on('identify', (userId: string) => {
    if (!userId) return;
    socket.join(`user_${userId}`);
    (socket as any).userId = userId;
    onlineUsers.add(userId);
    
    // Rozsyłamy informację o nowym statusie
    io.emit('user_status_change', { userId, status: 'online' });
    
    // Wysyłamy aktualną listę online do nowego użytkownika
    socket.emit('online_users_list', Array.from(onlineUsers));
    
    console.log(`Użytkownik ${userId} jest ONLINE`);
  });

  // ROZŁĄCZENIE
  socket.on('disconnect', () => {
    const userId = (socket as any).userId;
    if (userId) {
      onlineUsers.delete(userId);
      io.emit('user_status_change', { userId, status: 'offline' });
      console.log(`Użytkownik ${userId} jest OFFLINE`);
    }
  });
};
