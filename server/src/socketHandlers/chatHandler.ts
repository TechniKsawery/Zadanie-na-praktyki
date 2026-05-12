import { Server, Socket } from 'socket.io';
import { supabaseAdmin } from '../config/supabase';
import { MessageRepository } from '../repositories/messageRepository';

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

      const messageRepo = new MessageRepository(supabaseAdmin);
      const normalizedTeamId = data.teamId === 'global' ? null : data.teamId || null;

      const messagePayload = {
        sender_id: user.id,
        sender_email: user.email,
        content: data.content,
        team_id: normalizedTeamId,
        receiver_id: data.receiverId || null,
        created_at: new Date().toISOString()
      };

      await messageRepo.saveMessage({
        sender_id: user.id,
        receiver_id: data.receiverId || null,
        team_id: normalizedTeamId,
        sender_email: user.email || null,
        content: data.content
      });

      if (normalizedTeamId) {
        io.to(`team_${normalizedTeamId}`).emit('new_message', messagePayload);
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
    
    // Rozsyłamy AKTUALNĄ LISTĘ do wszystkich (io.emit)
    io.emit('online_users_list', Array.from(onlineUsers));
    
    console.log(`Użytkownik ${userId} jest ONLINE`);
  });

  // PROŚBA O LISTĘ (na start)
  socket.on('get_online_users', () => {
    socket.emit('online_users_list', Array.from(onlineUsers));
  });

  // ROZŁĄCZENIE
  socket.on('disconnect', () => {
    const userId = (socket as any).userId;
    if (userId) {
      onlineUsers.delete(userId);
      // Powiadamiamy wszystkich o nowej liście
      io.emit('online_users_list', Array.from(onlineUsers));
      console.log(`Użytkownik ${userId} jest OFFLINE`);
    }
  });
};
