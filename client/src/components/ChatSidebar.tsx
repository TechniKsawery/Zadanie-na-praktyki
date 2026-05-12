import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { MessageSquare, Send, X, Users, Globe, Circle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { userService, messageService } from '../services/apiService';
import toast from 'react-hot-toast';

const ChatSidebar: React.FC = () => {
  const { socket } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'global' | 'users'>('global');
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [privateHistory, setPrivateHistory] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [unreadGlobal, setUnreadGlobal] = useState(0);
  const [unreadByUser, setUnreadByUser] = useState<Record<string, number>>({});

  const resolveDisplayName = (userId?: string, fallbackEmail?: string) => {
    if (!userId) return fallbackEmail || 'Uzytkownik';
    if (currentProfile?.id === userId) {
      return currentProfile?.full_name || currentProfile?.email || 'Uzytkownik';
    }
    const match = allUsers.find((u) => u.id === userId);
    return match?.full_name || match?.email || fallbackEmail || 'Uzytkownik';
  };

  const resolveRole = (userId?: string) => {
    if (!userId) return null;
    if (currentProfile?.id === userId) return currentProfile?.role || null;
    const match = allUsers.find((u) => u.id === userId);
    return match?.role || null;
  };

  useEffect(() => {
    const initChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, full_name, role')
          .eq('id', user.id)
          .single();
        setCurrentProfile(profile);
      }

      if (socket && user) {
        socket.emit('identify', user.id);
      }
    };
    initChat();
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: any) => {
      if (!msg.receiver_id) {
        setChatHistory((prev) => [...prev, msg]);
        if (!isOpen || activeTab !== 'global') {
          setUnreadGlobal((prev) => prev + 1);
          toast.success(`Nowa wiadomosc: ${resolveDisplayName(msg.sender_id, msg.sender_email)}`);
        }
      }
    };

    const handleNewPrivateMessage = (msg: any) => {
      setPrivateHistory((prev) => [...prev, msg]);
      const otherUserId = msg.sender_id === currentUser?.id ? msg.receiver_id : msg.sender_id;
      const isCurrentDM = selectedUser?.id && otherUserId === selectedUser.id;
      if (!isOpen || activeTab !== 'users' || !isCurrentDM) {
        if (otherUserId) {
          setUnreadByUser((prev) => ({
            ...prev,
            [otherUserId]: (prev[otherUserId] || 0) + 1
          }));
        }
        toast.success(`Nowa wiadomosc prywatna: ${resolveDisplayName(msg.sender_id, msg.sender_email)}`);
      }
    };

    const handleOnlineUsers = (onlineIds: string[]) => {
      setOnlineUsers(onlineIds);
    };

    socket.on('new_message', handleNewMessage);
    socket.on('new_private_message', handleNewPrivateMessage);
    socket.on('online_users_list', handleOnlineUsers);

    socket.emit('get_online_users');

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('new_private_message', handleNewPrivateMessage);
      socket.off('online_users_list', handleOnlineUsers);
    };
  }, [socket, isOpen, activeTab, selectedUser, currentUser?.id, currentProfile]);

  useEffect(() => {
    const loadHistory = async () => {
      if (!isOpen) return;
      if (activeTab === 'global') {
        const history = await messageService.getGlobalHistory();
        setChatHistory(Array.isArray(history) ? history : []);
      }
      if (activeTab === 'users' && selectedUser?.id) {
        const history = await messageService.getPrivateHistory(selectedUser.id);
        setPrivateHistory(Array.isArray(history) ? history : []);
      }
    };
    loadHistory();
  }, [isOpen, activeTab, selectedUser?.id]);

  useEffect(() => {
    const refreshUsers = async () => {
      if (!isOpen || activeTab !== 'users') return;
      try {
        const users = await userService.getPublicUsers();
        setAllUsers(users.filter((u: any) => u.id !== currentUser?.id));
      } catch (err: any) {
        toast.error(err?.response?.data?.error || 'Blad odswiezania listy uzytkownikow');
      }
    };
    refreshUsers();
  }, [isOpen, activeTab, currentUser?.id]);

  useEffect(() => {
    if (!isOpen) return;
    if (activeTab === 'global') {
      setUnreadGlobal(0);
    }
    if (activeTab === 'users' && selectedUser?.id) {
      setUnreadByUser((prev) => {
        if (!prev[selectedUser.id]) return prev;
        const next = { ...prev };
        delete next[selectedUser.id];
        return next;
      });
    }
  }, [isOpen, activeTab, selectedUser?.id]);

  const totalUnread = unreadGlobal + Object.values(unreadByUser).reduce((sum, v) => sum + v, 0);

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
      <button className="chat-toggle" onClick={() => setIsOpen(!isOpen)} title="Otwórz czat" style={{ position: 'relative' }}>
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        {totalUnread > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              minWidth: '18px',
              height: '18px',
              padding: '0 5px',
              borderRadius: '999px',
              background: 'var(--error)',
              color: '#fff',
              fontSize: '0.7rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header flex justify-between items-center p-4">
            <h3 className="text-lg font-bold" style={{ margin: 0 }}>
              {selectedUser ? `DM: ${selectedUser.full_name || selectedUser.email?.split('@')[0]}` : 'Czat Ogólny'}
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
                  const unreadCount = unreadByUser[user.id] || 0;
                  return (
                    <button 
                      key={user.id}
                      onClick={() => { setSelectedUser(user); setActiveTab('users'); }}
                      className="w-full text-left p-2 hover:bg-gray-50 rounded flex items-center justify-between mb-1"
                      style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      <div className="flex items-center gap-2" style={{ flexWrap: 'nowrap' }}>
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex-shrink-0 flex items-center justify-center text-xs font-bold">
                          {(user.full_name || user.email)[0].toUpperCase()}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
                          <span className="text-sm" style={{ color: 'var(--text-main)', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                            {user.full_name || user.email}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--text-muted)', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                            {user.role || 'user'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <span
                            style={{
                              minWidth: '18px',
                              height: '18px',
                              padding: '0 5px',
                              borderRadius: '999px',
                              background: 'var(--error)',
                              color: '#fff',
                              fontSize: '0.7rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                        <Circle size={10} fill={isOnline ? "#10b981" : "transparent"} color={isOnline ? "#10b981" : "#cbd5e1"} />
                      </div>
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
                      {msg.sender_id !== currentUser?.id && (
                        <div className="text-xs font-bold opacity-75 mb-1">
                          {resolveDisplayName(msg.sender_id, msg.sender_email)}
                          {resolveRole(msg.sender_id) ? ` (${resolveRole(msg.sender_id)})` : ''}
                        </div>
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
