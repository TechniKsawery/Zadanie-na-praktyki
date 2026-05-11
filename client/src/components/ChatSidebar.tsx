import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { MessageSquare, Send, X, Users, Globe, Circle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { userService } from '../services/apiService';

const ChatSidebar: React.FC = () => {
  const { socket } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'global' | 'users'>('global');
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [privateHistory, setPrivateHistory] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    const initChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      const users = await userService.getUsers();
      setAllUsers(users.filter((u: any) => u.id !== user?.id));
    };
    initChat();

    if (socket) {
      socket.on('new_message', (msg) => {
        if (!msg.receiver_id) {
          setChatHistory((prev) => [...prev, msg]);
        }
      });

      socket.on('new_private_message', (msg) => {
        setPrivateHistory((prev) => [...prev, msg]);
      });

      socket.on('online_users_list', (users: string[]) => {
        setOnlineUsers(users);
      });

      socket.on('user_status_change', ({ userId, status }: { userId: string, status: 'online' | 'offline' }) => {
        setOnlineUsers(prev => {
          if (status === 'online') return Array.from(new Set([...prev, userId]));
          return prev.filter(id => id !== userId);
        });
      });
    }

    return () => {
      socket?.off('new_message');
      socket?.off('new_private_message');
      socket?.off('online_users_list');
      socket?.off('user_status_change');
    };
  }, [socket]);

  const sendMessage = async () => {
    if (!message.trim() || !socket) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const payload: any = {
      token: session.access_token,
      content: message,
    };

    if (selectedUser) {
      payload.receiverId = selectedUser.id;
      setPrivateHistory(prev => [...prev, {
        sender_id: currentUser.id,
        sender_email: currentUser.email,
        content: message,
        receiver_id: selectedUser.id,
        created_at: new Date().toISOString()
      }]);
    } else {
      payload.teamId = 'global';
    }

    socket.emit('send_message', payload);
    setMessage('');
  };

  const filteredPrivateMessages = privateHistory.filter(msg => 
    (msg.sender_id === selectedUser?.id && msg.receiver_id === currentUser?.id) ||
    (msg.sender_id === currentUser?.id && msg.receiver_id === selectedUser?.id)
  );

  return (
    <div className={`chat-sidebar ${isOpen ? 'open' : ''}`}>
      <button className="chat-toggle" onClick={() => setIsOpen(!isOpen)} title="Otwórz czat">
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header flex justify-between items-center p-4">
            <h3 className="text-lg font-bold" style={{ margin: 0 }}>
              {selectedUser ? `DM: ${selectedUser.email.split('@')[0]}` : 'Czat Ogólny'}
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={() => { setSelectedUser(null); setActiveTab('global'); }}
                className={`btn-mini ${activeTab === 'global' ? 'btn-primary-mini' : ''}`}
                title="Czat Ogólny"
                style={{ padding: '5px' }}
              >
                <Globe size={18} />
              </button>
              <button 
                onClick={() => setActiveTab('users')}
                className={`btn-mini ${activeTab === 'users' ? 'btn-primary-mini' : ''}`}
                title="Prywatne Wiadomości"
                style={{ padding: '5px' }}
              >
                <Users size={18} />
              </button>
            </div>
          </div>
          
          <div className="chat-content">
            {activeTab === 'users' && !selectedUser ? (
              <div className="user-list overflow-y-auto p-2 flex-grow">
                <p className="text-xs text-muted mb-2 px-2 uppercase font-bold">Użytkownicy:</p>
                {allUsers.length === 0 && <p className="text-xs text-center p-4">Brak innych użytkowników</p>}
                {allUsers.map(user => {
                  const isOnline = onlineUsers.includes(user.id);
                  return (
                    <button 
                      key={user.id}
                      onClick={() => { setSelectedUser(user); setActiveTab('users'); }}
                      className="w-full text-left p-2 hover:bg-gray-50 rounded flex items-center justify-between mb-1"
                      style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex-shrink-0 flex items-center justify-center text-xs font-bold">
                          {user.email[0].toUpperCase()}
                        </div>
                        <span className="text-sm truncate" style={{ color: 'var(--text-main)' }}>{user.email}</span>
                      </div>
                      <Circle size={10} fill={isOnline ? "#10b981" : "transparent"} color={isOnline ? "#10b981" : "#cbd5e1"} />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="chat-messages p-4">
                {(selectedUser ? filteredPrivateMessages : chatHistory).length === 0 && (
                  <p className="text-xs text-center text-muted mt-4">Brak wiadomości. Przywitaj się!</p>
                )}
                {(selectedUser ? filteredPrivateMessages : chatHistory).map((msg, i) => (
                  <div key={i} className={`message ${msg.sender_id === currentUser?.id ? 'text-right' : 'text-left'}`}>
                    <div className={`message-bubble text-sm ${
                      msg.sender_id === currentUser?.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {!selectedUser && msg.sender_id !== currentUser?.id && (
                        <div className="text-xs font-bold opacity-75 mb-1">{msg.sender_email?.split('@')[0]}</div>
                      )}
                      <p style={{ margin: 0 }}>{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {(activeTab === 'global' || selectedUser) && (
            <div className="chat-input p-4 border-t flex gap-2">
              <input 
                type="text" 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={selectedUser ? "Prywatna..." : "Wiadomość..."}
                className="flex-grow p-2 border rounded text-sm outline-none focus:ring-2"
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button 
                onClick={sendMessage}
                className="btn btn-primary"
                style={{ padding: '8px', borderRadius: '8px' }}
              >
                <Send size={18} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatSidebar;
