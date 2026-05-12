import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

export const SocketContext = createContext<SocketContextType>({ socket: null, connected: false });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode, userId?: string }> = ({ children, userId }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // ŁĄCZYMY SIĘ Z BACKENDEM
    const newSocket = io('http://localhost:5000');
    
    newSocket.on('connect', () => {
      setConnected(true);
      console.log('Połączono z WebSocket');
      // IDENTYFIKUJEMY SIĘ NA SERWERZE
      newSocket.emit('identify', userId);
    });

    // OBSŁUGA POWIADOMIEŃ NA ŻYWO (TOAST)
    newSocket.on('receive_notification', (data: { title: string, content: string }) => {
      toast.success(`${data.title}: ${data.content}`, {
        duration: 5000,
        position: 'top-right',
      });
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [userId]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};
